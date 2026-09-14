package com.example.audiozy.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.audiozy.model.SourceOption
import com.example.audiozy.ui.theme.StudioBorder
import com.example.audiozy.ui.theme.StudioCard
import com.example.audiozy.ui.theme.StudioDark
import com.example.audiozy.ui.theme.StudioSurface
import com.example.audiozy.viewmodel.ProjectListViewModel

@Composable
fun CreateProjectScreen(
    viewModel: ProjectListViewModel,
    onBack: () -> Unit,
    onProjectCreated: (String) -> Unit
) {
    var projectName by remember { mutableStateOf("My Project") }
    var selectedSource by remember { mutableStateOf(SourceOption.BLANK_PROJECT) }
    var bpm by remember { mutableIntStateOf(120) }
    var timeSignature by remember { mutableStateOf("4/4") }
    var sampleRate by remember { mutableStateOf("44.1kHz") }
    var bitDepth by remember { mutableStateOf("24-bit") }
    var nameError by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .background(StudioSurface)
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.testTag("btn_create_back")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = Color.White
                    )
                }
                Text(
                    text = "New Project",
                    color = Color.White,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(start = 8.dp)
                )
            }
        },
        containerColor = StudioDark
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Project Name
            Column {
                Text(
                    text = "PROJECT NAME",
                    color = Color.Gray,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = projectName,
                    onValueChange = {
                        projectName = it
                        if (nameError != null) nameError = null
                    },
                    isError = nameError != null,
                    singleLine = true,
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = StudioSurface,
                        unfocusedContainerColor = StudioSurface,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedIndicatorColor = Color.White,
                        unfocusedIndicatorColor = StudioBorder
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_project_name")
                )
                nameError?.let {
                    Text(text = it, color = Color(0xFFEF4444), fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
                }
            }

            // Starting Source Options
            Column {
                Text(
                    text = "STARTING SOURCE",
                    color = Color.Gray,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Import Audio
                    SourceCard(
                        title = "Import Audio",
                        subtitle = "Load audio file",
                        icon = Icons.Default.Download,
                        iconColor = Color(0xFF60A5FA),
                        isSelected = selectedSource == SourceOption.IMPORT_AUDIO,
                        onClick = { selectedSource = SourceOption.IMPORT_AUDIO },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("btn_source_import")
                    )

                    // Record Manually
                    SourceCard(
                        title = "Record",
                        subtitle = "Arm microphone",
                        icon = Icons.Default.Mic,
                        iconColor = Color(0xFFFB7185),
                        isSelected = selectedSource == SourceOption.RECORD_MANUALLY,
                        onClick = { selectedSource = SourceOption.RECORD_MANUALLY },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("btn_source_record")
                    )

                    // Blank Project
                    SourceCard(
                        title = "Blank",
                        subtitle = "Empty canvas",
                        icon = Icons.Default.Description,
                        iconColor = Color(0xFF34D399),
                        isSelected = selectedSource == SourceOption.BLANK_PROJECT,
                        onClick = { selectedSource = SourceOption.BLANK_PROJECT },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("btn_source_blank")
                    )
                }
            }

            // Tempo (BPM) Stepper
            Column {
                Text(
                    text = "TEMPO (BPM)",
                    color = Color.Gray,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(StudioSurface)
                        .border(1.dp, StudioBorder, RoundedCornerShape(12.dp))
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(
                        onClick = { bpm = maxOf(40, bpm - 1) },
                        modifier = Modifier.testTag("btn_bpm_minus")
                    ) {
                        Icon(imageVector = Icons.Default.Remove, contentDescription = "Decrease BPM", tint = Color.White)
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = bpm.toString(),
                            color = Color.White,
                            fontSize = 24.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold
                        )
                        Text(text = "Beats Per Minute", color = Color.Gray, fontSize = 10.sp)
                    }

                    IconButton(
                        onClick = { bpm = minOf(300, bpm + 1) },
                        modifier = Modifier.testTag("btn_bpm_plus")
                    ) {
                        Icon(imageVector = Icons.Default.Add, contentDescription = "Increase BPM", tint = Color.White)
                    }
                }
            }

            // Time Signature
            Column {
                Text(
                    text = "TIME SIGNATURE",
                    color = Color.Gray,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("4/4", "3/4", "6/8", "2/4").forEach { sig ->
                        val isSel = timeSignature == sig
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isSel) Color(0xFF1E2030) else StudioSurface)
                                .border(
                                    1.dp,
                                    if (isSel) Color.White else StudioBorder,
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { timeSignature = sig }
                                .testTag("btn_timesig_${sig.replace('/', '_')}"),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = sig,
                                color = if (isSel) Color.White else Color.Gray,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }

            // Audio Quality
            Column {
                Text(
                    text = "AUDIO QUALITY",
                    color = Color.Gray,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Sample Rate
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Sample Rate", color = Color.Gray, fontSize = 11.sp, modifier = Modifier.padding(bottom = 4.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(StudioSurface)
                                .border(1.dp, StudioBorder, RoundedCornerShape(10.dp))
                                .clickable {
                                    sampleRate = when (sampleRate) {
                                        "44.1kHz" -> "48kHz"
                                        "48kHz" -> "96kHz"
                                        else -> "44.1kHz"
                                    }
                                }
                                .padding(horizontal = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(sampleRate, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                        }
                    }

                    // Bit Depth
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Bit Depth", color = Color.Gray, fontSize = 11.sp, modifier = Modifier.padding(bottom = 4.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(StudioSurface)
                                .border(1.dp, StudioBorder, RoundedCornerShape(10.dp))
                                .clickable {
                                    bitDepth = if (bitDepth == "16-bit") "24-bit" else "16-bit"
                                }
                                .padding(horizontal = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(bitDepth, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Create Project CTA
            Button(
                onClick = {
                    if (projectName.isBlank()) {
                        nameError = "Project name cannot be empty"
                        return@Button
                    }
                    viewModel.createProject(
                        name = projectName.trim(),
                        bpm = bpm,
                        timeSignature = timeSignature,
                        sampleRate = sampleRate,
                        bitDepth = bitDepth,
                        sourceOption = selectedSource,
                        onCreated = onProjectCreated
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("btn_create_project_submit")
            ) {
                Text("Create Project", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        }
    }
}

@Composable
fun SourceCard(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .height(96.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (isSelected) Color(0xFF1C1E2A) else StudioSurface)
            .border(
                width = if (isSelected) 1.5.dp else 1.dp,
                color = if (isSelected) Color.White else StudioBorder,
                shape = RoundedCornerShape(12.dp)
            )
            .clickable { onClick() }
            .padding(10.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(imageVector = icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = title, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Text(text = subtitle, color = Color.Gray, fontSize = 9.sp)
        }
    }
}
