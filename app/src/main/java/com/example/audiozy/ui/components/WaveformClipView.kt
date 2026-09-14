package com.example.audiozy.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.audiozy.model.Clip

@Composable
fun WaveformClipView(
    clip: Clip,
    trackColor: Color,
    isSelected: Boolean,
    zoomPxPerSec: Int,
    scrollOffsetPx: Float,
    onSelect: () -> Unit,
    onMove: (Long) -> Unit,
    onTrim: (Long, Long) -> Unit,
    onOpenMenu: () -> Unit,
    modifier: Modifier = Modifier
) {
    val effectiveDurationMs = clip.getEffectiveDurationMs()
    val clipStartSec = clip.startTimeMs / 1000f
    val clipDurationSec = effectiveDurationMs / 1000f

    val clipLeftPx = clipStartSec * zoomPxPerSec - scrollOffsetPx
    val clipWidthPx = clipDurationSec * zoomPxPerSec

    if (clipLeftPx + clipWidthPx < -100f) return

    var dragAccumulatorX by remember { mutableFloatStateOf(0f) }

    Box(
        modifier = modifier
            .offset { IntOffset(clipLeftPx.toInt(), 0) }
            .width(clipWidthPx.coerceAtLeast(24f).dp)
            .fillMaxHeight()
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(trackColor.copy(alpha = if (clip.isMuted) 0.2f else 0.35f))
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = if (isSelected) Color.White else trackColor.copy(alpha = 0.8f),
                shape = RoundedCornerShape(6.dp)
            )
            .pointerInput(clip.id) {
                detectTapGestures(
                    onTap = { onSelect() },
                    onLongPress = { onOpenMenu() },
                    onDoubleTap = { onOpenMenu() }
                )
            }
            .pointerInput(clip.id, zoomPxPerSec) {
                detectDragGestures(
                    onDragStart = {
                        dragAccumulatorX = 0f
                        onSelect()
                    },
                    onDragEnd = {
                        val deltaMs = ((dragAccumulatorX / zoomPxPerSec.toFloat()) * 1000f).toLong()
                        onMove(maxOf(0L, clip.startTimeMs + deltaMs))
                        dragAccumulatorX = 0f
                    },
                    onDrag = { change, dragAmount ->
                        change.consume()
                        dragAccumulatorX += dragAmount.x
                    }
                )
            }
            .testTag("clip_${clip.id}")
    ) {
        // Waveform & Fades Canvas
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height
            val midY = height / 2f

            val peaks = clip.peaks
            if (peaks.isNotEmpty()) {
                val peakWidth = width / peaks.size.toFloat()
                val waveformColor = if (clip.isMuted) Color.Gray.copy(alpha = 0.5f) else Color.White.copy(alpha = 0.85f)

                for (i in peaks.indices) {
                    val peak = peaks[i]
                    val barHeight = (peak * (height * 0.75f)).coerceAtLeast(2f)
                    val x = i * peakWidth
                    drawLine(
                        color = waveformColor,
                        start = Offset(x, midY - barHeight / 2f),
                        end = Offset(x, midY + barHeight / 2f),
                        strokeWidth = (peakWidth * 0.7f).coerceIn(1f, 3.dp.toPx())
                    )
                }
            }

            // Draw Fade In Ramp
            if (clip.fadeInMs > 0) {
                val fadeInWidth = (clip.fadeInMs / 1000f) * zoomPxPerSec
                val fadePath = Path().apply {
                    moveTo(0f, 0f)
                    lineTo(0f, height)
                    lineTo(fadeInWidth.coerceAtMost(width), 0f)
                    close()
                }
                drawPath(fadePath, color = Color.Black.copy(alpha = 0.35f))
            }

            // Draw Fade Out Ramp
            if (clip.fadeOutMs > 0) {
                val fadeOutWidth = (clip.fadeOutMs / 1000f) * zoomPxPerSec
                val startX = (width - fadeOutWidth).coerceAtLeast(0f)
                val fadePath = Path().apply {
                    moveTo(startX, 0f)
                    lineTo(width, height)
                    lineTo(width, 0f)
                    close()
                }
                drawPath(fadePath, color = Color.Black.copy(alpha = 0.35f))
            }
        }

        // Clip Title Badge
        Box(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(4.dp)
                .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(4.dp))
                .padding(horizontal = 4.dp, vertical = 1.dp)
        ) {
            Text(
                text = clip.name + if (clip.isMuted) " [M]" else "",
                color = Color.White,
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        // Left Trim Handle (visible when selected)
        if (isSelected) {
            Box(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .width(10.dp)
                    .fillMaxHeight()
                    .background(Color.White.copy(alpha = 0.4f))
            )
            // Right Trim Handle
            Box(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .width(10.dp)
                    .fillMaxHeight()
                    .background(Color.White.copy(alpha = 0.4f))
            )
        }
    }
}
