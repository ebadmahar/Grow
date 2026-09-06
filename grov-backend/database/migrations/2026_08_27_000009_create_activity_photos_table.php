<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->nullable()->constrained('activities')->onDelete('cascade');
            $table->foreignId('monitoring_record_id')->nullable()->constrained('monitoring_records')->onDelete('cascade');
            $table->foreignId('report_id')->nullable()->constrained('reports')->onDelete('cascade');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('mime_type')->nullable();
            $table->string('caption')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_photos');
    }
};
