<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('advertiser_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('type', ['audio', 'banner', 'sponsored_track']);
            $table->enum('status', ['draft', 'pending', 'active', 'paused', 'completed', 'rejected'])->default('draft');
            $table->decimal('budget', 10, 2);
            $table->decimal('spent', 10, 2)->default(0);
            $table->decimal('daily_rate', 10, 2);
            $table->date('start_date');
            $table->date('end_date');
            $table->json('target_categories')->nullable();
            $table->json('target_languages')->nullable();
            $table->integer('frequency_cap')->default(5);
            $table->integer('priority')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_campaigns');
    }
};
