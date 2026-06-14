import { useStoreState } from 'easy-peasy';
import isEqual from 'react-fast-compare';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Label from '@/components/elements/Label';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';

import { ip } from '@/lib/formatters';

import { ServerContext } from '@/state/server';

import RenameServerBox from './RenameServerBox';

const SettingsContainer = () => {
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);

    return (
        <ServerContentBlock title={'Settings'}>
            <FlashMessageRender byKey={'settings'} />
            <MainPageHeader direction='column' title={'Settings'}>
                <p className='text-sm text-neutral-400 leading-relaxed'>
                    Configure your server settings, manage SFTP access, and access debug information. Make changes to
                    reinstall when needed.
                </p>
            </MainPageHeader>

            <div className='flex flex-col gap-8'>
                {/* Server overview stats */}
                <RenameServerBox />

                <Can action={'settings.reinstall'}>
                    <ReinstallServerBox />
                </Can>

                {/* Debug Information */}
                <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-6 shadow-sm'>
                    <h3 className='text-xl font-extrabold tracking-tight mb-6'>Debug Information</h3>
                    <div className='flex flex-col gap-3'>
                        <div className='flex items-center justify-between'>
                            <span className='text-sm text-zinc-400'>Node</span>
                            <code className='font-mono text-sm bg-[#ffffff0d] border border-[#ffffff12] rounded-lg px-3 py-1.5'>
                                {node}
                            </code>
                        </div>
                        <div className='h-px bg-[#ffffff08]' />
                        <CopyOnClick text={uuid}>
                            <div className='flex items-center justify-between cursor-pointer group'>
                                <span className='text-sm text-zinc-400'>Server ID</span>
                                <code className='font-mono text-sm bg-[#ffffff0d] border border-[#ffffff12] rounded-lg px-3 py-1.5 group-hover:border-[#ffffff25] transition-colors'>
                                    {uuid}
                                </code>
                            </div>
                        </CopyOnClick>
                    </div>
                </div>

                {/* SFTP Details */}
                <Can action={'file.sftp'}>
                    <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-6 shadow-sm'>
                        <h3 className='text-xl font-extrabold tracking-tight mb-6'>SFTP Details</h3>
                        <div className='flex flex-col gap-3'>
                            <div className='flex items-center justify-between'>
                                <Label className='text-sm text-zinc-400'>Server Address</Label>
                                <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                                    <code className='font-mono text-sm bg-[#ffffff0d] border border-[#ffffff12] rounded-lg px-3 py-1.5 cursor-pointer hover:border-[#ffffff25] transition-colors'>
                                        {`sftp://${ip(sftp.ip)}:${sftp.port}`}
                                    </code>
                                </CopyOnClick>
                            </div>
                            <div className='h-px bg-[#ffffff08]' />
                            <div className='flex items-center justify-between'>
                                <Label className='text-sm text-zinc-400'>Username</Label>
                                <CopyOnClick text={`${username}.${id}`}>
                                    <code className='font-mono text-sm bg-[#ffffff0d] border border-[#ffffff12] rounded-lg px-3 py-1.5 cursor-pointer hover:border-[#ffffff25] transition-colors'>
                                        {`${username}.${id}`}
                                    </code>
                                </CopyOnClick>
                            </div>
                        </div>

                        <div className='mt-6 flex items-center justify-between gap-4'>
                            <div className='border-l-4 border-brand pl-3 py-1'>
                                <p className='text-xs text-zinc-300'>
                                    Your SFTP password is the same as the password you use to access this panel.
                                </p>
                            </div>
                            <a href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`} className='shrink-0'>
                                <button className='px-4 py-2 text-sm font-medium rounded-lg bg-[#ffffff12] border border-[#ffffff15] hover:bg-[#ffffff1a] hover:border-[#ffffff25] transition-all'>
                                    Launch SFTP
                                </button>
                            </a>
                        </div>
                    </div>
                </Can>
            </div>
        </ServerContentBlock>
    );
};

export default SettingsContainer;
