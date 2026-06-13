import { useEffect } from 'react';
import { Person, DocumentText, ShieldCheck } from '@gravity-ui/icons';
import ContentBox from '@/components/elements/ContentBox';
import { useStoreState } from 'easy-peasy';
import { useFlashKey } from '@/plugins/useFlash';
import styled from 'styled-components';

const AnimatedCard = styled.div`
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Account Information */}
            <AnimatedCard className="col-span-1 md:col-span-2 lg:col-span-1">
                <ContentBox title="Account Information" icon={<Person size={20} />}>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-neutral-400">Username</p>
                            <p className="font-medium text-lg">{user.username}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-400">Email</p>
                            <p className="font-medium break-all">{user.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-400">Registered</p>
                            <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </ContentBox>
            </AnimatedCard>

            {/* Quick Stats */}
            <AnimatedCard>
                <ContentBox title="Quick Stats" icon={<ShieldCheck size={20} />}>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-3xl font-bold text-cyan-400">12</div>
                            <div className="text-sm text-neutral-400">Servers</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-emerald-400">3</div>
                            <div className="text-sm text-neutral-400">Backups</div>
                        </div>
                    </div>
                </ContentBox>
            </AnimatedCard>

            {/* Recent Activity */}
            <AnimatedCard className="lg:col-span-2">
                <ContentBox title="Recent Activity" icon={<DocumentText size={20} />}>
                    <div className="text-neutral-400 text-sm italic">
                        No recent activity. Your account is looking clean!
                    </div>
                </ContentBox>
            </AnimatedCard>
        </div>
    );
}
