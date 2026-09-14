package com.example.audiozy.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.audiozy.model.Clip
import com.example.audiozy.model.Project
import com.example.audiozy.model.Track
import com.example.audiozy.model.TrackPalette
import com.example.audiozy.model.WaveformGenerator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [ProjectEntity::class, TrackEntity::class, ClipEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AudiozyDatabase : RoomDatabase() {
    abstract fun dao(): AudiozyDao

    companion object {
        @Volatile
        private var INSTANCE: AudiozyDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): AudiozyDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AudiozyDatabase::class.java,
                    "audiozy_studio.db"
                ).addCallback(object : Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        super.onCreate(db)
                        scope.launch(Dispatchers.IO) {
                            populateSampleProject(getDatabase(context, scope).dao())
                        }
                    }
                }).build()
                INSTANCE = instance
                instance
            }
        }

        suspend fun populateSampleProject(dao: AudiozyDao) {
            val sample = createSampleProject()
            saveFullProject(dao, sample)
        }

        fun createSampleProject(): Project {
            return Project(
                id = "sample_project_audiozy",
                name = "My Project",
                bpm = 120,
                timeSignature = "4/4",
                sampleRate = "44.1kHz",
                bitDepth = "24-bit",
                lastModified = System.currentTimeMillis(),
                tracks = listOf(
                    Track(
                        id = "track_1",
                        name = "Vocals",
                        color = TrackPalette.colors[0],
                        isMuted = false,
                        isSolo = false,
                        clips = listOf(
                            Clip(
                                id = "clip_v1",
                                trackId = "track_1",
                                name = "Vocals Take 1",
                                startTimeMs = 0L,
                                durationMs = 18000L,
                                fadeInMs = 300L,
                                fadeOutMs = 500L,
                                peaks = WaveformGenerator.generateRealisticPeaks(120, 101)
                            ),
                            Clip(
                                id = "clip_v2",
                                trackId = "track_1",
                                name = "Vocals Outro",
                                startTimeMs = 24000L,
                                durationMs = 12000L,
                                fadeInMs = 200L,
                                fadeOutMs = 400L,
                                peaks = WaveformGenerator.generateRealisticPeaks(80, 202)
                            )
                        )
                    ),
                    Track(
                        id = "track_2",
                        name = "Guitar",
                        color = TrackPalette.colors[1],
                        isMuted = false,
                        isSolo = false,
                        clips = listOf(
                            Clip(
                                id = "clip_g1",
                                trackId = "track_2",
                                name = "Guitar Riff",
                                startTimeMs = 4000L,
                                durationMs = 22000L,
                                fadeInMs = 150L,
                                fadeOutMs = 300L,
                                peaks = WaveformGenerator.generateRealisticPeaks(140, 303)
                            )
                        )
                    ),
                    Track(
                        id = "track_3",
                        name = "Bass",
                        color = TrackPalette.colors[2],
                        isMuted = false,
                        isSolo = false,
                        clips = listOf(
                            Clip(
                                id = "clip_b1",
                                trackId = "track_3",
                                name = "Synth Bass",
                                startTimeMs = 0L,
                                durationMs = 28000L,
                                fadeInMs = 100L,
                                fadeOutMs = 200L,
                                peaks = WaveformGenerator.generateRealisticPeaks(160, 404)
                            )
                        )
                    ),
                    Track(
                        id = "track_4",
                        name = "Beats",
                        color = TrackPalette.colors[3],
                        isMuted = false,
                        isSolo = false,
                        clips = listOf(
                            Clip(
                                id = "clip_d1",
                                trackId = "track_4",
                                name = "Master Beat",
                                startTimeMs = 0L,
                                durationMs = 32000L,
                                fadeInMs = 50L,
                                fadeOutMs = 100L,
                                peaks = WaveformGenerator.generateRealisticPeaks(180, 505)
                            )
                        )
                    ),
                    Track(
                        id = "track_5",
                        name = "Drums",
                        color = TrackPalette.colors[4],
                        isMuted = false,
                        isSolo = false,
                        clips = listOf(
                            Clip(
                                id = "clip_l1",
                                trackId = "track_5",
                                name = "Drum Loop",
                                startTimeMs = 8000L,
                                durationMs = 16000L,
                                fadeInMs = 100L,
                                fadeOutMs = 150L,
                                peaks = WaveformGenerator.generateRealisticPeaks(100, 606)
                            )
                        )
                    )
                )
            )
        }

        suspend fun saveFullProject(dao: AudiozyDao, project: Project) {
            dao.insertProject(
                ProjectEntity(
                    id = project.id,
                    name = project.name,
                    bpm = project.bpm,
                    timeSignature = project.timeSignature,
                    sampleRate = project.sampleRate,
                    bitDepth = project.bitDepth,
                    lastModified = project.lastModified
                )
            )
            dao.deleteClipsForProject(project.id)
            dao.deleteTracksForProject(project.id)

            val trackEntities = project.tracks.mapIndexed { index, track ->
                TrackEntity(
                    id = track.id,
                    projectId = project.id,
                    name = track.name,
                    color = track.color,
                    isMuted = track.isMuted,
                    isSolo = track.isSolo,
                    sortOrder = index
                )
            }
            dao.insertTracks(trackEntities)

            val clipEntities = mutableListOf<ClipEntity>()
            for (track in project.tracks) {
                for (clip in track.clips) {
                    clipEntities.add(
                        ClipEntity(
                            id = clip.id,
                            trackId = track.id,
                            name = clip.name,
                            sourceFileUri = clip.sourceFileUri,
                            startTimeMs = clip.startTimeMs,
                            durationMs = clip.durationMs,
                            trimStartMs = clip.trimStartMs,
                            trimEndMs = clip.trimEndMs,
                            fadeInMs = clip.fadeInMs,
                            fadeOutMs = clip.fadeOutMs,
                            isMuted = clip.isMuted,
                            peaksJson = clip.peaks.joinToString(",")
                        )
                    )
                }
            }
            dao.insertClips(clipEntities)
        }
    }
}
