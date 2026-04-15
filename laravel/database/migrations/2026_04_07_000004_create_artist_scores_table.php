<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artist_scores', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('total_plays_7d')->default(0);
            $table->unsignedInteger('total_likes_7d')->default(0);
            $table->integer('follower_growth_7d')->default(0);
            $table->unsignedInteger('track_count')->default(0);
            $table->decimal('rising_score', 10, 4)->default(0);
            $table->timestamp('computed_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artist_scores');
    }
};
