<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->string('region')->default('Islamabad, Pakistan');
            $table->decimal('accuracy_meters', 5, 2)->default(8.00);
            $table->timestamps();

            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
