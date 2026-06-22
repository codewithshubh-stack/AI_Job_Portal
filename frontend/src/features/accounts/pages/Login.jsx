import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { Mail, Lock, ArrowRight, KeyRound, CheckCircle, Sun, Moon, Sparkles } from 'lucide-react';

const Login = () => {
  const { login, requestPasswordReset } = useAuth();
  const { theme, toggleTheme, selectTheme } = useTheme();
  const navigate = useNavigate();

  // Mode: 'login' or 'forgot'
  const [mode, setMode] = useState('login');
  
  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Feedback States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid email or password. Make sure your email is verified.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await requestPasswordReset(email);
      setSuccess('If a matching account exists, password reset instructions have been sent to your email.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.email?.[0] || 'Something went wrong. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center px-4 relative">
      {/* Theme Selector Dropdown */}
      <div class="absolute top-4 right-4 group/theme z-50">
        <button
          onClick={toggleTheme}
          class="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
          title="Change Theme"
        >
          {theme === 'dark' ? <Moon size={15} /> : theme === 'light' ? <Sun size={15} /> : <Sparkles size={15} />}
        </button>
        <div class="absolute right-0 mt-2 w-32 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-20 hidden group-hover/theme:block animate-in fade-in duration-200">
          {['light', 'dark', 'system'].map((t) => (
            <button
              key={t}
              onClick={() => selectTheme(t)}
              class={`w-full text-left px-3 py-1.5 text-xs capitalize transition-colors flex items-center gap-2 hover:bg-slate-800 ${
                theme === t ? 'text-indigo-400 font-semibold' : 'text-slate-300'
              }`}
            >
              {t === 'light' ? <Sun size={12} /> : t === 'dark' ? <Moon size={12} /> : <Sparkles size={12} />}
              {t}
            </button>
          ))}
        </div>
      </div>
      {/* Decorative backdrop shapes */}
      <div class="absolute w-[400px] h-[400px] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-[100px] opacity-20 -top-12 -left-12"></div>
      <div class="absolute w-[450px] h-[450px] bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-full blur-[100px] opacity-15 -bottom-20 -right-20"></div>

      <div class="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div class="text-center mb-8">
          <h2 class="font-display font-extrabold text-3xl tracking-tight text-white">
            Talent<span class="text-gradient-primary">AI</span>
          </h2>
          <p class="text-slate-400 text-sm mt-2">
            {mode === 'login' ? 'Welcome back! Log in to your portal' : 'Reset your account security keys'}
          </p>
        </div>

        {/* Auth Glass Card */}
        <div class="glass border border-slate-800/80 rounded-2xl shadow-2xl p-8">
          {error && (
            <div class="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {success && (
            <div class="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex gap-2.5 items-start animate-in fade-in duration-200">
              <CheckCircle size={16} class="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} class="space-y-5">
              {/* Email */}
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-300">Corporate Email</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:bg-slate-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div class="space-y-1.5">
                <div class="flex justify-between items-center">
                  <label class="text-xs font-semibold text-slate-300">Access Key</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                      setSuccess('');
                    }}
                    class="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot Access Key?
                  </button>
                </div>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:bg-slate-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white font-semibold text-sm shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {submitting ? (
                  <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} class="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotSubmit} class="space-y-5">
              {/* Email */}
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-300">Corporate Email</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:bg-slate-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white font-semibold text-sm shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <KeyRound size={16} />
                    Send Reset Link
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
                class="w-full text-center text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          )}

          <div class="h-px bg-slate-800 my-6"></div>

          {/* Footer Action Links */}
          <div class="text-center text-xs">
            <span class="text-slate-400">Need a portal key?</span>{' '}
            <Link to="/register" class="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-all ml-1">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
