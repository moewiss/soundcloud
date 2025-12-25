<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tracks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title', 180);
            $table->text('description')->nullable();
            $table->string('cover_path')->nullable();
            $table->string('audio_path')->nullable();
            $table->string('source_path')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->integer('plays')->default(0);
            $table->json('tags')->nullable();
            $table->json('waveform')->nullable();
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracks');
    }
};

