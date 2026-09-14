package com.example.audiozy.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface AudiozyDao {
    @Query("SELECT * FROM projects ORDER BY lastModified DESC")
    fun getAllProjects(): Flow<List<ProjectEntity>>

    @Query("SELECT * FROM projects WHERE id = :id LIMIT 1")
    suspend fun getProjectById(id: String): ProjectEntity?

    @Query("SELECT * FROM tracks WHERE projectId = :projectId ORDER BY sortOrder ASC")
    suspend fun getTracksForProject(projectId: String): List<TrackEntity>

    @Query("SELECT * FROM clips WHERE trackId = :trackId ORDER BY startTimeMs ASC")
    suspend fun getClipsForTrack(trackId: String): List<ClipEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProject(project: ProjectEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTracks(tracks: List<TrackEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertClips(clips: List<ClipEntity>)

    @Query("DELETE FROM projects WHERE id = :projectId")
    suspend fun deleteProjectById(projectId: String)

    @Query("DELETE FROM tracks WHERE projectId = :projectId")
    suspend fun deleteTracksForProject(projectId: String)

    @Query("DELETE FROM clips WHERE trackId IN (SELECT id FROM tracks WHERE projectId = :projectId)")
    suspend fun deleteClipsForProject(projectId: String)

    @Query("DELETE FROM tracks WHERE id = :trackId")
    suspend fun deleteTrackById(trackId: String)

    @Query("DELETE FROM clips WHERE id = :clipId")
    suspend fun deleteClipById(clipId: String)
}
