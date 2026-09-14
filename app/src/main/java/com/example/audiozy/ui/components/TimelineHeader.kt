package com.example.audiozy.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.audiozy.audio.AudioEngine
import com.example.audiozy.ui.theme.StudioBorder
import com.example.audiozy.ui.theme.StudioCard
import com.example.audiozy.ui.theme.StudioDark
import com.example.audiozy.ui.theme.StudioSurface

@Composable
fun TimelineHeader(
    timeDisplay: String,
    playheadMs: Long,
    totalDurationMs: Long,
    bpm: Int,
    timeSignature: String,
    zoomPxPerSec: Int,
    scrollOffsetPx: Float,
    headerLeftWidthDp: Int,
    onSeek: (Long) -> Unit,
    onZoomIn: () -> Unit,
    onZoomOut: () -> Unit,
    modifier: Modifier = Modifier
) {
    val beatsPerBar = timeSignature.split("/").firstOrNull()?.toIntOrNull() ?: 4
    val beatDurationSec = 60.0 / maxOf(1, bpm).toDouble()
    val barDurationSec = beatDurationSec * beatsPerBar

    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(44.dp)
            .background(StudioSurface),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Left info block with time display
        Box(
            modifier = Modifier
                .width(headerLeftWidthDp.dp)
                .fillMaxHeight()
                .background(StudioCard)
                .padding(horizontal = 4.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = timeDisplay,
                color = Color(0xFF6EE7B7),
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                maxLines = 1
            )
        }

        // Timeline Ruler Canvas
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight()
                .background(StudioDark)
        ) {
            Canvas(
                modifier = Modifier
                    .matchParentSize()
                    .pointerInput(zoomPxPerSec, scrollOffsetPx) {
                        detectTapGestures { offset ->
                            val clickedPx = offset.x + scrollOffsetPx
                            val timeMs = ((clickedPx / zoomPxPerSec.toFloat()) * 1000f).toLong()
                            onSeek(timeMs)
                        }
                    }
            ) {
                val canvasWidth = size.width
                val canvasHeight = size.height

                // Draw bottom border
                drawLine(
                    color = Color(0xFF242533),
                    start = Offset(0f, canvasHeight - 1f),
                    end = Offset(canvasWidth, canvasHeight - 1f),
                    strokeWidth = 1.dp.toPx()
                )

                val barPx = (barDurationSec * zoomPxPerSec).toFloat()
                val beatPx = (beatDurationSec * zoomPxPerSec).toFloat()

                val startBar = (scrollOffsetPx / barPx).toInt()
                val endBar = ((scrollOffsetPx + canvasWidth) / barPx).toInt() + 1

                val paint = android.graphics.Paint().apply {
                    color = android.graphics.Color.argb(200, 160, 163, 175)
                    textSize = 10.sp.toPx()
                    isAntiAlias = true
                }

                for (bar in startBar..endBar) {
                    val barX = bar * barPx - scrollOffsetPx

                    if (barX in -50f..canvasWidth + 50f) {
                        // Major bar line
                        drawLine(
                            color = Color(0xFF4B4F64),
                            start = Offset(barX, canvasHeight - 14.dp.toPx()),
                            end = Offset(barX, canvasHeight),
                            strokeWidth = 1.5.dp.toPx()
                        )

                        // Bar label
                        drawContext.canvas.nativeCanvas.drawText(
                            (bar + 1).toString(),
                            barX + 4.dp.toPx(),
                            canvasHeight - 16.dp.toPx(),
                            paint
                        )

                        // Beat tick marks inside bar
                        for (b in 1 until beatsPerBar) {
                            val beatX = barX + b * beatPx
                            if (beatX in 0f..canvasWidth) {
                                drawLine(
                                    color = Color(0xFF2A2B3D),
                                    start = Offset(beatX, canvasHeight - 7.dp.toPx()),
                                    end = Offset(beatX, canvasHeight),
                                    strokeWidth = 1.dp.toPx()
                                )
                            }
                        }
                    }
                }

                // Playhead indicator inverted triangle
                val playheadPx = (playheadMs / 1000f) * zoomPxPerSec - scrollOffsetPx
                if (playheadPx in 0f..canvasWidth) {
                    val path = androidx.compose.ui.graphics.Path().apply {
                        moveTo(playheadPx - 6.dp.toPx(), 0f)
                        lineTo(playheadPx + 6.dp.toPx(), 0f)
                        lineTo(playheadPx, 10.dp.toPx())
                        close()
                    }
                    drawPath(path, color = Color.White)
                }
            }
        }

        // Zoom Controls
        Row(
            modifier = Modifier
                .padding(horizontal = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onZoomOut,
                modifier = Modifier
                    .size(32.dp)
                    .testTag("btn_zoom_out")
            ) {
                Icon(
                    imageVector = Icons.Default.Remove,
                    contentDescription = "Zoom out",
                    tint = Color.LightGray,
                    modifier = Modifier.size(16.dp)
                )
            }
            IconButton(
                onClick = onZoomIn,
                modifier = Modifier
                    .size(32.dp)
                    .testTag("btn_zoom_in")
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Zoom in",
                    tint = Color.LightGray,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
