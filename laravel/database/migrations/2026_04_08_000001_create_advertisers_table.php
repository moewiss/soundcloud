<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advertisers', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->string('contact_name');
            $table->string('contact_email');
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->text('description')->nullable();
            $table->enum('halal_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('halal_notes')->nullable();
            $table->enum('status', ['active', 'paused', 'suspended'])->default('active');
            $table->decimal('balance', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advertisers');
    }
};
