<?php

namespace Pterodactyl\Services\Servers;

use Carbon\Carbon;
use Illuminate\Support\Arr;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerMetric;
use Pterodactyl\Enums\Daemon\DaemonType;
use Pterodactyl\Repositories\Wings\DaemonServerRepository as WingsDaemonServerRepository;
use Pterodactyl\Repositories\Elytra\DaemonServerRepository as ElytraDaemonServerRepository;
use Illuminate\Support\Facades\Log;

class ServerMetricsCollectionService
{
    /**
     * Collect and persist a single metrics sample for the given server (if possible).
     */
    public function collectFor(Server $server): void
    {
        $server->loadMissing('node');

        if ($server->isSuspended() || !$server->isInstalled()) {
            return;
        }

        if ($server->node && $server->node->isUnderMaintenance()) {
            return;
        }

        // Avoid inserting duplicates too close together (within ~45s)
        $last = ServerMetric::where('server_id', $server->id)
            ->latest('timestamp')
            ->first();

        if ($last && $last->timestamp->diffInSeconds(Carbon::now()) < 45) {
            return;
        }

        try {
            $daemonType = $server->node?->daemonType ?? DaemonType::ELYTRA->value;

            if ($daemonType === DaemonType::WINGS->value) {
                $repository = app(WingsDaemonServerRepository::class);
            } else {
                $repository = app(ElytraDaemonServerRepository::class);
            }

            $details = $repository->setServer($server)->getDetails();

            $util = Arr::get($details, 'utilization', []);
            $network = Arr::get($util, 'network', []);

            ServerMetric::create([
                'server_id' => $server->id,
                'timestamp' => Carbon::now(),
                'cpu_absolute' => (float) Arr::get($util, 'cpu_absolute', 0),
                'memory_bytes' => (int) Arr::get($util, 'memory_bytes', 0),
                'disk_bytes' => (int) Arr::get($util, 'disk_bytes', 0),
                'network_rx_bytes' => (int) Arr::get($network, 'rx_bytes', 0),
                'network_tx_bytes' => (int) Arr::get($network, 'tx_bytes', 0),
                'state' => Arr::get($details, 'state'),
            ]);
        } catch (\Throwable $exception) {
            // Swallow per-server errors so one bad daemon doesn't kill the whole collection run.
            Log::warning('Failed to collect server metrics', [
                'server_id' => $server->id,
                'uuid' => $server->uuid,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
