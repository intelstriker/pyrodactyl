import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MessageBox from '@/components/MessageBox';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';
import styled from 'styled-components';

const ObsidianCard = styled.div<{ $hasAnimation?: boolean }>`
    background: #0a0612;
    border: 1px solid rgba(147, 51, 234, 0.3);
    border-radius: 22px;
    padding: 2rem;
    transition: all 320ms cubic-bezier(0.23, 1, 0.32, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 12px 30px -10px rgb(0 0 0 / 0.7);

    /* Animated Obsidian Background */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: 
            radial-gradient(circle at 25% 35%, rgba(168, 85, 247, 0.18) 0%, transparent 60%),
            radial-gradient(circle at 75% 65%, rgba(192, 132, 252, 0.14) 0%, transparent 60%);
        animation: nebulaDrift 45s ease-in-out infinite alternate;
        z-index: 1;
        pointer-events: none;
    }

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: 
            linear-gradient(transparent, rgba(147, 51, 234, 0.06), transparent),
            repeating-linear-gradient(
                45deg,
                transparent,
                transparent 38px,
                rgba(192, 132, 252, 0.035) 38px,
                rgba(192, 132, 252, 0.035) 76px
            );
        animation: wavyFlow 36s linear infinite;
        z-index: 2;
        opacity: 0.7;
        mix-blend-mode: screen;
        pointer-events: none;
    }

    .geometric {
        position: absolute;
        inset: 0;
        background-image: 
            radial-gradient(circle, rgba(192, 132, 252, 0.4) 1px, transparent 1px),
            linear-gradient(transparent 50%, rgba(147, 51, 234, 0.07) 50%);
        background-size: 65px 65px;
        animation: triTravel 50s linear infinite;
        z-index: 3;
        opacity: 0.3;
        pointer-events: none;
    }

    &:hover {
        border-color: rgba(192, 132, 252, 0.6);
        box-shadow: 
            0 25px 40px -12px rgb(147 51 234 / 0.45),
            inset 0 0 95px rgba(192, 132, 252, 0.2);
        transform: translateY(-3px);
    }

    ${props => props.$hasAnimation && `
        .geometric { opacity: 0.35; }
    `}
`;

const AccountOverviewContainer = () => {
    const { state } = useLocation();

    useEffect(() => {
        // Clear any flashes on mount
    }, []);

    return (
        <PageContentBlock title="Account Overview">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {state?.twoFactorRedirect && (
                    <MessageBox title="2-Factor Required" type="error" className="mb-8">
                        Your account must have two-factor authentication enabled in order to continue.
                    </MessageBox>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Account Information */}
                    <ObsidianCard className="lg:col-span-5" $hasAnimation>
                        <ContentBox title="Account Information" className="relative z-10">
                            <UpdateEmailAddressForm />
                        </ContentBox>
                        <div className="geometric" />
                    </ObsidianCard>

                    {/* Security Settings */}
                    <div className="lg:col-span-7 space-y-8">
                        <ObsidianCard $hasAnimation>
                            <ContentBox title="Account Password" className="relative z-10">
                                <UpdatePasswordForm />
                            </ContentBox>
                            <div className="geometric" />
                        </ObsidianCard>

                        <ObsidianCard $hasAnimation>
                            <ContentBox title="Multi-Factor Authentication" className="relative z-10">
                                <ConfigureTwoFactorForm />
                            </ContentBox>
                            <div className="geometric" />
                        </ObsidianCard>
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};

export default AccountOverviewContainer;
