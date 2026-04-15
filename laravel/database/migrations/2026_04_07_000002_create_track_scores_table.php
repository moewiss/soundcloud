<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('track_scores', function (Blueprint $table) {
            $table->foreignId('track_id')->primary()->constrained()->cascadeOnDelete();
            $table->decimal('trending_score', 10, 4)->default(0);
            $table->decimal('viral_score', 10, 4)->default(0);
            $table->decimal('popularity_score', 10, 4)->default(0);
            $table->timestamp('computed_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('track_scores');
    }
};
