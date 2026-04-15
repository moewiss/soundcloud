<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_search_cache', function (Blueprint $table) {
            $table->id();
            $table->char('query_hash', 32)->unique();
            $table->string('query_text', 255);
            $table->json('parsed_intent');
            $table->json('track_ids');
            $table->string('suggestion_text', 500)->nullable();
            $table->timestamp('computed_at')->useCurrent();
            $table->timestamp('expires_at');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_search_cache');
    }
};
