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

const ServerCard = styled(Link)<{ 
    $status: ServerPowerState; 
    $suspended: boolean;
}>`
    background: linear-gradient(145deg, #1a1428 0%, #2a1f3d 100%);
    border: 1px solid rgba(167, 139, 250, 0.15);
    border-radius: 16px;
    padding: 1.25rem 1.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 280ms cubic-bezier(0.23, 1, 0.32, 1);
    text-decoration: none;
    color: inherit;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3);

    /* Subtle diagonal stripe pattern */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
            135deg,
            transparent,
            transparent 20px,
            rgba(167, 139, 250, 0.03) 20px,
            rgba(167, 139, 250, 0.03) 40px
        );
        pointer-events: none;
        z-index: 1;
    }

    &:hover {
        border-color: rgba(167, 139, 250, 0.4);
        transform: translateY(-3px);
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.4), 0 0 0 1px rgba(167, 139, 250, 0.3) inset;
    }

    .status-dot {
        width: 13px;
        height: 13px;
        border-radius: 9999px;
        transition: all 300ms ease;
        box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.2);
        flex-shrink: 0;
        z-index: 2;
    }

    ${({ $status, $suspended }) => {
        if ($suspended) {
            return `.status-dot { background: #ef4444; box-shadow: 0 0 15px #ef4444; }`;
        }
        if (!$status || $status === 'offline') {
            return `.status-dot { background: #ef4444; box-shadow: 0 0 12px #ef4444; }`;
        }
        if ($status === 'running') {
            return `.status-dot { background: #22c55e; box-shadow: 0 0 15px #22c55e; }`;
        }
        if ($status === 'installing') {
            return `
                .status-dot { 
                    background: #a855f7; 
                    box-shadow: 0 0 15px #a855f7;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
            `;
        }
        return `.status-dot { background: #eab308; box-shadow: 0 0 12px #eab308; }`;
    }}
`;

const ResourceItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 70px;
    font-size: 0.8rem;
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
        interval.current = setInterval(getStats, 25000);
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
            $status={stats?.status || (server.status as ServerPowerState)}
            $suspended={isSuspended}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0 relative z-10">
                {/* Status Dot */}
                <div className="status-dot" />

                {/* Server Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <p className="text-lg font-semibold text-white tracking-tight truncate">
                            {server.name}
                        </p>
                        {isSuspended && (
                            <span className="px-3 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                                SUSPENDED
                            </span>
                        )}
                    </div>

                    {defaultAllocation && (
                        <p className="text-sm text-purple-300/70 font-mono mt-0.5">
                            {defaultAllocation.alias || ip(defaultAllocation.ip)}:{defaultAllocation.port}
                        </p>
                    )}

                    {/* Optional short ID / hash like in your screenshot */}
                    {server.id && (
                        <p className="text-[10px] text-purple-400/50 font-mono mt-1 tracking-widest">
                            {server.id.slice(0, 8)}
                        </p>
                    )}
                </div>
            </div>

            {/* Resources - Compact like second screenshot */}
            <div className="hidden md:flex items-center gap-6 relative z-10">
                {!stats || isSuspended || isInstalling ? (
                    <div className="text-purple-400/60 text-sm italic px-4">
                        {isSuspended ? 'Suspended' : isInstalling ? 'Installing...' : 'No Data'}
                    </div>
                ) : (
                    <>
                        <ResourceItem>
                            <span className="text-purple-400 text-xs font-medium tracking-widest">CPU</span>
                            <span className={`font-semibold tabular-nums ${cpuAlarm ? 'text-orange-400' : 'text-white'}`}>
                                {stats.cpuUsagePercent.toFixed(1)}%
                            </span>
                        </ResourceItem>

                        <ResourceItem>
                            <span className="text-purple-400 text-xs font-medium tracking-widest">RAM</span>
                            <span className={`font-semibold tabular-nums ${memAlarm ? 'text-orange-400' : 'text-white'}`}>
                                {bytesToString(stats.memoryUsageInBytes)}
                            </span>
                        </ResourceItem>

                        <ResourceItem>
                            <span className="text-purple-400 text-xs font-medium tracking-widest">DISK</span>
                            <span className={`font-semibold tabular-nums ${diskAlarm ? 'text-orange-400' : 'text-white'}`}>
                                {bytesToString(stats.diskUsageInBytes)}
                            </span>
                        </ResourceItem>
                    </>
                )}
            </div>

            {/* Mobile fallback */}
            <div className="md:hidden text-xs text-purple-400/70 font-mono">
                {stats?.status || server.status}
            </div>
        </ServerCard>
    );
};

const isAlarmState = (current: number, limit: number): boolean =>
    limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

export default ServerRow;
