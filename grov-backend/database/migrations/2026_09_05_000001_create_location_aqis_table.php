<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('location_aqis', function (Blueprint $table) {
            $table->id();
            $table->string('location_slug')->unique(); // e.g. 'islamabad' — used as lookup key
            $table->string('location_name');           // human readable
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->integer('aqi')->nullable();
            $table->string('status')->nullable();      // 'Good', 'Moderate', etc.
            $table->decimal('pm10', 8, 2)->nullable();
            $table->decimal('pm2_5', 8, 2)->nullable();
            $table->string('source')->nullable();      // 'Google Air Quality API', 'Open-Meteo', 'Baseline'
            $table->integer('refresh_interval_hours')->default(1); // changeable via Admin Panel
            $table->timestamp('last_updated_at')->nullable();
            $table->json('raw_json')->nullable();      // full API response for debugging
            $table->timestamps();

            $table->index('location_slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('location_aqis');
    }
};
