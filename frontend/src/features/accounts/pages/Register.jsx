import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { User, Briefcase, Mail, Lock, ArrowRight, UserPlus, Info, Sun, Moon, Sparkles } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const { theme, toggleTheme, selectTheme } = useTheme();
  const navigate = useNavigate();

  // Registration step state
  // 1: Choose Role, 2: Form Details
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('candidate'); // 'candidate' or 'recruiter'

  // Input fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status indicators
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        password_confirm: password,
        role,
      });
      setSuccess(response.detail || 'Registration successful! A verification link has been sent to your email.');
      // Auto redirect to login page after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        // Collect field validation errors
        const data = err.response.data;
        let errorMessage = '';
        if (data.email) errorMessage += `Email: ${data.email.join(' ')} `;
        if (data.password) errorMessage += `Password: ${data.password.join(' ')} `;
        if (data.first_name) errorMessage += `First Name: ${data.first_name.join(' ')} `;
        if (data.last_name) errorMessage += `Last Name: ${data.last_name.join(' ')} `;
        setError(errorMessage || data.detail || 'An error occurred during registration.');
      } else {
        setError('Something went wrong. Please check your internet connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center px-4 relative py-12">
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
      {/* Glow backgrounds */}
      <div class="absolute w-[400px] h-[400px] bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full blur-[100px] opacity-15 -top-12 -left-12"></div>
      <div class="absolute w-[450px] h-[450px] bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full blur-[100px] opacity-15 -bottom-20 -right-20"></div>

      <div class="w-full max-w-lg relative z-10">
        <div class="text-center mb-8">
          <h2 class="font-display font-extrabold text-3xl tracking-tight text-white">
            Talent<span class="text-gradient-primary">AI</span>
          </h2>
          <p class="text-slate-400 text-sm mt-2">
            Build your professional identity on the AI Matching Network
          </p>
        </div>

        <div class="glass border border-slate-800/80 rounded-2xl shadow-2xl p-8">
          {error && (
            <div class="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {success && (
            <div class="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex gap-2.5 items-start animate-in fade-in duration-200">
              <Info size={16} class="shrink-0 mt-0.5" />
              <div>
                <p class="font-semibold">{success}</p>
                <p class="text-[10px] mt-1 text-emerald-400/80">Redirecting to login shortly...</p>
              </div>
            </div>
          )}

          {step === 1 ? (
            <div class="space-y-6">
              <div class="text-center">
                <span class="text-xs uppercase tracking-widest text-indigo-400 font-bold">Step 1 of 2</span>
                <h3 class="font-display font-semibold text-lg text-white mt-1">Select your account profile type</h3>
              </div>

              {/* Role Cards Grid */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Candidate Card */}
                <button
                  onClick={() => setRole('candidate')}
                  class={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                    role === 'candidate'
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div class={`p-2.5 w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    role === 'candidate' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <User size={20} />
                  </div>
                  <h4 class="font-semibold text-white text-sm">Job Seeker</h4>
                  <p class="text-slate-400 text-xs mt-1.5 leading-normal">
                    Search jobs, parse resumes via AI, and receive semantic recommendations.
                  </p>
                </button>

                {/* Recruiter Card */}
                <button
                  onClick={() => setRole('recruiter')}
                  class={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                    role === 'recruiter'
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div class={`p-2.5 w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    role === 'recruiter' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Briefcase size={20} />
                  </div>
                  <h4 class="font-semibold text-white text-sm">Employer / Recruiter</h4>
                  <p class="text-slate-400 text-xs mt-1.5 leading-normal">
                    Register your company, publish job listings, and scan candidates with AI score insights.
                  </p>
                </button>
              </div>

              {/* Next Step */}
              <button
                type="button"
                onClick={() => setStep(2)}
                class="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-indigo-400 hover:text-indigo-300 font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                Continue Details
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} class="space-y-4">
              <div class="text-center mb-2">
                <span class="text-xs uppercase tracking-widest text-indigo-400 font-bold">Step 2 of 2</span>
                <h3 class="font-display font-semibold text-lg text-white mt-1">
                  Fill in your credentials as a <span class="capitalize text-indigo-400">{role}</span>
                </h3>
              </div>

              {/* Full name flex group */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-300">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:bg-slate-950 focus:border-indigo-500 text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-300">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:bg-slate-950 focus:border-indigo-500 text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  />
                </div>
              </div>

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
                    placeholder="jane.doe@company.com"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:bg-slate-950 focus:border-indigo-500 text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-300">Password</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:bg-slate-950 focus:border-indigo-500 text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Submit / back flex */}
              <div class="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  class="w-full sm:w-1/3 py-3 px-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900 text-slate-400 font-semibold text-sm transition-all cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  class="w-full sm:w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white font-semibold text-sm shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {submitting ? (
                    <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Create Key
                      <UserPlus size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div class="h-px bg-slate-800 my-6"></div>

          {/* Footer Action Links */}
          <div class="text-center text-xs">
            <span class="text-slate-400">Already registered?</span>{' '}
            <Link to="/login" class="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-all ml-1">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
