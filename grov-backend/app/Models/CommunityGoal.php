<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunityGoal extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'year',
        'month',
        'target_trees',
        'target_seeds',
        'target_monitoring',
        'target_participants',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'target_trees' => 'integer',
            'target_seeds' => 'integer',
            'target_monitoring' => 'integer',
            'target_participants' => 'integer',
        ];
    }
}
