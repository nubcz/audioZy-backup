package com.example.audiozy.data

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import com.example.audiozy.model.Clip
import com.example.audiozy.model.Project
import com.example.audiozy.model.Track

@Entity(tableName = "projects")
data class ProjectEntity(
    @PrimaryKey val id: String,
    val name: String,
    val bpm: Int,
    val timeSignature: String,
    val sampleRate: String,
    val bitDepth: String,
    val lastModified: Long
)

@Entity(
    tableName = "tracks",
    foreignKeys = [
        ForeignKey(
            entity = ProjectEntity::class,
            parentColumns = ["id"],
            childColumns = ["projectId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("projectId")]
)
data class TrackEntity(
    @PrimaryKey val id: String,
    val projectId: String,
    val name: String,
    val color: String,
    val isMuted: Boolean,
    val isSolo: Boolean,
    val sortOrder: Int
)

@Entity(
    tableName = "clips",
    foreignKeys = [
        ForeignKey(
            entity = TrackEntity::class,
            parentColumns = ["id"],
            childColumns = ["trackId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("trackId")]
)
data class ClipEntity(
    @PrimaryKey val id: String,
    val trackId: String,
    val name: String,
    val sourceFileUri: String?,
    val startTimeMs: Long,
    val durationMs: Long,
    val trimStartMs: Long,
    val trimEndMs: Long,
    val fadeInMs: Long,
    val fadeOutMs: Long,
    val isMuted: Boolean,
    val peaksJson: String
)

class Converters {
    @TypeConverter
    fun fromFloatList(list: List<Float>): String {
        return list.joinToString(",")
    }

    @TypeConverter
    fun toFloatList(data: String): List<Float> {
        if (data.isBlank()) return emptyList()
        return data.split(",").mapNotNull { it.toFloatOrNull() }
    }
}
