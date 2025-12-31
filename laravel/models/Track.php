<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Track extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'cover_path',
        'audio_path',
        'source_path',
        'duration_seconds',
        'status',
        'plays',
        'tags',
        'waveform',
    ];

    protected $casts = [
        'tags' => 'array',
        'waveform' => 'array',
        'plays' => 'integer',
        'duration_seconds' => 'integer',
    ];

    protected $appends = ['audio_url', 'cover_url', 'duration'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'likes')
            ->withTimestamps();
    }

    public function reposts(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'reposts')
            ->withTimestamps();
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function playlists(): BelongsToMany
    {
        return $this->belongsToMany(Playlist::class, 'playlist_track')
            ->withPivot('position')
            ->withTimestamps();
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function getAudioUrlAttribute(): ?string
    {
        // Use audio_path if available, fallback to source_path
        $path = $this->audio_path ?? $this->source_path;
        
        if (!$path) {
            \Log::warning("Track {$this->id} has no audio_path or source_path");
            return null;
        }
        
        try {
            // Check if file exists
            if (!\Storage::disk('s3')->exists($path)) {
                \Log::error("Audio file not found for track {$this->id}: {$path}");
                return null;
            }
            
            // Use nginx proxy instead of direct MinIO URL to add CORS headers
            $baseUrl = rtrim(env('APP_URL', 'http://localhost'), '/');
            $publicUrl = $baseUrl . '/storage/' . $path;
            
            \Log::info("Generated audio URL for track {$this->id}: {$publicUrl}");
            
            return $publicUrl;
        } catch (\Exception $e) {
            \Log::error("Error generating audio URL for track {$this->id}: " . $e->getMessage());
            return null;
        }
    }

    public function getCoverUrlAttribute(): ?string
    {
        if (!$this->cover_path) {
            return null;
        }
        
        try {
            // Use nginx proxy for CORS support
            $baseUrl = rtrim(env('APP_URL', 'http://localhost'), '/');
            return $baseUrl . '/storage/' . $this->cover_path;
        } catch (\Exception $e) {
            \Log::error("Error generating cover URL for track {$this->id}: " . $e->getMessage());
            return null;
        }
    }

    public function getDurationAttribute(): int
    {
        return $this->duration_seconds ?? 0;
    }

    public function incrementPlays(): void
    {
        $this->increment('plays');
    }
}

