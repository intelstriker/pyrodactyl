<?php

namespace Pterodactyl\Console\Commands\Server;

use Illuminate\Console\Command;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Servers\ServerMetricsCollectionService;

class CollectServerMetricsCommand extends Command
{
    protected $signature = 'p:server:metrics:collect';

    protected $description = 'Collect and store resource utilization metrics for servers from the daemon.';

    public function handle(ServerMetricsCollectionService $service): int
    {
        $this->info('Collecting server resource metrics...');

        // Only consider installed, non-suspended servers. The service will further filter per-node maintenance etc.
        $servers = Server::query()
            ->where('installed', true)
            ->where('suspended', false)
            ->get(['id', 'uuid', 'owner_id', 'node_id', 'egg_id', 'installed', 'suspended']);

        $count = 0;

        foreach ($servers as $server) {
            $service->collectFor($server);
            $count++;
        }

        $this->info("Processed {$count} server(s) for metrics collection.");

        return self::SUCCESS;
    }
}
