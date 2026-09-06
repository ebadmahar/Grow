<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Activity extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'location_id',
        'activity_type',
        'status',
        'date',
        'field_notes',
        'points_awarded',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'points_awarded' => 'integer',
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function plantation(): HasOne
    {
        return $this->hasOne(PlantationActivity::class);
    }

    public function seeding(): HasOne
    {
        return $this->hasOne(SeedingActivity::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ActivityPhoto::class);
    }

    public function monitoringRecords(): HasMany
    {
        return $this->hasMany(MonitoringRecord::class);
    }
}
