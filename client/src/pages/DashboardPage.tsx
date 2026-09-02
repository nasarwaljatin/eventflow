import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '../api/dashboard';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { AlertTriangle, Calendar, CheckCircle, Clock } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  reserved: '#3b82f6', // blue
  confirmed: '#10b981', // green
  checked_in: '#8b5cf6', // purple
  cancelled: '#64748b', // grey
  expired: '#f97316', // orange
};

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: getDashboardMetrics,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard metrics</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome to EventFlow, {user?.fullName}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's an overview of your events and registrations.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500 truncate">Sessions Today</dt>
            <dd className="mt-1 text-3xl font-semibold text-slate-900">{data.headlines.sessionsToday}</dd>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500 truncate">Checked In Today</dt>
            <dd className="mt-1 text-3xl font-semibold text-slate-900">{data.headlines.checkedInToday}</dd>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500 truncate">Expired This Week</dt>
            <dd className="mt-1 text-3xl font-semibold text-slate-900">{data.headlines.expiredThisWeek}</dd>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500 truncate">At Capacity</dt>
            <dd className="mt-1 text-3xl font-semibold text-slate-900">{data.headlines.sessionsAtCapacity}</dd>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Registration Status Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {data.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status.toLowerCase()] || '#94a3b8'} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value, name) => [value, String(name).charAt(0).toUpperCase() + String(name).slice(1).replace('_', ' ')]} />
                <Legend formatter={(value) => String(value).charAt(0).toUpperCase() + String(value).slice(1).replace('_', ' ')} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Registrations by Session (Top 10)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.registrationsBySession}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="title" type="category" width={100} tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="count" name="Registrations" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Check-ins Per Day (Last 14 Days)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.checkinsPerDay}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(val) => {
                const date = new Date(val);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }} />
              <YAxis />
              <RechartsTooltip labelFormatter={(label) => new Date(label as string).toLocaleDateString()} />
              <Line type="monotone" dataKey="count" name="Check-ins" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
