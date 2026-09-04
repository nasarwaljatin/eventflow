import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, ClipboardList, Bell, X, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getAlertCount } from '../../api/alerts';

export default function Sidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (o: boolean) => void }) {
  const { user } = useAuth();

  const { data: alertCountData } = useQuery({
    queryKey: ['alertCount'],
    queryFn: getAlertCount,
    refetchInterval: 30000,
  });

  const alertCount = alertCountData?.count || 0;

  const links = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', to: '/events', icon: Calendar },
    { name: 'Registrations', to: '/registrations', icon: ClipboardList },
    { name: 'Alerts', to: '/alerts', icon: Bell, badge: alertCount > 0 ? alertCount : undefined },
  ];

  if (user?.role === 'CHECK_IN_STAFF') {
    links.push({ name: 'My Sessions', to: '/my-sessions', icon: Calendar });
  }

  if (user?.role === 'ADMIN') {
    links.push({ name: 'Admin Panel', to: '/admin', icon: Shield });
  }

  return (
    <>
      <div className={cn("fixed inset-0 z-20 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden", sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={() => setSidebarOpen(false)} />
      <aside className={cn("fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white/65 backdrop-blur-xl border-r border-white/30 transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col shadow-xl", !sidebarOpen && "-translate-x-full")}>
        <div className="h-16 flex items-center px-6 border-b border-white/30 justify-between">
          <span className="text-xl font-extrabold text-indigo-700 tracking-tight flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1 rounded-lg shadow-sm">EF</span> EventFlow
          </span>
          <button className="lg:hidden text-slate-600" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.to}
                className={({ isActive }) =>
                  cn("flex flex-1 items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 border",
                    isActive 
                      ? "bg-white/80 text-indigo-700 border-indigo-200 shadow-md backdrop-blur-md" 
                      : "text-slate-700 border-transparent hover:bg-white/50 hover:text-slate-900 hover:border-white/40")
                }
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center">
                  <Icon size={20} className="mr-3" />
                  {link.name}
                </div>
                {link.badge !== undefined && (
                  <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
