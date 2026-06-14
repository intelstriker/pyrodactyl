import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import CopyOnClick from '@/components/elements/CopyOnClick';
// StatBlock kept for reference (layout redesigned to spacious obsidian gauges)
import { SocketEvent, SocketRequest } from '@/components/server/events';

import { bytesToString, ip, mbToBytes } from '@/lib/formatters';

import { SubdomainInfo, getSubdomainInfo } from '@/api/server/network/subdomain';

import { ServerContext } from '@/state/server';

import useWebsocketEvent from '@/plugins/useWebsocketEvent';

import UptimeDuration from '../UptimeDuration';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

// const getBackgroundColor = (value: number, max: number | null): string | undefined => {
//     const delta = !max ? 0 : value / max;

//     if (delta > 0.8) {
//         if (delta > 0.9) {
//             return 'bg-red-500';
//         }
//         return 'bg-yellow-500';
//     }

//     return undefined;
// };

// @ts-expect-error - Unused parameter in component definition
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Limit = ({ limit, children }: { limit: string | null; children: React.ReactNode }) => <>{children}</>;

const ResourceRing = styled.div`
    position: relative;
    width: 128px;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
`;

const RingContainer = styled.div`
    position: relative;
    width: 118px;
    height: 118px;
`;

const Svg = styled.svg`
    transform: rotate(-90deg);
    filter: drop-shadow(0 4px 12px rgba(192, 132, 252, 0.15));
`;

const CircleBg = styled.circle`
    fill: none;
    stroke: rgba(147, 51, 234, 0.18);
    stroke-width: 11;
`;

const CircleProgress = styled.circle<{ $alarm?: boolean }>`
    fill: none;
    stroke: ${({ $alarm }) => ($alarm ? '#fb923c' : '#c084fc')};
    stroke-width: 11;
    stroke-linecap: round;
    transition: stroke-dashoffset 650ms cubic-bezier(0.4, 0, 0.2, 1);
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
    font-size: 10px;
    font-weight: 700;
    color: #c084fc;
    letter-spacing: 1px;
    line-height: 1;
    text-transform: uppercase;
`;

const RingValue = styled.div<{ $alarm?: boolean }>`
    font-size: 20px;
    font-weight: 800;
    color: ${({ $alarm }) => ($alarm ? '#fb923c' : '#f3e8ff')};
    line-height: 1;
    font-variant-numeric: tabular-nums;
`;

const RingSub = styled.div`
    margin-top: 6px;
    font-size: 10px;
    font-weight: 600;
    color: #a5a5b0;
    text-align: center;
    line-height: 1.1;
`;

