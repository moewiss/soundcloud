<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, boolean, integer, json
            $table->string('group')->default('general');
            $table->string('label')->nullable();
            $table->timestamps();
        });

        // Seed default settings
        DB::table('site_settings')->insert([
            ['key' => 'site_name', 'value' => 'Nashidify', 'type' => 'string', 'group' => 'general', 'label' => 'Site Name', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'group' => 'general', 'label' => 'Maintenance Mode', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'require_track_approval', 'value' => 'true', 'type' => 'boolean', 'group' => 'content', 'label' => 'Require Track Approval', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'max_upload_size_mb', 'value' => '100', 'type' => 'integer', 'group' => 'content', 'label' => 'Max Upload Size (MB)', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'allow_registration', 'value' => 'true', 'type' => 'boolean', 'group' => 'general', 'label' => 'Allow Registration', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'ads_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'ads', 'label' => 'Ads Enabled', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'audio_ad_interval', 'value' => '3', 'type' => 'integer', 'group' => 'ads', 'label' => 'Audio Ad Interval (tracks)', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'welcome_message', 'value' => 'Welcome to Nashidify — your halal music platform', 'type' => 'string', 'group' => 'general', 'label' => 'Welcome Message', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
