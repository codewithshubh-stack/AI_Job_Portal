import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../config/axios';
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Calendar, 
  Eye, 
  Sparkles,
  Building,
  ArrowLeft,
  FileText,
  CheckCircle,
  MessageSquare
} from 'lucide-react';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Application Modal States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Recruiter States (Applicants viewing)
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${id}/`);
      setJob(res.data);
      
      // If recruiter, check if they own the job listing. If so, fetch applicants.
      if (user?.role === 'recruiter' && res.data.recruiter?.id === user.recruiter_profile?.id) {
        fetchApplicantsForJob();
      }

      // Check if candidate has already applied
      if (user?.role === 'candidate') {
        const appsRes = await api.get('/applications/');
        const alreadyApplied = appsRes.data.some(app => app.job.id === id);
        setHasApplied(alreadyApplied);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicantsForJob = async () => {
    setLoadingApplicants(true);
    try {
      const res = await api.get(`/applications/?job=${id}`);
      setApplicants(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleOpenApplyModal = async () => {
    setShowApplyModal(true);
    setApplyError('');
    try {
      const res = await api.get('/resumes/');
      setResumes(res.data);
      const primaryResume = res.data.find(r => r.is_primary);
      if (primaryResume) {
        setSelectedResumeId(primaryResume.id);
      } else if (res.data.length > 0) {
        setSelectedResumeId(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setApplyError('Please upload a resume first to apply.');
      return;
    }

    setActionLoading(true);
    setApplyError('');
    try {
      await api.post('/applications/', {
        job_id: id,
        resume_id: selectedResumeId,
        cover_letter: coverLetter
      });
      setHasApplied(true);
      setShowApplyModal(false);
      setCoverLetter('');
    } catch (err) {
      console.error(err);
      setApplyError(err.response?.data?.detail || 'Application failed. You might have already applied.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleJobStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/jobs/${id}/`, { status: newStatus });
      setJob(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div class="flex items-center justify-center min-h-[500px]">
        <div class="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div class="text-center py-20">
        <h3 class="text-white font-semibold">Job listing not found.</h3>
        <Link to="/jobs" class="text-indigo-400 text-xs mt-2 inline-block">Back to Job Board</Link>
      </div>
    );
  }

  const isOwner = user?.role === 'recruiter' && job.recruiter?.id === user.recruiter_profile?.id;

  return (
    <div class="max-w-5xl mx-auto py-4 space-y-8 animate-in fade-in duration-300">
      
      {/* Back button */}
      <div>
        <Link to="/jobs" class="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs font-semibold">
          <ArrowLeft size={14} /> Back to Listings
        </Link>
      </div>

      {/* Main details banner card */}
      <div class="glass border border-slate-800/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <Building size={28} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-indigo-400 font-semibold uppercase tracking-wider">{job.company_name || job.company?.name || 'Company'}</span>
              {job.source === 'linkedin' && (
                <span class="px-1.5 py-0.2 rounded text-[8px] font-bold bg-[#0077b5]/15 text-[#0077b5] border border-[#0077b5]/25">LinkedIn</span>
              )}
              {job.source === 'internshala' && (
                <span class="px-1.5 py-0.2 rounded text-[8px] font-bold bg-[#f89c34]/15 text-[#f89c34] border border-[#f89c34]/25">Internshala</span>
              )}
              {(job.source === 'portal' || !job.source) && (
                <span class="px-1.5 py-0.2 rounded text-[8px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">Portal</span>
              )}
            </div>
            <h1 class="font-display font-bold text-2xl text-white mt-0.5">{job.title}</h1>
            
            {/* Metadata row */}
            <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3 font-medium">
              <span class="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
              <span class="flex items-center gap-1 uppercase"><Briefcase size={14} /> {job.work_type}</span>
              <span class="flex items-center gap-1 capitalize"><Clock size={14} /> {job.employment_type}</span>
              {job.min_salary && (
                <span class="flex items-center gap-0.5 text-emerald-400 font-bold">
                  <DollarSign size={14} />
                  {parseFloat(job.min_salary).toLocaleString(undefined, {maximumFractionDigits: 0})} - {parseFloat(job.max_salary).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action button: Candidate Apply vs Recruiter Edit */}
        <div class="w-full md:w-auto flex flex-col gap-2">
          {user?.role === 'candidate' && (
            (job.source === 'linkedin' || job.source === 'internshala') && job.external_url ? (
              <a
                href={job.external_url}
                target="_blank"
                rel="noopener noreferrer"
                class="w-full md:w-auto py-3 px-6 rounded-xl font-semibold text-sm shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white hover:shadow-indigo-500/25 text-center"
              >
                Apply on {job.source === 'linkedin' ? 'LinkedIn' : 'Internshala'}
              </a>
            ) : (
              <button
                onClick={handleOpenApplyModal}
                disabled={hasApplied}
                class={`w-full md:w-auto py-3 px-6 rounded-xl font-semibold text-sm shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  hasApplied 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white hover:shadow-indigo-500/25'
                }`}
              >
                {hasApplied ? (
                  <>
                    <CheckCircle size={16} /> Applied
                  </>
                ) : (
                  'Apply to Vacancy'
                )}
              </button>
            )
          )}

          {isOwner && (
            <div class="flex flex-wrap gap-2">
              {job.status === 'published' ? (
                <button
                  onClick={() => handleToggleJobStatus('closed')}
                  disabled={actionLoading}
                  class="py-2.5 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close Position
                </button>
              ) : (
                <button
                  onClick={() => handleToggleJobStatus('published')}
                  disabled={actionLoading}
                  class="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Re-publish Listing
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Job Information Details vs Side Meta */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Info Column */}
        <div class="lg:col-span-2 space-y-6">
          
          {/* Job Description card */}
          <div class="glass border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 class="font-display font-semibold text-white text-base border-b border-slate-800 pb-2">Description</h3>
            <p class="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Job Requirements card */}
          <div class="glass border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 class="font-display font-semibold text-white text-base border-b border-slate-800 pb-2">Requirements & Qualifications</h3>
            <p class="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
          </div>

          {/* Recruiter specific applicant viewing segment */}
          {isOwner && (
            <div class="glass border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 class="font-display font-semibold text-white text-base border-b border-slate-800 pb-2">Applicants pipeline ({applicants.length})</h3>
              
              {loadingApplicants ? (
                <div class="flex justify-center py-6"><div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : applicants.length === 0 ? (
                <p class="text-slate-500 text-xs py-2">No applications received yet for this vacancy.</p>
              ) : (
                <div class="space-y-3">
                  {applicants.map((app) => (
                    <div key={app.id} class="p-4 rounded-xl border border-slate-850 bg-slate-950/40 flex justify-between items-center gap-4 hover:border-slate-800 transition-colors">
                      <div>
                        <div class="flex items-center gap-2">
                          <p class="font-semibold text-white text-xs">{app.candidate_profile.user.first_name} {app.candidate_profile.user.last_name}</p>
                          <span class="px-1.5 py-0.2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-bold">
                            {Math.round(app.ai_match_score)}% match
                          </span>
                        </div>
                        <p class="text-[10px] text-slate-500 mt-0.5">{app.candidate_profile.user.email}</p>
                      </div>
                      
                      <Link 
                        to="/applications" 
                        class="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
                      >
                        View pipeline &rarr;
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Side Column info */}
        <div class="space-y-6">
          <div class="glass border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 class="font-display font-semibold text-white text-sm">Listing Metadata</h3>
            
            <div class="space-y-3">
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-500 flex items-center gap-1"><Calendar size={13} /> Posted Date</span>
                <span class="text-slate-300 font-mono">{job.published_at ? new Date(job.published_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-500 flex items-center gap-1"><Eye size={13} /> Views Count</span>
                <span class="text-slate-300 font-mono">{job.views_count}</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-500 flex items-center gap-1"><MessageSquare size={13} /> Applications</span>
                <span class="text-slate-300 font-mono">{job.applications_count}</span>
              </div>
            </div>

            <div class="h-px bg-slate-850"></div>

            <div class="space-y-2">
              <span class="text-slate-500 text-xs font-semibold">Skills Required:</span>
              <div class="flex flex-wrap gap-1.5">
                {(job.skills_required || []).map((skill) => (
                  <span key={skill} class="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* APPLY MODAL */}
      {showApplyModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowApplyModal(false)}></div>
          <div class="glass border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
            <h3 class="font-display font-semibold text-lg text-white mb-4">Apply for {job.title}</h3>
            
            {applyError && (
              <div class="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {applyError}
              </div>
            )}

            <form onSubmit={handleApplySubmit} class="space-y-4">
              {/* Select Resume */}
              <div class="space-y-1.5">
                <label class="text-xs text-slate-300 font-medium flex items-center gap-1"><FileText size={14} /> Select Resume</label>
                {resumes.length === 0 ? (
                  <div class="p-3 border border-slate-800 rounded-xl bg-slate-950/60 text-xs text-slate-400">
                    No resumes uploaded yet. Go to <Link to="/resumes" class="text-indigo-400 underline font-semibold">My Resumes</Link> to upload a PDF resume.
                  </div>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    required
                    class="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-300 outline-none"
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.file_name} {r.is_primary ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Cover Letter */}
              <div class="space-y-1.5">
                <label class="text-xs text-slate-300 font-medium">Cover Letter (Optional)</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                  placeholder="Introduce yourself to the hiring team..."
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-xs text-slate-100 outline-none resize-none"
                ></textarea>
              </div>

              <div class="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  class="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || resumes.length === 0}
                  class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobDetail;
