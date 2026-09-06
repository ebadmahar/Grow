<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityTaskParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'role',
        'status',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(CommunityTask::class, 'task_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
