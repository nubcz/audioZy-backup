package com.example.audiozy.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = StudioBlue,
    onPrimary = Color.White,
    primaryContainer = StudioCardElevated,
    onPrimaryContainer = Color.White,
    secondary = StudioCyan,
    onSecondary = Color.Black,
    background = StudioDark,
    onBackground = StudioTextPrimary,
    surface = StudioSurface,
    onSurface = StudioTextPrimary,
    surfaceVariant = StudioCard,
    onSurfaceVariant = StudioTextSecondary,
    outline = StudioBorder,
    error = StudioRose
)

@Composable
fun AudiozyTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
