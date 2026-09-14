package com.example.audiozy.model

enum class SourceOption {
    IMPORT_AUDIO,
    RECORD_MANUALLY,
    BLANK_PROJECT
}

data class Clip(
    val id: String,
    val trackId: String,
    val name: String,
    val sourceFileUri: String? = null,
    val startTimeMs: Long,
    val durationMs: Long,
    val trimStartMs: Long = 0L,
    val trimEndMs: Long = 0L,
    val fadeInMs: Long = 50L,
    val fadeOutMs: Long = 100L,
    val isMuted: Boolean = false,
    val peaks: List<Float> = emptyList(),
    val isLoading: Boolean = false
) {
    fun getEffectiveDurationMs(): Long {
        return maxOf(100L, durationMs - trimStartMs - trimEndMs)
    }

    fun getEndTimeMs(): Long {
        return startTimeMs + getEffectiveDurationMs()
    }
}

data class Track(
    val id: String,
    val name: String,
    val color: String,
    val isMuted: Boolean = false,
    val isSolo: Boolean = false,
    val clips: List<Clip> = emptyList()
)

data class Project(
    val id: String,
    val name: String,
    val bpm: Int = 120,
    val timeSignature: String = "4/4",
    val sampleRate: String = "44.1kHz",
    val bitDepth: String = "24-bit",
    val tracks: List<Track> = emptyList(),
    val lastModified: Long = System.currentTimeMillis()
) {
    fun getTotalDurationMs(): Long {
        var maxEnd = 0L
        for (track in tracks) {
            for (clip in track.clips) {
                val end = clip.getEndTimeMs()
                if (end > maxEnd) {
                    maxEnd = end
                }
            }
        }
        val safeBpm = maxOf(1, bpm)
        val beatDurationMs = 60000L / safeBpm
        val minFourBarsMs = beatDurationMs * 16L
        return maxOf(maxEnd + 2000L, minFourBarsMs)
    }
}

object TrackPalette {
    val colors = listOf(
        "#3B82F6", // Blue - Vocals
        "#FB7185", // Coral - Guitar
        "#FBBF24", // Yellow - Bass
        "#FFFFFF", // White - Beats
        "#A855F7", // Purple - Drums
        "#34D399", // Green
        "#06B6D4", // Cyan
        "#FB923C"  // Orange
    )

    fun getColor(index: Int): String {
        return colors[index % colors.size]
    }
}

object WaveformGenerator {
    fun generateRealisticPeaks(count: Int, seed: Int): List<Float> {
        val result = mutableListOf<Float>()
        var current = 0.45f
        for (i in 0 until count) {
            val progress = i.toFloat() / count.toFloat()
            val envelope = (Math.sin(progress * Math.PI).toFloat()).coerceIn(0.2f, 1.0f)
            val pseudoRandom = ((seed * 9301 + i * 49297 + 233280) % 233280) / 233280.0f
            val delta = (pseudoRandom - 0.5f) * 0.35f
            current = (current + delta).coerceIn(0.12f, 0.95f)
            val peak = (current * envelope).coerceIn(0.08f, 1.0f)
            result.add(peak)
        }
        return result
    }
}
