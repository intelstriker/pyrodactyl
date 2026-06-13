import clsx from 'clsx';

interface Props {
    children: React.ReactNode;
    className?: string;
}

const PageListContainer = ({ className, children }: Props) => {
    return (
        <div
            style={{
                background:
                    'radial-gradient(124.75% 124.75% at 50.01% -10.55%, #150a22 0%, #06010d 100%), ' +
                    'repeating-linear-gradient(135deg, rgba(168,85,247,0.05) 0px, rgba(168,85,247,0.05) 1px, transparent 1px, transparent 26px)',
                border: '1px solid rgba(168,85,247,0.12)',
            }}
            className={clsx(className, 'p-2 rounded-xl')}
        >
            <div className='flex h-full w-full flex-col gap-3 overflow-hidden rounded-lg'>{children}</div>
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

