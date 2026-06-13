import { forwardRef } from 'react';
import { NavLink } from 'react-router-dom';
import type { FeatureLimitKey, ServerRouteDefinition } from '@/routers/routes';
import Can from '@/components/elements/Can';
import { getSubdomainInfo } from '@/api/server/network/subdomain';
import { ServerContext } from '@/state/server';

interface ServerSidebarNavItemProps {
    route: ServerRouteDefinition;
    serverId: string;
    onClick?: () => void;
}

/**
 * Enhanced Server Sidebar Navigation Item - ObsidianHost Theme
 */
const ServerSidebarNavItem = forwardRef<HTMLAnchorElement, ServerSidebarNavItemProps>(
    ({ route, serverId, onClick }, ref) => {
        const { icon: Icon, name, path, permission, featureLimit, end } = route;

        const featureLimits = ServerContext.useStoreState((state) => state.server.data?.featureLimits);
        const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);

        const [subdomainSupported, setSubdomainSupported] = useState(false);

        // Subdomain check for Network feature
        useEffect(() => {
            if (featureLimit !== 'network' || !uuid) return;

            const checkSubdomainSupport = async () => {
                try {
                    const data = await getSubdomainInfo(uuid);
                    setSubdomainSupported(data.supported);
                } catch {
                    setSubdomainSupported(false);
                }
            };

            checkSubdomainSupport();
        }, [featureLimit, uuid]);

        const isVisible = (): boolean => {
            if (!featureLimit) return true;
            if (featureLimits?.[featureLimit] === null) return true;

            if (featureLimit === 'network') {
                if (featureLimits?.allocations === null) return true;
                const allocationLimit = featureLimits?.allocations ?? 0;
                return allocationLimit > 0 || subdomainSupported;
            }

            const limitValue = featureLimits?.[featureLimit as FeatureLimitKey] ?? 0;
            return limitValue !== 0;
        };

        if (!isVisible()) return null;

        const to = path ? `/server/${serverId}/${path}` : `/server/${serverId}`;

        return (
            <Can action={permission} matchAny>
                <NavLink
                    ref={ref}
                    to={to}
                    end={end}
                    onClick={onClick}
                    className={({ isActive }) =>
                        `group flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 text-sm font-medium
                         ${isActive 
                            ? 'bg-purple-600/20 text-purple-200 border-l-4 border-purple-500' 
                            : 'hover:bg-white/5 text-gray-300 hover:text-white'
                         }`
                    }
                >
                    {Icon && (
                        <Icon 
                            className="w-5 h-5 transition-transform group-hover:scale-110" 
                            fill="currentColor" 
                        />
                    )}
                    <span>{name}</span>
                </NavLink>
            </Can>
        );
    }
);

ServerSidebarNavItem.displayName = 'ServerSidebarNavItem';

export default ServerSidebarNavItem;
