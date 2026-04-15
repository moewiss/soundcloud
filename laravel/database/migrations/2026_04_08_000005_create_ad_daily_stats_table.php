<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_daily_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_id')->constrained()->onDelete('cascade');
            $table->foreignId('ad_campaign_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->integer('views')->default(0);
            $table->integer('listens')->default(0);
            $table->integer('clicks')->default(0);
            $table->integer('skips')->default(0);
            $table->integer('completes')->default(0);
            $table->decimal('revenue', 10, 2)->default(0);
            $table->timestamps();

            $table->unique(['ad_id', 'date']);
            $table->index(['ad_campaign_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_daily_stats');
    }
};
