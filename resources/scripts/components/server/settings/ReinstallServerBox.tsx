import { Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';

import { httpErrorToHuman } from '@/api/http';
import reinstallServer from '@/api/server/reinstallServer';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

const ReinstallServerBox = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
        setLoading(true);
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'Your server has begun the reinstallation process.',
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                setLoading(false);
                setModalVisible(false);
            });
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <div className='bg-gradient-to-b from-[#ff000008] to-[#ff000005] border-[1px] border-[#ff000020] rounded-xl p-6 shadow-sm'>
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirm server reinstallation'}
                confirm={'Yes, reinstall server'}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
                loading={loading}
            >
                Your server will be stopped and some files may be deleted or modified during this process, are you sure
                you wish to continue?
            </Dialog.Confirm>

            <div className='flex items-start justify-between gap-6'>
                <div className='flex flex-col gap-2'>
                    <h3 className='text-xl font-extrabold tracking-tight'>Reinstall Server</h3>
                    <p className='text-sm text-zinc-400 leading-relaxed max-w-lg'>
                        Reinstalling will stop your server and re-run the installation script that initially set it up.{' '}
                        <span className='text-zinc-300 font-medium'>
                            Some files may be deleted or modified — back up your data before continuing.
                        </span>
                    </p>
                </div>
                <div className='shrink-0'>
                    <ActionButton variant='danger' onClick={() => setModalVisible(true)} disabled={loading}>
                        {loading && <Spinner size='small' />}
                        Reinstall Server
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};

export default ReinstallServerBox;
