import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '../hooks/useDebounce';
import { getAllRegistrations, confirmRegistration, checkInRegistration, cancelRegistration } from '../api/registrations';
import { getEvents } from '../api/events';
import { getSessionsByEvent } from '../api/sessions';
import { RegistrationFilters, Registration } from '../types';
import { Search, ChevronLeft, ChevronRight, Check, X, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { RegistrationDetailModal } from '../components/RegistrationDetailModal';

export default function RegistrationsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const [filters, setFilters] = useState<RegistrationFilters>({
    page: 1,
    limit: 25,
    order: 'desc',
    sort: 'reserved_at'
  });

  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    setFilters(f => ({ ...f, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents()
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions', filters.event],
    queryFn: () => getSessionsByEvent(filters.event!),
    enabled: !!filters.event
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['registrations', filters],
    queryFn: () => getAllRegistrations(filters)
  });

  const confirmMutation = useMutation({
    mutationFn: confirmRegistration,
    onSuccess: () => {
      toast.success('Registration confirmed');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    }
  });

  const checkInMutation = useMutation({
    mutationFn: checkInRegistration,
    onSuccess: () => {
      toast.success('Checked in successfully');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRegistration,
    onSuccess: () => {
      toast.success('Registration cancelled');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    }
  });

  const handleSort = (field: string) => {
    setFilters(f => ({
      ...f,
      sort: field,
      order: f.sort === field && f.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
          <p className="text-slate-600 mt-1">Manage all event registrations</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          className="border border-slate-300 rounded-md px-3 py-2"
          value={filters.event || ''}
          onChange={(e) => setFilters(f => ({ ...f, event: e.target.value, session: undefined, page: 1 }))}
        >
          <option value="">All Events</option>
          {Array.isArray(events) && events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        <select
          className="border border-slate-300 rounded-md px-3 py-2"
          value={filters.session || ''}
          onChange={(e) => setFilters(f => ({ ...f, session: e.target.value, page: 1 }))}
          disabled={!filters.event}
        >
          <option value="">All Sessions</option>
          {sessions?.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>

        <select
          className="border border-slate-300 rounded-md px-3 py-2"
          value={filters.status || ''}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
        >
          <option value="">All Statuses</option>
          <option value="reserved">Reserved</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th onClick={() => handleSort('attendee_name')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
                  Attendee {filters.sort === 'attendee_name' && (filters.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th onClick={() => handleSort('status')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
                  Status {filters.sort === 'status' && (filters.order === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('reserved_at')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
                  Reserved At {filters.sort === 'reserved_at' && (filters.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">Loading...</td>
                </tr>
              ) : response?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">No registrations found</td>
                </tr>
              ) : (
                response?.data.map((reg: Registration) => (
                  <tr key={reg.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedRegistration(reg)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {reg.attendeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {reg.attendeeEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${reg.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          reg.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                          reg.status === 'cancelled' || reg.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                        {reg.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {format(new Date(reg.reservedAt), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                      {reg.status === 'reserved' && (
                        <button
                          onClick={() => confirmMutation.mutate(reg.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Confirm"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      {(reg.status === 'reserved' || reg.status === 'confirmed') && (
                        <button
                          onClick={() => checkInMutation.mutate(reg.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Check In"
                        >
                          <UserCheck size={18} />
                        </button>
                      )}
                      {(reg.status === 'reserved' || reg.status === 'confirmed') && (
                        <button
                          onClick={() => cancelMutation.mutate(reg.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {response?.meta && (
          <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing <span className="font-medium">{((response.meta.page - 1) * response.meta.limit) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(response.meta.page * response.meta.limit, response.meta.total)}</span> of{' '}
                  <span className="font-medium">{response.meta.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setFilters(f => ({ ...f, page: f.page! - 1 }))}
                    disabled={response.meta.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                    Page {response.meta.page} of {response.meta.totalPages}
                  </span>
                  <button
                    onClick={() => setFilters(f => ({ ...f, page: f.page! + 1 }))}
                    disabled={response.meta.page === response.meta.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {selectedRegistration && (
        <RegistrationDetailModal 
          registration={selectedRegistration} 
          onClose={() => setSelectedRegistration(null)} 
        />
      )}
    </div>
  );
}
