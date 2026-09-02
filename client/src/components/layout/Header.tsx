import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Header({ setSidebarOpen }: { setSidebarOpen: (o: boolean) => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center">
        <button className="lg:hidden text-slate-500 hover:text-slate-700 mr-4" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-slate-900">{user?.fullName}</div>
          <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
        </div>
        <button onClick={logout} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
