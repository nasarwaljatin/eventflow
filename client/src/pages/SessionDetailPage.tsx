import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSessionById, deleteSession } from '../api/sessions';
import { getRegistrations, confirmRegistration, checkInRegistration, cancelRegistration } from '../api/registrations';
import { useAuth } from '../hooks/useAuth';
import { format, differenceInSeconds } from 'date-fns';
import { Edit, Trash2, CheckCircle, XCircle, UserCheck, Clock, Download, Upload, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { getSessionStaff, assignStaff, removeStaff, importRegistrations, downloadCheckInSheet } from '../api/sessions';
import { getUsersByRole } from '../api/users';
import { ImportResult } from '../types';


const CountdownTimer = ({ reservedAt }: { reservedAt: string }) => {
  const holdMinutes = Number(import.meta.env.VITE_RESERVATION_HOLD_MINUTES) || 30;
  const expiryTime = new Date(new Date(reservedAt).getTime() + holdMinutes * 60 * 1000);
  
  const [timeLeft, setTimeLeft] = useState(() => {
    return Math.max(0, differenceInSeconds(expiryTime, new Date()));
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  if (timeLeft <= 0) {
    return <span className="text-red-500 font-medium">Expired</span>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return (
    <span className="text-yellow-600 font-medium flex items-center gap-1">
      <Clock size={14} />
      Expires in {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
};

export default function SessionDetailPage() {
  const { id: eventId, sid: sessionId } = useParams<{ id: string; sid: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['session', eventId, sessionId],
    queryFn: () => getSessionById(eventId!, sessionId!),
    enabled: !!eventId && !!sessionId,
  });

  const { data: registrations, isLoading: isRegistrationsLoading } = useQuery({
    queryKey: ['registrations', sessionId],
    queryFn: () => getRegistrations(sessionId!),
    enabled: !!sessionId,
  });

  const { data: staff, isLoading: isStaffLoading } = useQuery({
    queryKey: ['session-staff', sessionId],
    queryFn: () => getSessionStaff(sessionId!),
    enabled: !!sessionId && user?.role === 'ORGANIZER',
  });

  const { data: availableStaff } = useQuery({
    queryKey: ['users-staff'],
    queryFn: () => getUsersByRole('CHECK_IN_STAFF'),
    enabled: user?.role === 'ORGANIZER',
  });

  const [activeTab, setActiveTab] = useState<'registrations' | 'staff'>('registrations');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{ summary: any, rows: ImportResult[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteSession(eventId!, sessionId!),
    onSuccess: () => {
      toast.success('Session deleted');
      navigate(`/events/${eventId}`);
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to delete session'),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmRegistration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations', sessionId] });
      toast.success('Registration confirmed');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to confirm'),
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => checkInRegistration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations', sessionId] });
      toast.success('Attendee checked in');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to check in'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelRegistration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session', eventId, sessionId] });
      toast.success('Registration cancelled');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to cancel'),
  });

  const assignStaffMutation = useMutation({
    mutationFn: (userId: string) => assignStaff(sessionId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-staff', sessionId] });
      toast.success('Staff assigned');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to assign staff'),
  });

  const removeStaffMutation = useMutation({
    mutationFn: (userId: string) => removeStaff(sessionId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-staff', sessionId] });
      toast.success('Staff removed');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to remove staff'),
  });

  const handleImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    try {
      const result = await importRegistrations(sessionId!, importFile);
      setImportResults(result);
      queryClient.invalidateQueries({ queryKey: ['registrations', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session', eventId, sessionId] });
      toast.success('Import completed');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      await downloadCheckInSheet(sessionId!, session?.title || 'session');
    } catch (error: any) {
      toast.error('Failed to export check-in sheet');
    }
  };

  if (isSessionLoading) return <div className="text-center py-12">Loading...</div>;
  if (!session) return <div className="text-center py-12">Session not found</div>;

  const activeCount = session.activeRegistrationsCount ?? 0;
  const percentFull = Math.min(100, Math.round((activeCount / session.capacity) * 100));
  let barColor = 'bg-green-500';
  if (percentFull >= 90) barColor = 'bg-red-500';
  else if (percentFull >= 70) barColor = 'bg-yellow-500';

  const canManage = user?.role === 'ORGANIZER' || user?.role === 'CHECK_IN_STAFF';

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/events" className="hover:text-primary-600">Events</Link>
        <span className="mx-2">/</span>
        <Link to={`/events/${eventId}`} className="hover:text-primary-600">Event</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{session.title}</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{session.title}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mt-4">
                <div><strong>Time:</strong> {format(new Date(session.startTime), 'PPp')} ({session.durationMinutes}m)</div>
                <div><strong>Location:</strong> {session.location}</div>
                <div><strong>Capacity:</strong> {activeCount} / {session.capacity}</div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4 max-w-md">
                <div className={cn("h-2.5 rounded-full transition-all", barColor)} style={{ width: `${percentFull}%` }}></div>
              </div>
            </div>
            
            {user?.role === 'ORGANIZER' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/events/${eventId}/sessions/${sessionId}/edit`)}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this session?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-4 border-b border-slate-200 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('registrations')}
              className={cn("pb-2 px-1 text-sm font-medium border-b-2 transition-colors", activeTab === 'registrations' ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700")}
            >
              Registrations
            </button>
            {user?.role === 'ORGANIZER' && (
              <button
                onClick={() => setActiveTab('staff')}
                className={cn("pb-2 px-1 text-sm font-medium border-b-2 transition-colors", activeTab === 'staff' ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700")}
              >
                Staff
              </button>
            )}
          </div>
          
          {activeTab === 'registrations' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Download size={16} /> Export
              </button>
              {user?.role === 'ORGANIZER' && (
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Upload size={16} /> Import
                </button>
              )}
              <button
                onClick={() => navigate(`/events/${eventId}/sessions/${sessionId}/register`)}
                className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                New Registration
              </button>
            </div>
          )}
        </div>
        
        {activeTab === 'registrations' ? (
          isRegistrationsLoading ? (
            <div className="text-center py-8">Loading registrations...</div>
          ) : !registrations?.length ? (
            <div className="py-8 text-center text-slate-500">
              No registrations yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Attendee</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Registered</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{reg.attendeeName}</div>
                        <div className="text-slate-500 text-xs">{reg.attendeeEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                          {
                            'bg-yellow-100 text-yellow-800': reg.status === 'reserved',
                            'bg-blue-100 text-blue-800': reg.status === 'confirmed',
                            'bg-green-100 text-green-800': reg.status === 'checked_in',
                            'bg-slate-100 text-slate-800': reg.status === 'cancelled',
                            'bg-red-100 text-red-800': reg.status === 'expired',
                          }
                        )}>
                          {reg.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {reg.status === 'reserved' && reg.reservedAt && (
                          <div className="mt-1 text-xs">
                            <CountdownTimer reservedAt={reg.reservedAt} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {format(new Date(reg.createdAt), 'MMM d, p')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canManage && (
                          <div className="flex justify-end gap-2">
                            {reg.status === 'reserved' && (
                              <button
                                onClick={() => confirmMutation.mutate(reg.id)}
                                className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                                title="Confirm"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {(reg.status === 'reserved' || reg.status === 'confirmed') && (
                              <button
                                onClick={() => checkInMutation.mutate(reg.id)}
                                className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 py-1 rounded"
                                title="Check In"
                              >
                                <UserCheck size={16} />
                              </button>
                            )}
                            {(reg.status === 'reserved' || reg.status === 'confirmed') && (
                              <button
                                onClick={() => cancelMutation.mutate(reg.id)}
                                className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                                title="Cancel"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Assigned Staff</h3>
            {isStaffLoading ? (
              <div>Loading staff...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-md border border-slate-200">
                  <select 
                    id="staff-select"
                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>Select staff to assign...</option>
                    {availableStaff?.filter(u => !staff?.some(s => s.id === u.id)).map(u => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const select = document.getElementById('staff-select') as HTMLSelectElement;
                      if (select.value) {
                        assignStaffMutation.mutate(select.value);
                        select.value = '';
                      }
                    }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    Assign
                  </button>
                </div>

                {staff?.length === 0 ? (
                  <p className="text-slate-500 text-sm">No staff assigned to this session.</p>
                ) : (
                  <ul className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                    {staff?.map(s => (
                      <li key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary-100 text-primary-700 p-2 rounded-full">
                            <UsersIcon size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{s.fullName}</p>
                            <p className="text-xs text-slate-500">{s.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeStaffMutation.mutate(s.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Import Registrations</h2>
              <button onClick={() => { setImportModalOpen(false); setImportFile(null); setImportResults(null); }} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {!importResults ? (
                <>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload size={32} className="text-slate-400 mb-2" />
                      <span className="text-sm font-medium text-slate-900">
                        {importFile ? importFile.name : 'Click to select CSV file'}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">Expected columns: name, email</span>
                    </label>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setImportModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={!importFile || isImporting}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isImporting ? 'Importing...' : 'Import'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                    <div className="text-center flex-1"><div className="font-bold text-lg">{importResults.summary.total}</div>Total</div>
                    <div className="text-center flex-1 text-green-600"><div className="font-bold text-lg">{importResults.summary.created}</div>Created</div>
                    <div className="text-center flex-1 text-yellow-600"><div className="font-bold text-lg">{importResults.summary.duplicates}</div>Duplicates</div>
                    <div className="text-center flex-1 text-red-600"><div className="font-bold text-lg">{importResults.summary.rejected}</div>Rejected</div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-medium">Row</th>
                          <th className="px-4 py-2 font-medium">Status</th>
                          <th className="px-4 py-2 font-medium">Name/Email</th>
                          <th className="px-4 py-2 font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {importResults.rows.map((row, i) => (
                          <tr key={i} className={row.status === 'created' ? 'bg-green-50/30' : row.status === 'rejected' ? 'bg-red-50/30' : 'bg-yellow-50/30'}>
                            <td className="px-4 py-2">{row.row}</td>
                            <td className="px-4 py-2 capitalize font-medium">{row.status}</td>
                            <td className="px-4 py-2">
                              <div>{row.name}</div>
                              <div className="text-xs text-slate-500">{row.email}</div>
                            </td>
                            <td className="px-4 py-2 text-slate-600 text-xs">{row.reason || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
