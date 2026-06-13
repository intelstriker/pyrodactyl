import { useEffect } from 'react';
import { Person, FileText, ShieldCheck } from '@gravity-ui/icons';
import ContentBox from '@/components/elements/ContentBox';
import { useStoreState } from 'easy-peasy';
import { useFlashKey } from '@/plugins/useFlash';
import styled from 'styled-components';

const AnimatedCard = styled.div`
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3);
  }
`;

export default function AccountOverviewContainer() {
    const user = useStoreState((state) => state.user.data);
    const { clearFlashes } = useFlashKey('account:overview');

    useEffect(() => {
        clearFlashes();
    }, [clearFlashes]);

    if (!user) return null;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-8">Account Overview</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Account Info */}
                <AnimatedCard className="lg:col-span-5 bg-[#111827] border border-white/10 rounded-3xl p-8">
                    <ContentBox title="Account Information" icon={<Person size={28} className="text-purple-400" />}>
                        <div className="space-y-6 text-white">
                            <div>
                                <p className="text-neutral-400">Username</p>
                                <p className="text-3xl font-semibold mt-1">{user.username}</p>
                            </div>
                            <div>
                                <p className="text-neutral-400">Email</p>
                                <p className="font-medium break-all">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-neutral-400">Member Since</p>
                                <p>{new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </ContentBox>
                </AnimatedCard>

                {/* Stats & Activity */}
                <div className="lg:col-span-7 space-y-6">
                    <AnimatedCard className="bg-[#111827] border border-white/10 rounded-3xl p-8">
                        <ContentBox title="Quick Stats" icon={<ShieldCheck size={28} className="text-emerald-400" />}>
                            <div className="grid grid-cols-2 gap-8 text-center">
                                <div>
                                    <div className="text-5xl font-bold text-cyan-400">12</div>
                                    <div className="text-neutral-400 mt-2">Servers</div>
                                </div>
                                <div>
                                    <div className="text-5xl font-bold text-purple-400">3</div>
                                    <div className="text-neutral-400 mt-2">Backups</div>
                                </div>
                            </div>
                        </ContentBox>
                    </AnimatedCard>

                    <AnimatedCard className="bg-[#111827] border border-white/10 rounded-3xl p-8">
                        <ContentBox title="Recent Activity" icon={<FileText size={28} className="text-purple-400" />}>
                            <div className="text-neutral-400 italic py-12 text-center text-lg">
                                No recent activity. Your account is looking clean!
                            </div>
                        </ContentBox>
                    </AnimatedCard>
                </div>
            </div>
        </div>
    );
}
