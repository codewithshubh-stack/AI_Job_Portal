import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../config/axios';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Calendar, 
  Video, 
  MapPin, 
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Mail,
  SlidersHorizontal,
  UserPlus
} from 'lucide-react';

const ApplicationsList = () => {
  const { user } = useAuth();
  
  // Base states
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' or 'interviews'

  // Filter state (For recruiters)
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobs, setJobs] = useState([]);

  // Expanded History ID
  const [expandedAppId, setExpandedAppId] = useState(null);

  // Status transition form states
  const [transitionNotes, setTransitionNotes] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Interview Scheduler Modal States
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleAppId, setScheduleAppId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewType, setInterviewType] = useState('online');
  const [locationField, setLocationField] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchInterviews();
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications/');
      setApplications(res.data);
      
      // Extract unique list of jobs for filtering
      if (user.role === 'recruiter') {
        const uniqueJobs = [];
        const map = new Map();
        for (const app of res.data) {
          if (!map.has(app.job.id)) {
            map.set(app.job.id, true);
            uniqueJobs.push({ id: app.job.id, title: app.job.title });
          }
        }
        setJobs(uniqueJobs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async () => {
    try {
      const res = await api.get('/applications/interviews/');
      setInterviews(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleWithdraw = async (id) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      try {
        await api.patch(`/applications/${id}/withdraw/`);
        fetchApplications();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || 'Failed to withdraw application.');
      }
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setSubmittingStatus(true);
    try {
      await api.patch(`/applications/${id}/status/`, {
        status: newStatus,
        notes: transitionNotes || `Status updated to ${newStatus}`
      });
      setTransitionNotes('');
      fetchApplications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Invalid status transition.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleOpenScheduleModal = (appId) => {
    setScheduleAppId(appId);
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setScheduling(true);
    try {
      await api.post('/applications/interviews/', {
        application_id: scheduleAppId,
        scheduled_at: scheduledAt,
        interview_type: interviewType,
        location: locationField,
        meeting_link: meetingLink
      });
      setShowScheduleModal(false);
      setScheduledAt('');
      setLocationField('');
      setMeetingLink('');
      fetchApplications();
      fetchInterviews();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to schedule interview. Check date formatting.');
    } finally {
      setScheduling(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'applied':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'screening':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'interview':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse';
      case 'offered':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'rejected':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'withdrawn':
        return 'bg-slate-800 text-slate-500 border border-slate-700/60';
      default:
        return 'bg-slate-900 text-slate-400 border border-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'applied':
        return <Clock size={14} class="text-indigo-400" />;
      case 'screening':
        return <Clock size={14} class="text-blue-400" />;
      case 'interview':
        return <Calendar size={14} class="text-amber-400" />;
      case 'offered':
        return <CheckCircle2 size={14} class="text-emerald-400" />;
      case 'rejected':
        return <XCircle size={14} class="text-rose-400" />;
      default:
        return <HelpCircle size={14} class="text-slate-500" />;
    }
  };

  // Filter application list for recruiters
  const filteredApplications = selectedJobId 
    ? applications.filter(app => app.job.id === selectedJobId)
    : applications;

  return (
    <div class="max-w-5xl mx-auto py-4 space-y-6 animate-in fade-in duration-300">
      
      {/* Header and tab switcher */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="font-display font-bold text-2xl text-white">
            {user.role === 'recruiter' ? 'Applicants Pipeline' : 'My Job Applications'}
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">Track application histories, transition logs, and upcoming meetings.</p>
        </div>

        {/* Pipeline vs interview switcher */}
        <div class="flex border border-slate-800 rounded-xl bg-slate-900/60 p-1">
          <button
            onClick={() => setActiveTab('pipeline')}
            class={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === 'pipeline' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            class={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === 'interviews' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Interviews ({interviews.length})
          </button>
        </div>
      </div>

      {activeTab === 'pipeline' ? (
        <div class="space-y-4">
          {/* Recruiter Filters Row */}
          {user.role === 'recruiter' && jobs.length > 0 && (
            <div class="flex items-center gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
              <span class="text-xs text-slate-400 font-semibold flex items-center gap-1"><SlidersHorizontal size={13} /> Filter by Job:</span>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                class="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 text-xs outline-none"
              >
                <option value="">All Posted Jobs</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <div class="flex justify-center py-20"><div class="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>
          ) : filteredApplications.length === 0 ? (
            <div class="text-center py-16 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
              No applications in this pipeline.
            </div>
          ) : (
            <div class="space-y-4">
              {filteredApplications.map((app) => {
                const isExpanded = expandedAppId === app.id;
                return (
                  <div key={app.id} class="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
                    
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Left: Job & Applicant Info */}
                      <div class="space-y-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <h4 class="font-semibold text-white text-sm">
                            {user.role === 'candidate' ? app.job.title : `${app.candidate_profile.user.first_name} ${app.candidate_profile.user.last_name}`}
                          </h4>
                          {app.ai_match_score !== null && (
                            <span class="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold flex items-center gap-0.5">
                              <Sparkles size={9} />
                              {Math.round(app.ai_match_score)}% Match
                            </span>
                          )}
                        </div>
                        <p class="text-xs text-slate-400 font-medium">
                          {user.role === 'candidate' ? app.job.company.name : app.job.title}
                        </p>
                        <p class="text-[10px] text-slate-500 font-mono">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                      </div>

                      {/* Right: Badge and Main Action */}
                      <div class="flex items-center gap-3 self-end sm:self-auto">
                        <span class={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(app.status)}`}>
                          {getStatusIcon(app.status)}
                          <span class="capitalize">{app.status}</span>
                        </span>

                        {user.role === 'candidate' && app.status !== 'withdrawn' && app.status !== 'rejected' && (
                          <button
                            onClick={() => handleWithdraw(app.id)}
                            class="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expand History details bar */}
                    <div class="flex justify-between items-center pt-3 border-t border-slate-850/60 text-xs">
                      <button
                        onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                        class="text-[10px] font-semibold text-slate-500 hover:text-slate-300 flex items-center gap-0.5 cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {isExpanded ? 'Hide History Log' : 'View History Log'}
                      </button>

                      {user.role === 'recruiter' && app.resume && (
                        <a 
                          href={app.resume.file_url} 
                          target="_blank" 
                          rel="noreferrer"
                          class="text-[10px] text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          <FileText size={12} /> View PDF Resume
                        </a>
                      )}
                    </div>

                    {/* Expand Details Panel */}
                    {isExpanded && (
                      <div class="mt-2 p-4 rounded-xl bg-slate-950/60 border border-slate-850/80 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        {/* Cover Letter display */}
                        {app.cover_letter && (
                          <div class="text-xs space-y-1">
                            <span class="text-slate-500 font-semibold block">Cover Letter:</span>
                            <p class="text-slate-350 italic p-3 bg-slate-900/40 rounded-lg border border-slate-900/50 whitespace-pre-wrap">{app.cover_letter}</p>
                          </div>
                        )}

                        {/* Transition History timeline */}
                        <div class="text-xs space-y-2">
                          <span class="text-slate-500 font-semibold block">Transition timeline:</span>
                          <div class="relative border-l border-slate-800 pl-4 ml-2 space-y-3">
                            {(app.history || []).map((h) => (
                              <div key={h.id} class="relative">
                                <div class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-slate-950"></div>
                                <p class="text-slate-300 font-medium">{h.notes}</p>
                                <div class="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                                  <span>{h.changed_by?.first_name || 'System'}</span>
                                  <span>&bull;</span>
                                  <span>{new Date(h.created_at).toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recruiter Workflow Actions form */}
                        {user.role === 'recruiter' && (
                          <div class="pt-3 border-t border-slate-850 space-y-3">
                            <span class="text-slate-500 font-semibold block text-xs">Pipeline Actions:</span>
                            
                            <div class="flex flex-col gap-2">
                              <textarea
                                value={transitionNotes}
                                onChange={(e) => setTransitionNotes(e.target.value)}
                                placeholder="Add optional logs or remarks for this transition..."
                                class="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 outline-none"
                                rows={2}
                              ></textarea>
                              
                              <div class="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(app.id, 'screening')}
                                  disabled={submittingStatus || app.status !== 'applied'}
                                  class="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold cursor-pointer disabled:opacity-30"
                                >
                                  Move to Screening
                                </button>
                                <button
                                  onClick={() => handleOpenScheduleModal(app.id)}
                                  disabled={submittingStatus || (app.status !== 'screening' && app.status !== 'applied')}
                                  class="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-[10px] font-bold cursor-pointer disabled:opacity-30 flex items-center gap-0.5"
                                >
                                  <Calendar size={11} /> Schedule Interview
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(app.id, 'offered')}
                                  disabled={submittingStatus || app.status !== 'interview'}
                                  class="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold cursor-pointer disabled:opacity-30"
                                >
                                  Offer Job
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                  disabled={submittingStatus || app.status === 'rejected' || app.status === 'withdrawn'}
                                  class="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-[10px] font-bold cursor-pointer disabled:opacity-30"
                                >
                                  Reject Applicant
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* INTERVIEWS TAB LIST */
        <div class="space-y-4">
          {interviews.length === 0 ? (
            <div class="text-center py-16 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
              No interviews scheduled.
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviews.map((meet) => (
                <div key={meet.id} class="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
                  <div class="flex justify-between items-start gap-4">
                    <div class="space-y-1">
                      <span class="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                        {meet.application?.job?.company?.name || 'Employer'}
                      </span>
                      <h4 class="font-semibold text-white text-sm">{meet.application?.job?.title}</h4>
                      {user.role === 'recruiter' && (
                        <p class="text-xs text-slate-400">Candidate: {meet.application?.candidate_profile?.user?.first_name} {meet.application?.candidate_profile?.user?.last_name}</p>
                      )}
                    </div>
                    
                    <div class="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                      <Calendar size={18} />
                    </div>
                  </div>

                  <div class="h-px bg-slate-850"></div>

                  <div class="space-y-2 text-xs text-slate-400">
                    <div class="flex items-center gap-2">
                      <Clock size={13} class="text-slate-500" />
                      <span>{new Date(meet.scheduled_at).toLocaleString()}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      {meet.interview_type === 'online' ? (
                        <>
                          <Video size={13} class="text-slate-500" />
                          <span class="capitalize">Online (Meeting Room)</span>
                        </>
                      ) : (
                        <>
                          <MapPin size={13} class="text-slate-500" />
                          <span class="capitalize">On-site meeting</span>
                        </>
                      )}
                    </div>
                    {meet.meeting_link && (
                      <div class="flex items-center gap-2 pt-1.5">
                        <a
                          href={meet.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          class="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <Video size={11} /> Join Video Call
                        </a>
                      </div>
                    )}
                    {meet.location && (
                      <p class="text-[10px] text-slate-500 italic pl-5">Location details: {meet.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {showScheduleModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)}></div>
          <div class="glass border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
            <h3 class="font-display font-semibold text-lg text-white mb-4">Schedule Interview</h3>
            
            <form onSubmit={handleScheduleSubmit} class="space-y-4">
              {/* DateTime */}
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">Scheduled Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-100 outline-none"
                />
              </div>

              {/* Type */}
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">Type</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  class="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-300 outline-none"
                >
                  <option value="online">Online Video Meeting</option>
                  <option value="onsite">On-site meeting</option>
                </select>
              </div>

              {/* Conditional parameters */}
              {interviewType === 'online' ? (
                <div class="space-y-1">
                  <label class="text-xs text-slate-300 font-medium">Meeting URL (Optional)</label>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-100 outline-none"
                  />
                </div>
              ) : (
                <div class="space-y-1">
                  <label class="text-xs text-slate-300 font-medium">Office Location Details</label>
                  <input
                    type="text"
                    required
                    value={locationField}
                    onChange={(e) => setLocationField(e.target.value)}
                    placeholder="Building 4, HQ Room, 5th Floor"
                    class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-100 outline-none"
                  />
                </div>
              )}

              <div class="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  class="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {scheduling ? 'Scheduling...' : 'Schedule & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApplicationsList;
