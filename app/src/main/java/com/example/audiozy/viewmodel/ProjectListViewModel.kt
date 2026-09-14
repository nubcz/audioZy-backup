package com.example.audiozy.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.audiozy.data.AudiozyDatabase
import com.example.audiozy.data.AudiozyRepository
import com.example.audiozy.data.ProjectEntity
import com.example.audiozy.model.Clip
import com.example.audiozy.model.Project
import com.example.audiozy.model.SourceOption
import com.example.audiozy.model.Track
import com.example.audiozy.model.TrackPalette
import com.example.audiozy.model.WaveformGenerator
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class ProjectListViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: AudiozyRepository

    val projects: StateFlow<List<ProjectEntity>>

    init {
        val database = AudiozyDatabase.getDatabase(application, viewModelScope)
        repository = AudiozyRepository(database.dao())
        projects = repository.allProjects.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )
    }

    fun deleteProject(projectId: String) {
        viewModelScope.launch {
            repository.deleteProject(projectId)
        }
    }

    fun createProject(
        name: String,
        bpm: Int,
        timeSignature: String,
        sampleRate: String,
        bitDepth: String,
        sourceOption: SourceOption,
        onCreated: (String) -> Unit
    ) {
        viewModelScope.launch {
            val projectId = "project_" + System.currentTimeMillis().toString(36)
            val initialClips = if (sourceOption == SourceOption.RECORD_MANUALLY) {
                emptyList()
            } else if (sourceOption == SourceOption.IMPORT_AUDIO) {
                listOf(
                    Clip(
                        id = "clip_imported_" + System.currentTimeMillis(),
                        trackId = "track_1",
                        name = "$name Audio",
                        startTimeMs = 0L,
                        durationMs = 24000L,
                        fadeInMs = 50L,
                        fadeOutMs = 100L,
                        peaks = WaveformGenerator.generateRealisticPeaks(120, 777)
                    )
                )
            } else {
                emptyList()
            }

            val newProject = Project(
                id = projectId,
                name = name,
                bpm = bpm,
                timeSignature = timeSignature,
                sampleRate = sampleRate,
                bitDepth = bitDepth,
                tracks = listOf(
                    Track(
                        id = "track_1",
                        name = "Track 1",
                        color = TrackPalette.colors[0],
                        clips = initialClips
                    )
                ),
                lastModified = System.currentTimeMillis()
            )

            repository.saveProject(newProject)
            onCreated(projectId)
        }
    }
}
