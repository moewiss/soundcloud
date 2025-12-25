<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('likes', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('track_id')->constrained()->onDelete('cascade');
            $table->timestamp('created_at')->nullable();
            
            $table->primary(['user_id', 'track_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('likes');
    }
};

