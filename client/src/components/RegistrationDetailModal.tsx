import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRegistrationTimeline, addRegistrationNote } from '../api/registrations';
import { Registration, TimelineEntry } from '../types';
import { format } from 'date-fns';
import { X, Send, Activity, User, FileText, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  registration: Registration;
  onClose: () => void;
}

export function RegistrationDetailModal({ registration, onClose }: Props) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const { data: timeline, isLoading } = useQuery({
    queryKey: ['registrationTimeline', registration.id],
    queryFn: () => getRegistrationTimeline(registration.id),
  });

  const addNoteMutation = useMutation({
    mutationFn: (newNote: string) => addRegistrationNote(registration.id, newNote),
    onSuccess: () => {
      toast.success('Note added successfully');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['registrationTimeline', registration.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add note');
    },
  });

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    addNoteMutation.mutate(note.trim());
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Activity className="w-5 h-5 text-blue-500" />;
      case 'status_changed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'note_added': return <FileText className="w-5 h-5 text-purple-500" />;
      default: return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  const getActionText = (entry: TimelineEntry) => {
    switch (entry.action) {
      case 'created': return 'Registration Created';
      case 'status_changed': return `Status Changed: ${entry.oldStatus || 'None'} → ${entry.newStatus}`;
      case 'note_added': return 'Note Added';
      default: return entry.action;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle flex flex-col max-h-[90vh]">
          
          <div className="bg-white px-4 py-5 sm:px-6 border-b border-slate-200 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-lg font-medium leading-6 text-slate-900">
                Registration Details
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {registration.attendeeName} ({registration.attendeeEmail})
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 py-5 sm:p-6 overflow-y-auto grow">
            <h4 className="text-sm font-medium text-slate-900 mb-4">Audit Timeline</h4>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {timeline?.map((entry, entryIdx) => (
                    <li key={entry.id}>
                      <div className="relative pb-8">
                        {entryIdx !== timeline.length - 1 ? (
                          <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-slate-50">
                              {getActionIcon(entry.action)}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-slate-500">
                                {getActionText(entry)}
                                {entry.note && (
                                  <span className="block mt-1 text-slate-700 italic border-l-2 border-slate-200 pl-3">
                                    "{entry.note}"
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-slate-500">
                              <time dateTime={entry.performedAt}>{format(new Date(entry.performedAt), 'MMM d, h:mm a')}</time>
                              <div className="mt-1 flex items-center justify-end text-xs">
                                <User className="w-3 h-3 mr-1" />
                                {entry.performedBy?.fullName || 'System'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-slate-50 px-4 py-4 sm:px-6 border-t border-slate-200 shrink-0">
            <form onSubmit={handleSubmitNote} className="flex gap-3">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a staff note..."
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                disabled={addNoteMutation.isPending}
              />
              <button
                type="submit"
                disabled={addNoteMutation.isPending || !note.trim()}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                Add Note
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
