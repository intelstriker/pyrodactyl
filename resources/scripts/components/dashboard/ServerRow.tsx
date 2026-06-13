import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { bytesToString, ip } from '@/lib/formatters';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';

interface ServerRowProps {
    server: Server;
    className?: string;
}

// Obsidian Host Premium Server Card
const ServerCard = styled(Link)<{ 
    $status: ServerPowerState; 
    $suspended: boolean;
    $background?: string;
}>`
    background: linear-gradient(145deg, #0f0f0f 0%, #1a1a1a 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.75rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 280ms cubic-bezier(0.23, 1, 0.32, 1);
    text-decoration: none;
    color: inherit;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: ${({ $background }) => 
            $background 
                ? `url(${$background}) center/cover no-repeat` 
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)'};
        opacity: 0.6;
        transition: opacity 280ms ease;
        z-index: 1;
        mix-blend-mode: overlay;
    }

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            180deg,
            rgba(255,255,255,0.03) 0%,
            transparent 40%,
            transparent 60%,
            rgba(255,255,255,0.02) 100%
        );
        z-index: 2;
        pointer-events: none;
    }

    &:hover {
        border-color: rgba(167, 139, 250, 0.3);
        background: linear-gradient(145deg, #1a1a1a 0%, #242424 100%);
        transform: translateY(-4px) scale(1.01);
        box-shadow: 
            0 20px 25px -5px rgb(0 0 0 / 0.2),
            0 8px 10px -6px rgb(0 0 0 / 0.2),
            0 0 0 1px rgba(167, 139, 250, 0.2) inset;
    }

    .status-dot {
        width: 14px;
        height: 14px;
        border-radius: 9999px;
        transition: all 300ms cubic-bezier(0.23, 1, 0.32, 1);
        box-shadow: 0 0 0 4px rgba(255,255,255,0.08);
        position: relative;
        z-index: 3;
    }

    ${({ $status, $suspended }) => {
        if ($suspended) {
            return `
                .status-dot {
                    background: #ef4444;
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2), 0 0 20px 4px #ef4444;
                }
            `;
        }
        if (!$status || $status === 'offline') {
            return `
                .status-dot {
                    background: #ef4444;
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15), 0 0 18px 3px #ef4444;
                }
            `;
        }
        if ($status === 'running') {
            return `
                .status-dot {
                    background: #22c55e;
                    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2), 0 0 22px 6px #22c55e;
                }
            `;
        }
        if ($status === 'installing') {
            return `
                .status-dot {
                    background: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2), 0 0 20px 4px #3b82f6;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `;
        }
        return `
            .status-dot {
                background: #eab308;
                box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.2), 0 0 18px 3px #eab308;
            }
        `;
    }}
`;

const ResourceBar = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: #a1a1aa;
    transition: all 200ms ease;
`;

const ServerRow = ({ server, className }: ServerRowProps) => {
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
        interval.current = setInterval(getStats, 25000); // Slightly faster refresh
        return () => {
            if (interval.current) clearInterval(interval.current);
        };
    }, [isSuspended, server.uuid]);

    const defaultAllocation = server.allocations.find(a => a.isDefault);
    
    const cpuAlarm = stats && server.limits.cpu > 0 && stats.cpuUsagePercent >= server.limits.cpu * 0.9;
    const memAlarm = stats && isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
    const diskAlarm = stats && server.limits.disk > 0 && isAlarmState(stats.diskUsageInBytes, server.limits.disk);

    // Example custom background support - extend Server type if needed
    // For now: subtle per-status or random/seed-based for demo
    const getBackground = () => {
        if (isSuspended) return undefined;
        if (stats?.status === 'running') {
            // You can map server.game or server.id to real image URLs
            return `https://picsum.photos/id/${(server.id || 1) % 100 + 10}/800/600`; // Placeholder
        }
        return undefined;
    };

    return (
        <ServerCard
            to={`/server/${server.id}`}
            className={className}
            $status={stats?.status || server.status as ServerPowerState}
            $suspended={isSuspended}
            $background={getBackground()}
        >
            <div className="flex items-center gap-5 flex-1 min-w-0 relative z-10">
                {/* Status Indicator */}
                <div className="status-dot flex-shrink-0" />

                {/* Server Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <p className="text-xl font-semibold text-white tracking-[-0.02em] truncate">
                            {server.name}
                        </p>
                        {isSuspended && (
                            <span className="px-3 py-1 text-xs font-semibold bg-red-500/10 text-red-400 rounded-xl border border-red-500/30 backdrop-blur-sm">
                                SUSPENDED
                            </span>
                        )}
                        {isInstalling && (
                            <span className="px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/30 animate-pulse">
                                INSTALLING
                            </span>
                        )}
                    </div>
                    
                    {defaultAllocation && (
                        <p className="text-sm text-zinc-400 mt-1.5 font-mono tracking-tight">
                            {defaultAllocation.alias || ip(defaultAllocation.ip)}:{defaultAllocation.port}
                        </p>
                    )}

                    {/* Optional: Server type / game icon */}
                    {server.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                            {server.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Resource Usage - Desktop */}
            <div className="hidden md:flex items-center gap-10 text-sm relative z-10">
                {!stats || isSuspended || isInstalling ? (
                    <div className="text-zinc-400 text-sm italic px-4 py-2 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
                        {isSuspended 
                            ? 'Server Suspended' 
                            : isInstalling 
                                ? 'Installing...' 
                                : 'No Data'}
                    </div>
                ) : (
                    <div className="flex items-center gap-8">
                        <ResourceBar>
                            <span className="font-medium text-violet-400">CPU</span>
                            <span className={`tabular-nums transition-colors ${cpuAlarm ? 'text-orange-400 font-semibold' : 'text-white'}`}>
                                {stats.cpuUsagePercent.toFixed(1)}%
                            </span>
                        </ResourceBar>

                        <ResourceBar>
                            <span className="font-medium text-violet-400">RAM</span>
                            <span className={`tabular-nums transition-colors ${memAlarm ? 'text-orange-400 font-semibold' : 'text-white'}`}>
                                {bytesToString(stats.memoryUsageInBytes)}
                            </span>
                        </ResourceBar>

                        <ResourceBar>
                            <span className="font-medium text-violet-400">DISK</span>
                            <span className={`tabular-nums transition-colors ${diskAlarm ? 'text-orange-400 font-semibold' : 'text-white'}`}>
                                {bytesToString(stats.diskUsageInBytes)}
                            </span>
                        </ResourceBar>
                    </div>
                )}
            </div>

            {/* Mobile Status */}
            <div className="md:hidden text-xs uppercase tracking-widest text-zinc-500 font-mono relative z-10">
                {stats?.status || server.status}
            </div>

            {/* Subtle glow accent on hover */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none" />
        </ServerCard>
    );
};

// Helper
const isAlarmState = (current: number, limit: number): boolean =>
    limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

export default ServerRow;
