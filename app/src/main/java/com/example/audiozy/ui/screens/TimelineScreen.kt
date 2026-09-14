package com.example.audiozy.ui.screens

import android.content.Intent
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.audiozy.audio.AudioEngine
import com.example.audiozy.model.Clip
import com.example.audiozy.model.Track
import com.example.audiozy.ui.components.AddTrackBottomSheet
import com.example.audiozy.ui.components.ClipActionBottomSheet
import com.example.audiozy.ui.components.FadeDialog
import com.example.audiozy.ui.components.RenameProjectDialog
import com.example.audiozy.ui.components.ShareBottomSheet
import com.example.audiozy.ui.components.TimelineHeader
import com.example.audiozy.ui.components.TopBar
import com.example.audiozy.ui.components.TrackQuickMenuBottomSheet
import com.example.audiozy.ui.components.TrackRow
import com.example.audiozy.ui.components.TransportBar
import com.example.audiozy.ui.components.UnsavedChangesDialog
import com.example.audiozy.ui.theme.StudioBorder
import com.example.audiozy.ui.theme.StudioCard
import com.example.audiozy.ui.theme.StudioDark
import com.example.audiozy.ui.theme.StudioSurface
import com.example.audiozy.viewmodel.TimelineViewModel
import kotlinx.coroutines.launch
import java.io.File

