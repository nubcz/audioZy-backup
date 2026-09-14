package com.example.audiozy.audio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import com.example.audiozy.model.Clip
import com.example.audiozy.model.Project
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.PI
import kotlin.math.sin

class AudioEngine(private val scope: CoroutineScope) {

    private var audioTrack: AudioTrack? = null
    private var playbackJob: Job? = null
    private var trackingJob: Job? = null

    var isPlaying: Boolean = false
        private set

    var playheadMs: Long = 0L
        private set

    private var onTimeUpdate: ((Long) -> Unit)? = null
    private var onPlaybackStateChange: ((Boolean) -> Unit)? = null

    private val sampleRate = 44100
    private val channelConfig = AudioFormat.CHANNEL_OUT_STEREO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT

    fun setOnTimeUpdate(callback: (Long) -> Unit) {
        onTimeUpdate = callback
    }

    fun setOnPlaybackStateChange(callback: (Boolean) -> Unit) {
        onPlaybackStateChange = callback
    }

    fun play(project: Project) {
        if (isPlaying) return
        val totalDur = project.getTotalDurationMs()
        if (playheadMs >= totalDur) {
            playheadMs = 0L
        }

        isPlaying = true
        onPlaybackStateChange?.invoke(true)

        val bufferSize = AudioTrack.getMinBufferSize(sampleRate, channelConfig, audioFormat) * 2
        audioTrack = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(audioFormat)
                    .setSampleRate(sampleRate)
                    .setChannelMask(channelConfig)
                    .build()
            )
            .setBufferSizeInBytes(bufferSize)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()

        audioTrack?.play()

        val stemFreqs = listOf(261.63, 329.63, 130.81, 174.61, 196.0) // C4, E4, C3, F3, G3
        val anySolo = project.tracks.any { it.isSolo }

        playbackJob = scope.launch(Dispatchers.Default) {
            val chunkFrames = 1024
            val shortBuffer = ShortArray(chunkFrames * 2)
            var currentSampleIndex = (playheadMs * sampleRate / 1000L).toDouble()

            while (isActive && isPlaying) {
                for (frame in 0 until chunkFrames) {
                    val frameTimeMs = (currentSampleIndex * 1000.0 / sampleRate).toLong()
                    var mixedSample = 0.0

                    project.tracks.forEachIndexed { trackIndex, track ->
                        val isAudible = if (anySolo) track.isSolo else !track.isMuted
                        if (isAudible) {
                            for (clip in track.clips) {
                                if (clip.isMuted) continue
                                val effectiveDur = clip.getEffectiveDurationMs()
                                val clipStart = clip.startTimeMs
                                val clipEnd = clipStart + effectiveDur

                                if (frameTimeMs in clipStart until clipEnd) {
                                    val offsetMs = frameTimeMs - clipStart + clip.trimStartMs
                                    var gain = 0.22

                                    // Fade In
                                    if (clip.fadeInMs > 0 && offsetMs < clip.fadeInMs) {
                                        gain *= (offsetMs.toDouble() / clip.fadeInMs.toDouble())
                                    }
                                    // Fade Out
                                    if (clip.fadeOutMs > 0) {
                                        val fadeStartMs = effectiveDur - clip.fadeOutMs
                                        if (offsetMs >= fadeStartMs) {
                                            val fadeProg = (effectiveDur - offsetMs).toDouble() / clip.fadeOutMs.toDouble()
                                            gain *= fadeProg.coerceIn(0.0, 1.0)
                                        }
                                    }

                                    val freq = stemFreqs[trackIndex % stemFreqs.size]
                                    val t = currentSampleIndex / sampleRate.toDouble()
                                    val sample = when (trackIndex % 5) {
                                        2 -> sin(2.0 * PI * freq * t) * 0.7 + sin(4.0 * PI * freq * t) * 0.3 // Bass
                                        3 -> sin(2.0 * PI * freq * 0.5 * t) * 0.8 // Beats
                                        else -> sin(2.0 * PI * freq * t)
                                    }
                                    mixedSample += sample * gain
                                }
                            }
                        }
                    }

                    val clamped = (mixedSample.coerceIn(-1.0, 1.0) * 32767.0).toInt().toShort()
                    shortBuffer[frame * 2] = clamped
                    shortBuffer[frame * 2 + 1] = clamped
                    currentSampleIndex += 1.0
                }

                audioTrack?.write(shortBuffer, 0, shortBuffer.size)
            }
        }

