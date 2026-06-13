import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MessageBox from '@/components/MessageBox';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';
import styled from 'styled-components';

const AnimatedCard = styled.div`
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3);
  }
`;

const AccountOverviewContainer = () => {
    const { state } = useLocation();

    useEffect(() => {
        // Clear any flashes on mount
    }, []);

    return (
        <PageContentBlock title="Account Overview">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {state?.twoFactorRedirect && (
                    <MessageBox title="2-Factor Required" type="error" className="mb-6">
                        Your account must have two-factor authentication enabled in order to continue.
                    </MessageBox>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Account Information */}
                    <AnimatedCard className="lg:col-span-5 bg-[#111827] border border-white/10 rounded-3xl p-8">
                        <ContentBox title="Account Information">
                            <UpdateEmailAddressForm />
                        </ContentBox>
                    </AnimatedCard>

                    {/* Security Settings */}
                    <div className="lg:col-span-7 space-y-6">
                        <AnimatedCard className="bg-[#111827] border border-white/10 rounded-3xl p-8">
                            <ContentBox title="Account Password">
                                <UpdatePasswordForm />
                            </ContentBox>
                        </AnimatedCard>

                        <AnimatedCard className="bg-[#111827] border border-white/10 rounded-3xl p-8">
                            <ContentBox title="Multi-Factor Authentication">
                                <ConfigureTwoFactorForm />
                            </ContentBox>
                        </AnimatedCard>
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};

export default AccountOverviewContainer;
