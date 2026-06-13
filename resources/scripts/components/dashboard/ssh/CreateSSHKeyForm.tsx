import { Plus } from '@gravity-ui/icons';
import { Form, Formik, FormikHelpers } from 'formik';
import { useState } from 'react';
import { object, string } from 'yup';
import ActionButton from '@/components/elements/ActionButton';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';
import { createSSHKey } from '@/api/account/ssh-keys';
import { useFlashKey } from '@/plugins/useFlash';

interface CreateValues {
    name: string;
    public_key: string;
}

const validationSchema = object().shape({
    name: string().required('SSH Key Name is required'),
    public_key: string().required('Public key is required'),
});

export default function CreateSSHKeyForm() {
    const [visible, setVisible] = useState(false);
    const { clearFlashes, addError } = useFlashKey('account:ssh-keys');

    const handleSubmit = async (values: CreateValues, { setSubmitting, resetForm }: FormikHelpers<CreateValues>) => {
        clearFlashes();
        try {
            await createSSHKey(values.name, values.public_key);
            resetForm();
            setVisible(false);
            window.location.reload();
        } catch (err) {
            addError(err);
        }
        setSubmitting(false);
    };

    return (
        <>
            {/* Add SSH Key Button */}
            <ActionButton
                variant="primary"
                onClick={() => setVisible(true)}
                className="flex items-center gap-2"
            >
                <Plus width={20} height={20} />
                Add SSH Key
            </ActionButton>

            {/* Create SSH Key Modal Dialog */}
            <Dialog.Confirm
                open={visible}
                onClose={() => setVisible(false)}
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
                    initialValues={{ name: '', public_key: '' }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting }) => (
                        <Form className="space-y-6">
                            <SpinnerOverlay visible={isSubmitting} />

                            <FormikFieldWrapper
                                label="SSH Key Name"
                                name="name"
                                description="A name to identify this SSH key."
                            >
                                <Input
                                    name="name"
                                    className="w-full bg-zinc-900 border-zinc-700 focus:border-purple-500 focus:ring-purple-500 text-white"
                                    placeholder="My Laptop Key"
                                />
                            </FormikFieldWrapper>

                            <FormikFieldWrapper
                                label="Public Key"
                                name="public_key"
                                description="Enter your public SSH key."
                            >
                                <Input
                                    name="public_key"
                                    className="w-full bg-zinc-900 border-zinc-700 focus:border-purple-500 focus:ring-purple-500 font-mono text-sm h-28 resize-y"
                                    placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI..."
                                    asTextarea
                                />
                            </FormikFieldWrapper>
                        </Form>
                    )}
                </Formik>
            </Dialog.Confirm>
        </>
    );
}
