import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome to EventFlow, {user?.fullName}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's an overview of your events and registrations.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <dt className="text-sm font-medium text-slate-500 truncate">Sessions Today</dt>
          <dd className="mt-2 text-3xl font-semibold text-slate-900">0</dd>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <dt className="text-sm font-medium text-slate-500 truncate">Checked In</dt>
          <dd className="mt-2 text-3xl font-semibold text-slate-900">0</dd>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <dt className="text-sm font-medium text-slate-500 truncate">Expired This Week</dt>
          <dd className="mt-2 text-3xl font-semibold text-slate-900">0</dd>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <dt className="text-sm font-medium text-slate-500 truncate">At Capacity</dt>
          <dd className="mt-2 text-3xl font-semibold text-slate-900">0</dd>
        </div>
      </div>
    </div>
  );
}
