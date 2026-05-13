<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'display_name',
        'bio',
        'avatar_path',
        'header_path',
        'is_founder',
    ];

    protected $casts = [
        'is_founder' => 'boolean',
        // Without these casts, MySQL TINYINT(1) columns serialise as
        // integer 0/1 in JSON responses, breaking mobile zod schemas
        // that declare z.boolean() — every /tracks/{id} fires a Sentry
        // schema-mismatch warning otherwise. Discovered 2026-05-13
        // post-v1.0.1 from the live console-error report.
        'is_verified' => 'boolean',
        // Forward-compat for BACKEND TICKET #29 (verified-reciter
        // editorial column). When the migration adds the column, the
        // cast is already in place so the rolling deploy can't ship a
        // pre-cast response window.
        'is_verified_reciter' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar_path) {
            return null;
        }
        
        // Use Nginx proxy URL instead of direct MinIO URL
        // This ensures avatars work from the browser
        return config('app.url') . '/storage/' . $this->avatar_path;
    }

    public function getHeaderUrlAttribute(): ?string
    {
        if (!$this->header_path) {
            return null;
        }
        
        // Use Nginx proxy URL instead of direct MinIO URL
        return config('app.url') . '/storage/' . $this->header_path;
    }
}