const ServerDetailsBlock = ({ className }: { className?: string }) => {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });
    const [subdomainInfo, setSubdomainInfo] = useState<SubdomainInfo | null>(null);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverAllocations = ServerContext.useStoreState((state) => state.server.data!.allocations);

    const textLimits = useMemo(
        () => ({
            cpu: limits?.cpu ? `${limits.cpu}%` : null,
            memory: limits?.memory ? bytesToString(mbToBytes(limits.memory)) : null,
            disk: limits?.disk ? bytesToString(mbToBytes(limits.disk)) : null,
        }),
        [limits],
    );

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);

        return !match ? 'n/a' : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    // Get display address (subdomain if available and active, otherwise IP)
    const displayAddress = useMemo(() => {
        if (
            subdomainInfo?.current_subdomain?.attributes?.is_active &&
            subdomainInfo.current_subdomain.attributes.full_domain
        ) {
            return subdomainInfo.current_subdomain.attributes.full_domain;
        }
        return allocation;
    }, [subdomainInfo, allocation, serverAllocations]);

    useEffect(() => {
        const loadSubdomainInfo = async () => {
            try {
                const data = await getSubdomainInfo(uuid);
                setSubdomainInfo(data);
            } catch (error) {
                // Silently fail - subdomain feature might not be available
                setSubdomainInfo(null);
            }
        };

        loadSubdomainInfo();
    }, [uuid]);

    useEffect(() => {
        if (!connected || !instance) {
            return;
        }

        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        let stats: any = {};
        try {
            stats = JSON.parse(data);
        } catch (e) {
            return;
        }

        setStats({
            memory: stats.memory_bytes,
            cpu: stats.cpu_absolute,
            disk: stats.disk_bytes,
            tx: stats.network.tx_bytes,
            rx: stats.network.rx_bytes,
            uptime: stats.uptime || 0,
        });
    });

    const isOffline = status === 'offline';
    const cpuPercent = isOffline ? 0 : Math.min(Math.max(stats.cpu || 0, 0), 100);
    const memPercent = !isOffline && limits.memory > 0
        ? Math.min(((stats.memory || 0) / (limits.memory * 1024 * 1024)) * 100, 100)
        : 0;
    const diskPercent = !isOffline && limits.disk > 0
        ? Math.min(((stats.disk || 0) / (limits.disk * 1024 * 1024)) * 100, 100)
        : 0;

    const cpuAlarm = cpuPercent >= 90;
    const memAlarm = memPercent >= 90;
    const diskAlarm = diskPercent >= 90;

    // Larger radius for bigger gauges
    const circumference = 2 * Math.PI * 52;

    const formatLimit = (val: number | null | undefined, unit: string) =>
        val && val > 0 ? `${val}${unit}` : '∞';

    return (
        <div className={clsx('space-y-4', className)}>
            {/* Header info row - IP and Uptime, obsidian theme */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <CopyOnClick text={displayAddress}>
                        <div className="group cursor-pointer">
                            <div className="text-[10px] uppercase tracking-[1.5px] text-purple-300/70 font-semibold mb-0.5">IP ADDRESS</div>
                            <div className="font-mono text-sm sm:text-[15px] text-white group-hover:text-[#c084fc] transition-colors truncate max-w-[260px] border-b border-white/10 pb-px">
                                {displayAddress}
                            </div>
                        </div>
                    </CopyOnClick>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-sm">
                    <div className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.015] text-xs uppercase tracking-widest text-purple-200/80">UPTIME</div>
                    <div className="font-semibold tabular-nums text-white/95 text-base">
                        {stats.uptime > 0 ? <UptimeDuration uptime={stats.uptime} /> : '—'}
                    </div>
                </div>
            </div>

            {/* Big radial gauges - redesigned spacious layout for obsidian theme */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-2">
                {/* CPU Gauge */}
                <div className="flex flex-col items-center">
                    <ResourceRing>
                        <RingContainer>
                            <Svg width="118" height="118" viewBox="0 0 118 118">
                                <CircleBg cx="59" cy="59" r="52" />
                                <CircleProgress
                                    cx="59" cy="59" r="52"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - (cpuPercent / 100) * circumference}
                                    $alarm={cpuAlarm}
                                />
                            </Svg>
                            <RingContent>
                                <RingLabel>CPU</RingLabel>
                                <RingValue $alarm={cpuAlarm}>{cpuPercent.toFixed(0)}%</RingValue>
                            </RingContent>
                        </RingContainer>
                    </ResourceRing>
                    <RingSub>
                        {isOffline ? 'Server offline' : `${cpuPercent.toFixed(1)}% of ${formatLimit(limits.cpu, '')}`}
                    </RingSub>
                </div>

                {/* RAM Gauge */}
                <div className="flex flex-col items-center">
                    <ResourceRing>
                        <RingContainer>
                            <Svg width="118" height="118" viewBox="0 0 118 118">
                                <CircleBg cx="59" cy="59" r="52" />
                                <CircleProgress
                                    cx="59" cy="59" r="52"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - (memPercent / 100) * circumference}
                                    $alarm={memAlarm}
                                />
                            </Svg>
                            <RingContent>
                                <RingLabel>RAM</RingLabel>
                                <RingValue $alarm={memAlarm}>{bytesToString(stats.memory || 0)}</RingValue>
                            </RingContent>
                        </RingContainer>
                    </ResourceRing>
                    <RingSub>
                        {isOffline ? 'Server offline' : `${memPercent.toFixed(1)}% of ${textLimits.memory || '∞'}`}
                    </RingSub>
                </div>

                {/* DISK / Storage Gauge */}
                <div className="flex flex-col items-center">
                    <ResourceRing>
                        <RingContainer>
                            <Svg width="118" height="118" viewBox="0 0 118 118">
                                <CircleBg cx="59" cy="59" r="52" />
                                <CircleProgress
                                    cx="59" cy="59" r="52"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - (diskPercent / 100) * circumference}
                                    $alarm={diskAlarm}
                                />
                            </Svg>
                            <RingContent>
                                <RingLabel>DISK</RingLabel>
                                <RingValue $alarm={diskAlarm}>{bytesToString(stats.disk || 0)}</RingValue>
                            </RingContent>
                        </RingContainer>
                    </ResourceRing>
                    <RingSub>
                        {isOffline ? 'Server offline' : `${diskPercent.toFixed(1)}% of ${textLimits.disk || '∞'}`}
                    </RingSub>
                </div>
            </div>
        </div>
    );
};

export default ServerDetailsBlock;
