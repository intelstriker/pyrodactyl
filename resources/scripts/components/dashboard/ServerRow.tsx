import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { bytesToString } from '@/lib/formatters';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';

const ObsidianServerCard = styled.div<{ $status?: ServerPowerState }>`
    position: relative;
    padding: 1.25rem 1.75rem;
    border-radius: 20px;
    border: 1px solid rgba(168, 85, 247, 0.25);
    background: 
        radial-gradient(ellipse at top right, rgba(168,85,247,0.22) 0%, transparent 70%),
        linear-gradient(135deg, #1a1033 0%, #120a24 100%);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
    overflow: hidden;
    cursor: pointer;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
            135deg,
            rgba(168,85,247,0.08) 0px,
            transparent 2px,
            transparent 30px
        );
        pointer-events: none;
    }

    &::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 80%;
        height: 80%;
        background: radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%);
        animation: orb 15s ease-in-out infinite;
        opacity: 0.7;
    }

    @keyframes orb {
        0%, 100% { transform: translate(20%, 20%); }
        50% { transform: translate(-20%, -20%); }
    }

    &:hover {
        transform: translateY(-6px) scale(1.02);
        border-color: rgba(168, 85, 247, 0.6);
        box-shadow: 0 25px 50px rgba(168, 85, 247, 0.3);
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
                console.error(e);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [server.uuid]);

    const status = stats?.status || 'offline';
    const cpu = stats?.cpu || 0;
    const memory = stats?.memory || 0;
    const disk = stats?.disk || 0;

    return (
        <Link to={`/server/${server.uuid}`} className="block">
            <ObsidianServerCard $status={status}>
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${status === 'running' ? 'bg-green-500' : 'bg-red-500'} ring-2 ring-offset-2 ring-offset-[#120a24] ${status === 'running' ? 'ring-green-500/50' : 'ring-red-500/50'}`} />
                    
                    <div>
                        <div className="font-semibold text-lg text-white">{server.name}</div>
                        <div className="text-xs text-zinc-400 font-mono">{server.uuid.slice(0, 8)}</div>
                    </div>
                </div>

                <div className="flex items-center gap-8 text-sm">
                    <div>
                        <div className="text-zinc-400 text-xs">CPU</div>
                        <div className="font-medium text-white">{cpu.toFixed(1)}%</div>
                    </div>
                    <div>
                        <div className="text-zinc-400 text-xs">RAM</div>
                        <div className="font-medium text-white">{bytesToString(memory)}</div>
                    </div>
                    <div>
                        <div className="text-zinc-400 text-xs">DISK</div>
                        <div className="font-medium text-white">{bytesToString(disk)}</div>
                    </div>
                </div>
            </ObsidianServerCard>
        </Link>
    );
};

export default ServerRow;
