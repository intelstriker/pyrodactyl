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
    background: linear-gradient(145deg, #1f1629 0%, #2a1f3d 50%, #1f1629 100%);
    border: 1px solid rgba(167, 139, 250, 0.18);
    border-radius: 18px;
    padding: 1.4rem 1.8rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 320ms cubic-bezier(0.23, 1, 0.32, 1);
    text-decoration: none;
    color: inherit;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 16px -4px rgb(0 0 0 / 0.4);

    /* Animated subtle background */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: 
            linear-gradient(135deg, rgba(167, 139, 250, 0.06) 0%, transparent 50%),
            repeating-linear-gradient(
                135deg,
                transparent 0px,
                transparent 24px,
                rgba(167, 139, 250, 0.045) 24px,
                rgba(167, 139, 250, 0.045) 48px
            );
        animation: subtleShift 25s linear infinite;
        z-index: 1;
        opacity: 0.85;
    }

    /* Animated glow layer */
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 30% 50%, rgba(167, 139, 250, 0.12) 0%, transparent 70%);
        animation: slowPulse 18s ease-in-out infinite;
        z-index: 2;
        pointer-events: none;
        opacity: 0.6;
    }

    &:hover {
        border-color: rgba(167, 139, 250, 0.45);
        transform: translateY(-4px) scale(1.015);
        box-shadow: 
            0 25px 30px -8px rgb(0 0 0 / 0.5),
            0 0 0 1px rgba(167, 139, 250, 0.35) inset;
    }

    .status-dot {
        width: 14px;
        height: 14px;
        border-radius: 9999px;
        transition: all 280ms ease;
        box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.25);
        flex-shrink: 0;
        z-index: 3;
    }

    ${({ $status, $suspended }) => {
        if ($suspended) {
            return `.status-dot { background: #f87171; box-shadow: 0 0 18px #f87171; }`;
        }
        if (!$status || $status === 'offline') {
            return `.status-dot { background: #ef4444; box-shadow: 0 0 16px #ef4444; }`;
        }
        if ($status === 'running') {
            return `.status-dot { background: #4ade80; box-shadow: 0 0 18px #4ade80; }`;
        }
        if ($status === 'installing') {
            return `
                .status-dot { 
                    background: #c084fc; 
                    box-shadow: 0 0 20px #c084fc;
                    animation: installingPulse 1.8s infinite;
                }
            `;
        }
        return `.status-dot { background: #fbbf24; box-shadow: 0 0 16px #fbbf24; }`;
    }}

    @keyframes subtleShift {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
    }

    @keyframes slowPulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.05); }
    }

    @keyframes installingPulse {
        0%, 100% { box-shadow: 0 0 20px #c084fc; }
        50% { box-shadow: 0 0 30px #c084fc; }
    }
`;

const ResourceItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 78px;
    font-size: 0.8rem;
    line-height: 1.1;
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
        interval.current = setInterval(getStats, 20000);
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
                        <p className="text-[17px] font-semibold text-white tracking-[-0.01em] truncate">
                            {server.name}
                        </p>
                        {isSuspended && (
                            <span className="px-3 py-1 text-xs font-semibold bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                                SUSPENDED
                            </span>
                        )}
                        {isInstalling && (
                            <span className="px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30 animate-pulse">
                                INSTALLING
                            </span>
                        )}
                    </div>

                    {defaultAllocation && (
                        <p className="text-sm text-purple-300/80 font-mono mt-1 tracking-tight">
                            {defaultAllocation.alias || ip(defaultAllocation.ip)}:{defaultAllocation.port}
                        </p>
                    )}

                    {/* Short ID like in your screenshot */}
                    <p className="text-[10px] text-purple-400/60 font-mono mt-1.5 tracking-[1px]">
                        {server.id ? server.id.slice(0, 8) : ''}
                    </p>
                </div>
            </div>

            {/* Resources - Exact layout from your second screenshot */}
            <div className="hidden md:flex items-center gap-8 relative z-10">
                {!stats || isSuspended || isInstalling ? (
                    <div className="text-purple-400/70 text-sm italic pr-6">
                        {isSuspended ? 'Suspended' : isInstalling ? 'Installing...' : 'No data'}
                    </div>
                ) : (
                    <>
                        <ResourceItem>
                            <span className="text-purple-400 text-[10px] font-medium tracking-widest">CPU</span>
                            <span className={`font-semibold tabular-nums text-base ${cpuAlarm ? 'text-orange-400' : 'text-white'}`}>
                                {stats.cpuUsagePercent.toFixed(1)}%
                            </span>
                        </ResourceItem>

                        <ResourceItem>
                            <span className="text-purple-400 text-[10px] font-medium tracking-widest">RAM</span>
                            <span className={`font-semibold tabular-nums text-base ${memAlarm ? 'text-orange-400' : 'text-white'}`}>
                                {bytesToString(stats.memoryUsageInBytes)}
                            </span>
                        </ResourceItem>

                        <ResourceItem>
                            <span className="text-purple-400 text-[10px] font-medium tracking-widest">DISK</span>
                            <span className={`font-semibold tabular-nums text-base ${diskAlarm ? 'text-orange-400' : 'text-white'}`}>
                                {bytesToString(stats.diskUsageInBytes)}
                            </span>
                        </ResourceItem>
                    </>
                )}
            </div>

            {/* Mobile */}
            <div className="md:hidden text-xs text-purple-400/70 font-mono relative z-10">
                {stats?.status || server.status}
            </div>
        </ServerCard>
    );
};

const isAlarmState = (current: number, limit: number): boolean =>
    limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

export default ServerRow;
