package com.example.audiozy.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Redo
import androidx.compose.material.icons.automirrored.filled.Undo
import androidx.compose.material.icons.filled.FastRewind
import androidx.compose.material.icons.filled.FiberManualRecord
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.audiozy.ui.theme.StudioBorder
import com.example.audiozy.ui.theme.StudioSurface

@Composable
fun TransportBar(
    isPlaying: Boolean,
    isRecording: Boolean,
    isRecordArmed: Boolean,
    canUndo: Boolean,
    canRedo: Boolean,
    onPlayPauseClick: () -> Unit,
    onRewindTap: () -> Unit,
    onRecordClick: () -> Unit,
    onUndoClick: () -> Unit,
    onRedoClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(72.dp)
            .background(StudioSurface)
            .navigationBarsPadding()
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        // Left: Undo & Redo
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(
                onClick = onUndoClick,
                enabled = canUndo,
                modifier = Modifier
                    .size(48.dp)
                    .testTag("btn_undo")
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Undo,
                    contentDescription = "Undo",
                    tint = if (canUndo) Color.White else Color(0xFF4B5563)
                )
            }

            IconButton(
                onClick = onRedoClick,
                enabled = canRedo,
                modifier = Modifier
                    .size(48.dp)
                    .testTag("btn_redo")
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Redo,
                    contentDescription = "Redo",
                    tint = if (canRedo) Color.White else Color(0xFF4B5563)
                )
            }
        }

        // Center: Transport Controls (Rewind, Play/Pause, Record)
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Rewind
            IconButton(
                onClick = onRewindTap,
                modifier = Modifier
                    .size(48.dp)
                    .testTag("btn_rewind")
            ) {
                Icon(
                    imageVector = Icons.Default.FastRewind,
                    contentDescription = "Rewind to start",
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                )
            }

            // Play / Pause (Large Primary Button)
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(CircleShape)
                    .background(Color.White)
                    .testTag("btn_play_pause"),
                contentAlignment = Alignment.Center
            ) {
                IconButton(
                    onClick = onPlayPauseClick,
                    modifier = Modifier.size(52.dp)
                ) {
                    Icon(
                        imageVector = if (isPlaying || isRecording) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = if (isPlaying) "Pause" else "Play",
                        tint = Color.Black,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }

            // Record Button
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(
                        when {
                            isRecording -> Color(0xFFEF4444)
                            isRecordArmed -> Color(0xFFB91C1C)
                            else -> Color(0xFF1F2937)
                        }
                    )
                    .testTag("btn_record"),
                contentAlignment = Alignment.Center
            ) {
                IconButton(
                    onClick = onRecordClick,
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(
                        imageVector = if (isRecording) Icons.Default.Stop else Icons.Default.FiberManualRecord,
                        contentDescription = if (isRecording) "Stop Recording" else "Record",
                        tint = if (isRecording || isRecordArmed) Color.White else Color(0xFFEF4444),
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }

        // Right spacer
        Box(modifier = Modifier.size(48.dp))
    }
}
