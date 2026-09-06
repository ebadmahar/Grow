<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'region',
        'accuracy_meters',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'accuracy_meters' => 'float',
        ];
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function communityTasks(): HasMany
    {
        return $this->hasMany(CommunityTask::class);
    }
}
