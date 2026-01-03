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
use App\Http\Controllers\Api\RepostController;
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

// User's reposted tracks (public read)
Route::get('/users/{id}/reposts', [RepostController::class, 'userReposts']);

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
    Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar']);
    
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
    
    // Reposts
    Route::post('/tracks/{track}/repost', [RepostController::class, 'toggle']);
    Route::get('/me/reposts', [RepostController::class, 'index']);
    Route::get('/user/reposts', [RepostController::class, 'index']);
    
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
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
    Route::delete('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'clearAll']);
});

// Admin routes
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    // Track Management
    Route::get('/tracks', [AdminTrackController::class, 'index']);
    Route::get('/tracks/pending', [AdminTrackController::class, 'pending']);
    Route::patch('/tracks/{track}/approve', [AdminTrackController::class, 'approve']);
    Route::patch('/tracks/{track}/reject', [AdminTrackController::class, 'reject']);
    Route::delete('/tracks/{track}', [AdminTrackController::class, 'destroy']);
    
    // User Management
    Route::get('/users', [\App\Http\Controllers\Api\AdminController::class, 'getUsers']);
    Route::put('/users/{id}', [\App\Http\Controllers\Api\AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteUser']);
    Route::post('/users/{id}/restore', [\App\Http\Controllers\Api\AdminController::class, 'restoreUser']);
    Route::post('/users/{id}/ban', [\App\Http\Controllers\Api\AdminController::class, 'banUser']);
    Route::post('/users/{id}/reset-password', [\App\Http\Controllers\Api\AdminController::class, 'resetUserPassword']);
    Route::post('/users/{id}/reset-link', [\App\Http\Controllers\Api\AdminController::class, 'generateResetLink']);
    
    // Statistics & Activity
    Route::get('/stats', [\App\Http\Controllers\Api\AdminController::class, 'getStats']);
    Route::get('/activity', [\App\Http\Controllers\Api\AdminController::class, 'getActivity']);
    
    // Content Moderation
    Route::get('/comments', [\App\Http\Controllers\Api\AdminController::class, 'getComments']);
    Route::delete('/comments/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteComment']);
});
