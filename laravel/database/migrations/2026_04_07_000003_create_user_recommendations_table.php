<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('track_id')->constrained()->cascadeOnDelete();
            $table->string('section', 50);
            $table->decimal('score', 8, 4)->default(0);
            $table->text('reason')->nullable();
            $table->unsignedBigInteger('source_track_id')->nullable();
            $table->timestamp('computed_at')->useCurrent();
            $table->index(['user_id', 'section', 'score']);
            $table->index('computed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_recommendations');
    }
};
