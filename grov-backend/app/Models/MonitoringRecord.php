<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MonitoringRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'user_id',
        'observation_date',
        'observed_count',
        'established_count',
        'surviving_count',
        'dead_count',
        'condition',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'observation_date' => 'date',
            'observed_count' => 'integer',
            'established_count' => 'integer',
            'surviving_count' => 'integer',
            'dead_count' => 'integer',
        ];
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ActivityPhoto::class);
    }
}
