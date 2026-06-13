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

const ResourceRing = styled.div`
    position: relative;
    width: 74px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const RingContainer = styled.div`
    position: relative;
    width: 62px;
    height: 62px;
`;

const Svg = styled.svg`
    transform: rotate(-90deg);
`;

const CircleBg = styled.circle`
    fill: none;
    stroke: rgba(167, 139, 250, 0.15);
    stroke-width: 6;
`;

const CircleProgress = styled.circle<{ $alarm?: boolean }>`
    fill: none;
    stroke: ${({ $alarm }) => ($alarm ? '#fb923c' : '#a855f7')};
    stroke-width: 6;
    stroke-linecap: round;
    transition: stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const RingContent = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 4;
    pointer-events: none;
`;

const RingLabel = styled.div`
    font-size: 9px;
    font-weight: 600;
    color: #c4b5fd;
    letter-spacing: 0.8px;
    line-height: 1;
`;

const RingValue = styled.div<{ $alarm?: boolean }>`
    font-size: 13px;
    font-weight: 700;
    color: ${({ $alarm }) => ($alarm ? '#fb923c' : '#f3e8ff')};
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

    const cpuPercent = stats ? Math.min(Math.max(stats.cpuUsagePercent, 0), 100) : 0;
    const memPercent = stats && server.limits.memory > 0 
        ? Math.min((stats.memoryUsageInBytes / (server.limits.memory * 1024 * 1024)) * 100, 100) 
        : 0;
    const diskPercent = stats && server.limits.disk > 0 
        ? Math.min((stats.diskUsageInBytes / (server.limits.disk * 1024 * 1024)) * 100, 100) 
        : 0;

    const cpuAlarm = cpuPercent >= 90;
    const memAlarm = memPercent >= 90;
    const diskAlarm = diskPercent >= 90;

    const circumference = 2 * Math.PI * 26; // radius = 26 for bigger ring

    return (
        <ServerCard
            to={`/server/${server.id}`}
            className={className}
            $status={stats?.status || (server.status as ServerPowerState)}
            $suspended={isSuspended}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0 relative z-10">
                <div className="status-dot" />

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

                    <p className="text-[10px] text-purple-400/60 font-mono mt-1.5 tracking-[1px]">
                        {server.id ? server.id.slice(0, 8) : ''}
                    </p>
                </div>
            </div>

            {/* Circular Rings with Text Inside */}
            <div className="hidden md:flex items-center gap-5 relative z-10">
                {!stats || isSuspended || isInstalling ? (
                    <div className="text-purple-400/70 text-sm italic pr-8">
                        {isSuspended ? 'Suspended' : isInstalling ? 'Installing...' : 'No data'}
                    </div>
                ) : (
                    <>
                        {/* CPU */}
                        <ResourceRing>
                            <RingContainer>
                                <Svg width="62" height="62" viewBox="0 0 62 62">
                                    <CircleBg cx="31" cy="31" r="26" />
                                    <CircleProgress 
                                        cx="31" 
                                        cy="31" 
                                        r="26" 
                                        strokeDasharray={circumference} 
                                        strokeDashoffset={circumference - (cpuPercent / 100) * circumference}
                                        $alarm={cpuAlarm}
                                    />
                                </Svg>
                                <RingContent>
                                    <RingLabel>CPU</RingLabel>
                                    <RingValue $alarm={cpuAlarm}>{cpuPercent.toFixed(1)}%</RingValue>
                                </RingContent>
                            </RingContainer>
                        </ResourceRing>

                        {/* RAM */}
                        <ResourceRing>
                            <RingContainer>
                                <Svg width="62" height="62" viewBox="0 0 62 62">
                                    <CircleBg cx="31" cy="31" r="26" />
                                    <CircleProgress 
                                        cx="31" 
                                        cy="31" 
                                        r="26" 
                                        strokeDasharray={circumference} 
                                        strokeDashoffset={circumference - (memPercent / 100) * circumference}
                                        $alarm={memAlarm}
                                    />
                                </Svg>
                                <RingContent>
                                    <RingLabel>RAM</RingLabel>
                                    <RingValue $alarm={memAlarm}>{bytesToString(stats.memoryUsageInBytes)}</RingValue>
                                </RingContent>
                            </RingContainer>
                        </ResourceRing>

                        {/* DISK */}
                        <ResourceRing>
                            <RingContainer>
                                <Svg width="62" height="62" viewBox="0 0 62 62">
                                    <CircleBg cx="31" cy="31" r="26" />
                                    <CircleProgress 
                                        cx="31" 
                                        cy="31" 
                                        r="26" 
                                        strokeDasharray={circumference} 
                                        strokeDashoffset={circumference - (diskPercent / 100) * circumference}
                                        $alarm={diskAlarm}
                                    />
                                </Svg>
                                <RingContent>
                                    <RingLabel>DISK</RingLabel>
                                    <RingValue $alarm={diskAlarm}>{bytesToString(stats.diskUsageInBytes)}</RingValue>
                                </RingContent>
                            </RingContainer>
                        </ResourceRing>
                    </>
                )}
            </div>

            <div className="md:hidden text-xs text-purple-400/70 font-mono relative z-10">
                {stats?.status || server.status}
            </div>
        </ServerCard>
    );
};

const isAlarmState = (current: number, limit: number): boolean =>
    limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

export default ServerRow;
