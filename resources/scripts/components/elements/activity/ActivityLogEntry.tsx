import { ActivityLog } from '@definitions/user';
import { TerminalLine } from '@gravity-ui/icons';
// FIXME: add icons back
import clsx from 'clsx';
// FIXME: replace with radix tooltip
// import Tooltip from '@/components/elements/tooltip/Tooltip';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import ActivityLogMetaButton from '@/components/elements/activity/ActivityLogMetaButton';

import { formatObjectToIdentString } from '@/lib/objects';

import useLocationHash from '@/plugins/useLocationHash';

import style from './style.module.css';

interface Props {
    activity: ActivityLog;
    children?: React.ReactNode;
}

// Simple in-memory cache shared across all IP displays in the session
const ipGeoCache: Record<string, { code?: string; name?: string } | null> = {};

function isPrivateIP(ip: string): boolean {
    if (!ip) return false;
    const trimmed = ip.trim().toLowerCase();
    if (trimmed === '127.0.0.1' || trimmed === '::1' || trimmed === 'localhost') return true;
    // IPv4 private ranges
    const ipv4Match = trimmed.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
        const a = parseInt(ipv4Match[1], 10);
        const b = parseInt(ipv4Match[2], 10);
        if (a === 10) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        if (a === 169 && b === 254) return true;
        if (a === 0 || a === 127) return true;
    }
    // IPv6 local / unique local
    if (trimmed.includes(':')) {
        if (trimmed === '::1' || trimmed.startsWith('fc') || trimmed.startsWith('fd') || trimmed.startsWith('fe80')) return true;
    }
    return false;
}

function getFlagEmoji(countryCode: string): string | null {
    if (!countryCode || countryCode.length !== 2 || countryCode.toUpperCase() === 'LAN') return null;
    try {
        const cc = countryCode.toUpperCase();
        // Regional Indicator Symbols (flag emojis) constructed from code points - pure SVG under the hood, no external assets
        return String.fromCodePoint(...cc.split('').map((c) => 127397 + c.charCodeAt(0)));
    } catch {
        return null;
    }
}

// Self-contained IP + country flag display. Hides the raw IP text until hover. Fetches country using public APIs (best effort, cached).
const IpDisplay = ({ ip }: { ip: string }) => {
    const [geo, setGeo] = useState<{ code?: string; name?: string } | null | undefined>(undefined);

    useEffect(() => {
        if (!ip) return;

        // Use cached result immediately if present
        if (ipGeoCache[ip] !== undefined) {
            setGeo(ipGeoCache[ip]);
            return;
        }

        const controller = new AbortController();

        const doLookup = async () => {
            if (isPrivateIP(ip)) {
                const localGeo = { code: 'LAN', name: 'Local Network' };
                ipGeoCache[ip] = localGeo;
                setGeo(localGeo);
                return;
            }

            // Primary lookup (returns country_code + country_name)
            try {
                const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && !data.error && data.country_code) {
                        const val = { code: data.country_code, name: data.country_name || data.country_code };
                        ipGeoCache[ip] = val;
                        setGeo(val);
                        return;
                    }
                }
            } catch {
                // ignore, try fallback
            }

            // Fallback (lightweight, just code)
            try {
                const res2 = await fetch(`https://api.country.is/${encodeURIComponent(ip)}`, {
                    signal: controller.signal,
                });
                if (res2.ok) {
                    const data2 = await res2.json();
                    if (data2 && data2.country) {
                        const val = { code: data2.country };
                        ipGeoCache[ip] = val;
                        setGeo(val);
                        return;
                    }
                }
            } catch {
                // ignore
            }

            ipGeoCache[ip] = null;
            setGeo(null);
        };

        doLookup();
        return () => controller.abort();
    }, [ip]);

    const flag = geo?.code ? getFlagEmoji(geo.code) : null;
    const titleText = geo?.name ? `${ip} • ${geo.name}` : ip;

    // Theme-fitting pill: subtle zinc glass, hover lift, IP text expands in only on hover
    return (
        <span
            className="group/ip inline-flex items-center gap-1.5 font-mono bg-zinc-800/30 hover:bg-zinc-700/40 active:bg-zinc-700/30 px-1.5 py-0.5 rounded text-[11px] text-zinc-300 hover:text-zinc-100 transition-all duration-150 border border-transparent hover:border-white/10 select-none"
            title={titleText}
        >
            {flag ? (
                <span
                    className="text-[13px] leading-none mt-px"
                    style={{ filter: 'saturate(0.95) drop-shadow(0 1px 1px rgba(0,0,0,0.35))' }}
                    aria-label={geo?.name || geo?.code}
                >
                    {flag}
                </span>
            ) : (
                // Globe-ish SVG icon (in-code SVG) used while loading geo, on failure, or for local/private IPs
                <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={geo === undefined ? 'text-zinc-500 animate-pulse' : 'text-zinc-400'}
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10" />
                </svg>
            )}

            {/* IP address is hidden until hover over the pill. Fits the dark zinc theme. */}
            <span className="opacity-0 max-w-0 group-hover/ip:opacity-100 group-hover/ip:max-w-[14rem] transition-all duration-200 overflow-hidden whitespace-nowrap text-[11px] text-zinc-200">
                {ip}
            </span>
        </span>
    );
};

