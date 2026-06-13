import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { object, string } from 'yup';

import obsidianLogo from '@/assets/images/obsidianhostlogo.svg';

import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import Field from '@/components/elements/Field';

import CaptchaManager from '@/lib/captcha';

import login from '@/api/auth/login';

import useFlash from '@/plugins/useFlash';

interface Values {
    user: string;
    password: string;
}

function LoginContainer() {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const navigate = useNavigate();
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        clearFlashes();
    }, []);

    useEffect(() => {
        const panel = glowRef.current?.parentElement;
        if (!panel) return;

        const handleMove = (e: MouseEvent) => {
            const rect = panel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (glowRef.current) {
                glowRef.current.style.transform = `translate(${x - 200}px, ${y - 200}px)`;
                glowRef.current.style.opacity = '0.5';
            }
        };

        const handleLeave = () => {
            if (glowRef.current) glowRef.current.style.opacity = '0';
        };

        panel.addEventListener('mousemove', handleMove);
        panel.addEventListener('mouseleave', handleLeave);
        return () => {
            panel.removeEventListener('mousemove', handleMove);
            panel.removeEventListener('mouseleave', handleLeave);
        };
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        let loginData: any = values;
        if (CaptchaManager.isEnabled()) {
            const captchaResponse = getCaptchaResponse();
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();

            if (fieldName) {
                if (captchaResponse) {
                    loginData = { ...values, [fieldName]: captchaResponse };
                } else {
                    clearAndAddHttpError({ error: new Error('Please complete the captcha verification.') });
                    setSubmitting(false);
                    return;
                }
            }
        }

        login(loginData)
            .then((response) => {
                if (response.complete) {
                    window.location.href = response.intended || '/';
                    return;
                }
                navigate('/auth/login/checkpoint', { state: { token: response.confirmationToken } });
            })
            .catch((error: any) => {
                setSubmitting(false);

                if (error.code === 'InvalidCredentials') {
                    clearAndAddHttpError({ error: new Error('Invalid username or password. Please try again.') });
                } else if (error.code === 'DisplayException') {
                    clearAndAddHttpError({ error: new Error(error.detail || error.message) });
                } else {
                    clearAndAddHttpError({ error });
                }
            });
    };

    return (
        <div className='flex min-h-screen w-full bg-[#0a0a0f] text-white overflow-hidden'>
            {/* LEFT PANEL — Animated Obsidian / Minecraft scene */}
            <div className='hidden lg:flex relative w-1/2 items-center justify-center overflow-hidden border-r border-purple-900/40'>
                {/* Base gradient */}
                <div className='absolute inset-0 bg-gradient-to-br from-[#0d0014] via-[#1a0a2e] to-[#000005]' />

                {/* Reactive cursor glow */}
                <div
                    ref={glowRef}
                    className='pointer-events-none absolute left-0 top-0 h-[400px] w-[400px] rounded-full bg-purple-400/25 blur-[80px] opacity-0 transition-opacity duration-300 ease-out'
                    style={{ willChange: 'transform' }}
                />

                {/* Obsidian shard accents */}
                <svg
                    className='absolute -left-24 -top-16 w-[420px] h-[420px] opacity-60 animate-spin-slow'
                    viewBox='0 0 200 200'
                >
                    <polygon points='100,10 180,60 160,150 60,180 20,90' fill='url(#obsidianGrad)' />
                    <defs>
                        <linearGradient id='obsidianGrad' x1='0' y1='0' x2='1' y2='1'>
                            <stop offset='0%' stopColor='#3b0764' stopOpacity='0.5' />
                            <stop offset='100%' stopColor='#000000' stopOpacity='0.1' />
                        </linearGradient>
                    </defs>
                </svg>
                <svg
                    className='absolute right-[-100px] bottom-[-80px] w-[360px] h-[360px] opacity-50 animate-spin-slower'
                    viewBox='0 0 200 200'
                >
                    <polygon points='100,0 200,80 150,200 30,190 0,70' fill='url(#obsidianGrad2)' />
                    <defs>
                        <linearGradient id='obsidianGrad2' x1='0' y1='1' x2='1' y2='0'>
                            <stop offset='0%' stopColor='#a855f7' stopOpacity='0.35' />
                            <stop offset='100%' stopColor='#000000' stopOpacity='0.05' />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Animated portal glow */}
                <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full bg-purple-600/30 blur-[100px] animate-pulse-slow' />
                <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[320px] rounded-[40%] bg-fuchsia-500/40 blur-3xl animate-pulse-slower' />
                <div className='absolute left-1/3 top-2/3 w-[200px] h-[200px] rounded-full bg-violet-700/30 blur-2xl animate-drift' />

                {/* Minecraft-style block grid floor */}
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

                {/* Glowing ore veins */}
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

                {/* Floating obsidian blocks (CSS cubes) */}
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

                {/* Drifting particles (soul-fire / portal sparks) */}
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

                {/* Vignette */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40' />

                {/* Branding overlay */}
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
                            className='group flex flex-col items-center gap-2 rounded-lg border border-purple-500/20 bg-white/5 px-4 py-3 no-underline backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 hover:border-purple-400/60 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] active:scale-95 active:translate-y-0'
                        >
                            <svg viewBox='0 0 24 24' fill='none' className='h-6 w-6 text-purple-300 transition-transform duration-300 group-hover:text-purple-200 group-hover:rotate-[20deg] group-hover:scale-110'>
                                <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='1.6' />
                                <path d='M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18' stroke='currentColor' strokeWidth='1.6' />
                            </svg>
                            Website
                        </a>
                        <a
                            href='https://discord.gg/ubyvnNC4JP'
                            target='_blank'
                            rel='noreferrer'
                            className='group flex flex-col items-center gap-2 rounded-lg border border-purple-500/20 bg-white/5 px-4 py-3 no-underline backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 hover:border-purple-400/60 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] active:scale-95 active:translate-y-0'
                        >
                            <svg viewBox='0 0 24 24' fill='currentColor' className='h-6 w-6 text-purple-300 transition-transform duration-300 group-hover:text-purple-200 group-hover:-rotate-6 group-hover:scale-110'>
                                <path d='M20.317 4.369A19.79 19.79 0 0 0 15.885 3c-.21.375-.444.875-.608 1.27a18.27 18.27 0 0 0-5.555 0A12.76 12.76 0 0 0 9.114 3a19.74 19.74 0 0 0-4.432 1.369C2.1 8.07 1.5 11.69 1.78 15.255a19.9 19.9 0 0 0 5.993 3.04c.483-.659.913-1.36 1.282-2.098a12.9 12.9 0 0 1-2.02-.973c.17-.125.336-.256.497-.392a14.2 14.2 0 0 0 12.93 0c.163.14.328.27.497.392-.643.382-1.32.71-2.02.974.37.737.8 1.438 1.282 2.097a19.87 19.87 0 0 0 5.994-3.04c.34-4.13-.59-7.72-2.898-10.886ZM8.68 13.06c-.81 0-1.47-.745-1.47-1.66 0-.916.65-1.66 1.47-1.66.83 0 1.49.754 1.47 1.66 0 .915-.65 1.66-1.47 1.66Zm6.64 0c-.81 0-1.47-.745-1.47-1.66 0-.916.65-1.66 1.47-1.66.83 0 1.49.754 1.47 1.66 0 .915-.64 1.66-1.47 1.66Z' />
                            </svg>
                            Discord
                        </a>
                        <a
                            href='https://status.obsidianhost.net/'
                            target='_blank'
                            rel='noreferrer'
                            className='group flex flex-col items-center gap-2 rounded-lg border border-purple-500/20 bg-white/5 px-4 py-3 no-underline backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 hover:border-purple-400/60 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] active:scale-95 active:translate-y-0'
                        >
                            <svg viewBox='0 0 24 24' fill='none' className='h-6 w-6 text-purple-300 transition-transform duration-300 group-hover:text-purple-200 group-hover:scale-110'>
                                <path d='M3 17 9 11l4 4 8-8' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' className='transition-all duration-300 group-hover:[stroke-dasharray:30] group-hover:[stroke-dashoffset:0] [stroke-dasharray:30] [stroke-dashoffset:30]' />
                                <circle cx='21' cy='7' r='1.6' fill='currentColor' className='transition-transform duration-300 group-hover:scale-125' />
                            </svg>
                            Status
                        </a>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL — Login form */}
            <div className='relative flex w-full lg:w-1/2 items-center justify-center px-6 py-12 bg-[#0c0c12]'>
                {/* subtle background texture */}
                <div className='pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] bg-[size:24px_24px]' />

                <div className='relative z-10 w-full max-w-sm'>
                    {/* Mobile-only logo */}
                    <div className='mb-8 flex items-center gap-3 lg:hidden'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-700 to-fuchsia-600 font-black'>
                            O
                        </div>
                        <span className='text-xl font-extrabold'>
                            Obsidian<span className='text-purple-400'>Host</span>
                        </span>
                    </div>

                    <h2 className='text-2xl font-extrabold'>Welcome back</h2>
                    <p className='mt-1 mb-8 text-sm text-zinc-500'>Sign in to manage your servers.</p>

                    <Formik
                        onSubmit={onSubmit}
                        initialValues={{ user: '', password: '' }}
                        validationSchema={object().shape({
                            user: string().required('A username or email must be provided.'),
                            password: string().required('Please enter your account password.'),
                        })}
                    >
                        {({ isSubmitting }) => (
                            <div className='flex flex-col gap-5'>
                                <Field
                                    id='user'
                                    type='text'
                                    label='Username or Email'
                                    name='user'
                                    disabled={isSubmitting}
                                />

                                <div className='relative'>
                                    <Field
                                        id='password'
                                        type='password'
                                        label='Password'
                                        name='password'
                                        disabled={isSubmitting}
                                    />
                                    <Link
                                        to='/auth/password'
                                        className='absolute right-0 top-1 text-xs tracking-wide text-zinc-500 no-underline hover:text-purple-400'
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>

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
                                    Login
                                </Button>
                            </div>
                        )}
                    </Formik>

                    <p className='mt-8 text-center text-xs text-zinc-600'>&copy; ObsidianHost 2026</p>
                </div>
            </div>

            {/* Animations */}
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

                @keyframes drift {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(40px, -30px) scale(1.2); }
                }
                .animate-drift { animation: drift 14s ease-in-out infinite; }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow { animation: spin-slow 60s linear infinite; }
                .animate-spin-slower { animation: spin-slow 90s linear infinite reverse; }

                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) rotate(3deg); }
                    50% { transform: translateY(-10px) rotate(-3deg); }
                }
                .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }

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

export default LoginContainer;
