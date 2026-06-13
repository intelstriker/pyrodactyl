import { Bars, ChevronDown, House, LayoutCellsLarge, SlidersVertical } from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useSWR from 'swr';
import ServerRow from '@/components/dashboard/ServerRow';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Pagination from '@/components/elements/Pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/elements/Tabs';
import { PageListContainer } from '@/components/elements/pages/PageList';
import getServers from '@/api/getServers';
import { PaginatedResult } from '@/api/http';
import { Server } from '@/api/server/getServer';
import useFlash from '@/plugins/useFlash';
import { usePersistedState } from '@/plugins/usePersistedState';
import { MainPageHeader } from '../elements/MainPageHeader';

const DashboardContainer = () => {
    const getTitle = () => {
        if (serverViewMode === 'admin-all') return 'All Servers (Admin)';
        if (serverViewMode === 'all') return 'All Accessible Servers';
        return 'Your Servers';
    };

    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');
    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);

    const [serverViewMode, setServerViewMode] = usePersistedState<'owner' | 'admin-all' | 'all'>(
        `${uuid}:server_view_mode`,
        'owner',
    );
    const [dashboardDisplayOption, setDashboardDisplayOption] = usePersistedState(
        `${uuid}:dashboard_display_option`,
        'list',
    );

    const getApiType = (): string | undefined => {
        if (serverViewMode === 'owner') return 'owner';
        if (serverViewMode === 'admin-all') return 'admin-all';
        if (serverViewMode === 'all') return 'all';
        return undefined;
    };

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', serverViewMode, page],
        () => getServers({ page, type: getApiType() }),
        { revalidateOnFocus: false },
    );

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) setPage(1);
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    const EmptyState = ({ isAdmin }: { isAdmin: boolean }) => (
        <div className='flex flex-col items-center justify-center py-20 px-4'>
            <div className='relative mb-6'>
                <div className='w-20 h-20 rounded-2xl flex items-center justify-center'
                    style={{
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(126,34,206,0.08) 100%)',
                        border: '1px solid rgba(168,85,247,0.25)',
                        boxShadow: '0 0 40px rgba(168,85,247,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}>
                    <House width={32} height={32} color='rgba(168,85,247,0.8)' />
                </div>
                <div className='absolute inset-0 rounded-2xl blur-xl opacity-30'
                    style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)' }} />
            </div>
            <h3 className='text-xl font-semibold mb-2' style={{
                background: 'linear-gradient(135deg, #d8b4fe, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
                {isAdmin ? 'No other servers found' : 'No servers yet'}
            </h3>
            <p className='text-sm text-zinc-500 max-w-xs text-center leading-relaxed'>
                {isAdmin
                    ? 'There are no other servers to display.'
                    : 'Servers assigned to your account will appear here.'}
            </p>
        </div>
    );

    const LoadingState = () => (
        <div className='flex flex-col items-center justify-center py-20 gap-4'>
            <div className='relative'>
                <div className='w-10 h-10 rounded-full border-2 border-transparent animate-spin'
                    style={{ borderTopColor: '#a855f7', borderRightColor: 'rgba(168,85,247,0.3)' }} />
                <div className='absolute inset-0 rounded-full blur-md opacity-50'
                    style={{ background: 'rgba(168,85,247,0.3)' }} />
            </div>
            <p className='text-sm text-zinc-500 animate-pulse'>Loading your servers…</p>
        </div>
    );

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <div className='w-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                <Tabs
                    defaultValue={dashboardDisplayOption}
                    onValueChange={(value) => setDashboardDisplayOption(value)}
                    className='w-full'
                >
                    {/* Header */}
                    <div className='transform-gpu skeleton-anim-2 mb-4 sm:mb-6'>
                        <MainPageHeader
                            title={getTitle()}
                            titleChildren={
                                <div className='flex gap-3'>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className='inline-flex h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-hidden'
                                                style={{
                                                    background: 'rgba(168,85,247,0.1)',
                                                    border: '1px solid rgba(168,85,247,0.2)',
                                                    color: 'rgba(216,180,254,0.9)',
                                                }}
                                            >
                                                <SlidersVertical width={16} height={16} color='currentColor' />
                                                <div>{getTitle()}</div>
                                                <ChevronDown width={12} height={12} color='currentColor' />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className='flex flex-col gap-1 z-99999' sideOffset={8}>
                                            <DropdownMenuItem
                                                onSelect={() => setServerViewMode('owner')}
                                                className={serverViewMode === 'owner' ? 'bg-accent/20' : ''}
                                            >
                                                Your Servers Only
                                            </DropdownMenuItem>
                                            {rootAdmin && (
                                                <DropdownMenuItem
                                                    onSelect={() => setServerViewMode('admin-all')}
                                                    className={serverViewMode === 'admin-all' ? 'bg-accent/20' : ''}
                                                >
                                                    All Servers (Admin)
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onSelect={() => setServerViewMode('all')}
                                                className={serverViewMode === 'all' ? 'bg-accent/20' : ''}
                                            >
                                                All Servers
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <TabsList>
                                        <TabsTrigger aria-label='List layout' value='list'>
                                            <Bars width={18} height={20} color='white' />
                                        </TabsTrigger>
                                        <TabsTrigger aria-label='Grid layout' value='grid'>
                                            <LayoutCellsLarge width={20} height={20} color='white' />
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                            }
                        />
                    </div>

                    {/* Server Content */}
                    {!servers ? (
                        <LoadingState />
                    ) : (
                        <>
                            <TabsContent value='list'>
                                <Pagination data={servers} onPageSelect={setPage}>
                                    {({ items }) =>
                                        items.length > 0 ? (
                                            <PageListContainer>
                                                {items.map((server, index) => (
                                                    <div
                                                        key={server.uuid}
                                                        className='transform-gpu skeleton-anim-2'
                                                        style={{ animationDelay: `${index * 50 + 50}ms` }}
                                                    >
                                                        <ServerRow className='flex-row' key={server.uuid} server={server} />
                                                    </div>
                                                ))}
                                            </PageListContainer>
                                        ) : (
                                            <EmptyState isAdmin={serverViewMode === 'admin-all'} />
                                        )
                                    }
                                </Pagination>
                            </TabsContent>

                            <TabsContent value='grid'>
                                <Pagination data={servers} onPageSelect={setPage}>
                                    {({ items }) =>
                                        items.length > 0 ? (
                                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                                {items.map((server, index) => (
                                                    <div
                                                        key={server.uuid}
                                                        className='transform-gpu skeleton-anim-2'
                                                        style={{ animationDelay: `${index * 50 + 50}ms` }}
                                                    >
                                                        <ServerRow
                                                            className='items-start! flex-col w-full gap-4 [&>div~div]:w-full'
                                                            key={server.uuid}
                                                            server={server}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <EmptyState isAdmin={serverViewMode === 'admin-all'} />
                                        )
                                    }
                                </Pagination>
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </div>
        </PageContentBlock>
    );
};

export default DashboardContainer;
