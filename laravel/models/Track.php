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
            return null;
        }
        
        try {
            $url = \Storage::disk('s3')->temporaryUrl(
                $path,
                now()->addHours(2)
            );
            
            // Replace internal MinIO URL with public URL
            return str_replace('http://minio:9000', env('AWS_URL', 'http://minio:9000'), $url);
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
        
        $url = \Storage::disk('s3')->temporaryUrl(
            $this->cover_path,
            now()->addHours(2)
        );
        
        // Replace internal MinIO URL with public URL
        return str_replace('http://minio:9000', env('AWS_URL', 'http://minio:9000'), $url);
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

