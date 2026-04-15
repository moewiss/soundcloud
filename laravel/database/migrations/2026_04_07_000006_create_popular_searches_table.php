<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('popular_searches', function (Blueprint $table) {
            $table->id();
            $table->string('query', 255)->unique();
            $table->integer('search_count')->default(1);
            $table->timestamp('last_searched_at')->nullable();
            $table->index('search_count');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('popular_searches');
    }
};
