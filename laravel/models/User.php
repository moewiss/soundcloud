<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Billable, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_admin',
        'email_verification_code',
        'email_verification_expires_at',
        'last_seen_at',
        'plan_slug',
        'uploads_this_month',
        'uploads_month_reset_at',
        'onboarding_state',
        'onboarding_step',
        'is_artist',
        'artist_verified_at',
        'is_private',
        'social_provider',
        'social_id',
        'social_avatar',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_admin' => 'boolean',
        'is_artist' => 'boolean',
        'is_private' => 'boolean',
        'artist_verified_at' => 'datetime',
    ];

    public function scopePublic($query)
    {
        return $query->where('is_private', false);
    }

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function artistProfile(): HasOne
    {
        return $this->hasOne(ArtistProfile::class);
    }

    public function complianceAttestation(): HasOne
    {
        return $this->hasOne(ComplianceAttestation::class);
    }

    public function artistAnnouncements(): HasMany
    {
        return $this->hasMany(ArtistAnnouncement::class);
    }

    public function isArtist(): bool
    {
        return (bool) $this->is_artist;
    }

    public function tracks(): HasMany
    {
        return $this->hasMany(Track::class);
    }

    public function likedTracks(): BelongsToMany
    {
        return $this->belongsToMany(Track::class, 'likes')
            ->withTimestamps();
    }

    public function hasLiked(Track $track): bool
    {
        return $this->likedTracks()->where('track_id', $track->id)->exists();
    }

    public function repostedTracks(): BelongsToMany
    {
        return $this->belongsToMany(Track::class, 'reposts')
            ->withTimestamps();
    }

    public function hasReposted(Track $track): bool
    {
        return $this->repostedTracks()->where('track_id', $track->id)->exists();
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'following_id', 'follower_id')
            ->withTimestamps();
    }

    public function following(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'following_id')
            ->withTimestamps();
    }

    public function isFollowing(User $user): bool
    {
        return $this->following()->where('following_id', $user->id)->exists();
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function playlists(): HasMany
    {
        return $this->hasMany(Playlist::class);
    }

    public function likedPlaylists()
    {
        return $this->belongsToMany(Playlist::class, 'playlist_likes')->withTimestamps();
    }

    public function repostedPlaylists()
    {
        return $this->belongsToMany(Playlist::class, 'playlist_reposts')->withTimestamps();
    }

    public function hasLikedPlaylist(Playlist $playlist): bool
    {
        return $this->likedPlaylists()->where('playlist_id', $playlist->id)->exists();
    }

    public function hasRepostedPlaylist(Playlist $playlist): bool
    {
        return $this->repostedPlaylists()->where('playlist_id', $playlist->id)->exists();
    }

    public function history(): HasMany
    {
        return $this->hasMany(\App\Models\History::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(\App\Models\Notification::class, 'user_id');
    }

    public function preferences(): HasOne
    {
        return $this->hasOne(UserPreference::class);
    }

    /**
     * Get the user's active plan.
     */
    public function getPlan(): ?object
    {
        return \DB::table('plans')->where('slug', $this->plan_slug ?? 'free')->first();
    }

    /**
     * Check if user has a paid plan.
     */
    public function isPremium(): bool
    {
        return !in_array($this->plan_slug, ['free', null]);
    }

    /**
     * Check if user can upload more tracks this month.
     */
    public function canUpload(): bool
    {
        $plan = $this->getPlan();
        if (!$plan || $plan->upload_limit_monthly === null) return true; // unlimited
        return $this->uploads_this_month < $plan->upload_limit_monthly;
    }

    /**
     * Get remaining uploads this month.
     */
    public function remainingUploads(): ?int
    {
        $plan = $this->getPlan();
        if (!$plan || $plan->upload_limit_monthly === null) return null; // unlimited
        return max(0, $plan->upload_limit_monthly - $this->uploads_this_month);
    }
}

