import { Route, Routes } from 'react-router-dom';

import ForgotPasswordContainer from '@/components/auth/ForgotPasswordContainer';
import LoginCheckpointContainer from '@/components/auth/LoginCheckpointContainer';
import LoginContainer from '@/components/auth/LoginContainer';
import ResetPasswordContainer from '@/components/auth/ResetPasswordContainer';
import { NotFound } from '@/components/elements/ScreenBlock';

const AuthenticationRouter = () => {
    return (
        <div
            className='relative w-full h-full flex justify-center items-center rounded-md overflow-hidden bg-[#0a0a0f]'
        >
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0d0014] via-[#1a0a2e] to-[#000005]' />
            <div className='pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-purple-600/20 blur-[100px]' />
            <div className='relative z-10 w-full h-full flex justify-center items-center p-4'>
                <Routes>
                    <Route path='login' element={<LoginContainer />} />
                    <Route path='login/checkpoint/*' element={<LoginCheckpointContainer />} />
                    <Route path='password' element={<ForgotPasswordContainer />} />
                    <Route path='password/reset/:token' element={<ResetPasswordContainer />} />
                    <Route path='*' element={<NotFound />} />
                </Routes>
            </div>
        </div>
    );
};

export default AuthenticationRouter;
