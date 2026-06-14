import { ArrowDownToLine, ArrowUpToLine } from '@gravity-ui/icons';
import * as Tooltip from '@radix-ui/react-tooltip';
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

const StatGraphs = ({ period, expanded = false }: { period: Period; expanded?: boolean }) => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });

    const maxPoints = 60; // always live rolling buffer, bigger for more visibility

    // For expanded popup: support clicking points to inspect values
    const cpuRef = useRef<any>(null);
    const memoryRef = useRef<any>(null);
    const networkRef = useRef<any>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    useEffect(() => {
        setSelectedIndex(null);
    }, []); // reset on mount only (pure live now)

    const cpu = useChart('CPU', {
        sets: 1,
        maxPoints,
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
        maxPoints,
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
        maxPoints,
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

    // Simple click handler for the expanded live popup (works on CPU, RAM and Networking)
    const handleLivePointClick = (chartRef: any, evt: any) => {
        if (!expanded) return;
        const chartInstance = chartRef?.current;
        if (!chartInstance) return;
        const ev = evt?.nativeEvent || evt;
        try {
            const active = chartInstance.getElementsAtEventForMode(ev, 'nearest', { intersect: false }, false);
            if (active && active.length > 0) {
                setSelectedIndex(active[0].index);
            }
        } catch {
            /* ignore */
        }
    };

    // ===================== RENDER (pure live only) =====================
    const renderChartContent = (chart: any, label: string, which: 'cpu' | 'memory' | 'network') => {
        const len = chart.props.data?.datasets?.[0]?.data?.length || 1;
        const baseOptions = chart.props.options || {};
        const pointOpts = expanded ? { radius: 3, hoverRadius: 6, hitRadius: 12 } : { radius: 0 };
        const dynamicOptions = {
            ...baseOptions,
            scales: {
                ...baseOptions.scales,
                x: {
                    ...baseOptions.scales?.x,
                    max: Math.max(0, len - 1),
                },
            },
            elements: {
                ...(baseOptions.elements || {}),
                point: {
                    ...((baseOptions.elements as any)?.point || {}),
                    ...pointOpts,
                },
            },
        };
        const ref = which === 'cpu' ? cpuRef : which === 'memory' ? memoryRef : networkRef;

        const clickHandler = expanded ? (evt: any) => handleLivePointClick(ref, evt) : undefined;

        const lineEl = (
            <Line
                aria-label={label}
                role="img"
                ref={ref}
                {...chart.props}
                options={dynamicOptions}
                onClick={clickHandler}
            />
        );
        return expanded ? (
            <div className="cursor-pointer" onClick={(e) => handleLivePointClick(ref, e)}>
                {lineEl}
            </div>
        ) : lineEl;
    };

    return (
        <Tooltip.Provider>
            <div
                className='transform-gpu skeleton-anim-2'
                style={{
                    animationDelay: `250ms`,
                    animationTimingFunction:
                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                }}
            >
                <ChartBlock
                    title="CPU"
                    contentClassName={expanded ? 'z-10 overflow-hidden rounded-lg h-64 sm:h-72' : undefined}
                >
                    {renderChartContent(cpu, 'CPU Usage', 'cpu')}
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
                <ChartBlock
                    title="RAM"
                    contentClassName={expanded ? 'z-10 overflow-hidden rounded-lg h-64 sm:h-72' : undefined}
                >
                    {renderChartContent(memory, 'Memory Usage', 'memory')}
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
                    title="Network Activity"
                    legend={
                        expanded ? (
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
                    contentClassName={expanded ? 'z-10 overflow-hidden rounded-lg h-64 sm:h-72' : undefined}
                >
                    {renderChartContent(network, 'Network Activity', 'network')}
                </ChartBlock>
            </div>

            {expanded && (
                <div className="mt-3 text-xs border border-[#ffffff12] rounded-lg bg-[#ffffff05] p-3 text-zinc-300">
                    <div className="font-semibold text-zinc-100 mb-1.5">
                        Click anywhere on the <span className="text-[#fa4e49]">CPU</span>, <span className="text-[#60a5fa]">RAM</span>, or <span className="text-[#facc15]">Networking</span> graph to see exactly how much the server was using at that time
                    </div>

                    {selectedIndex !== null ? (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-black/30 rounded px-2 py-1">
                            <span className="text-zinc-400">At point #{selectedIndex} in live window:</span>
                            <span><span className="text-zinc-400">CPU:</span> <span className="font-mono font-semibold text-white">{getValueAt(cpu, selectedIndex)}%</span></span>
                            <span><span className="text-zinc-400">RAM:</span> <span className="font-mono font-semibold text-white">{getValueAt(memory, selectedIndex)} MiB</span></span>
                            <span><span className="text-zinc-400">Net In:</span> <span className="font-mono font-semibold text-yellow-300">{bytesToString(Number(getValueAt(network, selectedIndex, 0)) || 0)}</span></span>
                            <span><span className="text-zinc-400">Net Out:</span> <span className="font-mono font-semibold text-blue-300">{bytesToString(Number(getValueAt(network, selectedIndex, 1)) || 0)}</span></span>
                            <button
                                className="ml-auto text-[10px] px-1.5 py-px rounded bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white"
                                onClick={() => setSelectedIndex(null)}
                            >
                                clear
                            </button>
                        </div>
                    ) : (
                        <div className="text-zinc-400">Click any point (or near the line) on any of the three graphs above. The exact usage numbers at that moment in the live data will appear here.</div>
                    )}

                    <div className="text-[10px] text-zinc-500 mt-1.5">
                        Pure live rolling data. All three graphs (CPU, RAM, Networking) support clicking in the popup.
                    </div>
                </div>
            )}
        </Tooltip.Provider>
    );
};

function getValueAt(chart: any, index: number, setIndex = 0): string {
    const ds = chart?.props?.data?.datasets?.[setIndex];
    const val = ds?.data?.[index];
    if (val == null || val < 0) return '—';
    if (typeof val === 'number') return Number.isInteger(val) ? val.toString() : val.toFixed(1);
    return String(val);
}

export default StatGraphs;
