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

    protected $appends = ['audio_url', 'cover_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'likes')
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
        if (!$this->audio_path) {
            return null;
        }
        
        $url = \Storage::disk('s3')->temporaryUrl(
            $this->audio_path,
            now()->addHours(2)
        );
        
        // Replace internal MinIO URL with public URL
        return str_replace('http://minio:9000', env('AWS_URL', 'http://minio:9000'), $url);
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

    public function incrementPlays(): void
    {
        $this->increment('plays');
    }
}

