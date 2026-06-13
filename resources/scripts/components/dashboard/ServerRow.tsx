import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { bytesToString, ip } from '@/lib/formatters';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';

const ServerCard = styled(Link)<{ $status: ServerPowerState }>`
    background: #1a1a1a;
    border: 1px solid #ffffff12;
    border-radius: 16px;
    padding: 1.25rem 1.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
    color: inherit;
    position: relative;
    overflow: hidden;

    &:hover {
        border-color: #ffffff22;
        background: #222222;
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }

    .status-dot {
        width: 12px;
        height: 12px;
        border-radius: 9999px;
        transition: all 250ms ease;
        box-shadow: 0 0 0 3px rgba(255,255,255,0.1);
    }

    ${({ $status }) => {
        if (!$status || $status === 'offline') {
            return `
                .status-dot {
                    background: #ef4444;
                    box-shadow: 0 0 12px 2px #ef4444;
                }
            `;
        }
        if ($status === 'running') {
            return `
                .status-dot {
                    background: #22c55e;
                    box-shadow: 0 0 12px 2px #22c55e;
                }
            `;
        }
        if ($status === 'installing') {
            return `
                .status-dot {
                    background: #3b82f6;
                    box-shadow: 0 0 12px 2px #3b82f6;
                }
            `;
        }
        return `
            .status-dot {
                background: #eab308;
                box-shadow: 0 0 12px 2px #eab308;
            }
        `;
    }}
`;

const ResourceBar = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #a1a1aa;
`;

const ServerRow = ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<NodeJS.Timeout | null>(null);
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [isInstalling, setIsInstalling] = useState(server.status === 'installing');

    const getStats = () => {
        getServerResourceUsage(server.uuid)
            .then(setStats)
            .catch(console.error);
    };

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
        setIsInstalling(stats?.isInstalling || server.status === 'installing');
    }, [stats, server.status]);

    useEffect(() => {
        if (isSuspended) return;

        getStats();
        interval.current = setInterval(getStats, 30000);

        return () => {
            if (interval.current) clearInterval(interval.current);
        };
    }, [isSuspended, server.uuid]);

    const defaultAllocation = server.allocations.find(a => a.isDefault);

    const cpuAlarm = stats && server.limits.cpu > 0 && stats.cpuUsagePercent >= server.limits.cpu * 0.9;
    const memAlarm = stats && isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
    const diskAlarm = stats && server.limits.disk > 0 && isAlarmState(stats.diskUsageInBytes, server.limits.disk);

    return (
        <ServerCard
            to={`/server/${server.id}`}
            className={className}
            $status={stats?.status}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Status Indicator */}
                <div className="status-dot flex-shrink-0" />

                {/* Server Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <p className="text-lg font-semibold text-white tracking-tight truncate">
                            {server.name}
                        </p>
                        {isSuspended && (
                            <span className="px-2.5 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
                                SUSPENDED
                            </span>
                        )}
                    </div>

                    {defaultAllocation && (
                        <p className="text-sm text-zinc-400 mt-0.5 font-mono">
                            {defaultAllocation.alias || ip(defaultAllocation.ip)}:{defaultAllocation.port}
                        </p>
                    )}
                </div>
            </div>

            {/* Resource Usage */}
            <div className="hidden md:flex items-center gap-8 text-sm">
                {!stats || isSuspended || isInstalling ? (
                    <div className="text-zinc-400 text-sm italic">
                        {isSuspended ? 'Suspended' : isInstalling ? 'Installing...' : 'Unavailable'}
                    </div>
                ) : (
                    <>
                        <ResourceBar>
                            <span className="font-medium text-zinc-500">CPU</span>
                            <span className={cpuAlarm ? 'text-orange-400 font-medium' : ''}>
                                {stats.cpuUsagePercent.toFixed(1)}%
                            </span>
                        </ResourceBar>

                        <ResourceBar>
                            <span className="font-medium text-zinc-500">RAM</span>
                            <span className={memAlarm ? 'text-orange-400 font-medium' : ''}>
                                {bytesToString(stats.memoryUsageInBytes)}
                            </span>
                        </ResourceBar>

                        <ResourceBar>
                            <span className="font-medium text-zinc-500">DISK</span>
                            <span className={diskAlarm ? 'text-orange-400 font-medium' : ''}>
                                {bytesToString(stats.diskUsageInBytes)}
                            </span>
                        </ResourceBar>
                    </>
                )}
            </div>

            {/* Mobile indicator */}
            <div className="md:hidden text-xs text-zinc-500">
                {stats?.status || server.status}
            </div>
        </ServerCard>
    );
};

// Helper (kept from original)
const isAlarmState = (current: number, limit: number): boolean => 
    limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

export default ServerRow;
