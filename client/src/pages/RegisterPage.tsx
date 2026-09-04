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
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  role: z.enum(['ORGANIZER', 'CHECK_IN_STAFF']),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerAuth, googleLogin } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CHECK_IN_STAFF' }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    try {
      await registerAuth(data.email, data.password, data.fullName, data.role);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        await googleLogin(credentialResponse.credential, selectedRole);
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Google sign-up failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">Create an account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Account Type / Role</label>
            <div className="mt-1">
              <select {...register('role')} className="block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm font-medium text-slate-900">
                <option value="ORGANIZER">Organizer (Create & Manage Events)</option>
                <option value="CHECK_IN_STAFF">Check-in Staff (Scan & Manage Registrations)</option>
              </select>
            </div>
          </div>

          {/* Google Sign-Up */}
          <GoogleAuthButton onSuccess={handleGoogleSuccess} text="signup_with" mode="register" />

          <div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">Or register with email</span>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <div className="mt-1">
                <input {...register('fullName')} type="text" className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm" />
                {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1">
                <input {...register('email')} type="email" className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-10 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none">
                  {showPassword ? <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-500" /> : <Eye className="h-4 w-4 text-slate-400 hover:text-slate-500" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input {...register('confirmPassword')} type={showConfirmPassword ? 'text' : 'password'} className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-10 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-500" /> : <Eye className="h-4 w-4 text-slate-400 hover:text-slate-500" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <button type="submit" disabled={isSubmitting} className="flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50">
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
