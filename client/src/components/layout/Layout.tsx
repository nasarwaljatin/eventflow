import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen bg-slate-900 overflow-hidden font-sans">
      {/* Dynamic Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-45 scale-105 transition-all duration-700 blur-sm pointer-events-none"
        style={{ backgroundImage: `url('/hero-bg.png')` }}
      />
      {/* Dark Ambient Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-900/60 to-indigo-950/70 pointer-events-none" />

      {/* Main Glass Layout Container */}
      <div className="relative z-10 flex w-full h-full min-w-0">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 backdrop-blur-md bg-white/40 shadow-2xl border-t border-white/20">
            <div className="max-w-7xl mx-auto space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
