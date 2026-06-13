import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { bytesToString } from '@/lib/formatters';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';

const ServerCard = styled.div<{ $status: ServerPowerState }>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 2rem;
    margin-bottom: 12px;
    border-radius: 16px;
    background: 
        linear-gradient(145deg, #1a1033 0%, #120a24 100%);
    border: 1px solid rgba(168, 85, 247, 0.3);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;

    /* Diagonal stripe pattern */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
            135deg,
            transparent,
            transparent 8px,
            rgba(168, 85, 247, 0.12) 8px,
            rgba(168, 85, 247, 0.12) 16px
        );
        pointer-events: none;
    }

    &:hover {
        transform: translateY(-4px);
        border-color: rgba(168, 85, 247, 0.6);
        box-shadow: 0 20px 40px rgba(168, 85, 247, 0.25);
    }
`;

const ServerRow = ({ server }: { server: Server }) => {
    const [stats, setStats] = useState<ServerStats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getServerResourceUsage(server.uuid);
                setStats(data);
            } catch (e) {
                console.error('Failed to fetch stats:', e);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 20000); // Update every 20s
        return () => clearInterval(interval);
    }, [server.uuid]);

    const status = stats?.status || 'offline';
    const cpu = stats?.cpu || 0;
    const memory = stats?.memory || 0;
    const disk = stats?.disk || 0;

    const shortId = server.uuid.substring(0, 8);

    return (
        <Link to={`/server/${server.uuid}`} className="block">
            <ServerCard $status={status}>
                <div className="flex items-center gap-4">
                    {/* Status Dot */}
                    <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-[#120a24]
                        ${status === 'running' ? 'bg-emerald-500 ring-emerald-500/50' : 'bg-red-500 ring-red-500/50'}`} 
                    />

                    <div>
                        <div className="text-white font-semibold text-xl tracking-tight">
                            {server.name}
                        </div>
                        <div className="text-zinc-400 font-mono text-sm">
                            {shortId}
                        </div>
                    </div>
                </div>

                {/* Resources Section */}
                <div className="flex items-center gap-10 text-sm">
                    <div className="text-center">
                        <div className="text-purple-400 text-xs tracking-widest">CPU</div>
                        <div className="font-medium text-white">{cpu.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                        <div className="text-purple-400 text-xs tracking-widest">RAM</div>
                        <div className="font-medium text-white">{bytesToString(memory)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-purple-400 text-xs tracking-widest">DISK</div>
                        <div className="font-medium text-white">{bytesToString(disk)}</div>
                    </div>
                </div>
            </ServerCard>
        </Link>
    );
};

export default ServerRow;
