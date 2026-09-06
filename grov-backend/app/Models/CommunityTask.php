<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommunityTask extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'creator_id',
        'location_id',
        'title',
        'activity_type',
        'date',
        'start_time',
        'max_volunteers',
        'description',
        'cover_image_path',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'max_volunteers' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function participations(): HasMany
    {
        return $this->hasMany(CommunityTaskParticipant::class, 'task_id');
    }

    public function activeParticipants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'community_task_participants', 'task_id', 'user_id')
                    ->wherePivot('status', 'joined')
                    ->withPivot(['role', 'status', 'joined_at'])
                    ->withTimestamps();
    }
}
