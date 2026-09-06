<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeedingActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'species_id',
        'seeds_dispersed',
        'dispersal_method',
        'coverage_area_sqm',
    ];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    public function species(): BelongsTo
    {
        return $this->belongsTo(Species::class);
    }
}
