import clsx from 'clsx';

interface Props {
    children: React.ReactNode;
    className?: string;
}

const PageListContainer = ({ className, children }: Props) => {
    return (
        <div
            style={{
                position: 'relative',
                background:
                    'radial-gradient(124.75% 124.75% at 50.01% -10.55%, #150a22 0%, #06010d 100%)',
                border: '1px solid rgba(168,85,247,0.12)',
                overflow: 'hidden',
            }}
            className={clsx(className, 'p-2 rounded-xl')}
        >
            <style>{`
                @keyframes obsidian-hatch-drift {
                    0% { background-position: 0 0; }
                    100% { background-position: 120px 120px; }
                }
                @keyframes obsidian-orb-drift-a {
                    0%, 100% { transform: translate(-10%, -10%) scale(1); opacity: 0.35; }
                    50% { transform: translate(10%, 5%) scale(1.15); opacity: 0.55; }
                }
                @keyframes obsidian-orb-drift-b {
                    0%, 100% { transform: translate(5%, 10%) scale(1); opacity: 0.25; }
                    50% { transform: translate(-12%, -6%) scale(1.2); opacity: 0.45; }
                }
            `}</style>

            {/* Animated hatch pattern */}
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'repeating-linear-gradient(135deg, rgba(168,85,247,0.05) 0px, rgba(168,85,247,0.05) 1px, transparent 1px, transparent 26px)',
                    backgroundSize: '120px 120px',
                    animation: 'obsidian-hatch-drift 40s linear infinite',
                    pointerEvents: 'none',
                }}
            />

            {/* Drifting glow orbs */}
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    width: '40%',
                    height: '40%',
                    top: 0,
                    left: 0,
                    borderRadius: '9999px',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    animation: 'obsidian-orb-drift-a 18s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    width: '35%',
                    height: '35%',
                    bottom: 0,
                    right: 0,
                    borderRadius: '9999px',
                    background: 'radial-gradient(circle, rgba(126,34,206,0.35) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    animation: 'obsidian-orb-drift-b 22s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />

            <div className='relative flex h-full w-full flex-col gap-3 overflow-hidden rounded-lg'>{children}</div>
        </div>
    );
};
PageListContainer.displayName = 'PageListContainer';

const PageListItem = ({ className, children }: Props) => {
    return (
        <div
            className={clsx(
                className,
                'bg-linear-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff15] px-5 py-4 rounded-xl hover:border-[#ffffff20] transition-all flex items-center gap-3 flex-col sm:flex-row',
            )}
        >
            {children}
        </div>
    );
};
PageListItem.displayName = 'PageListItem';

export { PageListContainer, PageListItem };
