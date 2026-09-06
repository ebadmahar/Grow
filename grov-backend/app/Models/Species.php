<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Species extends Model
{
    use HasFactory;

    protected $fillable = [
        'common_name',
        'scientific_name',
        'local_name',
        'suitable_zones',
        'basic_description',
        'basic_guidance',
        'category',
        'is_native',
        'is_active',
        'cover_image_path',
    ];

    protected function casts(): array
    {
        return [
            'is_native' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function plantationActivities(): HasMany
    {
        return $this->hasMany(PlantationActivity::class);
    }

    public function seedingActivities(): HasMany
    {
        return $this->hasMany(SeedingActivity::class);
    }
}
