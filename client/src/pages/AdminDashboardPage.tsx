import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminStats, getAdminEvents, approveEvent, rejectEvent, getAdminUsers, updateUserRole } from '../api/admin';
import { Event, User } from '../types';
import { Shield, Calendar, Users, ClipboardList, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const MAIN_TABS = [
  { key: 'EVENTS', label: 'Event Approvals', icon: Calendar },
  { key: 'USERS', label: 'User Role Management', icon: Users },
] as const;

const EVENT_STATUS_TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
] as const;

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<'EVENTS' | 'USERS'>('EVENTS');
  const [eventStatusTab, setEventStatusTab] = useState<string>('PENDING');
  const [rejectModalOpen, setRejectModalOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
  });

  const { data: eventsResponse, isLoading: eventsLoading } = useQuery({
    queryKey: ['adminEvents', eventStatusTab],
    queryFn: () => getAdminEvents(eventStatusTab),
    enabled: mainTab === 'EVENTS',
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: getAdminUsers,
    enabled: mainTab === 'USERS',
  });

  const approveMutation = useMutation({
    mutationFn: approveEvent,
    onSuccess: () => {
      toast.success('Event approved!');
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve event');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectEvent(id, reason),
    onSuccess: () => {
      toast.success('Event rejected');
      setRejectModalOpen(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject event');
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateUserRole(userId, role),
    onSuccess: (data) => {
      toast.success(`Role updated for ${data.fullName}`);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user role');
    },
  });

  const events = eventsResponse?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-indigo-600" />
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">Manage event approvals, user roles, and platform metrics.</p>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Pending Events</dt>
              <dd className="mt-1 text-3xl font-semibold text-slate-900">{stats.events.pending}</dd>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Approved Events</dt>
              <dd className="mt-1 text-3xl font-semibold text-slate-900">{stats.events.approved}</dd>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Total Users</dt>
              <dd className="mt-1 text-3xl font-semibold text-slate-900">{stats.totalUsers}</dd>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Total Registrations</dt>
              <dd className="mt-1 text-3xl font-semibold text-slate-900">{stats.totalRegistrations}</dd>
            </div>
          </div>
        </div>
      )}

      {/* Main Mode Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 pt-3 flex gap-6">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors',
                  mainTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Event Approvals */}
        {mainTab === 'EVENTS' && (
          <div>
            <div className="border-b border-slate-200 px-6">
              <nav className="flex -mb-px gap-4">
                {EVENT_STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setEventStatusTab(tab.key)}
                    className={cn(
                      'py-3 text-sm font-medium border-b-2 transition-colors',
                      eventStatusTab === tab.key
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {tab.label}
                    {stats && (
                      <span className={cn('ml-2 rounded-full px-2 py-0.5 text-xs font-bold',
                        tab.key === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        tab.key === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {tab.key === 'PENDING' ? stats.events.pending :
                         tab.key === 'APPROVED' ? stats.events.approved :
                         stats.events.rejected}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {eventsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-lg font-medium text-slate-500">No {eventStatusTab.toLowerCase()} events</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event: Event) => (
                    <div key={event.id} className="border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">{event.name}</h3>
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                              event.approvalStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              event.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            )}>
                              {event.approvalStatus}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">{event.description}</p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-500">
                            <div>📍 {event.venue}</div>
                            <div>🗓️ {format(new Date(event.startDate), 'MMM d, yyyy')} — {format(new Date(event.endDate), 'MMM d, yyyy')}</div>
                            <div>👤 {typeof event.createdBy === 'object' ? event.createdBy.fullName : 'Unknown'}</div>
                          </div>
                          {event.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-100">
                              <p className="text-sm text-red-700"><strong>Rejection reason:</strong> {event.rejectionReason}</p>
                            </div>
                          )}
                        </div>

                        {event.approvalStatus === 'PENDING' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => approveMutation.mutate(event.id)}
                              disabled={approveMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                              <Check size={16} /> Approve
                            </button>
                            <button
                              onClick={() => setRejectModalOpen(event.id)}
                              disabled={rejectMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                              <X size={16} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: User Role Management */}
        {mainTab === 'USERS' && (
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Manage User Roles</h2>
              <p className="text-sm text-slate-500">Change any user's role to Organizer, Check-in Staff, or Admin.</p>
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              </div>
            ) : !users?.length ? (
              <p className="text-slate-500 text-center py-8">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Auth Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Current Role</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Change Role</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.map((u: User) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{u.fullName}</div>
                          <div className="text-sm text-slate-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">
                          {u.authProvider || 'local'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                            u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'ORGANIZER' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-blue-100 text-blue-800'
                          )}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <select
                            value={u.role}
                            onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value })}
                            disabled={roleMutation.isPending}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="ORGANIZER">Organizer</option>
                            <option value="CHECK_IN_STAFF">Check-in Staff</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Reject Event</h3>
            <p className="text-sm text-slate-600 mb-4">Optionally provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason (optional)..."
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setRejectModalOpen(null); setRejectReason(''); }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectModalOpen, reason: rejectReason || undefined })}
                disabled={rejectMutation.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