const ActivityLogEntry = ({ activity, children }: Props) => {
    const { pathTo } = useLocationHash();
    const actor = activity.relationships.actor;

    return (
        <div className='flex items-center py-2 px-3 border-b border-zinc-800/30 last:border-0 group hover:bg-zinc-800/20 transition-colors duration-150'>
            {/* Compact Avatar */}
            <div className='flex-shrink-0 w-8 h-8 rounded-full bg-zinc-600 overflow-hidden mr-3'>
                {actor?.image ? (
                    <img src={actor.image} alt={actor.username || 'System'} className='w-full h-full object-cover' />
                ) : (
                    <div className='w-full h-full flex items-center justify-center text-zinc-300 text-xs font-semibold'>
                        {(actor?.username || 'S').charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Main Content - Compact Layout */}
            <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 text-sm'>
                    <span className='font-medium text-zinc-100 truncate'>{actor?.username || 'System'}</span>
                    <span className='text-zinc-500'>•</span>
                    <Link
                        to={`#${pathTo({ event: activity.event })}`}
                        className='font-mono text-xs bg-zinc-800/50 text-zinc-300 px-2 py-1 rounded hover:bg-zinc-700/50 hover:text-brand transition-colors duration-150 truncate'
                    >
                        {activity.event}
                    </Link>

                    {/* Compact badges */}
                    <div className='flex items-center gap-1 ml-auto'>
                        {activity.isApi && (
                            <span className='text-xs bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1'>
                                <TerminalLine width={22} height={22} fill='currentColor' />
                                API
                            </span>
                        )}
                        {children}
                    </div>
                </div>

                {/* Compact metadata and timestamp */}
                <div className='flex items-center gap-3 mt-1 text-xs text-zinc-400'>
                    {activity.ip && <IpDisplay ip={activity.ip} />}
                    <span>{formatDistanceToNowStrict(activity.timestamp, { addSuffix: true })}</span>

                    {/* Inline properties for compact view */}
                    {!activity.hasAdditionalMetadata &&
                        activity.properties &&
                        Object.keys(activity.properties).length > 0 && (
                            <span className='text-zinc-500 truncate max-w-xs'>
                                {formatObjectToIdentString(activity.properties)}
                            </span>
                        )}
                </div>
            </div>

            {/* Metadata button */}
            {activity.hasAdditionalMetadata && (
                <div className='flex-shrink-0 ml-2'>
                    <ActivityLogMetaButton meta={activity.properties} />
                </div>
            )}
        </div>
    );
};

export default ActivityLogEntry;

