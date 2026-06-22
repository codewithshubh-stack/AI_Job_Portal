import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircle, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const VerifyEmail = () => {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const hasCalled = useRef(false);

  // States: 'verifying', 'success', 'error'
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Validating verification token...');

  useEffect(() => {
    const triggerVerification = async () => {
      if (!uid || !token) {
        setStatus('error');
        setMessage('Verification metadata (uid or token) is missing. Check your link.');
        return;
      }

      try {
        await verifyEmail(uid, token);
        setStatus('success');
        setMessage('Your email address has been successfully verified! You can now log in.');
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage(err.response?.data?.token?.[0] || err.response?.data?.detail || 'Invalid or expired verification link.');
      }
    };

    if (!hasCalled.current) {
      hasCalled.current = true;
      triggerVerification();
    }
  }, [uid, token, verifyEmail]);

  return (
    <div class="min-h-screen flex items-center justify-center px-4 relative">
      <div class="absolute w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] -top-12 -left-12 pointer-events-none"></div>
      <div class="absolute w-[350px] h-[350px] bg-fuchsia-500/10 rounded-full blur-[100px] -bottom-12 -right-12 pointer-events-none"></div>

      <div class="w-full max-w-md relative z-10 text-center">
        <div class="glass border border-slate-800/80 rounded-2xl shadow-2xl p-8">
          
          {status === 'verifying' && (
            <div class="space-y-6 py-6">
              <div class="flex items-center justify-center">
                <div class="relative w-16 h-16">
                  <div class="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <div class="absolute inset-0 flex items-center justify-center text-indigo-400">
                    <ShieldCheck size={24} />
                  </div>
                </div>
              </div>
              <h3 class="font-display font-semibold text-lg text-white">Verifying Account Security</h3>
              <p class="text-slate-400 text-xs">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div class="space-y-6 py-6">
              <div class="flex items-center justify-center text-emerald-400">
                <CheckCircle size={56} class="animate-bounce" />
              </div>
              <h3 class="font-display font-semibold text-xl text-white">Email Verified!</h3>
              <p class="text-slate-400 text-xs leading-relaxed px-4">{message}</p>
              
              <div class="pt-4">
                <Link
                  to="/login"
                  class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white font-semibold text-sm shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  Proceed to Sign In
                  <ArrowRight size={16} class="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div class="space-y-6 py-6">
              <div class="flex items-center justify-center text-rose-400">
                <XCircle size={56} />
              </div>
              <h3 class="font-display font-semibold text-xl text-white">Verification Failed</h3>
              <p class="text-rose-300/80 text-xs leading-relaxed px-4">{message}</p>
              
              <div class="pt-4 flex gap-4">
                <Link
                  to="/register"
                  class="w-1/2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900 text-slate-400 font-medium text-xs transition-all cursor-pointer text-center"
                >
                  Register Again
                </Link>
                <Link
                  to="/login"
                  class="w-1/2 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-indigo-400 font-semibold text-xs transition-all cursor-pointer text-center"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
