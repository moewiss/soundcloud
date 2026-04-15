<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_impressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_id')->constrained()->onDelete('cascade');
            $table->foreignId('ad_campaign_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('event_type', ['view', 'listen', 'click', 'skip', 'complete']);
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['ad_id', 'created_at']);
            $table->index(['ad_campaign_id', 'created_at']);
            $table->index(['user_id', 'ad_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_impressions');
    }
};
