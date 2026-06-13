import { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { createSSHKey } from '@/api/account/ssh-keys';
import Button from '@/components/elements/Button';
import Field from '@/components/elements/Field';
import { useFlashKey } from '@/plugins/useFlash';

const schema = Yup.object({
    name: Yup.string().required('Name is required'),
    public_key: Yup.string().required('Public key is required'),
});

export default function CreateSSHKeyForm() {
    const [visible, setVisible] = useState(false);
    const { clearFlashes, addError } = useFlashKey('account:ssh');

    const handleSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
        clearFlashes();
        try {
            await createSSHKey(values.name, values.public_key);
            resetForm();
            setVisible(false);
            window.location.reload(); // Refresh list
        } catch (err) {
            addError(err);
        }
        setSubmitting(false);
    };

    return (
        <>
            <Button onClick={() => setVisible(true)} className="bg-purple-600 hover:bg-purple-700">+ Add SSH Key</Button>

            {visible && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
                    <div className="bg-[#111827] border border-purple-500/30 rounded-3xl p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-6">Add SSH Key</h2>

                        <Formik initialValues={{ name: '', public_key: '' }} validationSchema={schema} onSubmit={handleSubmit}>
                            {({ isSubmitting }) => (
                                <Form className="space-y-6">
                                    <Field name="name" label="SSH Key Name" description="A name to identify this SSH key." />
                                    <Field name="public_key" label="Public Key" description="Enter your public SSH key." as="textarea" rows={6} />

                                    <div className="flex gap-3 pt-4">
                                        <Button type="button" onClick={() => setVisible(false)} className="flex-1 bg-zinc-700">Cancel</Button>
                                        <Button type="submit" loading={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-700">Add Key</Button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            )}
        </>
    );
}
