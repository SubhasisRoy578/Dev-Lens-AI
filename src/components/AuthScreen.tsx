import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Terminal,
  Cpu,
  KeyRound,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(trimmedEmail, password);
      } else {
        await register(trimmedEmail, password, name.trim());
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoAccount = () => {
    setMode('login');
    setEmail('engineer@devlens.internal');
    setPassword('devlens123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#fdf9f2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[#1c1c18] selection:bg-[#fed3b8] selection:text-[#1c1c18]">
      {/* Visual background subtle grid accent */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Banner */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-[#1c1c18] text-[#fdf9f2] flex items-center justify-center border border-[#835331]/40 shadow-xs">
            <Cpu className="w-6 h-6 text-[#febf94]" />
          </div>

          <div className="flex items-center space-x-2">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c1c18]">
              DevLens AI
            </h1>
            <span className="font-mono text-[10px] bg-[#ece8e1] px-1.5 py-0.5 rounded border border-[#c8c5cb] text-[#47464b] uppercase tracking-widest font-semibold">
              auth
            </span>
          </div>

          <p className="font-mono text-xs text-[#78767b] max-w-xs">
            Codebase Intelligence &amp; Architectural AST Static Analysis Platform
          </p>
        </div>

        {/* Card Box */}
        <div className="mt-8 bg-[#ffffff] py-8 px-6 sm:px-8 border border-[#c8c5cb] rounded-lg shadow-sm">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-[#ece8e1] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-center font-mono text-xs font-semibold tracking-wider transition-all border-b-2 ${
                mode === 'login'
                  ? 'border-[#835331] text-[#835331]'
                  : 'border-transparent text-[#78767b] hover:text-[#1c1c18]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-center font-mono text-xs font-semibold tracking-wider transition-all border-b-2 ${
                mode === 'register'
                  ? 'border-[#835331] text-[#835331]'
                  : 'border-transparent text-[#78767b] hover:text-[#1c1c18]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 bg-[#fff0f0] border border-[#ba1a1a]/30 rounded text-[#ba1a1a] flex items-start space-x-2.5 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name field (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block font-mono text-xs font-medium text-[#47464b] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative rounded">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#78767b]">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                    className="block w-full pl-9 pr-3 py-2 bg-[#fdf9f2] border border-[#c8c5cb] rounded text-sm text-[#1c1c18] placeholder-[#78767b]/60 focus:outline-none focus:border-[#835331] focus:ring-1 focus:ring-[#835331] font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block font-mono text-xs font-medium text-[#47464b] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative rounded">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#78767b]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@company.com"
                  className="block w-full pl-9 pr-3 py-2 bg-[#fdf9f2] border border-[#c8c5cb] rounded text-sm text-[#1c1c18] placeholder-[#78767b]/60 focus:outline-none focus:border-[#835331] focus:ring-1 focus:ring-[#835331] font-mono text-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-mono text-xs font-medium text-[#47464b] uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <span className="font-mono text-[10px] text-[#78767b]">min 6 characters</span>
                )}
              </div>
              <div className="relative rounded">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#78767b]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 bg-[#fdf9f2] border border-[#c8c5cb] rounded text-sm text-[#1c1c18] placeholder-[#78767b]/60 focus:outline-none focus:border-[#835331] focus:ring-1 focus:ring-[#835331] font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#78767b] hover:text-[#1c1c18]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block font-mono text-xs font-medium text-[#47464b] uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative rounded">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#78767b]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 bg-[#fdf9f2] border border-[#c8c5cb] rounded text-sm text-[#1c1c18] placeholder-[#78767b]/60 focus:outline-none focus:border-[#835331] focus:ring-1 focus:ring-[#835331] font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-[#1c1c18] text-[#fdf9f2] hover:bg-[#2b2b30] rounded text-xs font-mono font-medium transition-all shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#febf94]" />
                    <span>{mode === 'login' ? 'Authenticating...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Enter Workspace' : 'Create &amp; Authenticate'}</span>
                    <ArrowRight className="w-4 h-4 text-[#febf94]" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-6 pt-4 border-t border-[#ece8e1]">
            <div className="bg-[#f7f3ec] p-3 rounded border border-[#c8c5cb]/60 flex flex-col space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#47464b]">
                <span className="flex items-center space-x-1.5 font-semibold">
                  <KeyRound className="w-3.5 h-3.5 text-[#835331]" />
                  <span>Quick Test Account:</span>
                </span>
                <button
                  type="button"
                  onClick={handleFillDemoAccount}
                  className="text-[#835331] hover:underline font-semibold text-[10px] uppercase tracking-wider"
                >
                  Click to Auto-fill
                </button>
              </div>
              <div className="text-[10px] font-mono text-[#78767b] flex justify-between bg-[#ffffff] px-2 py-1 rounded border border-[#ece8e1]">
                <span>email: engineer@devlens.internal</span>
                <span>pass: devlens123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Verification Guarantee */}
        <div className="mt-6 flex items-center justify-center space-x-2 font-mono text-[11px] text-[#78767b]">
          <ShieldCheck className="w-4 h-4 text-[#835331]" />
          <span>PBKDF2-SHA512 Cryptographic Authentication</span>
        </div>
      </div>
    </div>
  );
};
