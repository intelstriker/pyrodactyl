import type { FormikHelpers } from 'formik';
import { Form, Formik } from 'formik';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { object, ref, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
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
    const glowRef = useRef<HTMLDivElement>(null);
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

    const handleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
        const id = Date.now();
        setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
    };

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
        <div className='relative flex min-h-screen w-full bg-[#0a0a0f] text-white overflow-hidden' onClick={handleClick}>
            {ripples.map((r) => (
                <span
                    key={r.id}
                    className='pointer-events-none fixed z-50 rounded-full border border-purple-300/60 animate-click-ripple'
                    style={{ left: r.x - 20, top: r.y - 20, width: 40, height: 40 }}
                />
            ))}
            {/* LEFT PANEL — Animated Obsidian / Minecraft scene */}
            <div className='hidden lg:flex relative w-1/2 items-center justify-center overflow-hidden border-r border-purple-900/40'>
                <div className='absolute inset-0 bg-gradient-to-br from-[#120016] via-[#1a0a2e] to-[#05010a]' />

                <div
                    ref={glowRef}
                    className='pointer-events-none absolute left-0 top-0 h-[400px] w-[400px] rounded-full bg-purple-400/25 blur-[80px] opacity-0 transition-opacity duration-300 ease-out'
                    style={{ willChange: 'transform' }}
                />

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
                            className='group flex flex-col items-center gap-2 rounded-lg border border-purple-500/20 bg-white/5 px-4 py-3 no-underline backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 hover:border-purple-400/60 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] active:scale-90 active:translate-y-0 active:shadow-[0_0_25px_rgba(168,85,247,0.6)] active:border-purple-300/70'
                        >
                            <svg viewBox='0 0 24 24' fill='none' className='h-6 w-6 text-purple-300 transition-transform duration-300 group-hover:text-purple-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(216,180,254,0.8)]'>
                                <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='1.6' />
                                <path d='M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18' stroke='currentColor' strokeWidth='1.6' />
                            </svg>
                            Website
                        </a>
                        <a
                            href='https://discord.gg/ubyvnNC4JP'
                            target='_blank'
                            rel='noreferrer'
                            className='group flex flex-col items-center gap-2 rounded-lg border border-purple-500/20 bg-white/5 px-4 py-3 no-underline backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 hover:border-purple-400/60 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] active:scale-90 active:translate-y-0 active:shadow-[0_0_25px_rgba(168,85,247,0.6)] active:border-purple-300/70'
                        >
                            <svg viewBox='0 0 24 24' fill='currentColor' className='h-6 w-6 text-purple-300 transition-transform duration-300 group-hover:text-purple-200 group-hover:scale-110 group-active:scale-90'>
                                <path d='M20.222 0c1.406 0 2.54 1.137 2.607 2.475V24l-2.677-2.273-1.47-1.338-1.604-1.398.67 2.205H3.71c-1.402 0-2.54-1.065-2.54-2.476V2.48C1.17 1.142 2.31.003 3.715.003h16.5L20.222 0zm-6.118 5.683h-.03l-.202.2c2.073.6 3.076 1.537 3.076 1.537-1.336-.668-2.54-1.002-3.744-1.137-.87-.135-1.74-.064-2.475 0h-.2c-.47 0-1.47.2-2.81.735-.467.203-.735.336-.735.336s1.002-1.002 3.21-1.537l-.135-.135s-1.672-.064-3.477 1.27c0 0-1.805 3.144-1.805 7.02 0 0 1.002 1.74 3.743 1.806 0 0 .47-.535.805-1.002-1.54-.4-2.14-1.27-2.14-1.27s.135.066.335.2h.06c.03 0 .044.015.06.03v.006c.016.016.03.03.06.03.33.136.66.27.93.4.466.202 1.065.4 1.8.533.93.135 1.996.2 3.21 0 .6-.135 1.2-.267 1.8-.535.39-.2.87-.4 1.397-.737 0 0-.6.936-2.205 1.336.33.466.795 1.002.795 1.002 2.744-.065 3.81-1.806 3.87-1.74 0-3.87-1.815-7.02-1.815-7.02-1.635-1.214-3.165-1.27-3.435-1.27l.056-.04zm.116 4.273c.7 0 1.27.6 1.27 1.336 0 .74-.57 1.34-1.27 1.34-.673 0-1.27-.6-1.27-1.34.002-.74.6-1.336 1.27-1.336zm-4.56 0c.67 0 1.27.6 1.27 1.336 0 .74-.6 1.34-1.27 1.34-.67 0-1.27-.6-1.27-1.34 0-.74.6-1.336 1.27-1.336z' />
                            </svg>
                            Discord
                        </a>
                        <a
                            href='https://status.obsidianhost.net/'
                            target='_blank'
                            rel='noreferrer'
                            className='group flex flex-col items-center gap-2 rounded-lg border border-purple-500/20 bg-white/5 px-4 py-3 no-underline backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 hover:border-purple-400/60 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] active:scale-90 active:translate-y-0 active:shadow-[0_0_25px_rgba(168,85,247,0.6)] active:border-purple-300/70'
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

            {/* Mobile ambient background */}
            <div className='lg:hidden pointer-events-none absolute inset-0 overflow-hidden'>
                <div className='absolute inset-0 bg-gradient-to-br from-[#0d0014] via-[#1a0a2e] to-[#000005]' />
                <div className='absolute left-1/2 top-0 -translate-x-1/2 h-72 w-72 rounded-full bg-purple-600/25 blur-[90px]' />
                <div className='absolute right-0 bottom-1/4 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-[70px]' />
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30' />
            </div>

            {/* RIGHT PANEL — Reset password form */}
            <div className='relative flex w-full lg:w-1/2 items-center justify-center px-6 py-12 bg-transparent lg:bg-[#0c0c12]'>
                <div className='pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] bg-[size:24px_24px]' />

                <div className='relative z-10 w-full max-w-sm'>
                    <div className='mb-8 flex flex-col items-center gap-3 text-center lg:hidden'>
                        <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-700/80 to-fuchsia-600/80 p-3 shadow-[0_0_30px_rgba(168,85,247,0.45)]'>
                            <img
                                src={obsidianLogo}
                                alt='ObsidianHost'
                                className='h-full w-full object-contain drop-shadow-[0_0_12px_rgba(216,180,254,0.6)]'
                            />
                        </div>
                        <span className='text-2xl font-extrabold tracking-tight'>
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
                            <Form className='flex flex-col gap-5'>
                                <div className='obsidian-flash'>
                                    <FlashMessageRender />
                                </div>

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
                            </Form>
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

                @keyframes click-ripple {
                    0% { transform: scale(0.3); opacity: 0.8; }
                    100% { transform: scale(3); opacity: 0; }
                }
                .animate-click-ripple { animation: click-ripple 0.7s ease-out forwards; }

                .obsidian-flash:empty { display: none; }
                .obsidian-flash * {
                    border-color: rgba(168, 85, 247, 0.35) !important;
                    background-color: rgba(40, 10, 60, 0.6) !important;
                    background-image: none !important;
                    color: #f3e8ff !important;
                    box-shadow: none !important;
                }
                .obsidian-flash > div {
                    margin-bottom: 0.5rem;
                    border-radius: 0.5rem;
                    border: 1px solid rgba(168, 85, 247, 0.4) !important;
                    backdrop-filter: blur(6px);
                    font-size: 0.8rem;
                    overflow: hidden;
                    padding: 0.6rem 0.8rem;
                }
                .obsidian-flash svg, .obsidian-flash svg * {
                    color: #d8b4fe !important;
                    fill: #d8b4fe !important;
                    stroke: #d8b4fe !important;
                }
            `}</style>
        </div>
    );
}

export default ResetPasswordContainer;
