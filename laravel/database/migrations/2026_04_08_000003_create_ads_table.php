<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_campaign_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['audio', 'banner', 'sponsored_track']);
            $table->enum('placement', ['home_top', 'home_feed', 'search', 'between_tracks'])->nullable();
            $table->string('audio_url')->nullable();
            $table->integer('audio_duration')->nullable();
            $table->string('image_url')->nullable();
            $table->string('click_url')->nullable();
            $table->string('cta_text')->nullable();
            $table->foreignId('sponsored_track_id')->nullable()->constrained('tracks')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ads');
    }
};
