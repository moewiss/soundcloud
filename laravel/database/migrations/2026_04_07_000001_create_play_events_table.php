<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('play_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('track_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('played_at')->useCurrent();
            $table->unsignedInteger('duration_listened')->default(0);
            $table->string('source', 30)->default('direct');
            $table->index(['track_id', 'played_at']);
            $table->index(['user_id', 'played_at']);
            $table->index('played_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('play_events');
    }
};
