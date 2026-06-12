import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { Link } from 'react-router-dom';
import { object, string } from 'yup';

import obsidianLogo from '@/assets/images/obsidianhostlogo.svg';

import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import Field from '@/components/elements/Field';

import CaptchaManager from '@/lib/captcha';

import http from '@/api/http';

import useFlash from '@/plugins/useFlash';

interface Values {
    email: string;
}

function ForgotPasswordContainer() {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();

    const onSubmit = (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        let requestData: any = values;
        if (CaptchaManager.isEnabled()) {
            const captchaResponse = getCaptchaResponse();
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();

            if (fieldName) {
                if (captchaResponse) {
                    requestData = { ...values, [fieldName]: captchaResponse };
                } else {
                    clearAndAddHttpError({ error: new Error('Please complete the captcha verification.') });
                    setSubmitting(false);
                    return;
                }
            }
        }

        http.post('/auth/password', requestData)
            .then(() => {
                resetForm();
                addFlash({
                    type: 'success',
                    title: 'Success',
                    message: 'A password reset link will be sent to this email if it exists in our system.',
                });
            })
            .catch((error: any) => {
                console.error(error);
                clearAndAddHttpError({ error });
            })
            .then(() => setSubmitting(false));
    };

    return (
        <div className='flex min-h-screen w-full bg-[#0a0a0f] text-white overflow-hidden'>
            {/* LEFT PANEL — Animated Obsidian / Minecraft scene */}
            <div className='hidden lg:flex relative w-1/2 items-center justify-center overflow-hidden border-r border-purple-900/40'>
                <div className='absolute inset-0 bg-gradient-to-br from-[#120016] via-[#1a0a2e] to-[#05010a]' />

                <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full bg-purple-600/30 blur-[100px] animate-pulse-slow' />
                <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[320px] rounded-[40%] bg-fuchsia-500/40 blur-3xl animate-pulse-slower' />

                <div className='absolute inset-0'>
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className='absolute rounded-md bg-gradient-to-br from-[#2b0a3d] to-[#0d0014] border border-purple-500/30 shadow-[0_0_18px_rgba(168,85,247,0.35)] animate-float'
                            style={{
                                width: `${28 + (i % 4) * 14}px`,
                                height: `${28 + (i % 4) * 14}px`,
                                left: `${(i * 11 + 5) % 90}%`,
                                top: `${(i * 17 + 8) % 85}%`,
                                animationDelay: `${i * 0.9}s`,
                                animationDuration: `${10 + (i % 5) * 2}s`,
                            }}
                        />
                    ))}
                </div>

                <div className='absolute inset-0'>
                    {[...Array(24)].map((_, i) => (
                        <span
                            key={`p-${i}`}
                            className='absolute rounded-full bg-purple-300/70 animate-spark'
                            style={{
                                width: `${2 + (i % 3)}px`,
                                height: `${2 + (i % 3)}px`,
                                left: `${(i * 7 + 3) % 100}%`,
                                top: `${(i * 13 + 10) % 100}%`,
                                animationDelay: `${(i % 12) * 0.5}s`,
                                animationDuration: `${6 + (i % 6)}s`,
                            }}
                        />
                    ))}
                </div>

                <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40' />

                <div className='relative z-10 flex flex-col items-center text-center px-10'>
                    <div className='mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-700/80 to-fuchsia-600/80 shadow-[0_0_50px_rgba(168,85,247,0.55)] rotate-3 animate-float-slow p-3'>
                        <img src={obsidianLogo} alt='ObsidianHost' className='h-full w-full object-contain drop-shadow-[0_0_12px_rgba(216,180,254,0.6)]' />
                    </div>
                    <h1 className='text-4xl font-extrabold tracking-tight'>
                        Obsidian<span className='text-purple-400'>Host</span>
                    </h1>
                    <p className='mt-3 max-w-sm text-sm text-zinc-400'>
                        Premium Minecraft server hosting — instant setup, blazing-fast NVMe performance, and a
                        rock-solid network forged for your community.
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL — Forgot password form */}
            <div className='relative flex w-full lg:w-1/2 items-center justify-center px-6 py-12 bg-[#0c0c12]'>
                <div className='pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] bg-[size:24px_24px]' />

                <div className='relative z-10 w-full max-w-sm'>
                    <div className='mb-8 flex items-center gap-3 lg:hidden'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-700 to-fuchsia-600 font-black'>
                            O
                        </div>
                        <span className='text-xl font-extrabold'>
                            Obsidian<span className='text-purple-400'>Host</span>
                        </span>
                    </div>

                    <h2 className='text-2xl font-extrabold'>Forgot your password?</h2>
                    <p className='mt-1 mb-8 text-sm text-zinc-500'>
                        Enter your email and we&apos;ll send you a link to reset it.
                    </p>

                    <Formik
                        onSubmit={onSubmit}
                        initialValues={{ email: '' }}
                        validationSchema={object().shape({
                            email: string().email('A valid email must be provided.').required('A valid email must be provided.'),
                        })}
                    >
                        {({ isSubmitting }) => (
                            <div className='flex flex-col gap-5'>
                                <Field id='email' type='email' label='Email' name='email' disabled={isSubmitting} />

                                <Captcha
                                    className='mt-1'
                                    onError={(error) => {
                                        console.error('Captcha error:', error);
                                        clearAndAddHttpError({
                                            error: new Error('Captcha verification failed. Please try again.'),
                                        });
                                    }}
                                />

                                <Button
                                    className='relative mt-2 w-full rounded-full border-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 py-2 text-sm font-bold capitalize shadow-[0_0_24px_rgba(168,85,247,0.35)] outline-hidden ring-0 hover:cursor-pointer hover:from-purple-500 hover:to-fuchsia-500'
                                    type='submit'
                                    size='xlarge'
                                    isLoading={isSubmitting}
                                    disabled={isSubmitting}
                                >
                                    Send Email
                                </Button>

                                <Link
                                    to='/auth/login'
                                    className='text-center text-xs tracking-wide text-zinc-500 no-underline hover:text-purple-400'
                                >
                                    Back to Login
                                </Link>
                            </div>
                        )}
                    </Formik>

                    <p className='mt-8 text-center text-xs text-zinc-600'>&copy; ObsidianHost 2026</p>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-24px) rotate(8deg); }
                }
                .animate-float { animation: float 12s ease-in-out infinite; }

                @keyframes spark {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    20% { opacity: 0.9; }
                    100% { transform: translateY(-120px) scale(0.4); opacity: 0; }
                }
                .animate-spark { animation: spark linear infinite; }

                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.45; transform: translate(-50%, -50%) scale(1.1); }
                }
                .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }

                @keyframes pulse-slower {
                    0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                    50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.15) rotate(8deg); }
                }
                .animate-pulse-slower { animation: pulse-slower 9s ease-in-out infinite; }

                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) rotate(3deg); }
                    50% { transform: translateY(-10px) rotate(-3deg); }
                }
                .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
            `}</style>
        </div>
    );
}

export default ForgotPasswordContainer;
