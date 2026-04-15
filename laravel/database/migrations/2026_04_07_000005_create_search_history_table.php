<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('query', 255);
            $table->integer('result_count')->default(0);
            $table->timestamp('searched_at')->useCurrent();
            $table->index(['user_id', 'searched_at']);
            $table->index('query');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_history');
    }
};
