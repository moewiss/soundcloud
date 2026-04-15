<?php

use App\Http\Controllers\Api\AdminTrackController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TrackController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\PlaylistController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\HistoryController;
use App\Http\Controllers\Api\RepostController;
use App\Http\Controllers\Api\AdController;
use App\Http\Controllers\Api\AdminAdController;
use App\Http\Controllers\Api\AdminExtendedController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\TrackPromotionController;
use App\Http\Controllers\Api\OnboardingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Home page (works for both guest and authenticated)
Route::get('/home', [HomeController::class, 'index']);

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

// Plans (public)
Route::get('/plans', [SubscriptionController::class, 'plans']);
Route::get('/search/browse', [SearchController::class, 'browse']);
Route::get('/search/suggestions', [SearchController::class, 'suggestions']);
Route::get('/search/ai', [SearchController::class, 'aiSearch']);

// Playlists (public read)
Route::get('/playlists/{playlist}', [PlaylistController::class, 'show']);
Route::get('/users/{id}/playlists', [PlaylistController::class, 'userPlaylists']);

// Auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/guest-login', [AuthController::class, 'guestLogin']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
Route::post('/2fa/challenge', [TwoFactorController::class, 'challenge']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // 2FA
    Route::post('/2fa/setup', [TwoFactorController::class, 'setup']);
    Route::post('/2fa/confirm', [TwoFactorController::class, 'confirm']);
    Route::post('/2fa/disable', [TwoFactorController::class, 'disable']);
    Route::post('/2fa/recovery-codes', [TwoFactorController::class, 'recoveryCodes']);

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::delete('/account', [AuthController::class, 'deleteAccount']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', [AuthController::class, 'me']);
    
    // Profile
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/user', [ProfileController::class, 'update']);
    Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar']);
    Route::post('/user/change-password', [ProfileController::class, 'changePassword']);

    // Notification Preferences
    Route::get('/notification-preferences', [ProfileController::class, 'getNotificationPreferences']);
    Route::put('/notification-preferences', [ProfileController::class, 'updateNotificationPreferences']);
    
    // Tracks
    Route::get('/feed', [TrackController::class, 'feed']);
    Route::post('/tracks', [TrackController::class, 'store']);
    Route::post('/tracks/import-youtube', [TrackController::class, 'importFromYoutube']);
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
    
    // Playlists (auth required for write operations and listing own playlists)
    Route::get('/playlists', [PlaylistController::class, 'index']);
    Route::post('/playlists', [PlaylistController::class, 'store']);
    Route::put('/playlists/{playlist}', [PlaylistController::class, 'update']);
    Route::delete('/playlists/{playlist}', [PlaylistController::class, 'destroy']);
    Route::post('/playlists/{playlist}/tracks', [PlaylistController::class, 'addTrack']);
    Route::delete('/playlists/{playlist}/tracks/{track}', [PlaylistController::class, 'removeTrack']);
    Route::post('/playlists/{playlist}/like', [PlaylistController::class, 'toggleLike']);
    Route::post('/playlists/{playlist}/repost', [PlaylistController::class, 'toggleRepost']);
    Route::put('/playlists/{playlist}/reorder', [PlaylistController::class, 'reorderTracks']);
    
    // History
    Route::get('/history', [HistoryController::class, 'index']);
    Route::post('/history', [HistoryController::class, 'store']);
    Route::delete('/history', [HistoryController::class, 'clear']);

    // Play events (listen progress)
    Route::post('/play-events/update', [HomeController::class, 'updatePlayEvent']);

    // Search history
    Route::delete('/search/history', [SearchController::class, 'clearHistory']);
    Route::delete('/search/history/{id}', [SearchController::class, 'removeHistoryItem']);

    // Subscriptions
    Route::get('/subscription/status', [SubscriptionController::class, 'status']);
    Route::post('/subscription/checkout', [SubscriptionController::class, 'checkout']);
    Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel']);
    Route::post('/subscription/resume', [SubscriptionController::class, 'resume']);
    Route::post('/subscription/change-plan', [SubscriptionController::class, 'changePlan']);
    Route::get('/subscription/billing-history', [SubscriptionController::class, 'billingHistory']);
    
    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
    Route::delete('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'clearAll']);

    // Downloads (offline caching)
    Route::get('/downloads', [\App\Http\Controllers\Api\DownloadController::class, 'index']);
    Route::post('/downloads/status', [\App\Http\Controllers\Api\DownloadController::class, 'status']);
    Route::post('/tracks/{track}/download', [\App\Http\Controllers\Api\DownloadController::class, 'store']);
    Route::delete('/tracks/{track}/download', [\App\Http\Controllers\Api\DownloadController::class, 'destroy']);

    // Track Promotions (artist self-service)
    Route::get('/promotions', [TrackPromotionController::class, 'index']);
    Route::get('/promotions/pricing', [TrackPromotionController::class, 'pricing']);
    Route::post('/promotions/promote', [TrackPromotionController::class, 'promote']);
    Route::post('/promotions/{id}/cancel', [TrackPromotionController::class, 'cancel']);

    // Onboarding
    Route::get('/onboarding/state', [OnboardingController::class, 'state']);
    Route::post('/onboarding/step', [OnboardingController::class, 'saveStep']);
    Route::get('/onboarding/candidate-artists', [OnboardingController::class, 'candidateArtists']);
    Route::post('/onboarding/complete', [OnboardingController::class, 'complete']);
    Route::post('/onboarding/skip', [OnboardingController::class, 'skipFlow']);

    // Wallet
    Route::get('/wallet', [\App\Http\Controllers\Api\WalletController::class, 'show']);
    Route::get('/wallet/bonus-tiers', [\App\Http\Controllers\Api\WalletController::class, 'bonusTiers']);
    Route::post('/wallet/top-up', [\App\Http\Controllers\Api\WalletController::class, 'topUp']);
    Route::post('/wallet/gift', [\App\Http\Controllers\Api\WalletController::class, 'gift']);
    Route::post('/wallet/withdraw', [\App\Http\Controllers\Api\WalletController::class, 'withdraw']);

    // Artist Portal
    Route::prefix('artist')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Api\ArtistPortalController::class, 'dashboard']);
        Route::get('/analytics', [\App\Http\Controllers\Api\ArtistPortalController::class, 'analytics']);
        Route::get('/audience', [\App\Http\Controllers\Api\ArtistPortalController::class, 'audience']);
        Route::get('/profile', [\App\Http\Controllers\Api\ArtistPortalController::class, 'profileShow']);
        Route::put('/profile', [\App\Http\Controllers\Api\ArtistPortalController::class, 'profileUpdate']);
        Route::get('/profile/preview', [\App\Http\Controllers\Api\ArtistPortalController::class, 'profilePreview']);
        Route::get('/tracks', [\App\Http\Controllers\Api\ArtistPortalController::class, 'tracks']);
        Route::post('/tracks', [\App\Http\Controllers\Api\ArtistPortalController::class, 'trackStore']);
        Route::put('/tracks/{track}', [\App\Http\Controllers\Api\ArtistPortalController::class, 'trackUpdate']);
        Route::get('/onboarding/state', [\App\Http\Controllers\Api\ArtistOnboardingController::class, 'state']);
        Route::post('/onboarding/compliance', [\App\Http\Controllers\Api\ArtistOnboardingController::class, 'attestCompliance']);
        Route::post('/onboarding/profile-basics', [\App\Http\Controllers\Api\ArtistOnboardingController::class, 'saveProfileBasics']);
        Route::post('/onboarding/skip-stripe', [\App\Http\Controllers\Api\ArtistOnboardingController::class, 'skipStripe']);
        Route::post('/onboarding/complete', [\App\Http\Controllers\Api\ArtistOnboardingController::class, 'completeOnboarding']);
    });
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
    Route::post('/users/promote', [\App\Http\Controllers\Api\AdminController::class, 'promoteToAdmin']);
    Route::post('/users/{id}/verify-artist', [\App\Http\Controllers\Api\AdminController::class, 'verifyArtist']);
    Route::post('/users/{id}/unverify-artist', [\App\Http\Controllers\Api\AdminController::class, 'unverifyArtist']);

    // Statistics & Activity
    Route::get('/stats', [\App\Http\Controllers\Api\AdminController::class, 'getStats']);
    Route::get('/activity', [\App\Http\Controllers\Api\AdminController::class, 'getActivity']);
    
    // Content Moderation
    Route::get('/comments', [\App\Http\Controllers\Api\AdminController::class, 'getComments']);
    Route::delete('/comments/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteComment']);
    Route::get('/active-users', [\App\Http\Controllers\Api\AdminController::class, 'getActiveUsers']);

    // Extended Admin - Analytics
    Route::get('/analytics', [AdminExtendedController::class, 'analytics']);

    // Extended Admin - Playlists
    Route::get('/playlists', [AdminExtendedController::class, 'playlists']);
    Route::put('/playlists/{playlist}', [AdminExtendedController::class, 'updatePlaylist']);
    Route::delete('/playlists/{playlist}', [AdminExtendedController::class, 'deletePlaylist']);

    // Extended Admin - Track editing & bulk
    Route::put('/tracks/{track}/edit', [AdminExtendedController::class, 'updateTrack']);
    Route::post('/tracks/bulk', [AdminExtendedController::class, 'bulkTrackAction']);

    // Extended Admin - Likes, Reposts, Follows
    Route::get('/likes', [AdminExtendedController::class, 'likes']);
    Route::delete('/likes', [AdminExtendedController::class, 'removeLike']);
    Route::get('/reposts', [AdminExtendedController::class, 'reposts']);
    Route::delete('/reposts', [AdminExtendedController::class, 'removeRepost']);
    Route::get('/follows', [AdminExtendedController::class, 'follows']);

    // Extended Admin - Subscriptions
    Route::get('/subscriptions', [AdminExtendedController::class, 'subscriptions']);
    Route::put('/users/{id}/plan', [AdminExtendedController::class, 'updateUserPlan']);

    // Extended Admin - Announcements
    Route::get('/announcements', [AdminExtendedController::class, 'announcements']);
    Route::post('/announcements', [AdminExtendedController::class, 'storeAnnouncement']);
    Route::put('/announcements/{announcement}', [AdminExtendedController::class, 'updateAnnouncement']);
    Route::delete('/announcements/{announcement}', [AdminExtendedController::class, 'deleteAnnouncement']);

    // Extended Admin - Audit Logs
    Route::get('/audit-logs', [AdminExtendedController::class, 'auditLogs']);

    // Extended Admin - Site Settings
    Route::get('/settings', [AdminExtendedController::class, 'settings']);
    Route::put('/settings', [AdminExtendedController::class, 'updateSettings']);
});

