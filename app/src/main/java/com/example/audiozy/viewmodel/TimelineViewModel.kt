package com.example.audiozy.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.audiozy.audio.AudioEngine
import com.example.audiozy.audio.AudioRecorder
import com.example.audiozy.data.AudiozyDatabase
import com.example.audiozy.data.AudiozyRepository
import com.example.audiozy.model.Clip
import com.example.audiozy.model.Project
import com.example.audiozy.model.Track
import com.example.audiozy.model.TrackPalette
import com.example.audiozy.model.WaveformGenerator
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

class TimelineViewModel(
    application: Application,
    private val projectId: String
) : AndroidViewModel(application) {

    private val repository: AudiozyRepository
    private val audioEngine = AudioEngine(viewModelScope)
    private val audioRecorder = AudioRecorder(application, viewModelScope)

    private val _project = MutableStateFlow<Project?>(null)
    val project: StateFlow<Project?> = _project.asStateFlow()

    private val _playheadMs = MutableStateFlow(0L)
    val playheadMs: StateFlow<Long> = _playheadMs.asStateFlow()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _isRecordArmed = MutableStateFlow(false)
    val isRecordArmed: StateFlow<Boolean> = _isRecordArmed.asStateFlow()

    private val _isRecording = MutableStateFlow(false)
    val isRecording: StateFlow<Boolean> = _isRecording.asStateFlow()

    private val _selectedClipId = MutableStateFlow<String?>(null)
    val selectedClipId: StateFlow<String?> = _selectedClipId.asStateFlow()

    private val _zoomPxPerSecond = MutableStateFlow(60)
    val zoomPxPerSecond: StateFlow<Int> = _zoomPxPerSecond.asStateFlow()

    private val _hasUnsavedChanges = MutableStateFlow(false)
    val hasUnsavedChanges: StateFlow<Boolean> = _hasUnsavedChanges.asStateFlow()

    // Undo / Redo Stacks
    private val undoStack = mutableListOf<Project>()
    private val redoStack = mutableListOf<Project>()
    private val _canUndo = MutableStateFlow(false)
    val canUndo: StateFlow<Boolean> = _canUndo.asStateFlow()
    private val _canRedo = MutableStateFlow(false)
    val canRedo: StateFlow<Boolean> = _canRedo.asStateFlow()

    init {
        val database = AudiozyDatabase.getDatabase(application, viewModelScope)
        repository = AudiozyRepository(database.dao())

        audioEngine.setOnTimeUpdate { time ->
            _playheadMs.value = time
        }
        audioEngine.setOnPlaybackStateChange { playing ->
            _isPlaying.value = playing
        }

        loadProject()
    }

    private fun loadProject() {
        viewModelScope.launch {
            val loaded = repository.getFullProject(projectId) ?: AudiozyDatabase.createSampleProject()
            _project.value = loaded
        }
    }

    private fun pushHistoryState(oldProject: Project) {
        undoStack.add(oldProject)
        if (undoStack.size > 30) undoStack.removeAt(0)
        redoStack.clear()
        _canUndo.value = true
        _canRedo.value = false
        _hasUnsavedChanges.value = true
    }

    private fun updateProject(newProject: Project) {
        _project.value?.let { current ->
            pushHistoryState(current)
        }
        _project.value = newProject
    }

    fun undo() {
        val current = _project.value ?: return
        if (undoStack.isNotEmpty()) {
            val previous = undoStack.removeAt(undoStack.lastIndex)
            redoStack.add(current)
            _project.value = previous
            _canUndo.value = undoStack.isNotEmpty()
            _canRedo.value = true
            _hasUnsavedChanges.value = true
        }
    }

    fun redo() {
        val current = _project.value ?: return
        if (redoStack.isNotEmpty()) {
            val next = redoStack.removeAt(redoStack.lastIndex)
            undoStack.add(current)
            _project.value = next
            _canUndo.value = true
            _canRedo.value = redoStack.isNotEmpty()
            _hasUnsavedChanges.value = true
        }
    }

    fun setZoom(pxPerSecond: Int) {
        _zoomPxPerSecond.value = pxPerSecond.coerceIn(20, 240)
    }

    fun selectClip(clipId: String?) {
        _selectedClipId.value = clipId
    }

    fun togglePlay() {
        val current = _project.value ?: return
        if (_isRecording.value) {
            stopRecording()
            return
        }
        audioEngine.togglePlay(current)
    }

    fun seekTo(timeMs: Long) {
        val current = _project.value ?: return
        audioEngine.seekTo(timeMs, current)
    }

    fun jumpToStart() {
        val current = _project.value ?: return
        audioEngine.jumpToStart(current)
    }

    fun fastRewind() {
        val current = _project.value ?: return
        audioEngine.startFastRewind(current)
    }

    fun toggleRecordArmed() {
        _isRecordArmed.value = !_isRecordArmed.value
    }

    fun handleRecordClick() {
        if (_isRecording.value) {
            stopRecording()
        } else if (!_isRecordArmed.value) {
            _isRecordArmed.value = true
        } else {
            startRecording()
        }
    }

    private fun startRecording() {
        val current = _project.value ?: return
        val recordFile = File(getApplication<Application>().cacheDir, "rec_${System.currentTimeMillis()}.pcm")
        audioRecorder.startRecording(recordFile)
        _isRecording.value = true
        audioEngine.play(current)
    }

    private fun stopRecording() {
        val current = _project.value ?: return
        audioEngine.pause()
        _isRecording.value = false
        _isRecordArmed.value = false

        val result = audioRecorder.stopRecording(null)
        if (result.durationMs > 200L) {
            val targetTrack = current.tracks.firstOrNull() ?: Track(
                id = "track_rec_" + System.currentTimeMillis(),
                name = "Recorded",
                color = TrackPalette.colors[1]
            )

            val newClip = Clip(
                id = "clip_rec_" + System.currentTimeMillis(),
                trackId = targetTrack.id,
                name = "Take " + (targetTrack.clips.size + 1),
                startTimeMs = _playheadMs.value,
                durationMs = result.durationMs,
                fadeInMs = 50L,
                fadeOutMs = 100L,
                peaks = result.peaks
            )

            val updatedTracks = current.tracks.map { track ->
                if (track.id == targetTrack.id) {
                    track.copy(clips = track.clips + newClip)
                } else track
            }

            val finalTracks = if (current.tracks.none { it.id == targetTrack.id }) {
                updatedTracks + targetTrack.copy(clips = listOf(newClip))
            } else updatedTracks

            updateProject(current.copy(tracks = finalTracks))
            _selectedClipId.value = newClip.id
        }
    }

    fun moveClip(clipId: String, newStartMs: Long) {
        val current = _project.value ?: return
        val updatedTracks = current.tracks.map { track ->
            track.copy(
                clips = track.clips.map { clip ->
                    if (clip.id == clipId) clip.copy(startTimeMs = maxOf(0L, newStartMs)) else clip
                }
            )
        }
        updateProject(current.copy(tracks = updatedTracks))
    }

    fun trimClip(clipId: String, deltaStartMs: Long, deltaEndMs: Long) {
        val current = _project.value ?: return
        val updatedTracks = current.tracks.map { track ->
            track.copy(
                clips = track.clips.map { clip ->
                    if (clip.id == clipId) {
                        val maxTrimStart = maxOf(0L, clip.durationMs - clip.trimEndMs - 100L)
                        val maxTrimEnd = maxOf(0L, clip.durationMs - clip.trimStartMs - 100L)
                        val newTrimStart = (clip.trimStartMs + deltaStartMs).coerceIn(0L, maxTrimStart)
                        val newTrimEnd = (clip.trimEndMs + deltaEndMs).coerceIn(0L, maxTrimEnd)
                        clip.copy(trimStartMs = newTrimStart, trimEndMs = newTrimEnd)
                    } else clip
                }
            )
        }
        updateProject(current.copy(tracks = updatedTracks))
    }

    fun splitClipAtPlayhead(clip: Clip) {
        val current = _project.value ?: return
        val effectiveDur = clip.getEffectiveDurationMs()
        val clipEnd = clip.startTimeMs + effectiveDur
        val playhead = _playheadMs.value

        if (playhead <= clip.startTimeMs + 100L || playhead >= clipEnd - 100L) return

        val splitOffsetMs = playhead - clip.startTimeMs
        val piece1 = clip.copy(
            id = "clip_" + System.currentTimeMillis() + "_1",
            name = clip.name + " (Part 1)",
            trimEndMs = clip.trimEndMs + (effectiveDur - splitOffsetMs)
        )
        val piece2 = clip.copy(
            id = "clip_" + System.currentTimeMillis() + "_2",
            name = clip.name + " (Part 2)",
            startTimeMs = playhead,
            trimStartMs = clip.trimStartMs + splitOffsetMs
        )

        val updatedTracks = current.tracks.map { track ->
            if (track.id == clip.trackId) {
                val filtered = track.clips.filter { it.id != clip.id }
                track.copy(clips = filtered + piece1 + piece2)
            } else track
        }
        updateProject(current.copy(tracks = updatedTracks))
        _selectedClipId.value = piece2.id
    }

    fun duplicateClip(clip: Clip) {
        val current = _project.value ?: return
        val duplicate = clip.copy(
            id = "clip_" + System.currentTimeMillis() + "_dup",
            name = clip.name + " (Copy)",
            startTimeMs = clip.startTimeMs + clip.getEffectiveDurationMs() + 500L
        )
        val updatedTracks = current.tracks.map { track ->
            if (track.id == clip.trackId) {
                track.copy(clips = track.clips + duplicate)
            } else track
        }
        updateProject(current.copy(tracks = updatedTracks))
        _selectedClipId.value = duplicate.id
    }

    fun deleteClip(clipId: String) {
        val current = _project.value ?: return
        val updatedTracks = current.tracks.map { track ->
            track.copy(clips = track.clips.filter { it.id != clipId })
        }
        updateProject(current.copy(tracks = updatedTracks))
        _selectedClipId.value = null
    }

    fun toggleMuteClip(clipId: String) {
        val current = _project.value ?: return
        val updatedTracks = current.tracks.map { track ->
            track.copy(
                clips = track.clips.map { clip ->
                    if (clip.id == clipId) clip.copy(isMuted = !clip.isMuted) else clip
                }
            )
        }
        updateProject(current.copy(tracks = updatedTracks))
    }

    fun applyFades(clipId: String, fadeInMs: Long, fadeOutMs: Long) {
        val current = _project.value ?: return
        val updatedTracks = current.tracks.map { track ->
            track.copy(
                clips = track.clips.map { clip ->
                    if (clip.id == clipId) clip.copy(fadeInMs = fadeInMs, fadeOutMs = fadeOutMs) else clip
                }
            )
        }
        updateProject(current.copy(tracks = updatedTracks))
    }

    fun toggleMuteTrack(trackId: String) {
        val current = _project.value ?: return
        val updatedTracks = current.tracks.map {
            if (it.id == trackId) it.copy(isMuted = !it.isMuted) else it
        }
        updateProject(current.copy(tracks = updatedTracks))
    }

    fun toggleSoloTrack(trackId: String) {
        val current = _project.value ?: return
        val updatedTracks = current.tracks.map {
            if (it.id == trackId) it.copy(isSolo = !it.isSolo) else it
        }
        updateProject(current.copy(tracks = updatedTracks))
    }

    fun changeTrackColor(trackId: String, color: String) {
        val current = _project.value ?: return
        val updatedTracks = current.tracks.map {
            if (it.id == trackId) it.copy(color = color) else it
        }
        updateProject(current.copy(tracks = updatedTracks))
    }

    fun deleteTrack(trackId: String) {
        val current = _project.value ?: return
        val updatedTracks = current.tracks.filter { it.id != trackId }
        updateProject(current.copy(tracks = updatedTracks))
    }

    fun addBlankTrack() {
        val current = _project.value ?: return
        val newIndex = current.tracks.size + 1
        val newTrack = Track(
            id = "track_" + System.currentTimeMillis(),
            name = "Track $newIndex",
            color = TrackPalette.getColor(newIndex - 1)
        )
        updateProject(current.copy(tracks = current.tracks + newTrack))
    }

    fun importAudioClip(name: String, durationMs: Long) {
        val current = _project.value ?: return
        val newIndex = current.tracks.size + 1
        val color = TrackPalette.getColor(newIndex - 1)
        val clipId = "clip_imp_" + System.currentTimeMillis()
        val trackId = "track_imp_" + System.currentTimeMillis()

        val newClip = Clip(
            id = clipId,
            trackId = trackId,
            name = name,
            startTimeMs = _playheadMs.value,
            durationMs = durationMs,
            fadeInMs = 50L,
            fadeOutMs = 100L,
            peaks = WaveformGenerator.generateRealisticPeaks(120, (name.hashCode() % 1000) + 1)
        )
        val newTrack = Track(
            id = trackId,
            name = name.take(10),
            color = color,
            clips = listOf(newClip)
        )
        updateProject(current.copy(tracks = current.tracks + newTrack))
        _selectedClipId.value = newClip.id
    }

    fun renameProject(newName: String) {
        val current = _project.value ?: return
        updateProject(current.copy(name = newName))
    }

    fun saveProject() {
        val current = _project.value ?: return
        viewModelScope.launch {
            repository.saveProject(current)
            _hasUnsavedChanges.value = false
        }
    }

    fun exportMixdownWav(outputFile: File) {
        val current = _project.value ?: return
        viewModelScope.launch {
            audioEngine.exportToWav(current, outputFile)
        }
    }

    override fun onCleared() {
        super.onCleared()
        audioEngine.pause()
    }
}
