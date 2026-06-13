import { forwardRef, useEffect, useState } from 'react';
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

const ServerSidebarNavItem = forwardRef<HTMLAnchorElement, ServerSidebarNavItemProps>(
    ({ route, serverId, onClick }, ref) => {
        const { icon: Icon, name, path, permission, featureLimit, end } = route;

        const featureLimits = ServerContext.useStoreState((state) => state.server.data?.featureLimits);
        const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);

        const [subdomainSupported, setSubdomainSupported] = useState(false);

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
                        `flex flex-row items-center gap-[8px] py-[16px] px-0 font-semibold text-[14px] min-h-[56px] transition-all duration-200 select-none
                         ${isActive
                            ? 'text-[#d8b4fe]'
                            : 'text-[rgba(216,180,254,0.5)] hover:text-[rgba(216,180,254,0.9)]'
                         }`
                    }
                >
                    {Icon && (
                        <Icon
                            width={22}
                            height={22}
                            fill='currentColor'
                        />
                    )}
                    <p>{name}</p>
                </NavLink>
            </Can>
        );
    },
);

ServerSidebarNavItem.displayName = 'ServerSidebarNavItem';

export default ServerSidebarNavItem;
