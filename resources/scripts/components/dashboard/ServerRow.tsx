import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { bytesToString, ip } from '@/lib/formatters';

import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';

const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

// Status glow colors
const statusGlow = (status: ServerPowerState | undefined) => {
    if (!status || status === 'offline') return { dot: '#ef4444', glow: 'rgba(239,68,68,0.6)', bg: 'rgba(239,68,68,0.08)' };
    if (status === 'running') return { dot: '#22c55e', glow: 'rgba(34,197,94,0.6)', bg: 'rgba(34,197,94,0.08)' };
    if (status === 'installing') return { dot: '#60a5fa', glow: 'rgba(96,165,250,0.6)', bg: 'rgba(96,165,250,0.08)' };
    return { dot: '#f59e0b', glow: 'rgba(245,158,11,0.6)', bg: 'rgba(245,158,11,0.08)' };
};

const statusLabel = (status: ServerPowerState | undefined) => {
    if (!status || status === 'offline') return 'Offline';
    if (status === 'running') return 'Online';
    if (status === 'installing') return 'Installing';
    if (status === 'starting') return 'Starting';
    if (status === 'stopping') return 'Stopping';
    return 'Unknown';
};

const ObsidianCard = styled.div<{ $status: ServerPowerState }>`
    @keyframes obsidian-card-hatch {
        0% { background-position: 0 0, 0 0, 0 0; }
        100% { background-position: 120px 120px, 0 0, 0 0; }
    }
    @keyframes obsidian-card-orb {
        0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.7; }
        50% { transform: scale(1.25) translate(-8px, -8px); opacity: 1; }
    }

    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-radius: 0.875rem;
    cursor: pointer;
    transition: all 200ms ease-in-out;
    overflow: hidden;
    background:
        radial-gradient(120% 140% at 100% 0%, rgba(168, 85, 247, 0.10) 0%, transparent 55%),
        repeating-linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0px, rgba(168, 85, 247, 0.05) 1px, transparent 1px, transparent 22px),
        linear-gradient(135deg, rgba(20, 5, 35, 0.7) 0%, rgba(10, 2, 20, 0.85) 100%);
    background-size: 120px 120px, 31px 31px, 100% 100%;
    animation: obsidian-card-hatch 36s linear infinite;
    border: 1px solid rgba(168, 85, 247, 0.15);

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(168,85,247,0.04) 0%, transparent 60%);
        pointer-events: none;
    }

    &::after {
        content: '';
        position: absolute;
        width: 140px;
        height: 140px;
        right: -50px;
        bottom: -60px;
        border-radius: 9999px;
        background: radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%);
        filter: blur(2px);
        pointer-events: none;
        animation: obsidian-card-orb 7s ease-in-out infinite;
    }

    &:hover {
        border-color: rgba(168, 85, 247, 0.4);
        background:
            radial-gradient(120% 140% at 100% 0%, rgba(168, 85, 247, 0.16) 0%, transparent 55%),
            repeating-linear-gradient(135deg, rgba(168, 85, 247, 0.07) 0px, rgba(168, 85, 247, 0.07) 1px, transparent 1px, transparent 22px),
            linear-gradient(135deg, rgba(30, 8, 50, 0.8) 0%, rgba(15, 4, 30, 0.9) 100%);
        background-size: 120px 120px, 31px 31px, 100% 100%;
        transform: translateY(-1px);
        box-shadow: 0 8px 32px rgba(168,85,247,0.12), 0 0 0 1px rgba(168,85,247,0.2);
    }

    &:active {
        transform: translateY(0px);
    }
`;

type Timer = ReturnType<typeof setInterval>;

const StatPill = ({ label, value, alarm }: { label: string; value: string; alarm: boolean }) => (
    <div
        className='flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg'
        style={{
            background: alarm ? 'rgba(239,68,68,0.1)' : 'rgba(168,85,247,0.07)',
            border: `1px solid ${alarm ? 'rgba(239,68,68,0.25)' : 'rgba(168,85,247,0.15)'}`,
            minWidth: '64px',
        }}
    >
        <span className='text-[10px] font-medium uppercase tracking-wider' style={{ color: alarm ? '#fca5a5' : 'rgba(216,180,254,0.6)' }}>
            {label}
        </span>
        <span className={`text-xs font-bold ${alarm ? 'text-red-300' : 'text-white'}`}>{value}</span>
    </div>
);

const ServerRow = ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [isInstalling, setIsInstalling] = useState(server.status === 'installing');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        setIsInstalling(stats?.isInstalling || server.status === 'installing');
    }, [stats?.isInstalling, server.status]);

    useEffect(() => {
        if (isSuspended) return;
        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });
        return () => {
            if (interval.current) clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const colors = statusGlow(stats?.status);

    const defaultAlloc = server.allocations.filter((a) => a.isDefault);

    return (
        <ObsidianCard as={Link} to={`/server/${server.id}`} className={className} $status={stats?.status}>
            {/* Left: name + address */}
            <div className='flex items-center gap-4 min-w-0'>
                {/* Status dot */}
                <div
                    className='flex-shrink-0 w-3 h-3 rounded-full'
                    style={{
                        background: colors.dot,
                        boxShadow: `0 0 8px 2px ${colors.glow}`,
                        animation: stats?.status === 'starting' || stats?.status === 'stopping' ? 'pulse 1.5s ease-in-out infinite' : undefined,
                    }}
                />

                <div className='flex flex-col min-w-0'>
                    <div className='flex items-center gap-2'>
                        <p className='text-base font-bold text-white truncate leading-tight'>{server.name}</p>
                        {/* Status badge */}
                        <span
                            className='hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide flex-shrink-0'
                            style={{
                                background: colors.bg,
                                color: colors.dot,
                                border: `1px solid ${colors.glow}`,
                            }}
                        >
                            {isSuspended ? 'Suspended' : isInstalling ? 'Installing' : statusLabel(stats?.status)}
                        </span>
                    </div>
                    <p className='text-xs mt-0.5' style={{ color: 'rgba(168,85,247,0.55)' }}>
                        {defaultAlloc.map((alloc) => (
                            <Fragment key={alloc.ip + alloc.port.toString()}>
                                {alloc.alias || ip(alloc.ip)}:{alloc.port}
                            </Fragment>
                        ))}
                    </p>
                </div>
            </div>

            {/* Right: stats pills */}
            <div className='hidden sm:flex items-center gap-2 flex-shrink-0'>
                {isSuspended ? (
                    <span className='text-xs text-red-400 px-3 py-1.5 rounded-lg'
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        Suspended
                    </span>
                ) : server.isTransferring || (server.status && !stats) ? (
                    <span className='text-xs text-zinc-400 px-3 py-1.5 rounded-lg animate-pulse'
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {server.isTransferring ? 'Transferring…' : isInstalling ? 'Installing…' : 'Loading…'}
                    </span>
                ) : stats ? (
                    <Fragment>
                        <StatPill label='CPU' value={`${stats.cpuUsagePercent.toFixed(1)}%`} alarm={alarms.cpu} />
                        <StatPill label='RAM' value={bytesToString(stats.memoryUsageInBytes, 0)} alarm={alarms.memory} />
                        <StatPill label='Disk' value={bytesToString(stats.diskUsageInBytes, 0)} alarm={alarms.disk} />
                    </Fragment>
                ) : (
                    <span className='text-xs text-zinc-600 px-3 py-1.5 rounded-lg'
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        Sit tight…
                    </span>
                )}
            </div>
        </ObsidianCard>
    );
};

export default ServerRow;