// Public announcements
Route::get('/announcements', [AdminExtendedController::class, 'activeAnnouncements']);

// Ad serving (public, works for both guest and authenticated)
Route::get('/ads/audio', [AdController::class, 'audioAd']);
Route::get('/ads/banner', [AdController::class, 'bannerAds']);
Route::get('/ads/sponsored-tracks', [AdController::class, 'sponsoredTracks']);
Route::post('/ads/impression', [AdController::class, 'recordImpression']);

// Admin ad management
Route::middleware(['auth:sanctum'])->prefix('admin/ads')->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminAdController::class, 'dashboard']);

    // Advertisers
    Route::get('/advertisers', [AdminAdController::class, 'advertisers']);
    Route::post('/advertisers', [AdminAdController::class, 'storeAdvertiser']);
    Route::put('/advertisers/{advertiser}', [AdminAdController::class, 'updateAdvertiser']);
    Route::delete('/advertisers/{advertiser}', [AdminAdController::class, 'deleteAdvertiser']);

    // Campaigns
    Route::get('/campaigns', [AdminAdController::class, 'campaigns']);
    Route::post('/campaigns', [AdminAdController::class, 'storeCampaign']);
    Route::put('/campaigns/{campaign}', [AdminAdController::class, 'updateCampaign']);
    Route::delete('/campaigns/{campaign}', [AdminAdController::class, 'deleteCampaign']);

    // Ads (Creatives)
    Route::get('/creatives', [AdminAdController::class, 'ads']);
    Route::post('/creatives', [AdminAdController::class, 'storeAd']);
    Route::put('/creatives/{ad}', [AdminAdController::class, 'updateAd']);
    Route::delete('/creatives/{ad}', [AdminAdController::class, 'deleteAd']);
});

// Stripe webhooks (no auth, verified by Stripe signature)
Route::post('/stripe/webhook', [\App\Http\Controllers\Api\StripeWebhookController::class, 'handleWebhook']);
