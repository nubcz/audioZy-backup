package com.example.audiozy.audio

import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import kotlin.math.abs
import kotlin.math.max

data class RecordResult(
    val durationMs: Long,
    val peaks: List<Float>,
    val recordedFile: File?
)

class AudioRecorder(private val context: Context, private val scope: CoroutineScope) {

    private var audioRecord: AudioRecord? = null
    private var recordingJob: Job? = null
    var isRecording: Boolean = false
        private set

    private var startTimeMs: Long = 0L
    private val sampleRate = 44100
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT

    fun startRecording(outputFile: File) {
        if (isRecording) return
        val bufferSize = max(
            AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat),
            2048
        )

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            )

            audioRecord?.startRecording()
            isRecording = true
            startTimeMs = System.currentTimeMillis()

            recordingJob = scope.launch(Dispatchers.IO) {
                val pcmBuffer = ShortArray(1024)
                FileOutputStream(outputFile).use { fos ->
                    while (isActive && isRecording) {
                        val read = audioRecord?.read(pcmBuffer, 0, pcmBuffer.size) ?: 0
                        if (read > 0) {
                            val byteBuffer = ByteArray(read * 2)
                            for (i in 0 until read) {
                                val s = pcmBuffer[i].toInt()
                                byteBuffer[i * 2] = (s and 0x00FF).toByte()
                                byteBuffer[i * 2 + 1] = ((s shr 8) and 0x00FF).toByte()
                            }
                            fos.write(byteBuffer)
                        }
                    }
                }
            }
        } catch (e: SecurityException) {
            isRecording = false
        }
    }

    fun stopRecording(outputFile: File?): RecordResult {
        isRecording = false
        recordingJob?.cancel()
        recordingJob = null

        val durationMs = maxOf(0L, System.currentTimeMillis() - startTimeMs)

        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (_: Exception) {}
        audioRecord = null

        // Generate waveform peaks from file or duration
        val peakCount = maxOf(30, minOf(300, (durationMs / 100).toInt()))
        val peaks = mutableListOf<Float>()
        for (i in 0 until peakCount) {
            val progress = i.toFloat() / peakCount.toFloat()
            val amp = (0.25f + 0.65f * abs(Math.sin(progress * Math.PI * 4.0).toFloat())).coerceIn(0.1f, 1.0f)
            peaks.add(amp)
        }

        return RecordResult(
            durationMs = durationMs,
            peaks = peaks,
            recordedFile = outputFile
        )
    }
}
