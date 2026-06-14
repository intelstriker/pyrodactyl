import { ArrowDownToLine, ArrowUpToLine } from '@gravity-ui/icons';
import * as Tooltip from '@radix-ui/react-tooltip';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';

import ChartBlock from '@/components/server/console/ChartBlock';
import { useChart } from '@/components/server/console/chart';
import { SocketEvent } from '@/components/server/events';

import { bytesToString } from '@/lib/formatters';
import { hexToRgba } from '@/lib/helpers';

import { ServerContext } from '@/state/server';

import useWebsocketEvent from '@/plugins/useWebsocketEvent';

type Period = 'live' | '1h' | '24h' | '7d' | '30d';

const periodLabels: Record<Period, string> = {
    live: 'Live',
    '1h': 'Hourly',
    '24h': 'Past Day',
    '7d': 'Weekly',
    '30d': 'Monthly',
};

const StatGraphs = () => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });
    const [period, setPeriod] = useState<Period>('live');

    const cpu = useChart('CPU', {
        sets: 1,
        options: {
            scales: {
                y: {
                    suggestedMax: limits.cpu || 100,
                    ticks: {
                        callback(value) {
                            return `${Number(value).toFixed(0)}%`;
                        },
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${Number(ctx.raw).toFixed(1)}%`,
                    },
                },
            },
        },
    });

    const memory = useChart('Memory', {
        sets: 1,
        options: {
            scales: {
                y: {
                    suggestedMax: limits.memory || 4096,
                    ticks: {
                        callback(value) {
                            return `${value} MiB`;
                        },
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${Number(ctx.raw).toFixed(0)} MiB`,
                    },
                },
            },
        },
    });

    const network = useChart('Network', {
        sets: 2,
        options: {
            scales: {
                y: {
                    ticks: {
                        callback(value) {
                            return bytesToString(typeof value === 'string' ? parseInt(value, 10) : value);
                        },
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => bytesToString(Number(ctx.raw)),
                    },
                },
            },
        },
        callback(opts, index) {
            return {
                ...opts,
                label: !index ? 'Network In' : 'Network Out',
                borderColor: !index ? '#facc15' : '#60a5fa',
                backgroundColor: hexToRgba(!index ? '#facc15' : '#60a5fa', 0.09),
            };
        },
    });

    useEffect(() => {
        if (status === 'offline') {
            cpu.clear();
            memory.clear();
            network.clear();
        }
    }, [status]);

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        if (period !== 'live') return; // pause live push for historical views

        let values: any = {};
        try {
            values = JSON.parse(data);
        } catch (e) {
            return;
        }
        cpu.push(values.cpu_absolute);
        memory.push(Math.floor(values.memory_bytes / 1024 / 1024));
        network.push([
            previous.current.tx < 0 ? 0 : Math.max(0, values.network.tx_bytes - previous.current.tx),
            previous.current.rx < 0 ? 0 : Math.max(0, values.network.rx_bytes - previous.current.rx),
        ]);

        previous.current = { tx: values.network.tx_bytes, rx: values.network.rx_bytes };
    });

    const isHistorical = period !== 'live';

    const renderChartContent = (chart: any, label: string) => {
        if (isHistorical) {
            return (
                <div className="h-40 sm:h-48 flex flex-col items-center justify-center text-center px-4 text-xs text-zinc-400">
                    <div className="mb-1 opacity-70">No historical data for {periodLabels[period]}</div>
                    <div className="text-[10px] opacity-50 leading-tight">Only live samples are available.<br />Switch to Live for real-time CPU / RAM / Network.</div>
                </div>
            );
        }
        return <Line aria-label={label} role='img' {...chart.props} />;
    };

    return (
        <Tooltip.Provider>
            {/* Resource Metrics header + period buttons */}
            <div className="mb-3 px-1">
                <div className="font-bold text-lg tracking-tight text-white mb-2">Resource Metrics</div>
                <div className="inline-flex rounded-full bg-[#ffffff08] border border-[#ffffff12] p-px text-[10px] font-medium mb-3">
                    {(['live', '1h', '24h', '7d', '30d'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={clsx(
                                'px-2.5 py-1 rounded-full transition-all',
                                period === p
                                    ? 'bg-[#c084fc] text-black shadow-sm'
                                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                            )}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            <div
                className='transform-gpu skeleton-anim-2'
                style={{
                    animationDelay: `250ms`,
                    animationTimingFunction:
                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                }}
            >
                <ChartBlock title={isHistorical ? `CPU (${periodLabels[period]})` : 'CPU'}>
                    {renderChartContent(cpu, 'CPU Usage')}
                </ChartBlock>
            </div>
            <div
                className='transform-gpu skeleton-anim-2'
                style={{
                    animationDelay: `275ms`,
                    animationTimingFunction:
                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                }}
            >
                <ChartBlock title={isHistorical ? `RAM (${periodLabels[period]})` : 'RAM'}>
                    {renderChartContent(memory, 'Memory Usage')}
                </ChartBlock>
            </div>
            <div
                className='transform-gpu skeleton-anim-2'
                style={{
                    animationDelay: `300ms`,
                    animationTimingFunction:
                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                }}
            >
                <ChartBlock
                    title={isHistorical ? `Network (${periodLabels[period]})` : 'Network Activity'}
                    legend={
                        !isHistorical ? (
                            <div className='flex gap-2'>
                                <Tooltip.Root delayDuration={200}>
                                    <Tooltip.Trigger asChild>
                                        <div className='flex items-center cursor-default'>
                                            <ArrowDownToLine
                                                width={22}
                                                height={22}
                                                fill='currentColor'
                                                className='mr-2 text-yellow-400'
                                            />
                                        </div>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                        <Tooltip.Content
                                            side='top'
                                            className='px-2 py-1 text-sm bg-gray-800 text-gray-100 rounded shadow-lg'
                                            sideOffset={5}
                                        >
                                            Inbound
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>

                                <Tooltip.Root delayDuration={200}>
                                    <Tooltip.Trigger asChild>
                                        <div className='flex items-center cursor-default'>
                                            <ArrowUpToLine
                                                width={22}
                                                height={22}
                                                fill='currentColor'
                                                className='text-blue-400'
                                            />
                                        </div>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                        <Tooltip.Content
                                            side='top'
                                            className='px-2 py-1 text-sm bg-gray-800 text-gray-100 rounded shadow-lg'
                                            sideOffset={5}
                                        >
                                            Outbound
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                            </div>
                        ) : null
                    }
                >
                    {renderChartContent(network, 'Network Activity')}
                </ChartBlock>
            </div>

            <div className="text-[10px] text-center text-zinc-400/60 pt-1">Disk current usage is in the large gauges above. Historical periods for CPU/RAM/Network show live data only when available.</div>
        </Tooltip.Provider>
    );
};

export default StatGraphs;
