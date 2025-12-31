<?php

use App\Http\Controllers\Api\AdminTrackController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TrackController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\PlaylistController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\HistoryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::get('/tracks', [TrackController::class, 'index']);
Route::get('/tracks/{track}', [TrackController::class, 'show']);

// Users/Profiles - support both endpoints
Route::get('/users/{id}', [ProfileController::class, 'show']);
Route::get('/profiles/{userId}', [ProfileController::class, 'show']);
Route::get('/users', [ProfileController::class, 'index']);

// Comments (public read)
Route::get('/tracks/{track}/comments', [CommentController::class, 'index']);

// Followers (public read)
Route::get('/users/{id}/followers', [FollowController::class, 'followers']);
Route::get('/users/{id}/following', [FollowController::class, 'following']);

// User's liked tracks (public read)
Route::get('/users/{id}/likes', [LikeController::class, 'userLikes']);

// Search
Route::get('/search', [SearchController::class, 'search']);

// Auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/guest-login', [AuthController::class, 'guestLogin']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/verify-email/{token}', [AuthController::class, 'verifyEmail']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', [AuthController::class, 'me']);
    
    // Profile
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/user', [ProfileController::class, 'update']);
    
    // Tracks
    Route::post('/tracks', [TrackController::class, 'store']);
    Route::put('/tracks/{track}', [TrackController::class, 'update']);
    Route::delete('/tracks/{track}', [TrackController::class, 'destroy']);
    Route::get('/me/tracks', [TrackController::class, 'mine']);
    
    // Likes - toggle endpoint (POST to toggle)
    Route::post('/tracks/{track}/like', [LikeController::class, 'toggle']);
    Route::delete('/tracks/{track}/like', [LikeController::class, 'destroy']);
    Route::get('/me/likes', [LikeController::class, 'index']);
    Route::get('/user/likes', [LikeController::class, 'index']);
    
    // Comments
    Route::post('/tracks/{track}/comments', [CommentController::class, 'store']);
    Route::put('/tracks/{track}/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/tracks/{track}/comments/{comment}', [CommentController::class, 'destroy']);
    
    // Follows
    Route::post('/users/{id}/follow', [FollowController::class, 'toggle']);
    Route::delete('/users/{id}/follow', [FollowController::class, 'unfollow']);
    Route::get('/user/following', [FollowController::class, 'myFollowing']);
    
    // Playlists
    Route::get('/playlists', [PlaylistController::class, 'index']);
    Route::get('/playlists/{playlist}', [PlaylistController::class, 'show']);
    Route::post('/playlists', [PlaylistController::class, 'store']);
    Route::put('/playlists/{playlist}', [PlaylistController::class, 'update']);
    Route::delete('/playlists/{playlist}', [PlaylistController::class, 'destroy']);
    Route::post('/playlists/{playlist}/tracks', [PlaylistController::class, 'addTrack']);
    Route::delete('/playlists/{playlist}/tracks/{track}', [PlaylistController::class, 'removeTrack']);
    Route::get('/users/{id}/playlists', [PlaylistController::class, 'userPlaylists']);
    
    // History
    Route::get('/history', [HistoryController::class, 'index']);
    Route::post('/history', [HistoryController::class, 'store']);
    Route::delete('/history', [HistoryController::class, 'clear']);
    
    // Notifications
    Route::get('/notifications', [AuthController::class, 'notifications']);
    Route::post('/notifications/{id}/read', [AuthController::class, 'markNotificationRead']);
    Route::post('/notifications/read-all', [AuthController::class, 'markAllNotificationsRead']);
});

// Admin routes
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::get('/tracks', [AdminTrackController::class, 'index']);
    Route::get('/tracks/pending', [AdminTrackController::class, 'pending']);
    Route::patch('/tracks/{track}/approve', [AdminTrackController::class, 'approve']);
    Route::patch('/tracks/{track}/reject', [AdminTrackController::class, 'reject']);
    Route::get('/stats', [AdminTrackController::class, 'stats']);
    Route::get('/users', [AdminTrackController::class, 'users']);
});
