import { Database, Person, Server, ArrowDownToLine, CpuChip, HardDrive, MemoryCard } from '@gravity-ui/icons';
import { useEffect, useState } from 'react';

import { bytesToString, mbToBytes } from '@/lib/formatters';

import getServerSubusers from '@/api/server/users/getServerSubusers';

import { ServerContext } from '@/state/server';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    accent?: 'default' | 'brand';
}

const StatCard = ({ icon, label, value, sub, accent = 'default' }: StatCardProps) => (
    <div
        className={`flex flex-col gap-3 rounded-xl p-5 border transition-colors ${
            accent === 'brand'
                ? 'bg-brand/10 border-brand/20'
                : 'bg-[#ffffff06] border-[#ffffff0f] hover:border-[#ffffff18]'
        }`}
    >
        <div className='flex items-center gap-2 text-zinc-400'>
            <span className='w-4 h-4'>{icon}</span>
            <span className='text-xs font-medium uppercase tracking-wider'>{label}</span>
        </div>
        <div>
            <p className='text-2xl font-extrabold tracking-tight text-white'>{value}</p>
            {sub && <p className='text-xs text-zinc-500 mt-0.5'>{sub}</p>}
        </div>
    </div>
);

const RenameServerBox = () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const subusers = ServerContext.useStoreState((state) => state.subusers.data);
    const [subuserCount, setSubuserCount] = useState<number>(subusers.length);

    const { limits, featureLimits } = server;

    // Try to get fresh subuser count
    useEffect(() => {
        getServerSubusers(server.uuid)
            .then((users) => setSubuserCount(users.length))
            .catch(() => setSubuserCount(subusers.length));
    }, [server.uuid]);

    const formatMemory = (mb: number) =>
        mb === 0 ? 'Unlimited' : bytesToString(mbToBytes(mb));
    const formatDisk = (mb: number) =>
        mb === 0 ? 'Unlimited' : bytesToString(mbToBytes(mb));
    const formatCpu = (cpu: number) =>
        cpu === 0 ? 'Unlimited' : `${cpu}%`;
    const formatBackups = (n: number | null) =>
        n === null ? 'Unlimited' : n === 0 ? 'Disabled' : String(n);
    const formatDatabases = (n: number) =>
        n === 0 ? 'Disabled' : String(n);

    return (
        <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-6 shadow-sm'>
            {/* Header */}
            <div className='flex items-start gap-4 mb-8'>
                <div className='w-12 h-12 rounded-xl bg-[#ffffff0d] border border-[#ffffff12] flex items-center justify-center shrink-0'>
                    <Server width={20} height={20} className='text-zinc-300' />
                </div>
                <div className='min-w-0'>
                    <h3 className='text-xl font-extrabold tracking-tight truncate'>{server.name}</h3>
                    {server.description ? (
                        <p className='text-sm text-zinc-400 mt-0.5 line-clamp-2'>{server.description}</p>
                    ) : (
                        <p className='text-sm text-zinc-600 mt-0.5 italic'>No description set</p>
                    )}
                </div>
            </div>

            {/* Resources */}
            <p className='text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3'>Resources</p>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6'>
                <StatCard
                    icon={<svg viewBox='0 0 16 16' fill='currentColor' className='w-4 h-4'><path d='M8 1a1 1 0 0 1 1 1v.5h3.5a.5.5 0 0 1 0 1H13v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8h-.5a.5.5 0 0 1 0-1H6V2a1 1 0 0 1 1-1h1zm0 1H7v.5h2V2H8z'/></svg>}
                    label='Memory'
                    value={formatMemory(limits.memory)}
                    sub='RAM limit'
                />
                <StatCard
                    icon={<svg viewBox='0 0 16 16' fill='currentColor' className='w-4 h-4'><path d='M5 0a.5.5 0 0 1 .5.5V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2A2.5 2.5 0 0 1 14 4.5h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14a2.5 2.5 0 0 1-2.5 2.5v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14A2.5 2.5 0 0 1 2 11.5H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2A2.5 2.5 0 0 1 4.5 2V.5A.5.5 0 0 1 5 0z'/></svg>}
                    label='CPU'
                    value={formatCpu(limits.cpu)}
                    sub='CPU limit'
                />
                <StatCard
                    icon={<svg viewBox='0 0 16 16' fill='currentColor' className='w-4 h-4'><path d='M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v10.042a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.542V2.5zm1.5-.5a.5.5 0 0 0-.5.5v10.042a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V2.5a.5.5 0 0 0-.5-.5h-11zM2 13.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-8A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5v1A1.5 1.5 0 0 1 10.5 8h-5A1.5 1.5 0 0 1 4 6.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-5z'/></svg>}
                    label='Disk'
                    value={formatDisk(limits.disk)}
                    sub='Storage limit'
                />
            </div>

            {/* Feature Limits */}
            <p className='text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3'>Limits</p>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                <StatCard
                    icon={<ArrowDownToLine width={16} height={16} />}
                    label='Backups'
                    value={formatBackups(featureLimits.backups)}
                    sub={
                        featureLimits.backupStorageMb
                            ? `${bytesToString(mbToBytes(featureLimits.backupStorageMb))} storage`
                            : 'Unlimited storage'
                    }
                />
                <StatCard
                    icon={<Database width={16} height={16} />}
                    label='Databases'
                    value={formatDatabases(featureLimits.databases)}
                    sub='Max databases'
                />
                <StatCard
                    icon={<Person width={16} height={16} />}
                    label='Subusers'
                    value={String(subuserCount)}
                    sub='Active users'
                />
            </div>
        </div>
    );
};

export default RenameServerBox;
