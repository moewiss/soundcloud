<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class PlanFeatureService
{
    private ?object $plan = null;
    private ?User $user = null;

    public function forUser(?User $user): self
    {
        $this->user = $user;
        $this->plan = $user
            ? DB::table('plans')->where('slug', $user->plan_slug ?? 'free')->first()
            : DB::table('plans')->where('slug', 'free')->first();
        return $this;
    }

    public function plan(): ?object
    {
        return $this->plan;
    }

    public function planSlug(): string
    {
        return $this->plan->slug ?? 'free';
    }

    public function isPremium(): bool
    {
        return !in_array($this->planSlug(), ['free']);
    }

    // ─── Upload Limits ────────────────────────
    public function canUpload(): bool
    {
        if (!$this->user || !$this->plan) return false;
        if ($this->plan->upload_limit_monthly === null) return true;
        return $this->user->uploads_this_month < $this->plan->upload_limit_monthly;
    }

    public function uploadsRemaining(): ?int
    {
        if (!$this->plan || $this->plan->upload_limit_monthly === null) return null;
        return max(0, $this->plan->upload_limit_monthly - ($this->user->uploads_this_month ?? 0));
    }

    public function maxFileSizeMb(): int
    {
        return $this->plan->file_size_limit_mb ?? 100;
    }

    // ─── Audio Quality ────────────────────────
    public function maxAudioQuality(): string
    {
        return $this->plan->audio_quality ?? '128';
    }

    public function canPlayHQ(): bool
    {
        return in_array($this->maxAudioQuality(), ['320', 'lossless']);
    }

    public function canPlayLossless(): bool
    {
        return $this->maxAudioQuality() === 'lossless';
    }

    // ─── Downloads ────────────────────────────
    public function canDownload(): bool
    {
        if ($this->plan->download_limit === null) return true; // unlimited
        if (($this->plan->download_limit ?? 0) <= 0) return false;
        return ($this->user->downloads_this_month ?? 0) < $this->plan->download_limit;
    }

    public function downloadLimit(): ?int
    {
        return $this->plan->download_limit;
    }

    public function downloadsRemaining(): ?int
    {
        if (!$this->plan || $this->plan->download_limit === null) return null;
        if (($this->plan->download_limit ?? 0) <= 0) return 0;
        return max(0, $this->plan->download_limit - ($this->user->downloads_this_month ?? 0));
    }

    // ─── Ads ──────────────────────────────────
    public function hasAds(): bool
    {
        return $this->plan->has_ads ?? true;
    }

    // ─── Playlists ────────────────────────────
    public function playlistLimit(): ?int
    {
        return $this->plan->playlist_limit;
    }

    public function playlistTrackLimit(): ?int
    {
        return $this->plan->playlist_track_limit;
    }

    // ─── Approval ─────────────────────────────
    public function hasPriorityApproval(): bool
    {
        return $this->plan->has_priority_approval ?? false;
    }

    public function hasAutoApproval(): bool
    {
        return $this->plan->has_auto_approval ?? false;
    }

    // ─── Analytics ────────────────────────────
    public function hasAdvancedAnalytics(): bool
    {
        return $this->plan->has_advanced_analytics ?? false;
    }

    // ─── Branding ─────────────────────────────
    public function hasCustomBranding(): bool
    {
        return $this->plan->has_custom_branding ?? false;
    }

    public function hasVerifiedBadge(): bool
    {
        return $this->plan->has_verified_badge ?? false;
    }

    // ─── Tips ─────────────────────────────────
    public function tipCommissionPercent(): float
    {
        return $this->plan->tip_commission_percent ?? 20.00;
    }

    // ─── Promotions ───────────────────────────
    public function spotlightPins(): int
    {
        return $this->plan->spotlight_pins ?? 0;
    }

    public function promotedTracksMonthly(): int
    {
        return $this->plan->promoted_tracks_monthly ?? 0;
    }

    /**
     * Get the full feature summary for API responses.
     */
    public function toArray(): array
    {
        return [
            'plan' => $this->planSlug(),
            'plan_name' => $this->plan->name ?? 'Free',
            'is_premium' => $this->isPremium(),
            'can_upload' => $this->canUpload(),
            'uploads_remaining' => $this->uploadsRemaining(),
            'max_file_size_mb' => $this->maxFileSizeMb(),
            'audio_quality' => $this->maxAudioQuality(),
            'has_ads' => $this->hasAds(),
            'can_download' => $this->canDownload(),
            'download_limit' => $this->downloadLimit(),
            'downloads_remaining' => $this->downloadsRemaining(),
            'playlist_limit' => $this->playlistLimit(),
            'playlist_track_limit' => $this->playlistTrackLimit(),
            'has_priority_approval' => $this->hasPriorityApproval(),
            'has_auto_approval' => $this->hasAutoApproval(),
            'has_advanced_analytics' => $this->hasAdvancedAnalytics(),
            'has_custom_branding' => $this->hasCustomBranding(),
            'has_verified_badge' => $this->hasVerifiedBadge(),
            'tip_commission_percent' => $this->tipCommissionPercent(),
            'spotlight_pins' => $this->spotlightPins(),
            'promoted_tracks_monthly' => $this->promotedTracksMonthly(),
            'can_promote' => $this->promotedTracksMonthly() > 0 || in_array($this->planSlug(), ['artist', 'artist_pro']),
        ];
    }
}
