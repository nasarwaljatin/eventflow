import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { Key, X, ExternalLink } from 'lucide-react';

interface GoogleAuthButtonProps {
  onSuccess: (credentialResponse: any) => Promise<void>;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  mode?: 'login' | 'register';
}

export default function GoogleAuthButton({ onSuccess, text = 'continue_with', mode = 'login' }: GoogleAuthButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');

  const activeClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('VITE_GOOGLE_CLIENT_ID');

  const handleSaveClientId = () => {
    const trimmed = clientIdInput.trim();
    if (!trimmed) {
      toast.error('Please enter a valid Google Client ID');
      return;
    }
    localStorage.setItem('VITE_GOOGLE_CLIENT_ID', trimmed);
    toast.success('Google Client ID saved! Reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="w-full">
      {activeClientId ? (
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={onSuccess}
            onError={() => toast.error('Google authentication failed. Check your Client ID settings.')}
            size="large"
            width="100%"
            text={text}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          {mode === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
        </button>
      )}

      {/* Modal for setting Google Client ID if missing */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-4 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 text-indigo-600">
              <Key size={24} />
              <h3 className="text-xl font-bold text-slate-900">Google OAuth Client ID Required</h3>
            </div>

            <p className="text-sm text-slate-600">
              To test or use Google Sign-In, please enter your Google OAuth Client ID below:
            </p>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900 flex items-center gap-1">
                How to get your Client ID:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-600 underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink size={10} /></a></li>
                <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application)</li>
                <li>Add JavaScript origin: <code className="bg-slate-200 px-1 rounded">http://localhost:5173</code> (and your Vercel URL)</li>
                <li>Copy the Client ID and paste it below</li>
              </ol>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Google Client ID
              </label>
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="1234567890-abcdef...apps.googleusercontent.com"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClientId}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Save & Enable Google SSO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
