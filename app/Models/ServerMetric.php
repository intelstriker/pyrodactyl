<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $server_id
 * @property \Carbon\Carbon $timestamp
 * @property float $cpu_absolute
 * @property int $memory_bytes
 * @property int $disk_bytes
 * @property int $network_rx_bytes
 * @property int $network_tx_bytes
 * @property string|null $state
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class ServerMetric extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'server_metrics';

    /**
     * Fields that are mass assignable.
     */
    protected $guarded = ['id', 'created_at', 'updated_at'];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'timestamp' => 'datetime',
        'cpu_absolute' => 'float',
        'memory_bytes' => 'int',
        'disk_bytes' => 'int',
        'network_rx_bytes' => 'int',
        'network_tx_bytes' => 'int',
    ];

    /**
     * Gets the server that owns this metric sample.
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }
}
