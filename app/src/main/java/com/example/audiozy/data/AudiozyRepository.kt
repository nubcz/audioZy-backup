package com.example.audiozy.data

import com.example.audiozy.model.Clip
import com.example.audiozy.model.Project
import com.example.audiozy.model.Track
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

class AudiozyRepository(private val dao: AudiozyDao) {

    val allProjects: Flow<List<ProjectEntity>> = dao.getAllProjects().flowOn(Dispatchers.IO)

    suspend fun getFullProject(projectId: String): Project? = withContext(Dispatchers.IO) {
        val projectEntity = dao.getProjectById(projectId) ?: return@withContext null
        val trackEntities = dao.getTracksForProject(projectId)
        val tracks = trackEntities.map { tEntity ->
            val clipEntities = dao.getClipsForTrack(tEntity.id)
            val clips = clipEntities.map { cEntity ->
                val peaks = if (cEntity.peaksJson.isBlank()) emptyList() else {
                    cEntity.peaksJson.split(",").mapNotNull { it.toFloatOrNull() }
                }
                Clip(
                    id = cEntity.id,
                    trackId = cEntity.trackId,
                    name = cEntity.name,
                    sourceFileUri = cEntity.sourceFileUri,
                    startTimeMs = cEntity.startTimeMs,
                    durationMs = cEntity.durationMs,
                    trimStartMs = cEntity.trimStartMs,
                    trimEndMs = cEntity.trimEndMs,
                    fadeInMs = cEntity.fadeInMs,
                    fadeOutMs = cEntity.fadeOutMs,
                    isMuted = cEntity.isMuted,
                    peaks = peaks
                )
            }
            Track(
                id = tEntity.id,
                name = tEntity.name,
                color = tEntity.color,
                isMuted = tEntity.isMuted,
                isSolo = tEntity.isSolo,
                clips = clips
            )
        }
        Project(
            id = projectEntity.id,
            name = projectEntity.name,
            bpm = projectEntity.bpm,
            timeSignature = projectEntity.timeSignature,
            sampleRate = projectEntity.sampleRate,
            bitDepth = projectEntity.bitDepth,
            tracks = tracks,
            lastModified = projectEntity.lastModified
        )
    }

    suspend fun saveProject(project: Project) = withContext(Dispatchers.IO) {
        AudiozyDatabase.saveFullProject(dao, project)
    }

    suspend fun deleteProject(projectId: String) = withContext(Dispatchers.IO) {
        dao.deleteProjectById(projectId)
    }
}
