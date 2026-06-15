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
    background: #0a0612;
    border: 1px solid rgba(147, 51, 234, 0.3);
    border-radius: 20px;
    padding: 1.6rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 280ms cubic-bezier(0.23, 1, 0.32, 1);
    text-decoration: none;
    color: inherit;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 25px -8px rgb(0 0 0 / 0.65);

    /* === ULTRA PREMIUM OBSIDIAN BACKGROUND === */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
            radial-gradient(circle at 25% 35%, rgba(168, 85, 247, 0.18) 0%, transparent 60%),
            radial-gradient(circle at 75% 65%, rgba(192, 132, 252, 0.14) 0%, transparent 60%);
        animation: nebulaDrift 40s ease-in-out infinite alternate;
        z-index: 1;
    }

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background:
            linear-gradient(transparent, rgba(147, 51, 234, 0.06), transparent),
            repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(192, 132, 252, 0.035) 35px,
                rgba(192, 132, 252, 0.035) 70px
            );
        animation: wavyFlow 32s linear infinite;
        z-index: 2;
        opacity: 0.7;
        mix-blend-mode: screen;
    }

    .geometric {
        position: absolute;
        inset: 0;
        background-image:
            radial-gradient(circle, rgba(192, 132, 252, 0.4) 0.8px, transparent 1px),
            linear-gradient(transparent 50%, rgba(147, 51, 234, 0.08) 50%);
        background-size: 60px 60px;
        animation: triTravel 45s linear infinite;
        z-index: 3;
        opacity: 0.35;
        pointer-events: none;
    }

    &:hover {
        border-color: rgba(192, 132, 252, 0.65);
        box-shadow:
            0 20px 35px -10px rgb(147 51 234 / 0.4),
            inset 0 0 90px rgba(192, 132, 252, 0.25);
    }

    .status-dot {
        width: 15px;
        height: 15px;
        border-radius: 9999px;
        transition: all 280ms ease;
        box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.35);
        flex-shrink: 0;
        z-index: 5;
    }

    ${({ $status, $suspended }) => {
        if ($suspended) {
            return `.status-dot { background: #f87171; box-shadow: 0 0 22px #f87171; }`;
        }
        if (!$status || $status === 'offline') {
            return `.status-dot { background: #ef4444; box-shadow: 0 0 20px #ef4444; }`;
        }
        if ($status === 'running') {
            return `.status-dot { background: #4ade80; box-shadow: 0 0 22px #4ade80; }`;
        }
        if ($status === 'installing') {
            return `
                .status-dot {
                    background: #c084fc;
                    box-shadow: 0 0 25px #c084fc;
                    animation: installingPulse 1.5s infinite;
                }
            `;
        }
        return `.status-dot { background: #fbbf24; box-shadow: 0 0 20px #fbbf24; }`;
    }}

    @keyframes nebulaDrift {
        0% { transform: translate(0, 0) scale(1); }
        100% { transform: translate(18px, -12px) scale(1.04); }
    }

    @keyframes wavyFlow {
        0% { background-position: 0 0; }
        100% { background-position: 140px 90px; }
    }

    @keyframes triTravel {
        0% { background-position: 0 0; }
        100% { background-position: 180px 120px; }
    }

    @keyframes installingPulse {
        0%, 100% { box-shadow: 0 0 25px #c084fc; }
        50% { box-shadow: 0 0 40px #c084fc; }
    }
`;

const ResourceRing = styled.div`
    position: relative;
    width: 110px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const RingContainer = styled.div`
    position: relative;
    width: 92px;
    height: 92px;
`;

const Svg = styled.svg`
    transform: rotate(-90deg);
`;

const CircleBg = styled.circle`
    fill: none;
    stroke: rgba(147, 51, 234, 0.22);
    stroke-width: 8.5;
`;

const CircleProgress = styled.circle<{ $alarm?: boolean }>`
    fill: none;
    stroke: ${({ $alarm }) => ($alarm ? '#fb923c' : '#c084fc')};
    stroke-width: 8.5;
    stroke-linecap: round;
    transition: stroke-dashoffset 700ms cubic-bezier(0.4, 0, 0.2, 1);
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
    font-size: 11px;
    font-weight: 700;
    color: #e0bbff;
    letter-spacing: 1px;
    line-height: 1;
`;

const RingValue = styled.div<{ $alarm?: boolean }>`
    font-size: 16px;
    font-weight: 700;
    color: ${({ $alarm }) => ($alarm ? '#fb923c' : '#f3e8ff')};
    line-height: 1.05;
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

    const circumference = 2 * Math.PI * 39; // Increased radius

    return (
        <ServerCard
            to={`/server/${server.id}`}
            className={className}
            $status={stats?.status || (server.status as ServerPowerState)}
            $suspended={isSuspended}
        >
            <div className="flex items-center gap-5 flex-1 min-w-0 relative z-10">
                <div className="status-dot" />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <p className="text-[17.5px] font-semibold text-white tracking-[-0.02em] truncate">
                            {server.name}
                        </p>
                        {isSuspended && (
                            <span className="px-3.5 py-1 text-xs font-semibold bg-red-500/20 text-red-400 rounded-2xl border border-red-500/30">
                                SUSPENDED
                            </span>
                        )}
                        {isInstalling && (
                            <span className="px-3.5 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-500/30 animate-pulse">
                                INSTALLING
                            </span>
                        )}
                    </div>

                    {defaultAllocation && (
                        <p className="text-sm text-purple-300/80 font-mono mt-1 tracking-tight">
                            {defaultAllocation.alias || ip(defaultAllocation.ip)}
                        </p>
                    )}
                </div>
            </div>

            {/* Bigger Resource Rings */}
            <div className="hidden md:flex items-center gap-8 relative z-10">
                {!stats || isSuspended || isInstalling ? (
                    <div className="text-purple-400/70 text-sm italic pr-10">
                        {isSuspended ? 'Suspended' : isInstalling ? 'Installing...' : 'No data'}
                    </div>
                ) : (
                    <>
                        <ResourceRing>
                            <RingContainer>
                                <Svg width="92" height="92" viewBox="0 0 92 92">
                                    <CircleBg cx="46" cy="46" r="39" />
                                    <CircleProgress
                                        cx="46" cy="46" r="39"
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

                        <ResourceRing>
                            <RingContainer>
                                <Svg width="92" height="92" viewBox="0 0 92 92">
                                    <CircleBg cx="46" cy="46" r="39" />
                                    <CircleProgress
                                        cx="46" cy="46" r="39"
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

                        <ResourceRing>
                            <RingContainer>
                                <Svg width="92" height="92" viewBox="0 0 92 92">
                                    <CircleBg cx="46" cy="46" r="39" />
                                    <CircleProgress
                                        cx="46" cy="46" r="39"
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

            <div className="geometric" />
        </ServerCard>
    );
};

const isAlarmState = (current: number, limit: number): boolean =>
    limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

export default ServerRow;
