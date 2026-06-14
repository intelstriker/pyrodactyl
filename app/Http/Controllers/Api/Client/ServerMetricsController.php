<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Carbon\Carbon;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerMetric;
use Pterodactyl\Http\Requests\Api\Client\Servers\GetServerRequest;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Illuminate\Http\JsonResponse;

class ServerMetricsController extends ClientApiController
{
    /**
     * Return historical resource metrics for the given server.
     *
     * Query params:
     *   period: live|1h|24h|7d|30d (default 1h)
     */
    public function index(GetServerRequest $request, Server $server): JsonResponse
    {
        $period = (string) $request->query('period', '1h');

        $now = Carbon::now();

        $start = match ($period) {
            'live' => $now->copy()->subMinutes(5),
            '1h' => $now->copy()->subHour(),
            '24h', 'day' => $now->copy()->subDay(),
            '7d', 'week' => $now->copy()->subWeek(),
            '30d', 'month' => $now->copy()->subMonth(),
            default => $now->copy()->subHour(),
        };

        $query = ServerMetric::query()
            ->where('server_id', $server->id)
            ->where('timestamp', '>=', $start)
            ->orderBy('timestamp', 'asc');

        $metrics = $query->get([
            'timestamp',
            'cpu_absolute',
            'memory_bytes',
            'disk_bytes',
            'network_rx_bytes',
            'network_tx_bytes',
            'state',
        ]);

        $data = $metrics->map(function (ServerMetric $metric) {
            return [
                'timestamp' => $metric->timestamp->toIso8601String(),
                'cpu_absolute' => $metric->cpu_absolute,
                'memory_bytes' => $metric->memory_bytes,
                'disk_bytes' => $metric->disk_bytes,
                'network_rx_bytes' => $metric->network_rx_bytes,
                'network_tx_bytes' => $metric->network_tx_bytes,
                'state' => $metric->state,
            ];
        })->values();

        return new JsonResponse([
            'object' => 'list',
            'data' => $data,
            'meta' => [
                'period' => $period,
                'count' => $data->count(),
                'start' => $start->toIso8601String(),
                'end' => $now->toIso8601String(),
            ],
        ]);
    }
}
