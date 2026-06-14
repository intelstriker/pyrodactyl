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
import getServerMetrics, { ServerMetric, MetricPeriod } from '@/api/server/getServerMetrics';

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

    const maxPoints = period === 'live' ? 45 : period === '1h' ? 180 : period === '24h' ? 360 : 720;

    const serverUuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    // Historical metrics loaded from backend (for non-live periods)
    const isHistorical = period !== 'live';
    const [historical, setHistorical] = useState<ServerMetric[] | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // For expanded popup: support clicking points to inspect values
    const cpuRef = useRef<any>(null);
    const memoryRef = useRef<any>(null);
    const networkRef = useRef<any>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    useEffect(() => {
        setSelectedIndex(null);
    }, [period]);

    // Fetch (and periodically refresh) real saved metrics when viewing a historical period
    useEffect(() => {
        if (!isHistorical) {
            setHistorical(null);
            return;
        }

        let cancelled = false;
        const load = async () => {
            if (cancelled) return;
            setIsLoadingHistory(true);
            try {
                const resp = await getServerMetrics(serverUuid, period as MetricPeriod);
                if (!cancelled) {
                    setHistorical(resp.data || []);
                    setSelectedIndex(null);
                }
            } catch (e) {
                if (!cancelled) {
                    setHistorical([]);
                    setSelectedIndex(null);
                }
            } finally {
                if (!cancelled) setIsLoadingHistory(false);
            }
        };

        load();

        // Refresh while the user is looking at historical data so it "updates"
        const iv = setInterval(load, 45000);

        return () => {
            cancelled = true;
            clearInterval(iv);
        };
    }, [isHistorical, period, serverUuid]);

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

    // ===================== HISTORICAL HELPERS (real saved data) =====================
    const displayMetrics = (() => {
        if (!historical || historical.length === 0) return [];
        // Downsample for chart rendering performance while keeping the full array for clicks/inspector
        if (historical.length <= 420) return historical;
        const step = Math.ceil(historical.length / 380);
        const out: ServerMetric[] = [];
        for (let i = 0; i < historical.length; i += step) out.push(historical[i]);
        return out;
    })();

    const getHistoricalValue = (metric: ServerMetric | undefined, key: 'cpu' | 'mem' | 'rx' | 'tx') => {
        if (!metric) return 0;
        if (key === 'cpu') return metric.cpu_absolute || 0;
        if (key === 'mem') return Math.floor((metric.memory_bytes || 0) / 1024 / 1024);
        if (key === 'rx') return metric.network_rx_bytes || 0;
        return metric.network_tx_bytes || 0;
    };

    const formatShortTime = (iso: string) => {
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    // Build a ready-to-use chart.js data + options object for historical periods
    const buildHistoricalChart = (which: 'cpu' | 'memory' | 'network') => {
        const points = displayMetrics;
        const labels = points.map((m) => formatShortTime(m.timestamp));

        let borderColor = '#fa4e49';
        let bg = hexToRgba('#fa4e49', 0.09);
        let label = 'CPU';
        let data: number[];
        let tickFormatter: (v: any) => string = (v) => `${Number(v).toFixed(0)}%`;
        let tooltipFormatter = (raw: any) => `${Number(raw).toFixed(1)}%`;

        if (which === 'memory') {
            borderColor = '#60a5fa';
            bg = hexToRgba('#60a5fa', 0.09);
            label = 'Memory';
            data = points.map((m) => getHistoricalValue(m, 'mem'));
            tickFormatter = (v) => `${v} MiB`;
            tooltipFormatter = (raw) => `${Number(raw).toFixed(0)} MiB`;
        } else if (which === 'network') {
            // For network we return a special structure (2 lines)
            const rxData = points.map((m) => getHistoricalValue(m, 'rx'));
            const txData = points.map((m) => getHistoricalValue(m, 'tx'));
            return {
                labels,
                isNetwork: true,
                rxData,
                txData,
            } as const;
        } else {
            data = points.map((m) => getHistoricalValue(m, 'cpu'));
        }

        const pointRadius = expanded ? 3 : 1.5;
        const pointHover = expanded ? 6 : 3;

        const chartData = {
            labels,
            datasets: [
                {
                    label,
                    data,
                    fill: true,
                    borderColor,
                    backgroundColor: bg,
                    borderWidth: 1.5,
                    pointRadius,
                    pointHoverRadius: pointHover,
                    tension: 0.2,
                },
            ],
        };

        const options: any = {
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(20, 20, 24, 0.95)',
                    borderColor: 'rgba(192, 132, 252, 0.4)',
                    borderWidth: 1,
                    callbacks: {
                        title: (ctx: any) => {
                            const idx = ctx[0]?.dataIndex ?? 0;
                            const m = points[idx];
                            return m ? new Date(m.timestamp).toLocaleString() : '';
                        },
                        label: (ctx: any) => tooltipFormatter(ctx.raw),
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { display: false, maxTicksLimit: 6 },
                },
                y: {
                    min: 0,
                    grid: { display: false },
                    ticks: {
                        display: true,
                        count: 3,
                        font: { size: 11, weight: 600 },
                        callback: tickFormatter,
                    },
                },
            },
            elements: {
                line: { tension: 0.15 },
                point: { radius: pointRadius, hoverRadius: pointHover, hitRadius: 10 },
            },
            onClick: (event: any, elements: any[]) => {
                if (!expanded || !elements || elements.length === 0) return;
                const dispIdx = elements[0].index;
                const hLen = historical?.length || 1;
                const dLen = displayMetrics.length || 1;
                const realIdx = Math.min(Math.floor((dispIdx / Math.max(1, dLen - 1)) * (hLen - 1)), hLen - 1);
                setSelectedIndex(realIdx);
            },
        };

        return { data: chartData, options, pointsRef: points };
    };

    // ===================== RENDER =====================
    const renderChartContent = (chart: any, label: string, which: 'cpu' | 'memory' | 'network') => {
        // HISTORICAL PATH - uses persisted DB samples
        if (isHistorical) {
            if (isLoadingHistory && (!historical || historical.length === 0)) {
                return (
                    <div className="h-40 sm:h-48 flex items-center justify-center text-xs text-zinc-400">
                        Loading metrics...
                    </div>
                );
            }
            if (!historical || historical.length === 0) {
                return (
                    <div className="h-40 sm:h-48 flex flex-col items-center justify-center text-center px-4 text-xs text-zinc-400">
                        <div className="mb-1 opacity-70">No saved metrics for {periodLabels[period]} yet.</div>
                        <div className="text-[10px] opacity-60">Collection runs every ~2 minutes.<br />Switch to Live or wait for the first samples.</div>
                    </div>
                );
            }

            const built = buildHistoricalChart(which);
            const ref = which === 'cpu' ? cpuRef : which === 'memory' ? memoryRef : networkRef;

            if ((built as any).isNetwork) {
                // Network two-line chart for historical
                const netData = {
                    labels: (built as any).labels,
                    datasets: [
                        {
                            label: 'Network In',
                            data: (built as any).rxData,
                            borderColor: '#facc15',
                            backgroundColor: hexToRgba('#facc15', 0.09),
                            fill: true,
                            borderWidth: 1.5,
                            pointRadius: expanded ? 3 : 1.5,
                            pointHoverRadius: expanded ? 6 : 3,
                            tension: 0.2,
                        },
                        {
                            label: 'Network Out',
                            data: (built as any).txData,
                            borderColor: '#60a5fa',
                            backgroundColor: hexToRgba('#60a5fa', 0.09),
                            fill: true,
                            borderWidth: 1.5,
                            pointRadius: expanded ? 3 : 1.5,
                            pointHoverRadius: expanded ? 6 : 3,
                            tension: 0.2,
                        },
                    ],
                };
                const netOptions: any = {
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                title: (ctx: any) => {
                                    const idx = ctx[0]?.dataIndex ?? 0;
                                    const m = (built as any).pointsRef?.[idx] || historical![idx];
                                    return m ? new Date(m.timestamp).toLocaleString() : '';
                                },
                                label: (ctx: any) => bytesToString(Number(ctx.raw)),
                            },
                        },
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { display: false } },
                        y: { min: 0, grid: { display: false }, ticks: { display: true, count: 3, font: { size: 11, weight: 600 }, callback: (v: any) => bytesToString(typeof v === 'string' ? parseInt(v) : v) } },
                    },
                    elements: { point: { radius: expanded ? 3 : 1.5, hoverRadius: expanded ? 6 : 3, hitRadius: 10 } },
                    onClick: (evt: any, elems: any[]) => {
                        if (!expanded || !elems?.length) return;
                        const dispIdx = elems[0].index;
                        // Map from (possibly downsampled) display index back into the full historical array proportionally
                        const hLen = historical?.length || 1;
                        const dLen = displayMetrics.length || 1;
                        const realIdx = Math.min(Math.floor((dispIdx / Math.max(1, dLen - 1)) * (hLen - 1)), hLen - 1);
                        setSelectedIndex(realIdx);
                    },
                };
                return (
                    <Line
                        aria-label={label}
                        role="img"
                        ref={ref}
                        data={netData}
                        options={netOptions}
                    />
                );
            }

            // CPU / Memory single series
            return (
                <Line
                    aria-label={label}
                    role="img"
                    ref={ref}
                    data={(built as any).data}
                    options={(built as any).options}
                />
            );
        }

        // LIVE PATH (original rolling buffer behavior)
        const len = chart.props.data?.datasets?.[0]?.data?.length || 1;
        const baseOptions = chart.props.options || {};
        const pointOpts = expanded ? { radius: 2.5, hoverRadius: 5, hitRadius: 8 } : { radius: 0 };
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
        const onChartClick = expanded
            ? (evt: any) => {
                  const c = (ref as any).current;
                  if (!c) return;
                  const ev = evt?.nativeEvent || evt;
                  try {
                      const active = c.getElementsAtEventForMode(ev, 'nearest', { intersect: false }, false);
                      if (active && active.length) {
                          setSelectedIndex(active[0].index);
                      }
                  } catch {
                      /* ignore */
                  }
              }
            : undefined;

        const lineEl = (
            <Line
                aria-label={label}
                role="img"
                ref={ref}
                {...chart.props}
                options={dynamicOptions}
                onClick={onChartClick}
            />
        );
        return expanded ? <div onClick={onChartClick}>{lineEl}</div> : lineEl;
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
                    title={isHistorical ? `CPU (${periodLabels[period]})` : 'CPU'}
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
                    title={isHistorical ? `RAM (${periodLabels[period]})` : 'RAM'}
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
                    title={isHistorical ? `Network (${periodLabels[period]})` : 'Network Activity'}
                    legend={
                        !isHistorical || expanded ? (
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
                    <div className="font-medium text-zinc-200 mb-1">Point inspector</div>
                    {selectedIndex !== null && historical && historical[selectedIndex] ? (
                        // Historical (persisted) selection - show real timestamp + values
                        (() => {
                            const m = historical[selectedIndex];
                            const t = new Date(m.timestamp);
                            return (
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    <span className="font-mono text-white">{t.toLocaleString()}</span>
                                    <span>CPU: <span className="font-mono text-white">{(m.cpu_absolute || 0).toFixed(1)}%</span></span>
                                    <span>RAM: <span className="font-mono text-white">{Math.floor((m.memory_bytes || 0) / 1024 / 1024)} MiB</span></span>
                                    <span>
                                        Net In: <span className="font-mono text-yellow-300">{bytesToString(m.network_rx_bytes || 0)}</span>
                                    </span>
                                    <span>
                                        Net Out: <span className="font-mono text-blue-300">{bytesToString(m.network_tx_bytes || 0)}</span>
                                    </span>
                                    <button
                                        className="ml-auto underline text-[10px] text-zinc-400 hover:text-white"
                                        onClick={() => setSelectedIndex(null)}
                                    >
                                        clear
                                    </button>
                                </div>
                            );
                        })()
                    ) : selectedIndex !== null ? (
                        // Live selection (rolling buffer)
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span>Index in window: <span className="font-mono text-white">{selectedIndex}</span></span>
                            <span>CPU: <span className="font-mono text-white">{getValueAt(cpu, selectedIndex)}%</span></span>
                            <span>RAM: <span className="font-mono text-white">{getValueAt(memory, selectedIndex)} MiB</span></span>
                            <span>
                                Net In: <span className="font-mono text-yellow-300">{bytesToString(Number(getValueAt(network, selectedIndex, 0)) || 0)}</span>
                            </span>
                            <span>
                                Net Out: <span className="font-mono text-blue-300">{bytesToString(Number(getValueAt(network, selectedIndex, 1)) || 0)}</span>
                            </span>
                            <button
                                className="ml-auto underline text-[10px] text-zinc-400 hover:text-white"
                                onClick={() => setSelectedIndex(null)}
                            >
                                clear
                            </button>
                        </div>
                    ) : (
                        <div>Click points on the graphs above to see exact metrics at that position in the current window.</div>
                    )}
                    <div className="text-[10px] text-zinc-500 mt-1">
                        {isHistorical
                            ? 'Real stored metrics. Click any point for the exact recorded values + timestamp. Data refreshes automatically.'
                            : 'Larger windows (Hourly/Monthly) let you scroll further back through collected samples. Data is live-updating.'}
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