        // Time tracking
        val startTime = System.currentTimeMillis()
        val playheadAtStart = playheadMs
        trackingJob = scope.launch(Dispatchers.Main) {
            while (isActive && isPlaying) {
                val elapsed = System.currentTimeMillis() - startTime
                playheadMs = playheadAtStart + elapsed
                val maxDur = project.getTotalDurationMs()
                if (playheadMs >= maxDur) {
                    playheadMs = maxDur
                    onTimeUpdate?.invoke(playheadMs)
                    pause()
                    break
                }
                onTimeUpdate?.invoke(playheadMs)
                delay(30L)
            }
        }
    }

    fun pause() {
        if (!isPlaying) return
        isPlaying = false
        onPlaybackStateChange?.invoke(false)
        playbackJob?.cancel()
        playbackJob = null
        trackingJob?.cancel()
        trackingJob = null

        try {
            audioTrack?.stop()
            audioTrack?.release()
        } catch (_: Exception) {}
        audioTrack = null
    }

    fun togglePlay(project: Project) {
        if (isPlaying) {
            pause()
        } else {
            play(project)
        }
    }

    fun seekTo(timeMs: Long, project: Project) {
        val maxDur = project.getTotalDurationMs()
        playheadMs = timeMs.coerceIn(0L, maxDur)
        if (isPlaying) {
            pause()
            play(project)
        } else {
            onTimeUpdate?.invoke(playheadMs)
        }
    }

    fun jumpToStart(project: Project) {
        seekTo(0L, project)
    }

    fun startFastRewind(project: Project) {
        scope.launch(Dispatchers.Main) {
            val stepMs = 500L
            while (isPlaying || playheadMs > 0) {
                seekTo(maxOf(0L, playheadMs - stepMs), project)
                delay(60L)
                if (playheadMs <= 0L) break
            }
        }
    }

    fun exportToWav(project: Project, outputFile: File) {
        val totalDurMs = project.getTotalDurationMs()
        val totalFrames = (totalDurMs * sampleRate / 1000L).toInt()
        val channels = 2
        val bytesPerSample = 2
        val dataSize = totalFrames * channels * bytesPerSample

        FileOutputStream(outputFile).use { fos ->
            val header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
            header.put("RIFF".toByteArray())
            header.putInt(36 + dataSize)
            header.put("WAVE".toByteArray())
            header.put("fmt ".toByteArray())
            header.putInt(16) // Subchunk1Size
            header.putShort(1) // AudioFormat (PCM)
            header.putShort(channels.toShort())
            header.putInt(sampleRate)
            header.putInt(sampleRate * channels * bytesPerSample) // ByteRate
            header.putShort((channels * bytesPerSample).toShort()) // BlockAlign
            header.putShort(16) // BitsPerSample
            header.put("data".toByteArray())
            header.putInt(dataSize)
            fos.write(header.array())

            val stemFreqs = listOf(261.63, 329.63, 130.81, 174.61, 196.0)
            val anySolo = project.tracks.any { it.isSolo }
            val chunk = 2048
            val buffer = ByteBuffer.allocate(chunk * channels * bytesPerSample).order(ByteOrder.LITTLE_ENDIAN)

            var frame = 0
            while (frame < totalFrames) {
                val framesToWrite = minOf(chunk, totalFrames - frame)
                buffer.clear()

                for (f in 0 until framesToWrite) {
                    val currentFrame = frame + f
                    val frameTimeMs = (currentFrame * 1000L / sampleRate)
                    var mixedSample = 0.0

                    project.tracks.forEachIndexed { trackIndex, track ->
                        val isAudible = if (anySolo) track.isSolo else !track.isMuted
                        if (isAudible) {
                            for (clip in track.clips) {
                                if (clip.isMuted) continue
                                val effectiveDur = clip.getEffectiveDurationMs()
                                val clipStart = clip.startTimeMs
                                val clipEnd = clipStart + effectiveDur

                                if (frameTimeMs in clipStart until clipEnd) {
                                    val offsetMs = frameTimeMs - clipStart + clip.trimStartMs
                                    var gain = 0.22

                                    if (clip.fadeInMs > 0 && offsetMs < clip.fadeInMs) {
                                        gain *= (offsetMs.toDouble() / clip.fadeInMs.toDouble())
                                    }
                                    if (clip.fadeOutMs > 0) {
                                        val fadeStartMs = effectiveDur - clip.fadeOutMs
                                        if (offsetMs >= fadeStartMs) {
                                            val fadeProg = (effectiveDur - offsetMs).toDouble() / clip.fadeOutMs.toDouble()
                                            gain *= fadeProg.coerceIn(0.0, 1.0)
                                        }
                                    }

                                    val freq = stemFreqs[trackIndex % stemFreqs.size]
                                    val t = currentFrame.toDouble() / sampleRate.toDouble()
                                    val sample = sin(2.0 * PI * freq * t)
                                    mixedSample += sample * gain
                                }
                            }
                        }
                    }

                    val sampleInt = (mixedSample.coerceIn(-1.0, 1.0) * 32767.0).toInt().toShort()
                    buffer.putShort(sampleInt)
                    buffer.putShort(sampleInt)
                }

                fos.write(buffer.array(), 0, framesToWrite * channels * bytesPerSample)
                frame += framesToWrite
            }
        }
    }

    companion object {
        fun formatTime(ms: Long): String {
            val totalSeconds = (maxOf(0L, ms) / 1000.0)
            val hours = (totalSeconds / 3600).toInt()
            val minutes = ((totalSeconds % 3600) / 60).toInt()
            val seconds = (totalSeconds % 60).toInt()
            val hundredths = ((totalSeconds % 1) * 100).toInt()

            return String.format("%02d:%02d:%02d.%02d", hours, minutes, seconds, hundredths)
        }
    }
}
