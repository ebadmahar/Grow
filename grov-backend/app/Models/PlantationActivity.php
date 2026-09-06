<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlantationActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'species_id',
        'quantity_planted',
        'planting_method',
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
