package com.example.audiozy.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallSplit
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.VolumeMute
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Waveform
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.audiozy.model.Clip
import com.example.audiozy.model.Track
import com.example.audiozy.model.TrackPalette
import com.example.audiozy.ui.theme.StudioBorder
import com.example.audiozy.ui.theme.StudioCard
import com.example.audiozy.ui.theme.StudioDark
import com.example.audiozy.ui.theme.StudioSurface

@Composable
fun RenameProjectDialog(
    currentName: String,
    isOpen: Boolean,
    onClose: () -> Unit,
    onRename: (String) -> Unit
) {
    if (!isOpen) return
    var name by remember(currentName) { mutableStateOf(currentName) }

    AlertDialog(
        onDismissRequest = onClose,
        containerColor = StudioSurface,
        title = { Text("Rename Project", color = Color.White, fontWeight = FontWeight.Bold) },
        text = {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("input_rename_project")
            )
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank()) onRename(name.trim())
                    onClose()
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
                modifier = Modifier.testTag("btn_confirm_rename")
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onClose) {
                Text("Cancel", color = Color.Gray)
            }
        }
    )
}

@Composable
fun FadeDialog(
    clip: Clip,
    isOpen: Boolean,
    onClose: () -> Unit,
    onApply: (Long, Long) -> Unit
) {
    if (!isOpen) return
    var fadeIn by remember { mutableFloatStateOf(clip.fadeInMs.toFloat()) }
    var fadeOut by remember { mutableFloatStateOf(clip.fadeOutMs.toFloat()) }
    val maxFade = (clip.getEffectiveDurationMs() / 2f).coerceAtLeast(100f)

    AlertDialog(
        onDismissRequest = onClose,
        containerColor = StudioSurface,
        title = { Text("Adjust Fades: ${clip.name}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp) },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text("Fade In: ${fadeIn.toInt()} ms", color = Color.LightGray, fontSize = 13.sp)
                Slider(
                    value = fadeIn,
                    onValueChange = { fadeIn = it },
                    valueRange = 0f..maxFade,
                    colors = SliderDefaults.colors(thumbColor = Color.White, activeTrackColor = Color.White)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text("Fade Out: ${fadeOut.toInt()} ms", color = Color.LightGray, fontSize = 13.sp)
                Slider(
                    value = fadeOut,
                    onValueChange = { fadeOut = it },
                    valueRange = 0f..maxFade,
                    colors = SliderDefaults.colors(thumbColor = Color.White, activeTrackColor = Color.White)
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onApply(fadeIn.toLong(), fadeOut.toLong())
                    onClose()
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black)
            ) {
                Text("Apply")
            }
        },
        dismissButton = {
            TextButton(onClick = onClose) {
                Text("Cancel", color = Color.Gray)
            }
        }
    )
}

@Composable
fun UnsavedChangesDialog(
    isOpen: Boolean,
    onClose: () -> Unit,
    onSave: () -> Unit,
    onDiscard: () -> Unit
) {
    if (!isOpen) return

    AlertDialog(
        onDismissRequest = onClose,
        containerColor = StudioSurface,
        title = { Text("Unsaved Changes", color = Color.White, fontWeight = FontWeight.Bold) },
        text = { Text("You have unsaved changes in your project. Would you like to save before leaving?", color = Color.LightGray) },
        confirmButton = {
            Button(
                onClick = onSave,
                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black)
            ) {
                Text("Save & Exit")
            }
        },
        dismissButton = {
            TextButton(onClick = onDiscard) {
                Text("Discard", color = Color(0xFFEF4444))
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClipActionBottomSheet(
    clip: Clip?,
    onDismiss: () -> Unit,
    onSplit: () -> Unit,
    onDuplicate: () -> Unit,
    onFades: () -> Unit,
    onToggleMute: () -> Unit,
    onDelete: () -> Unit
) {
    if (clip == null) return
    val sheetState = rememberModalBottomSheetState()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = StudioSurface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) {
            Text(
                text = clip.name,
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Split
            ActionRowItem(
                icon = Icons.Default.CallSplit,
                label = "Split Clip at Playhead",
                onClick = { onDismiss(); onSplit() }
            )
            // Duplicate
            ActionRowItem(
                icon = Icons.Default.ContentCopy,
                label = "Duplicate Clip",
                onClick = { onDismiss(); onDuplicate() }
            )
            // Fade In / Out
            ActionRowItem(
                icon = Icons.Default.MusicNote,
                label = "Adjust Fades (In / Out)",
                onClick = { onDismiss(); onFades() }
            )
            // Mute / Unmute
            ActionRowItem(
                icon = if (clip.isMuted) Icons.Default.VolumeUp else Icons.Default.VolumeMute,
                label = if (clip.isMuted) "Unmute Clip" else "Mute Clip",
                onClick = { onDismiss(); onToggleMute() }
            )
            // Delete
            ActionRowItem(
                icon = Icons.Default.Delete,
                label = "Delete Clip",
                iconTint = Color(0xFFEF4444),
                textColor = Color(0xFFEF4444),
                onClick = { onDismiss(); onDelete() }
            )
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrackQuickMenuBottomSheet(
    track: Track?,
    onDismiss: () -> Unit,
    onToggleMute: () -> Unit,
    onToggleSolo: () -> Unit,
    onChangeColor: (String) -> Unit,
    onDeleteTrack: () -> Unit
) {
    if (track == null) return
    val sheetState = rememberModalBottomSheetState()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = StudioSurface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) {
            Text(
                text = track.name,
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Mute
            ActionRowItem(
                icon = if (track.isMuted) Icons.Default.VolumeUp else Icons.Default.VolumeMute,
                label = if (track.isMuted) "Unmute Track" else "Mute Track",
                onClick = { onDismiss(); onToggleMute() }
            )
            // Solo
            ActionRowItem(
                icon = Icons.Default.MusicNote,
                label = if (track.isSolo) "Turn Solo Off" else "Solo Track",
                onClick = { onDismiss(); onToggleSolo() }
            )

            // Color Palette Picker
            Text(
                text = "Track Color",
                color = Color.LightGray,
                fontSize = 12.sp,
                modifier = Modifier.padding(vertical = 8.dp)
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                TrackPalette.colors.forEach { hex ->
                    val color = Color(android.graphics.Color.parseColor(hex))
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(color)
                            .clickable {
                                onChangeColor(hex)
                                onDismiss()
                            }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Delete Track
            ActionRowItem(
                icon = Icons.Default.Delete,
                label = "Delete Track",
                iconTint = Color(0xFFEF4444),
                textColor = Color(0xFFEF4444),
                onClick = { onDismiss(); onDeleteTrack() }
            )
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTrackBottomSheet(
    isOpen: Boolean,
    onDismiss: () -> Unit,
    onAddBlankTrack: () -> Unit,
    onRecordNewTrack: () -> Unit,
    onImportAudio: () -> Unit
) {
    if (!isOpen) return
    val sheetState = rememberModalBottomSheetState()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = StudioSurface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) {
            Text("Add New Track", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 16.dp))

            ActionRowItem(icon = Icons.Default.MusicNote, label = "Blank Track", onClick = { onDismiss(); onAddBlankTrack() })
            ActionRowItem(icon = Icons.Default.Mic, label = "Record New Audio Track", onClick = { onDismiss(); onRecordNewTrack() })
            ActionRowItem(icon = Icons.Default.Download, label = "Import Audio File", onClick = { onDismiss(); onImportAudio() })

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShareBottomSheet(
    projectName: String,
    isOpen: Boolean,
    onDismiss: () -> Unit,
    onExportWav: () -> Unit,
    onShareApp: () -> Unit
) {
    if (!isOpen) return
    val sheetState = rememberModalBottomSheetState()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = StudioSurface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) {
            Text("Share & Export: $projectName", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 16.dp))

            ActionRowItem(icon = Icons.Default.Download, label = "Export Mixdown (.wav)", onClick = { onDismiss(); onExportWav() })
            ActionRowItem(icon = Icons.Default.Share, label = "Share Project Link", onClick = { onDismiss(); onShareApp() })

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun ActionRowItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    iconTint: Color = Color.White,
    textColor: Color = Color.White,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(22.dp))
        Text(text = label, color = textColor, fontSize = 14.sp, modifier = Modifier.padding(start = 14.dp))
    }
}
