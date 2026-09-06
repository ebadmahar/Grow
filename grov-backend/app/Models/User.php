<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'location',
        'bio',
        'avatar_path',
        'settings_json',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'settings_json' => 'array',
        ];
    }

    public function interests(): BelongsToMany
    {
        return $this->belongsToMany(Interest::class, 'user_interests');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function monitoringRecords(): HasMany
    {
        return $this->hasMany(MonitoringRecord::class);
    }

    public function createdTasks(): HasMany
    {
        return $this->hasMany(CommunityTask::class, 'creator_id');
    }

    public function taskParticipations(): HasMany
    {
        return $this->hasMany(CommunityTaskParticipant::class);
    }

    public function joinedTasks(): BelongsToMany
    {
        return $this->belongsToMany(CommunityTask::class, 'community_task_participants', 'user_id', 'task_id')
                    ->withPivot(['role', 'status', 'joined_at'])
                    ->withTimestamps();
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function pointsLedger(): HasMany
    {
        return $this->hasMany(UserPoint::class);
    }
}
