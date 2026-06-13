import { useEffect } from 'react';
import { User, FileText, Shield } from '@gravity-ui/icons';
import ContentBox from '@/components/elements/ContentBox';
import { useStoreState } from 'easy-peasy';
import { useFlashKey } from '@/plugins/useFlash';
import tw from 'twin.macro';
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
        <div css={tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
            {/* Account Information */}
            <AnimatedCard css={tw`col-span-1 md:col-span-2 lg:col-span-1`}>
                <ContentBox title="Account Information" icon={<User size={20} />}>
                    <div css={tw`space-y-4`}>
                        <div>
                            <p css={tw`text-sm text-neutral-400`}>Username</p>
                            <p css={tw`font-medium text-lg`}>{user.username}</p>
                        </div>
                        <div>
                            <p css={tw`text-sm text-neutral-400`}>Email</p>
                            <p css={tw`font-medium break-all`}>{user.email}</p>
                        </div>
                        <div>
                            <p css={tw`text-sm text-neutral-400`}>Registered</p>
                            <p css={tw`font-medium`}>{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </ContentBox>
            </AnimatedCard>

            {/* Quick Stats */}
            <AnimatedCard>
                <ContentBox title="Quick Stats" icon={<Shield size={20} />}>
                    <div css={tw`grid grid-cols-2 gap-4 text-center`}>
                        <div>
                            <div css={tw`text-3xl font-bold text-cyan-400`}>12</div>
                            <div css={tw`text-sm text-neutral-400`}>Servers</div>
                        </div>
                        <div>
                            <div css={tw`text-3xl font-bold text-emerald-400`}>3</div>
                            <div css={tw`text-sm text-neutral-400`}>Backups</div>
                        </div>
                    </div>
                </ContentBox>
            </AnimatedCard>

            {/* Recent Activity */}
            <AnimatedCard css={tw`lg:col-span-2`}>
                <ContentBox title="Recent Activity" icon={<FileText size={20} />}>
                    <div css={tw`text-neutral-400 text-sm italic`}>
                        No recent activity. Your account is looking clean!
                    </div>
                </ContentBox>
            </AnimatedCard>
        </div>
    );
}
