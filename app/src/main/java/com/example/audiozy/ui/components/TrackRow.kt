package com.example.audiozy.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.audiozy.model.Clip
import com.example.audiozy.model.Track
import com.example.audiozy.ui.theme.StudioBorder
import com.example.audiozy.ui.theme.StudioCard
import com.example.audiozy.ui.theme.StudioDark
import com.example.audiozy.ui.theme.StudioSurface

@Composable
fun TrackRow(
    track: Track,
    selectedClipId: String?,
    zoomPxPerSec: Int,
    scrollOffsetPx: Float,
    bpm: Int,
    timeSignature: String,
    headerLeftWidthDp: Int,
    onClipSelect: (String) -> Unit,
    onClipMove: (String, Long) -> Unit,
    onClipTrim: (String, Long, Long) -> Unit,
    onClipOpenMenu: (Clip) -> Unit,
    onTrackMenuClick: () -> Unit,
    onToggleMute: () -> Unit,
    onToggleSolo: () -> Unit,
    onEmptySpaceTap: (Long) -> Unit,
    modifier: Modifier = Modifier
) {
    val trackColor = try {
        Color(android.graphics.Color.parseColor(track.color))
    } catch (_: Exception) {
        Color(0xFF3B82F6)
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(84.dp)
            .border(width = 0.5.dp, color = StudioBorder)
    ) {
        // Left Track Controls Header
        Row(
            modifier = Modifier
                .width(headerLeftWidthDp.dp)
                .fillMaxHeight()
                .background(StudioSurface)
                .padding(horizontal = 4.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Track Color and Name
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(trackColor)
                        .clickable { onTrackMenuClick() }
                )
                Text(
                    text = track.name,
                    color = if (track.isMuted) Color.Gray else Color.White,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }

            // Mute / Solo buttons
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Mute (M)
                Box(
                    modifier = Modifier
                        .size(18.dp)
                        .clip(RoundedCornerShape(3.dp))
                        .background(if (track.isMuted) Color(0xFFEF4444) else StudioCard)
                        .clickable { onToggleMute() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "M",
                        color = Color.White,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Solo (S)
                Box(
                    modifier = Modifier
                        .padding(start = 2.dp)
                        .size(18.dp)
                        .clip(RoundedCornerShape(3.dp))
                        .background(if (track.isSolo) Color(0xFFF59E0B) else StudioCard)
                        .clickable { onToggleSolo() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "S",
                        color = Color.White,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                IconButton(
                    onClick = onTrackMenuClick,
                    modifier = Modifier.size(20.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.MoreVert,
                        contentDescription = "Track settings",
                        tint = Color.Gray,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
        }

        // Right Timeline Lane Canvas & Clips Container
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight()
                .background(StudioDark)
                .pointerInput(zoomPxPerSec, scrollOffsetPx) {
                    detectTapGestures { offset ->
                        val clickedPx = offset.x + scrollOffsetPx
                        val timeMs = ((clickedPx / zoomPxPerSec.toFloat()) * 1000f).toLong()
                        onEmptySpaceTap(timeMs)
                    }
                }
        ) {
            // Grid background
            Canvas(modifier = Modifier.matchParentSize()) {
                val beatsPerBar = timeSignature.split("/").firstOrNull()?.toIntOrNull() ?: 4
                val beatDurationSec = 60.0 / maxOf(1, bpm).toDouble()
                val barDurationSec = beatDurationSec * beatsPerBar
                val barPx = (barDurationSec * zoomPxPerSec).toFloat()

                val startBar = (scrollOffsetPx / barPx).toInt()
                val endBar = ((scrollOffsetPx + size.width) / barPx).toInt() + 1

                for (bar in startBar..endBar) {
                    val x = bar * barPx - scrollOffsetPx
                    if (x in 0f..size.width) {
                        drawLine(
                            color = Color(0xFF1B1C28),
                            start = Offset(x, 0f),
                            end = Offset(x, size.height),
                            strokeWidth = 1.dp.toPx()
                        )
                    }
                }
            }

            // Clips
            track.clips.forEach { clip ->
                WaveformClipView(
                    clip = clip,
                    trackColor = trackColor,
                    isSelected = selectedClipId == clip.id,
                    zoomPxPerSec = zoomPxPerSec,
                    scrollOffsetPx = scrollOffsetPx,
                    onSelect = { onClipSelect(clip.id) },
                    onMove = { newStartMs -> onClipMove(clip.id, newStartMs) },
                    onTrim = { dStart, dEnd -> onClipTrim(clip.id, dStart, dEnd) },
                    onOpenMenu = { onClipOpenMenu(clip) }
                )
            }
        }
    }
}
