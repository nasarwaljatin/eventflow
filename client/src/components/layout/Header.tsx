import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Header({ setSidebarOpen }: { setSidebarOpen: (o: boolean) => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white/60 backdrop-blur-lg border-b border-white/30 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <div className="flex items-center">
        <button className="lg:hidden text-slate-700 hover:text-slate-900 mr-4 p-1.5 rounded-lg bg-white/40 border border-white/40 backdrop-blur-md" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-slate-900 drop-shadow-sm">{user?.fullName}</div>
          <div className="text-xs font-medium text-slate-700 capitalize">{user?.role?.replace('_', ' ')}</div>
        </div>
        <button onClick={logout} className="p-2 text-slate-700 hover:text-red-600 hover:bg-white/50 rounded-full transition-all border border-white/30 backdrop-blur-md shadow-sm">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
