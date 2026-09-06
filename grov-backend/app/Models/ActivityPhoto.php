<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'monitoring_record_id',
        'report_id',
        'file_path',
        'file_size',
        'mime_type',
        'caption',
    ];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    public function monitoringRecord(): BelongsTo
    {
        return $this->belongsTo(MonitoringRecord::class);
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }
}
