import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { object, ref, string } from 'yup';

import obsidianLogo from '@/assets/images/obsidianhostlogo.svg';

import Button from '@/components/elements/Button';
import Field from '@/components/elements/Field';

import performPasswordReset from '@/api/auth/performPasswordReset';

import useFlash from '@/plugins/useFlash';

interface Values {
    password: string;
    passwordConfirmation: string;
}

function ResetPasswordContainer() {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');

    const location = useLocation();
    const navigate = useNavigate();
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const emailParam = params.get('email');
        const pathToken = location.pathname.split('/').pop() ?? '';

        if (!emailParam || !pathToken) {
            navigate('/auth/login');
            return;
        }

        setEmail(decodeURIComponent(emailParam));
        setToken(pathToken);
    }, [location]);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        performPasswordReset(email, { ...values, token })
            .then(() => {
                window.location.href = '/';
            })
            .catch((error: any) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <div className='flex min-h-screen w-full bg-[#0a0a0f] text-white overflow-hidden'>
            {/* LEFT PANEL — Animated Obsidian / Minecraft scene */}
            <div className='hidden lg:flex relative w-1/2 items-center justify-center overflow-hidden border-r border-purple-900/40'>
                <div className='absolute inset-0 bg-gradient-to-br from-[#120016] via-[#1a0a2e] to-[#05010a]' />

                <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full bg-purple-600/30 blur-[100px] animate-pulse-slow' />
                <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[320px] rounded-[40%] bg-fuchsia-500/40 blur-3xl animate-pulse-slower' />
                <div className='absolute left-1/3 top-2/3 w-[200px] h-[200px] rounded-full bg-violet-700/30 blur-2xl animate-drift' />

                <div
                    className='absolute bottom-0 left-0 w-full h-1/2 opacity-20'
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(168,85,247,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.25) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        maskImage: 'linear-gradient(to top, black, transparent)',
                        WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
                        transform: 'perspective(400px) rotateX(55deg)',
                        transformOrigin: 'bottom',
                    }}
                />

                <svg className='absolute inset-0 w-full h-full opacity-40' viewBox='0 0 600 800' preserveAspectRatio='none'>
                    <path
                        d='M0,100 C100,150 150,250 250,260 C350,270 380,400 480,420 C540,430 580,500 600,520'
                        stroke='url(#veinGrad)'
                        strokeWidth='2'
                        fill='none'
                        className='animate-vein'
                    />
                    <path
                        d='M50,800 C120,700 200,680 260,600 C320,520 420,500 460,400 C500,300 560,260 600,200'
                        stroke='url(#veinGrad2)'
                        strokeWidth='1.5'
                        fill='none'
                        className='animate-vein-rev'
                    />
                    <defs>
                        <linearGradient id='veinGrad' x1='0' y1='0' x2='1' y2='1'>
                            <stop offset='0%' stopColor='#a855f7' stopOpacity='0' />
                            <stop offset='50%' stopColor='#d8b4fe' stopOpacity='0.9' />
                            <stop offset='100%' stopColor='#a855f7' stopOpacity='0' />
                        </linearGradient>
                        <linearGradient id='veinGrad2' x1='0' y1='1' x2='1' y2='0'>
                            <stop offset='0%' stopColor='#7e22ce' stopOpacity='0' />
                            <stop offset='50%' stopColor='#f0abfc' stopOpacity='0.7' />
                            <stop offset='100%' stopColor='#7e22ce' stopOpacity='0' />
                        </linearGradient>
                    </defs>
                </svg>

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
                        Lag-free Minecraft hosting carved from pure obsidian — instant deploys, NVMe-backed worlds,
                        and a network built to keep your community online.
                    </p>

                    <div className='mt-10 grid grid-cols-3 gap-4 text-xs font-semibold text-zinc-300'>
                        <a
                            href='https://obsidianhost.net/'
                            target='_blank'
                            rel='noreferrer'
                            className='group rounded-lg border border-purple-500/20 bg-white/5 px-4 py-3 no-underline backdrop-blur-sm transition hover:-translate-y-1 hover:border-purple-400/60 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                        >
                            <p className='text-lg font-bold text-purple-300 transition group-hover:text-purple-200'>🌐</p>
                            Website
                        </a>
                        <a
                            href='https://discord.gg/ubyvnNC4JP'
                            target='_blank'
                            rel='noreferrer'
                            className='group rounded-lg border border-purple-500/20 bg-white/5 px-4 py-3 no-underline backdrop-blur-sm transition hover:-translate-y-1 hover:border-purple-400/60 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                        >
                            <p className='text-lg font-bold text-purple-300 transition group-hover:text-purple-200'>💬</p>
                            Discord
                        </a>
                        <a
                            href='https://status.obsidianhost.net/'
                            target='_blank'
                            rel='noreferrer'
                            className='group rounded-lg border border-purple-500/20 bg-white/5 px-4 py-3 no-underline backdrop-blur-sm transition hover:-translate-y-1 hover:border-purple-400/60 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                        >
                            <p className='text-lg font-bold text-purple-300 transition group-hover:text-purple-200'>📈</p>
                            Status
                        </a>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL — Reset password form */}
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

                    <h2 className='text-2xl font-extrabold'>Reset your password</h2>
                    <p className='mt-1 mb-8 text-sm text-zinc-500'>
                        Resetting password for <span className='text-zinc-300'>{email}</span>
                    </p>

                    <Formik
                        onSubmit={onSubmit}
                        initialValues={{ password: '', passwordConfirmation: '' }}
                        validationSchema={object().shape({
                            password: string().min(8, 'Password must be at least 8 characters.').required('A new password is required.'),
                            passwordConfirmation: string()
                                .required('Your new password does not match.')
                                .oneOf([ref('password'), null], 'Your new password does not match.'),
                        })}
                    >
                        {({ isSubmitting }) => (
                            <div className='flex flex-col gap-5'>
                                <Field
                                    id='password'
                                    type='password'
                                    label='New Password'
                                    name='password'
                                    disabled={isSubmitting}
                                />

                                <Field
                                    id='passwordConfirmation'
                                    type='password'
                                    label='Confirm New Password'
                                    name='passwordConfirmation'
                                    disabled={isSubmitting}
                                />

                                <Button
                                    className='relative mt-2 w-full rounded-full border-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 py-2 text-sm font-bold capitalize shadow-[0_0_24px_rgba(168,85,247,0.35)] outline-hidden ring-0 hover:cursor-pointer hover:from-purple-500 hover:to-fuchsia-500'
                                    type='submit'
                                    size='xlarge'
                                    isLoading={isSubmitting}
                                    disabled={isSubmitting}
                                >
                                    Reset Password
                                </Button>
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

                @keyframes drift {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(40px, -30px) scale(1.2); }
                }
                .animate-drift { animation: drift 14s ease-in-out infinite; }

                @keyframes vein {
                    0%, 100% { stroke-dasharray: 0 1000; opacity: 0.2; }
                    50% { stroke-dasharray: 1000 0; opacity: 0.9; }
                }
                .animate-vein { stroke-dasharray: 600 600; animation: vein 8s ease-in-out infinite; }
                .animate-vein-rev { stroke-dasharray: 500 500; animation: vein 11s ease-in-out infinite reverse; }
            `}</style>
        </div>
    );
}

export default ResetPasswordContainer;
