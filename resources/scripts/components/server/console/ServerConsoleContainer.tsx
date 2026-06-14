import { memo, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';

import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
// import Can from '@/components/elements/Can';
import Modal from '@/components/elements/Modal';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Alert } from '@/components/elements/alert';
import Console from '@/components/server/console/Console';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import StatGraphs from '@/components/server/console/StatGraphs';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import { CrashAnalysisCard } from '@/components/server/features/MclogsFeature';

import { ServerContext } from '@/state/server';

import Features from '@feature/Features';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const description = ServerContext.useStoreState((state) => state.server.data!.description);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);

    const [metricsOpen, setMetricsOpen] = useState(false);

    useEffect(() => {
        if (!connected || !instance) {
            return;
        }

        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    return (
        <ServerContentBlock title={'Home'}>
            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                    <div
                        className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                        style={{
                            animationDelay: '50ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <Alert type={'warning'}>
                            {isNodeUnderMaintenance
                                ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                                : isInstalling
                                  ? 'This server is currently running its installation process and most actions are unavailable.'
                                  : 'This server is currently being transferred to another node and all actions are unavailable.'}
                        </Alert>
                    </div>
                )}
                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                    style={{
                        animationDelay: '75ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <MainPageHeader
                        title={name}
                        titleChildren={
                            <div
                                className='transform-gpu skeleton-anim-2'
                                style={{
                                    animationDelay: '100ms',
                                    animationTimingFunction:
                                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                }}
                            >
                                <PowerButtons className='flex gap-1 items-center justify-center' />
                            </div>
                        }
                    />
                </div>
                {description && (
                    <div
                        className='transform-gpu skeleton-anim-2 mb-3 mt-3 sm:mb-4'
                        style={{
                            animationDelay: '100ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-3 sm:p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                            <p className='text-sm text-zinc-300 leading-relaxed'>{description}</p>
                        </div>
                    </div>
                )}
                <div className='flex flex-col gap-3 sm:gap-4'>
                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '125ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-3 sm:p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                            <ServerDetailsBlock />
                        </div>
                    </div>

                    {/* Crash Analysis Card - only shows if mclogs feature is enabled */}
                    {eggFeatures.map((v) => v.toLowerCase()).includes('mclogs') && (
                        <div
                            className='transform-gpu skeleton-anim-2'
                            style={{
                                animationDelay: '150ms',
                                animationTimingFunction:
                                    'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                            }}
                        >
                            <CrashAnalysisCard />
                        </div>
                    )}

                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '175ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-3 sm:p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                            <Console />
                        </div>
                    </div>

                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '225ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-3 sm:p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                            {/* Resource Metrics - always Live (rolling real-time). Click the button for the detailed popup where you can click points on CPU / RAM / Networking to see exact usage at that moment. */}
                            <div className="text-center mb-3">
                                <div className="font-bold text-lg tracking-tight text-white flex items-center justify-center gap-2">
                                    Resource Metrics — Live
                                    <button
                                        onClick={() => setMetricsOpen(true)}
                                        className="text-[10px] px-2 py-0.5 rounded-full border border-[#ffffff22] text-purple-300 hover:text-white hover:border-purple-400/60 active:scale-[0.985] transition"
                                        title="Open detailed live metrics popup. Click points on any graph (CPU, RAM, Networking) to see exactly how much the server was using at that time."
                                    >
                                        Click for popup
                                    </button>
                                </div>
                                <div className="mt-1 text-[10px] text-zinc-400">Live updating • Click points in the popup for values at that moment</div>
                            </div>
                            <div className={'grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4'}>
                                <Spinner.Suspense>
                                    <StatGraphs period="live" />
                                </Spinner.Suspense>
                            </div>
                        </div>
                    </div>

                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '275ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <ErrorBoundary>
                            <Features enabled={eggFeatures} />
                        </ErrorBoundary>
                    </div>
                </div>

                {/* Detailed live metrics popup: larger charts. Click points on CPU, RAM or Networking to see exactly how much the server was using at that moment. */}
                <Modal
                    visible={metricsOpen}
                    onDismissed={() => setMetricsOpen(false)}
                    title="Live Resource Metrics — Detailed View"
                    closeButton
                    dismissable
                >
                <div className="px-1 pb-2">
                    <div className="mb-2 text-sm text-zinc-300">
                        Live updating. Click any point on the <span className="text-white">CPU</span>, <span className="text-white">RAM</span> or <span className="text-white">Networking</span> graphs to see the exact usage values at that time.
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        <Spinner.Suspense>
                            <StatGraphs period="live" expanded />
                        </Spinner.Suspense>
                    </div>
                    <div className="mt-3 text-[10px] text-center text-zinc-500">
                        Click points anywhere on the three graphs. The inspector shows the precise values at the selected moment in the live data.
                    </div>
                </div>
            </Modal>
            </div>
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
