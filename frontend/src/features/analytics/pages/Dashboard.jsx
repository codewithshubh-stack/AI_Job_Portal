import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../config/axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title 
} from 'chart.js';
import { 
  Briefcase, 
  FileText, 
  CheckCircle, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  X, 
  RotateCw,
  Eye,
  TrendingUp,
  Award,
  Calendar,
  User,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Activity,
  CheckCircle2
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [refreshingRecs, setRefreshingRecs] = useState(false);
  const [details, setDetails] = useState(null);
  const [candidateList, setCandidateList] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateSkillFilter, setCandidateSkillFilter] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (user.role === 'candidate') {
        const statsRes = await api.get('/analytics/candidate/dashboard/');
        setStats(statsRes.data);
        const recsRes = await api.get('/analytics/candidate/recommendations/');
        setRecommendations(recsRes.data);
        const detailsRes = await api.get('/analytics/candidate/dashboard-details/');
        setDetails(detailsRes.data);
      } else {
        const statsRes = await api.get('/analytics/recruiter/dashboard/');
        setStats(statsRes.data);
        const rankRes = await api.get('/analytics/recruiter/candidate-ranking/');
        setCandidateList(rankRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateRanking = async () => {
    try {
      const params = {};
      if (candidateSearch) params.search = candidateSearch;
      if (candidateSkillFilter) params.skill = candidateSkillFilter;
      const res = await api.get('/analytics/recruiter/candidate-ranking/', { params });
      setCandidateList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshRecommendations = async () => {
    setRefreshingRecs(true);
    try {
      await api.post('/analytics/candidate/recommendations/refresh/');
      const recsRes = await api.get('/analytics/candidate/recommendations/');
      setRecommendations(recsRes.data);
      const detailsRes = await api.get('/analytics/candidate/dashboard-details/');
      setDetails(detailsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshingRecs(false);
    }
  };

  const handleDismissRecommendation = async (id) => {
    try {
      await api.patch(`/analytics/candidate/recommendations/${id}/dismiss/`);
      setRecommendations(recommendations.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div class="flex items-center justify-center min-h-[500px]">
        <div class="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- CANDIDATE DASHBOARD VIEW ---
  if (user.role === 'candidate') {
    const statusCounts = stats?.by_status || {};
    const resumeInfo = details?.resume_analysis || {};
    const skillGap = details?.skill_gap || {};
    
    return (
      <div class="space-y-8 animate-in fade-in duration-500">
        {/* Welcome Section */}
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="font-display font-bold text-3xl text-white">
              Hello, <span class="text-gradient-primary">{user.first_name}</span> 👋
            </h1>
            <p class="text-slate-400 text-sm mt-1">Here is a summary of your AI matching status and job applications.</p>
          </div>
          <div class="flex gap-2.5">
            <Link
              to="/interview-prep"
              class="px-4 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/5"
            >
              <Award size={14} />
              AI Interview Prep
            </Link>
            <Link
              to="/career-advisor"
              class="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              AI Career Roadmap
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div class="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Briefcase size={22} />
            </div>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Applications</p>
              <h3 class="text-2xl font-bold text-white mt-0.5">{stats?.total_applications || 0}</h3>
            </div>
          </div>

          <div class="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div class="p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl">
              <FileText size={22} />
            </div>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Uploaded Resumes</p>
              <h3 class="text-2xl font-bold text-white mt-0.5">{stats?.total_resumes || 0}</h3>
            </div>
          </div>

          <div class="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp size={22} />
            </div>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Average Match Score</p>
              <h3 class="text-2xl font-bold text-white mt-0.5">
                {stats?.avg_match_score !== null ? `${stats.avg_match_score}%` : 'N/A'}
              </h3>
            </div>
          </div>

          <div class="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div class="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <CheckCircle size={22} />
            </div>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Profile Completion</p>
              <h3 class="text-2xl font-bold text-white mt-0.5">{stats?.profile_completion || 0}%</h3>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: Recommendations & Recent Applications */}
          <div class="lg:col-span-2 space-y-8">
            {/* Recommendations Board */}
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="font-display font-semibold text-lg text-white flex items-center gap-2">
                  <Sparkles size={18} class="text-indigo-400" />
                  AI Job Recommendations
                </h3>
                <button
                  onClick={handleRefreshRecommendations}
                  disabled={refreshingRecs}
                  class="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RotateCw size={12} class={refreshingRecs ? 'animate-spin' : ''} />
                  Refresh Match
                </button>
              </div>

              <div class="space-y-4">
                {recommendations.length === 0 ? (
                  <div class="glass border border-slate-900/60 p-10 rounded-2xl text-center text-slate-500 text-sm">
                    No matching jobs found. Try expanding your profile skills to get better recommendations.
                  </div>
                ) : (
                  recommendations.map((rec) => {
                    const profileSkills = user.candidate_profile?.skills || [];
                    const requiredSkills = rec.skills_required || [];
                    const missingSkills = requiredSkills.filter(s => !profileSkills.some(ps => ps.toLowerCase() === s.toLowerCase()));
                    const matchedSkills = requiredSkills.filter(s => profileSkills.some(ps => ps.toLowerCase() === s.toLowerCase()));

                    return (
                      <div key={rec.id} class="glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between gap-4 border border-slate-800">
                        <button
                          onClick={() => handleDismissRecommendation(rec.id)}
                          class="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                        
                        <div class="space-y-2">
                          <div class="flex items-center gap-2.5 flex-wrap">
                            <h4 class="font-semibold text-white text-sm hover:text-indigo-400 transition-colors">
                              <Link to={`/jobs/${rec.job}`}>{rec.job_title}</Link>
                            </h4>
                            <span class="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold">
                              {Math.round(rec.score)}% Match
                            </span>
                          </div>
                          
                          <div class="flex justify-between items-center text-xs text-slate-400">
                            <span class="font-medium">{rec.company_name}</span>
                            <span class="font-mono text-indigo-300">
                              {rec.min_salary && rec.max_salary 
                                ? `${rec.currency || 'USD'} ${Number(rec.min_salary).toLocaleString([], {maximumFractionDigits:0})} - ${Number(rec.max_salary).toLocaleString([], {maximumFractionDigits:0})}`
                                : 'Salary: Not disclosed'
                              }
                            </span>
                          </div>

                          <p class="text-xs text-slate-500 italic flex items-center gap-1">
                            <Sparkles size={11} class="text-indigo-400" />
                            {rec.reason}
                          </p>

                          {/* Skill overlap tags */}
                          {requiredSkills.length > 0 && (
                            <div class="flex flex-wrap gap-1.5 pt-1 items-center">
                              <span class="text-[9px] font-bold uppercase tracking-wider text-slate-500 mr-1">Skills:</span>
                              {matchedSkills.map((s, idx) => (
                                <span key={`match-${idx}`} class="px-1.5 py-0.5 text-[9px] rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                  {s}
                                </span>
                              ))}
                              {missingSkills.map((s, idx) => (
                                <span key={`miss-${idx}`} class="px-1.5 py-0.5 text-[9px] rounded bg-slate-950 border border-slate-850 text-slate-500">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div class="flex justify-between items-center pt-2 border-t border-slate-900">
                          <span class="text-[10px] text-slate-500 capitalize">{rec.location} · {rec.work_type}</span>
                          <Link
                            to={`/jobs/${rec.job}`}
                            class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1 transition-colors self-end sm:self-auto cursor-pointer"
                          >
                            Apply Now
                            <ChevronRight size={12} />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Applications Table */}
            <div class="space-y-4">
              <h3 class="font-display font-semibold text-lg text-white">Recent Applications</h3>
              <div class="glass-card rounded-2xl border border-slate-850 overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="border-b border-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-950/20">
                        <th class="px-5 py-3.5">Job Title</th>
                        <th class="px-5 py-3.5">Company</th>
                        <th class="px-5 py-3.5">Match Score</th>
                        <th class="px-5 py-3.5">Status</th>
                        <th class="px-5 py-3.5 text-right">Applied Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details?.recent_applications?.length === 0 ? (
                        <tr>
                          <td colSpan={5} class="px-5 py-8 text-center text-slate-500 text-xs">
                            No applications submitted yet. Browse jobs to apply.
                          </td>
                        </tr>
                      ) : (
                        details?.recent_applications?.map((app) => (
                          <tr key={app.id} class="border-b border-slate-850 hover:bg-slate-900/10 text-xs text-slate-300 transition-colors">
                            <td class="px-5 py-4 font-semibold text-white">
                              <Link to={`/jobs/${app.job_id}`} class="hover:text-indigo-400 transition-colors">{app.job_title}</Link>
                            </td>
                            <td class="px-5 py-4">{app.company_name}</td>
                            <td class="px-5 py-4">
                              {app.ai_match_score ? (
                                <span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold text-[10px]">
                                  {Math.round(app.ai_match_score)}%
                                </span>
                              ) : (
                                <span class="text-slate-500">N/A</span>
                              )}
                            </td>
                            <td class="px-5 py-4">
                              <span class={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                app.status === 'selected' || app.status === 'offered'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : app.status === 'rejected'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : app.status === 'interview'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-indigo-500/10 text-indigo-400'
                              }`}>
                                {app.status_display}
                              </span>
                            </td>
                            <td class="px-5 py-4 text-right text-slate-500 font-mono">
                              {new Date(app.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Resume Analysis Dashboard */}
            <div class="space-y-4">
              <h3 class="font-display font-semibold text-lg text-white">Resume Analysis Dashboard</h3>
              {resumeInfo.has_resume ? (
                <div class="glass border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
                  {/* Scores gauge widgets */}
                  <div class="flex flex-col sm:flex-row gap-6 items-center border-b border-slate-850 pb-5">
                    {/* Circle Gauge: Resume score */}
                    <div class="flex items-center gap-4">
                      <div class="relative w-20 h-20 flex items-center justify-center shrink-0">
                        {/* Circle SVG */}
                        <svg class="absolute w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="34" class="stroke-slate-950 fill-transparent" strokeWidth="6"></circle>
                          <circle cx="40" cy="40" r="34" class="stroke-indigo-500 fill-transparent" strokeWidth="6" strokeDasharray="213" strokeDashoffset={213 - (213 * resumeInfo.resume_score) / 100} strokeLinecap="round"></circle>
                        </svg>
                        <span class="text-lg font-bold text-white font-display">{resumeInfo.resume_score}</span>
                      </div>
                      <div>
                        <h4 class="text-sm font-bold text-white">Resume Score</h4>
                        <p class="text-[10px] text-slate-500 mt-0.5">Overall parsing and structured formatting quality score.</p>
                      </div>
                    </div>

                    <div class="hidden sm:block h-10 w-px bg-slate-850"></div>

                    {/* Circle Gauge: ATS score */}
                    <div class="flex items-center gap-4">
                      <div class="relative w-20 h-20 flex items-center justify-center shrink-0">
                        <svg class="absolute w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="34" class="stroke-slate-950 fill-transparent" strokeWidth="6"></circle>
                          <circle cx="40" cy="40" r="34" class="stroke-fuchsia-500 fill-transparent" strokeWidth="6" strokeDasharray="213" strokeDashoffset={213 - (213 * resumeInfo.ats_score) / 100} strokeLinecap="round"></circle>
                        </svg>
                        <span class="text-lg font-bold text-white font-display">{resumeInfo.ats_score}</span>
                      </div>
                      <div>
                        <h4 class="text-sm font-bold text-white">ATS Keywords Score</h4>
                        <p class="text-[10px] text-slate-500 mt-0.5">Matching keywords ratio and format optimization compliance rate.</p>
                      </div>
                    </div>
                  </div>

                  {/* Details grids */}
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div class="space-y-2">
                      <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Strengths</span>
                      <ul class="space-y-1.5">
                        {resumeInfo.strengths?.map((str, idx) => (
                          <li key={idx} class="text-xs text-slate-300 leading-normal flex items-start gap-1.5">
                            <span class="text-emerald-500 font-bold shrink-0">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div class="space-y-2">
                      <span class="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Gaps & Weaknesses</span>
                      <ul class="space-y-1.5">
                        {resumeInfo.weaknesses?.map((wk, idx) => (
                          <li key={idx} class="text-xs text-slate-300 leading-normal flex items-start gap-1.5">
                            <span class="text-rose-500 font-bold shrink-0">✗</span>
                            <span>{wk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div class="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                    <h4 class="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Sparkles size={14} class="text-indigo-400" />
                      Suggested Actionable Revisions
                    </h4>
                    <ul class="space-y-1 pl-4 list-disc">
                      {resumeInfo.suggestions?.map((sug, idx) => (
                        <li key={idx} class="text-xs text-slate-400 leading-relaxed">{sug}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div class="glass border border-slate-800/80 rounded-2xl p-10 text-center text-slate-500 space-y-3">
                  <p class="text-xs">You must upload a PDF resume first to compute resume scoring metrics.</p>
                  <Link
                    to="/resumes"
                    class="inline-block px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Go to Resumes Page
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Skill Gap, Activity Feed, Pipeline */}
          <div class="space-y-8">
            {/* Quick Stats Funnel */}
            <div class="space-y-4">
              <h3 class="font-display font-semibold text-lg text-white">Application Pipeline</h3>
              <div class="glass-card rounded-2xl p-5 border border-slate-850 space-y-4">
                <div class="space-y-3.5">
                  {[
                    { key: 'applied', label: 'Applied', color: 'bg-indigo-500' },
                    { key: 'screening', label: 'Screening', color: 'bg-blue-500' },
                    { key: 'interview', label: 'Interviews Scheduled', color: 'bg-amber-500' },
                    { key: 'offered', label: 'Offered', color: 'bg-emerald-500' },
                    { key: 'rejected', label: 'Rejected', color: 'bg-rose-500' },
                  ].map((item) => {
                    const count = statusCounts[item.key] || 0;
                    const total = stats?.total_applications || 1;
                    const pct = stats?.total_applications ? (count / total) * 100 : 0;
                    return (
                      <div key={item.key} class="space-y-1">
                        <div class="flex justify-between text-xs font-medium">
                          <span class="text-slate-400">{item.label}</span>
                          <span class="text-white font-semibold">{count}</span>
                        </div>
                        <div class="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div class={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Skill Gap Analysis Section */}
            <div class="space-y-4">
              <h3 class="font-display font-semibold text-lg text-white">Skill Gap Analysis</h3>
              <div class="glass border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-5">
                <div class="space-y-2">
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Your Current Stack</span>
                  <div class="flex flex-wrap gap-1.5">
                    {skillGap.current_skills?.length === 0 ? (
                      <span class="text-xs text-slate-500">No skills defined. Edit profile to add.</span>
                    ) : (
                      skillGap.current_skills?.map((skill, idx) => (
                        <span key={`curr-${idx}`} class="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div class="space-y-2 border-t border-slate-850 pt-3">
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recommended Skills (In Demand)</span>
                  <div class="space-y-2">
                    {skillGap.recommended_skills?.length === 0 ? (
                      <span class="text-xs text-slate-600">Great job! No key skill gaps identified.</span>
                    ) : (
                      skillGap.recommended_skills?.map((recSkill, idx) => (
                        <div key={`rec-${idx}`} class="flex justify-between items-center">
                          <span class="text-xs font-medium text-slate-300">{recSkill.name}</span>
                          <span class={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            recSkill.priority === 'High' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {recSkill.priority} Priority
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div class="p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
                  <p class="text-[11px] font-bold text-slate-400">Advisor Notice:</p>
                  <p class="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{skillGap.learning_priority}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div class="space-y-4">
              <h3 class="font-display font-semibold text-lg text-white">Recent Activity</h3>
              <div class="glass border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {details?.recent_activities?.length === 0 ? (
                  <p class="text-xs text-slate-500 text-center py-4">No recent activity logged.</p>
                ) : (
                  details?.recent_activities?.map((log) => {
                    let logTitle = 'Activity';
                    let logMsg = '';
                    let logIcon = <Activity size={12} class="text-slate-400" />;

                    if (log.event_type === 'resume_uploaded') {
                      logTitle = 'Resume Uploaded';
                      logMsg = `Uploaded new resume: ${log.payload?.file_name || 'Resume'}`;
                      logIcon = <FileText size={12} class="text-fuchsia-400" />;
                    } else if (log.event_type === 'job_applied') {
                      logTitle = 'Applied to Job';
                      logMsg = `Applied for ${log.payload?.job_title || 'Position'} at ${log.payload?.company_name || 'Company'}`;
                      logIcon = <Briefcase size={12} class="text-indigo-400" />;
                    } else if (log.event_type === 'interview_scheduled') {
                      logTitle = 'Interview Scheduled';
                      logMsg = `Interview set for ${log.payload?.job_title} on ${new Date(log.payload?.scheduled_at).toLocaleDateString()}`;
                      logIcon = <Calendar size={12} class="text-blue-400" />;
                    } else if (log.event_type === 'profile_updated') {
                      logTitle = 'Profile Updated';
                      logMsg = 'Modified personal bio or background credentials';
                      logIcon = <User size={12} class="text-emerald-400" />;
                    } else if (log.event_type === 'status_updated') {
                      logTitle = 'Application Updated';
                      logMsg = `Application status updated to ${log.payload?.status}`;
                      logIcon = <Award size={12} class="text-amber-400" />;
                    }

                    return (
                      <div key={log.id} class="flex gap-3 items-start text-xs border-b border-slate-850/40 pb-3 last:border-b-0 last:pb-0">
                        <div class="p-1.5 rounded-lg bg-slate-950 border border-slate-850 shrink-0">
                          {logIcon}
                        </div>
                        <div class="min-w-0 flex-grow">
                          <p class="font-semibold text-white">{logTitle}</p>
                          <p class="text-[10px] text-slate-400 mt-0.5 leading-normal">{logMsg}</p>
                          <span class="text-[9px] text-slate-500 font-mono mt-1 block">
                            {new Date(log.created_at).toLocaleDateString()} at {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RECRUITER DASHBOARD VIEW ---
  const funnelData = stats?.application_funnel || {};
  const statusCounts = stats?.jobs_by_status || {};

  const barChartData = {
    labels: ['Applied', 'Screening', 'Interview', 'Offered', 'Rejected'],
    datasets: [
      {
        label: 'Candidates',
        data: [
          funnelData.applied || 0,
          funnelData.screening || 0,
          funnelData.interview || 0,
          funnelData.offered || 0,
          funnelData.rejected || 0,
        ],
        backgroundColor: [
          'rgba(99, 102, 241, 0.45)', // indigo
          'rgba(59, 130, 246, 0.45)', // blue
          'rgba(245, 158, 11, 0.45)', // amber
          'rgba(16, 185, 129, 0.45)', // emerald
          'rgba(239, 68, 68, 0.45)',  // rose
        ],
        borderColor: [
          '#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ef4848'
        ],
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Outfit' },
        bodyFont: { family: 'Inter' },
        borderColor: '#1e293b',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.03)' }
      },
      y: {
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.03)' }
      }
    }
  };

  const doughnutData = {
    labels: ['Draft', 'Published', 'Closed'],
    datasets: [
      {
        data: [
          statusCounts.draft || 0,
          statusCounts.published || 0,
          statusCounts.closed || 0,
        ],
        backgroundColor: [
          'rgba(148, 163, 184, 0.2)', // slate
          'rgba(99, 102, 241, 0.5)',  // indigo
          'rgba(239, 68, 68, 0.2)',   // rose
        ],
        borderColor: ['#64748b', '#6366f1', '#ef4848'],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 10 },
          padding: 12
        }
      }
    }
  };

  return (
    <div class="space-y-8 animate-in fade-in duration-500">
      {/* Recruiter Welcome */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="font-display font-bold text-3xl text-white">
            Workspace: <span class="text-gradient-primary">{user.first_name}</span> 💼
          </h1>
          <p class="text-slate-400 text-sm mt-1">Monitor job pipelines, application funnel rates, and vacancy listings.</p>
        </div>
        <Link
          to="/jobs/create"
          class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          Create Vacancy
        </Link>
      </div>

      {/* Recruiter Stats Board */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div class="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Briefcase size={22} />
          </div>
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Listings</p>
            <h3 class="text-2xl font-bold text-white mt-0.5">{stats?.total_jobs || 0}</h3>
          </div>
        </div>

        <div class="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div class="p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl">
            <CheckCircle size={22} />
          </div>
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Applications Received</p>
            <h3 class="text-2xl font-bold text-white mt-0.5">{stats?.total_applications || 0}</h3>
          </div>
        </div>

        <div class="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div class="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Interview Stage</p>
            <h3 class="text-2xl font-bold text-white mt-0.5">{funnelData.interview || 0}</h3>
          </div>
        </div>
      </div>

      {/* Charts Panels */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="glass-card rounded-2xl p-5 border border-slate-850 lg:col-span-2 space-y-4">
          <h3 class="font-display font-semibold text-sm text-white">Hiring Pipeline Funnel</h3>
          <div class="h-64 flex items-center justify-center">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        <div class="glass-card rounded-2xl p-5 border border-slate-850 space-y-4">
          <h3 class="font-display font-semibold text-sm text-white">Listing Breakdown</h3>
          <div class="h-64 relative">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Recruiter Candidate Rankings Pool */}
      <div class="glass-card rounded-2xl p-6 border border-slate-850 space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 class="font-display font-semibold text-sm text-white">AI Candidate Matching Pool</h3>
            <p class="text-[10px] text-slate-500 mt-0.5 font-medium">Scan and rank candidates from the matching index pool.</p>
          </div>
          
          <div class="flex gap-2 items-center flex-wrap w-full sm:w-auto">
            {/* Search */}
            <div class="relative shrink-0 text-xs">
              <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500"><Search size={12} /></span>
              <input
                type="text"
                placeholder="Search candidate..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                class="pl-7 pr-3 py-1.5 w-36 rounded-lg border border-slate-800 bg-slate-950/60 focus:bg-slate-950 focus:border-indigo-500 text-xs text-white outline-none placeholder-slate-650"
              />
            </div>
            
            {/* Skill filter */}
            <div class="relative shrink-0 text-xs">
              <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500"><Filter size={12} /></span>
              <input
                type="text"
                placeholder="Filter by skill..."
                value={candidateSkillFilter}
                onChange={(e) => setCandidateSkillFilter(e.target.value)}
                class="pl-7 pr-3 py-1.5 w-32 rounded-lg border border-slate-800 bg-slate-950/60 focus:bg-slate-950 focus:border-indigo-500 text-xs text-white outline-none placeholder-slate-655"
              />
            </div>

            <button
              onClick={fetchCandidateRanking}
              class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-semibold text-[11px] cursor-pointer hover:bg-slate-850 transition-colors"
            >
              Scan
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-800 text-slate-500 text-xs font-semibold">
                <th class="pb-3 px-2">Candidate Name</th>
                <th class="pb-3 px-2">Headline</th>
                <th class="pb-3 px-2">Experience</th>
                <th class="pb-3 px-2">Primary Skills</th>
                <th class="pb-3 px-2">Matching Score</th>
                <th class="pb-3 px-2 text-right">Resume</th>
              </tr>
            </thead>
            <tbody>
              {candidateList.length === 0 ? (
                <tr>
                  <td colSpan={6} class="py-6 text-center text-slate-500 text-sm">
                    No matching candidates found in database registry.
                  </td>
                </tr>
              ) : (
                candidateList.map((cand) => (
                  <tr key={cand.id} class="border-b border-slate-850 hover:bg-slate-900/20 text-xs text-slate-300 transition-colors">
                    <td class="py-3.5 px-2 font-medium text-white flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {cand.first_name[0]}
                      </div>
                      <div>
                        <p>{cand.first_name} {cand.last_name}</p>
                        <p class="text-[10px] text-slate-500">{cand.email}</p>
                      </div>
                    </td>
                    <td class="py-3.5 px-2 text-slate-400">{cand.headline || 'Software Engineer'}</td>
                    <td class="py-3.5 px-2">{cand.experience_years} Years</td>
                    <td class="py-3.5 px-2 max-w-[200px] truncate">
                      <div class="flex gap-1 flex-wrap overflow-hidden max-h-6">
                        {cand.skills?.slice(0, 3).map((s, idx) => (
                          <span key={idx} class="px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 text-[9px] border border-slate-850">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td class="py-3.5 px-2">
                      <span class={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        cand.match_score >= 80 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : cand.match_score >= 60 
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {Math.round(cand.match_score)}% Match
                      </span>
                    </td>
                    <td class="py-3.5 px-2 text-right">
                      {cand.primary_resume_id ? (
                        <a
                          href={`http://127.0.0.1:8000/api/v1/resumes/${cand.primary_resume_id}/`}
                          target="_blank"
                          rel="noreferrer"
                          class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-850 hover:border-slate-750 text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <Eye size={11} />
                          Resume
                        </a>
                      ) : (
                        <span class="text-[10px] text-slate-500">None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Active Jobs */}
      <div class="glass-card rounded-2xl p-6 border border-slate-850 space-y-4">
        <h3 class="font-display font-semibold text-sm text-white">Top Performing Vacancies</h3>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-800 text-slate-500 text-xs font-semibold">
                <th class="pb-3">Job Title</th>
                <th class="pb-3">Views</th>
                <th class="pb-3">Applications</th>
                <th class="pb-3">Status</th>
                <th class="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats?.top_jobs?.length === 0 ? (
                <tr>
                  <td colSpan={5} class="py-6 text-center text-slate-500 text-sm">
                    No active job listings. Create one to see applicant performance metrics.
                  </td>
                </tr>
              ) : (
                stats?.top_jobs?.map((job) => (
                  <tr key={job.id} class="border-b border-slate-850 hover:bg-slate-900/20 text-xs text-slate-300 transition-colors">
                    <td class="py-4 font-medium text-white">{job.title}</td>
                    <td class="py-4">{job.views_count}</td>
                    <td class="py-4">{job.applications_count}</td>
                    <td class="py-4">
                      <span class={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        job.status === 'published' 
                          ? 'bg-indigo-500/10 text-indigo-400' 
                          : job.status === 'draft' 
                          ? 'bg-slate-800 text-slate-400' 
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td class="py-4 text-right">
                      <Link
                        to={`/jobs/${job.id}`}
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-350 hover:text-white transition-colors"
                      >
                        <Eye size={12} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
