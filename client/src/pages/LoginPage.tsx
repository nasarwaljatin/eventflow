import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GoogleAuthButton from '../components/GoogleAuthButton';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        await googleLogin(credentialResponse.credential);
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Google sign-in failed');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Background Hero Image with Glass Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 blur-sm pointer-events-none"
        style={{ backgroundImage: `url('/hero-bg.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-indigo-950/80 pointer-events-none" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-2">
          <span className="bg-indigo-600/90 text-white p-3 rounded-2xl shadow-xl backdrop-blur-md border border-white/20 text-2xl font-black">EF</span>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white drop-shadow-md">Sign in to EventFlow</h2>
        <p className="mt-1 text-center text-sm text-slate-300">Experience event registration with real-time control</p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/70 backdrop-blur-2xl py-8 px-6 shadow-2xl rounded-3xl border border-white/40 sm:px-10">
          {/* Google Sign-In */}
          <GoogleAuthButton onSuccess={handleGoogleSuccess} text="signin_with" mode="login" />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300/60" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/80 backdrop-blur-md px-3 py-0.5 rounded-full text-slate-600 font-medium">Or continue with email</span>
              </div>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Email address</label>
              <div className="mt-1">
                <input {...register('email')} type="email" className="block w-full rounded-xl border border-white/60 bg-white/70 backdrop-blur-md px-4 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm font-medium transition-all" />
                {errors.email && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Password</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} className="block w-full rounded-xl border border-white/60 bg-white/70 backdrop-blur-md px-4 py-2.5 pr-10 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm font-medium transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none text-slate-500 hover:text-slate-700">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.password.message}</p>}
            </div>

            <div>
              <button type="submit" disabled={isSubmitting} className="flex w-full justify-center rounded-xl border border-indigo-500/30 bg-indigo-600/90 hover:bg-indigo-600 backdrop-blur-md py-3 px-4 text-sm font-bold text-white shadow-lg hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-all">
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-slate-600 font-medium">New to EventFlow? </span>
            <Link to="/register" className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
