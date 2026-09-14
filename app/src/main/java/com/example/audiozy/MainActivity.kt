package com.example.audiozy

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.audiozy.ui.screens.CreateProjectScreen
import com.example.audiozy.ui.screens.ProjectListScreen
import com.example.audiozy.ui.screens.TimelineScreen
import com.example.audiozy.ui.theme.AudiozyTheme
import com.example.audiozy.viewmodel.ProjectListViewModel
import com.example.audiozy.viewmodel.TimelineViewModel

sealed class Screen {
    object ProjectList : Screen()
    object CreateProject : Screen()
    data class Timeline(val projectId: String) : Screen()
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            AudiozyTheme {
                var currentScreen by remember { mutableStateOf<Screen>(Screen.ProjectList) }

                // Request microphone permission gracefully
                val permissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestPermission()
                ) { _ -> }

                LaunchedEffect(Unit) {
                    if (ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.RECORD_AUDIO
                        ) != PackageManager.PERMISSION_GRANTED
                    ) {
                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    }
                }

                when (val screen = currentScreen) {
                    is Screen.ProjectList -> {
                        val projectListViewModel: ProjectListViewModel = viewModel()
                        ProjectListScreen(
                            viewModel = projectListViewModel,
                            onOpenProject = { id ->
                                currentScreen = Screen.Timeline(id)
                            },
                            onCreateNewProject = {
                                currentScreen = Screen.CreateProject
                            }
                        )
                    }
                    is Screen.CreateProject -> {
                        val projectListViewModel: ProjectListViewModel = viewModel()
                        CreateProjectScreen(
                            viewModel = projectListViewModel,
                            onBack = {
                                currentScreen = Screen.ProjectList
                            },
                            onProjectCreated = { newId ->
                                currentScreen = Screen.Timeline(newId)
                            }
                        )
                    }
                    is Screen.Timeline -> {
                        val timelineViewModel: TimelineViewModel = viewModel(
                            key = screen.projectId,
                            factory = object : androidx.lifecycle.ViewModelProvider.Factory {
                                @Suppress("UNCHECKED_CAST")
                                override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                                    return TimelineViewModel(application, screen.projectId) as T
                                }
                            }
                        )
                        TimelineScreen(
                            viewModel = timelineViewModel,
                            onNavigateBack = {
                                currentScreen = Screen.ProjectList
                            }
                        )
                    }
                }
            }
        }
    }
}
