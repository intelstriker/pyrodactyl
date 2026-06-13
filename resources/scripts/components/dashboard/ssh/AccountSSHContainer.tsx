import { Eye, EyeSlash, Key, Plus, TrashBin } from '@gravity-ui/icons';
import { format } from 'date-fns';
import { Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useEffect, useState } from 'react';
import { object, string } from 'yup';
import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Code from '@/components/elements/Code';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';
import { createSSHKey, deleteSSHKey, useSSHKeys } from '@/api/account/ssh-keys';
import { httpErrorToHuman } from '@/api/http';
import { ApplicationStore } from '@/state';
import { useFlashKey } from '@/plugins/useFlash';

interface CreateValues {
    name: string;
    publicKey: string;
}

const AccountSSHContainer = () => {
    const [deleteKey, setDeleteKey] = useState<{ name: string; fingerprint: string } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const { clearAndAddHttpError } = useFlashKey('account:ssh-keys');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const { data, isValidating, error, mutate } = useSSHKeys({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    const doDeletion = () => {
        if (!deleteKey) return;
        clearAndAddHttpError();
        Promise.all([
            mutate((data) => data?.filter((value) => value.fingerprint !== deleteKey.fingerprint), false),
            deleteSSHKey(deleteKey.fingerprint),
        ])
            .catch((error) => {
                mutate(undefined, true).catch(console.error);
                clearAndAddHttpError(error);
            })
            .finally(() => setDeleteKey(null));
    };

    const submitCreate = (values: CreateValues, { setSubmitting, resetForm }: FormikHelpers<CreateValues>) => {
        clearFlashes('account:ssh-keys');
        createSSHKey(values.name, values.publicKey)
            .then((key) => {
                resetForm();
                setSubmitting(false);
                mutate((data) => (data || []).concat(key));
                setShowCreateModal(false);
            })
            .catch((error) => {
                addError({ key: 'account:ssh-keys', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    const toggleKeyVisibility = (fingerprint: string) => {
        setShowKeys((prev) => ({ ...prev, [fingerprint]: !prev[fingerprint] }));
    };

    return (
        <PageContentBlock title={'SSH Keys'}>
            <FlashMessageRender byKey='account:ssh-keys' />

            {/* === OBSIDIAN THEMED CREATE MODAL === */}
            {showCreateModal && (
                <Dialog.Confirm
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Add SSH Key"
                    confirm="Add Key"
                    confirmButtonProps={{
                        className: 'bg-purple-600 hover:bg-purple-700 border-purple-500 text-white font-medium',
                    }}
                    cancelButtonProps={{
                        className: 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300',
                    }}
                    className="!bg-[#0a0612] border border-purple-500/40 shadow-2xl"
                    overlayClassName="bg-black/80"
                >
                    <Formik
                        onSubmit={submitCreate}
                        initialValues={{ name: '', publicKey: '' }}
                        validationSchema={object().shape({
                            name: string().required('SSH Key Name is required'),
                            publicKey: string().required('Public Key is required'),
                        })}
                    >
                        {({ isSubmitting }) => (
                            <Form id="create-ssh-form" className="space-y-6">
                                <SpinnerOverlay visible={isSubmitting} />

                                <FormikFieldWrapper
                                    label="SSH Key Name"
                                    name="name"
                                    description="A name to identify this SSH key."
                                >
                                    <Field
                                        name="name"
                                        as={Input}
                                        className="w-full bg-zinc-900 border-zinc-700 focus:border-purple-500 focus:ring-purple-500 text-white"
                                        placeholder="My Laptop Key"
                                    />
                                </FormikFieldWrapper>

                                <FormikFieldWrapper
                                    label="Public Key"
                                    name="publicKey"
                                    description="Enter your public SSH key."
                                >
                                    <Field
                                        name="publicKey"
                                        as={Input}
                                        className="w-full bg-zinc-900 border-zinc-700 focus:border-purple-500 focus:ring-purple-500 font-mono text-sm h-28 resize-y"
                                        placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI..."
                                        asTextarea
                                    />
                                </FormikFieldWrapper>
                            </Form>
                        )}
                    </Formik>
                </Dialog.Confirm>
            )}

            {/* Delete Modal */}
            <Dialog.Confirm
                title="Delete SSH Key"
                confirm="Delete Key"
                confirmButtonProps={{
                    className: 'bg-red-600 hover:bg-red-700',
                }}
                open={!!deleteKey}
                onClose={() => setDeleteKey(null)}
                onConfirmed={doDeletion}
                className="!bg-[#0a0612] border border-purple-500/40"
            >
                Removing the <Code className="bg-zinc-900 px-1.5 py-0.5 border border-zinc-700">{deleteKey?.name}</Code> SSH key will invalidate it across all servers.
            </Dialog.Confirm>

            <div className="w-full min-h-full flex-1 flex flex-col px-2 sm:px-0">
                <MainPageHeader
                    title="SSH Keys"
                    titleChildren={
                        <ActionButton
                            variant="primary"
                            onClick={() => setShowCreateModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                        >
                            <Plus width={22} height={22} />
                            Add SSH Key
                        </ActionButton>
                    }
                />

                <div className="bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border border-[#ffffff12] rounded-xl p-4 sm:p-6 mt-6">
                    <SpinnerOverlay visible={!data && isValidating} />

                    {!data || data.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center">
                                <Key width={28} height={28} className="text-purple-400" />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-200">No SSH Keys</h3>
                            <p className="text-sm text-zinc-400 mt-2">Add your first SSH key to securely access your servers.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.map((key) => (
                                <div key={key.fingerprint} className="bg-[#0f0b17] border border-[#ffffff08] hover:border-purple-500/30 rounded-lg p-4 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-zinc-100 font-medium">{key.name}</h4>
                                            <div className="text-xs text-zinc-400 mt-2 flex flex-wrap gap-x-6 gap-y-1">
                                                <span>Added: {format(key.createdAt, 'MMM d, yyyy')}</span>
                                                <div className="flex items-center gap-2">
                                                    Fingerprint:
                                                    <code className="font-mono bg-black/40 px-2 py-0.5 rounded">
                                                        {showKeys[key.fingerprint] ? `SHA256:${key.fingerprint}` : 'SHA256:•••••••••••••••'}
                                                    </code>
                                                    <ActionButton
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => toggleKeyVisibility(key.fingerprint)}
                                                    >
                                                        {showKeys[key.fingerprint] ? <EyeSlash size={16} /> : <Eye size={16} />}
                                                    </ActionButton>
                                                </div>
                                            </div>
                                        </div>

                                        <ActionButton
                                            variant="danger"
                                            size="sm"
                                            onClick={() => setDeleteKey({ name: key.name, fingerprint: key.fingerprint })}
                                        >
                                            <TrashBin width={18} height={18} />
                                        </ActionButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageContentBlock>
    );
};

export default AccountSSHContainer;