@Composable
fun TimelineScreen(
    viewModel: TimelineViewModel,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    val project by viewModel.project.collectAsState()
    val playheadMs by viewModel.playheadMs.collectAsState()
    val isPlaying by viewModel.isPlaying.collectAsState()
    val isRecordArmed by viewModel.isRecordArmed.collectAsState()
    val isRecording by viewModel.isRecording.collectAsState()
    val selectedClipId by viewModel.selectedClipId.collectAsState()
    val zoomPxPerSec by viewModel.zoomPxPerSecond.collectAsState()
    val canUndo by viewModel.canUndo.collectAsState()
    val canRedo by viewModel.canRedo.collectAsState()
    val hasUnsavedChanges by viewModel.hasUnsavedChanges.collectAsState()

    // Dialog & Sheet States
    var showRenameDialog by remember { mutableStateOf(false) }
    var showUnsavedDialog by remember { mutableStateOf(false) }
    var showShareSheet by remember { mutableStateOf(false) }
    var showAddTrackSheet by remember { mutableStateOf(false) }
    var activeMenuClip by remember { mutableStateOf<Clip?>(null) }
    var activeFadeClip by remember { mutableStateOf<Clip?>(null) }
    var activeMenuTrack by remember { mutableStateOf<Track?>(null) }

    val headerLeftWidthDp = 105

    // Back button interception for unsaved changes
    BackHandler {
        if (hasUnsavedChanges) {
            showUnsavedDialog = true
        } else {
            onNavigateBack()
        }
    }

    if (project == null) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(StudioDark),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = Color.White)
        }
        return
    }

    val currentProject = project!!
    val totalDurationMs = currentProject.getTotalDurationMs()
    val timelineWidthDp = ((totalDurationMs / 1000f) * zoomPxPerSec).coerceAtLeast(800f).dp

    val horizontalScrollState = rememberScrollState()
    val verticalScrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopBar(
                projectName = currentProject.name,
                onBackClick = {
                    if (hasUnsavedChanges) {
                        showUnsavedDialog = true
                    } else {
                        onNavigateBack()
                    }
                },
                onTitleClick = { showRenameDialog = true },
                onShareClick = { showShareSheet = true }
            )
        },
        bottomBar = {
            TransportBar(
                isPlaying = isPlaying,
                isRecording = isRecording,
                isRecordArmed = isRecordArmed,
                canUndo = canUndo,
                canRedo = canRedo,
                onPlayPauseClick = { viewModel.togglePlay() },
                onRewindTap = { viewModel.jumpToStart() },
                onRecordClick = { viewModel.handleRecordClick() },
                onUndoClick = { viewModel.undo() },
                onRedoClick = { viewModel.redo() }
            )
        },
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        containerColor = StudioDark
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Timeline Header (Ruler, Time, Zoom)
            TimelineHeader(
                timeDisplay = AudioEngine.formatTime(playheadMs),
                playheadMs = playheadMs,
                totalDurationMs = totalDurationMs,
                bpm = currentProject.bpm,
                timeSignature = currentProject.timeSignature,
                zoomPxPerSec = zoomPxPerSec,
                scrollOffsetPx = horizontalScrollState.value.toFloat(),
                headerLeftWidthDp = headerLeftWidthDp,
                onSeek = { viewModel.seekTo(it) },
                onZoomIn = { viewModel.setZoom(zoomPxPerSec + 20) },
                onZoomOut = { viewModel.setZoom(zoomPxPerSec - 20) }
            )

            // Tracks & Playhead Area
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                // Scrollable Tracks Content
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(verticalScrollState)
                ) {
                    currentProject.tracks.forEach { track ->
                        TrackRow(
                            track = track,
                            selectedClipId = selectedClipId,
                            zoomPxPerSec = zoomPxPerSec,
                            scrollOffsetPx = horizontalScrollState.value.toFloat(),
                            bpm = currentProject.bpm,
                            timeSignature = currentProject.timeSignature,
                            headerLeftWidthDp = headerLeftWidthDp,
                            onClipSelect = { viewModel.selectClip(it) },
                            onClipMove = { clipId, newStart -> viewModel.moveClip(clipId, newStart) },
                            onClipTrim = { clipId, dStart, dEnd -> viewModel.trimClip(clipId, dStart, dEnd) },
                            onClipOpenMenu = { activeMenuClip = it },
                            onTrackMenuClick = { activeMenuTrack = track },
                            onToggleMute = { viewModel.toggleMuteTrack(track.id) },
                            onToggleSolo = { viewModel.toggleSoloTrack(track.id) },
                            onEmptySpaceTap = { timeMs ->
                                viewModel.selectClip(null)
                                viewModel.seekTo(timeMs)
                            }
                        )
                    }

                    // Add Track Row Button
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .background(StudioSurface)
                            .border(width = 0.5.dp, color = StudioBorder)
                            .clickable { showAddTrackSheet = true }
                            .padding(horizontal = 16.dp)
                            .testTag("btn_add_track"),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(StudioCard),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Add Track",
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Text(
                            text = "Add Track",
                            color = Color.LightGray,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(start = 12.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(60.dp))
                }

                // Full-Height Vertical Playhead Cursor Line
                val playheadPx = headerLeftWidthDp * LocalContext.current.resources.displayMetrics.density +
                        (playheadMs / 1000f) * zoomPxPerSec - horizontalScrollState.value
                val isPlayheadVisible = playheadPx >= (headerLeftWidthDp * LocalContext.current.resources.displayMetrics.density)

                if (isPlayheadVisible) {
                    Box(
                        modifier = Modifier
                            .offset { IntOffset(playheadPx.toInt(), 0) }
                            .width(2.dp)
                            .fillMaxHeight()
                            .background(Color.White)
                    )
                }
            }
        }
    }

    // Dialogs & Sheets
    RenameProjectDialog(
        currentName = currentProject.name,
        isOpen = showRenameDialog,
        onClose = { showRenameDialog = false },
        onRename = { viewModel.renameProject(it) }
    )

    activeFadeClip?.let { clip ->
        FadeDialog(
            clip = clip,
            isOpen = true,
            onClose = { activeFadeClip = null },
            onApply = { inMs, outMs ->
                viewModel.applyFades(clip.id, inMs, outMs)
                activeFadeClip = null
            }
        )
    }

    UnsavedChangesDialog(
        isOpen = showUnsavedDialog,
        onClose = { showUnsavedDialog = false },
        onSave = {
            viewModel.saveProject()
            showUnsavedDialog = false
            onNavigateBack()
        },
        onDiscard = {
            showUnsavedDialog = false
            onNavigateBack()
        }
    )

    ClipActionBottomSheet(
        clip = activeMenuClip,
        onDismiss = { activeMenuClip = null },
        onSplit = { activeMenuClip?.let { viewModel.splitClipAtPlayhead(it) } },
        onDuplicate = { activeMenuClip?.let { viewModel.duplicateClip(it) } },
        onFades = {
            val clipToFade = activeMenuClip
            activeMenuClip = null
            activeFadeClip = clipToFade
        },
        onToggleMute = { activeMenuClip?.let { viewModel.toggleMuteClip(it.id) } },
        onDelete = { activeMenuClip?.let { viewModel.deleteClip(it.id) } }
    )

    TrackQuickMenuBottomSheet(
        track = activeMenuTrack,
        onDismiss = { activeMenuTrack = null },
        onToggleMute = { activeMenuTrack?.let { viewModel.toggleMuteTrack(it.id) } },
        onToggleSolo = { activeMenuTrack?.let { viewModel.toggleSoloTrack(it.id) } },
        onChangeColor = { color -> activeMenuTrack?.let { viewModel.changeTrackColor(it.id, color) } },
        onDeleteTrack = { activeMenuTrack?.let { viewModel.deleteTrack(it.id) } }
    )

    AddTrackBottomSheet(
        isOpen = showAddTrackSheet,
        onDismiss = { showAddTrackSheet = false },
        onAddBlankTrack = { viewModel.addBlankTrack() },
        onRecordNewTrack = { viewModel.handleRecordClick() },
        onImportAudio = { viewModel.importAudioClip("Imported Take", 15000L) }
    )

    ShareBottomSheet(
        projectName = currentProject.name,
        isOpen = showShareSheet,
        onDismiss = { showShareSheet = false },
        onExportWav = {
            val exportFile = File(context.cacheDir, "${currentProject.name.replace(" ", "_")}.wav")
            viewModel.exportMixdownWav(exportFile)
            coroutineScope.launch {
                snackbarHostState.showSnackbar("Exported mixdown to ${exportFile.name}")
            }
        },
        onShareApp = {
            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, "Check out my music project '${currentProject.name}' made with Audiozy!")
                type = "text/plain"
            }
            context.startActivity(Intent.createChooser(sendIntent, "Share Project"))
        }
    )
}
