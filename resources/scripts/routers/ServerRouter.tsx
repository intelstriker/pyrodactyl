'use client';
import { Ellipsis } from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
import { Fragment, Suspense, createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import routes, { type ServerRouteDefinition, getServerNavRoutes } from '@/routers/routes';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import MainSidebar from '@/components/elements/MainSidebar';
import MainWrapper from '@/components/elements/MainWrapper';
import { ServerMobileMenu } from '@/components/elements/MobileFullScreenMenu';
import MobileTopBar from '@/components/elements/MobileTopBar';
import PermissionRoute from '@/components/elements/PermissionRoute';
import obsidianLogo from '@/assets/images/obsidianhostlogo.svg';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import CommandMenu from '@/components/elements/commandk/CmdK';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import InstallListener from '@/components/server/InstallListener';
import ServerSidebarNavItem from '@/components/server/ServerSidebarNavItem';
import TransferListener from '@/components/server/TransferListener';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import StatBlock from '@/components/server/console/StatBlock';

const ServerRouter = () => {
    const params = useParams<{ id: string }>();
    const location = useLocation();
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');
    const [subdomainSupported, setSubdomainSupported] = useState(false);
    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const serverName = ServerContext.useStoreState((state) => state.server.data?.name);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const [isMobileMenuVisible, setMobileMenuVisible] = useState(false);

    const toggleMobileMenu = () => setMobileMenuVisible(!isMobileMenuVisible);
    const closeMobileMenu = () => setMobileMenuVisible(false);

    const onTriggerLogout = () => {
        http.post('/auth/logout').finally(() => window.location.href = '/');
    };

    const onSelectManageServer = () => {
        window.open(`/admin/servers/view/${serverId}`);
    };

    useEffect(() => {
        return () => clearServerState();
    }, [clearServerState]);

    useEffect(() => {
        setError('');
        if (!params.id) return;
        getServer(params.id).catch((err) => setError(httpErrorToHuman(err)));
    }, [params.id, getServer, clearServerState]);

    // Subdomain check
    useEffect(() => {
        const checkSubdomain = async () => {
            if (uuid) {
                try {
                    const data = await getSubdomainInfo(uuid);
                    setSubdomainSupported(data.supported);
                } catch {
                    setSubdomainSupported(false);
                }
            }
        };
        checkSubdomain();
    }, [uuid]);

    return (
        <Fragment>
            {!uuid || !id ? (
                error ? <ServerError title="Something went wrong" message={error} /> : null
            ) : (
                <>
                    <MobileTopBar onMenuToggle={toggleMobileMenu} onTriggerLogout={onTriggerLogout} onSelectAdminPanel={onSelectManageServer} rootAdmin={rootAdmin} />
                    <ServerMobileMenu isVisible={isMobileMenuVisible} onClose={closeMobileMenu} serverId={id} subdomainSupported={subdomainSupported} />
                    <div className="flex flex-row w-full lg:pt-0 pt-16">
                        <MainSidebar className="hidden lg:flex lg:relative lg:shrink-0 w-[300px] flex flex-col h-full">
                            {/* Logo */}
                            <div className="flex flex-row items-center justify-between">
                                <NavLink to="/" className="flex shrink-0 items-center gap-3 py-2">
                                    <img src={obsidianLogo} alt="ObsidianHost" className="h-12 w-12 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                    <span className="text-xl font-extrabold tracking-tight text-white">Obsidian<span className="text-purple-400">Host</span></span>
                                </NavLink>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-10 h-10 flex items-center justify-center rounded-md text-white hover:bg-white/10">
                                            <Ellipsis width={26} height={22} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {rootAdmin && <DropdownMenuItem onSelect={onSelectManageServer}>Manage Server</DropdownMenuItem>}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={onTriggerLogout}>Log Out</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Nav Items */}
                            <ul className="pyro-subnav-routes-wrapper flex-grow overflow-y-auto mt-8">
                                {getServerNavRoutes().map((route) => (
                                    <ServerSidebarNavItem key={route.path || 'home'} route={route} serverId={id} />
                                ))}
                            </ul>

                            {/* Server Name */}
                            <StatBlock title="server" className="p-4 bg-[#111] border border-white/10 rounded-2xl mt-4">
                                {serverName}
                            </StatBlock>
                        </MainSidebar>

                        <MainWrapper className="w-full">
                            <CommandMenu />
                            <InstallListener />
                            <TransferListener />
                            <WebsocketHandler />
                            <main className="relative inset-[1px] w-full h-full overflow-y-auto overflow-x-hidden rounded-md bg-[#08080875]">
                                {inConflictState ? <ConflictStateRenderer /> : (
                                    <ErrorBoundary>
                                        <Routes location={location}>
                                            {routes.server.map(({ route, permission, component: Component }) => (
                                                <Route
                                                    key={route}
                                                    path={route}
                                                    element={
                                                        <PermissionRoute permission={permission}>
                                                            <Suspense fallback={null}>
                                                                <Component />
                                                            </Suspense>
                                                        </PermissionRoute>
                                                    }
                                                />
                                            ))}
                                            <Route path="*" element={<NotFound />} />
                                        </Routes>
                                    </ErrorBoundary>
                                )}
                            </main>
                        </MainWrapper>
                    </div>
                </>
            )}
        </Fragment>
    );
};

export default ServerRouter;
