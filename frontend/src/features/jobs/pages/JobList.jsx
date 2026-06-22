import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../config/axios';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Filter, 
  ChevronRight,
  SlidersHorizontal,
  Building,
  Globe,
  RefreshCw
} from 'lucide-react';

const JobList = () => {
  const { user } = useAuth();
  
  // Jobs states
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [source, setSource] = useState('');
  const [showRecruiterMyJobs, setShowRecruiterMyJobs] = useState(false);

  // Syncing states
  const [syncing, setSyncing] = useState(false);
  const [syncKeyword, setSyncKeyword] = useState('React');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [workType, employmentType, experienceLevel, source, showRecruiterMyJobs]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let endpoint = '/jobs/';
      let params = {};

      if (user?.role === 'recruiter' && showRecruiterMyJobs) {
        endpoint = '/jobs/my-jobs/';
      } else {
        // Build filters for public list
        if (search) params.search = search;
        if (location) params.location = location;
        if (workType) params.work_type = workType;
        if (employmentType) params.employment_type = employmentType;
        if (experienceLevel) params.experience_level = experienceLevel;
        if (source) params.source = source;
      }

      const res = await api.get(endpoint, { params });
      setJobs(res.data.results || res.data); // handles paginated response or raw list
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleClearFilters = () => {
    setSearch('');
    setLocation('');
    setWorkType('');
    setEmploymentType('');
    setExperienceLevel('');
    setSource('');
    setShowRecruiterMyJobs(false);
    fetchJobs();
  };

  const handleSyncExternalJobs = async () => {
    if (!syncKeyword.trim()) return;
    setSyncing(true);
    setSyncSuccessMsg('');
    try {
      const res = await api.post('/jobs/sync-external/', {
        search: syncKeyword,
        limit: 5,
        source: 'both'
      });
      setSyncSuccessMsg(res.data.detail || `Successfully synced ${res.data.imported_count} jobs.`);
      fetchJobs();
    } catch (err) {
      console.error(err);
      setSyncSuccessMsg('Failed to sync jobs. Please try again later.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div class="space-y-6 animate-in fade-in duration-400">
      {/* Header section */}
      <div class="flex justify-between items-center">
        <div>
          <h1 class="font-display font-bold text-2xl text-white">Explore Open Positions</h1>
          <p class="text-xs text-slate-400 mt-0.5">Find your next role matched with smart skills analysis.</p>
        </div>

        {user?.role === 'recruiter' && (
          <div class="flex border border-slate-800 rounded-xl bg-slate-900/60 p-1">
            <button
              onClick={() => setShowRecruiterMyJobs(false)}
              class={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                !showRecruiterMyJobs ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Public Board
            </button>
            <button
              onClick={() => setShowRecruiterMyJobs(true)}
              class={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                showRecruiterMyJobs ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Postings
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search segment */}
      {!showRecruiterMyJobs && (
        <form onSubmit={handleSearchSubmit} class="glass border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div class="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div class="relative flex-grow">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500"><Search size={16} /></span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job title, description, or keyword..."
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:bg-slate-950 focus:border-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
              />
            </div>
            
            {/* Location Input */}
            <div class="relative w-full md:w-60">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500"><MapPin size={16} /></span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Remote)"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:bg-slate-950 focus:border-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              class="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer"
            >
              Search
            </button>
          </div>

          <div class="h-px bg-slate-850"></div>

          {/* Select Filters row */}
          <div class="flex flex-wrap items-center gap-3 justify-between">
            <div class="flex flex-wrap items-center gap-3 text-xs">
              <span class="text-slate-400 font-semibold flex items-center gap-1"><SlidersHorizontal size={13} /> Filters:</span>
              
              {/* Work Type */}
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                class="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 outline-none"
              >
                <option value="">Work Style</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>

              {/* Employment Type */}
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                class="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 outline-none"
              >
                <option value="">Job Type</option>
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>

              {/* Experience Level */}
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                class="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 outline-none"
              >
                <option value="">Seniority</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>

              {/* Source Filter */}
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                class="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 outline-none"
              >
                <option value="">All Sources</option>
                <option value="portal">TalentAI Portal</option>
                <option value="linkedin">LinkedIn</option>
                <option value="internshala">Internshala</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              class="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </form>
      )}

      {/* Global Job Sync Indexer */}
      {!showRecruiterMyJobs && (
        <div class="glass border border-indigo-500/10 rounded-2xl p-4 shadow-md bg-gradient-to-r from-indigo-950/20 to-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={13} /> Global Job Sync Indexer
            </h2>
            <p class="text-[10px] text-slate-400">Import real-time job listings from LinkedIn and Internshala into our dashboard.</p>
          </div>
          
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={syncKeyword}
              onChange={(e) => setSyncKeyword(e.target.value)}
              placeholder="e.g. React, Python"
              class="w-full sm:w-40 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-200 outline-none"
            />
            <button
              onClick={handleSyncExternalJobs}
              disabled={syncing}
              class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <RefreshCw size={12} class="animate-spin" /> Syncing...
                </>
              ) : (
                'Import Jobs'
              )}
            </button>
          </div>
        </div>
      )}

      {syncSuccessMsg && (
        <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex justify-between items-center animate-in fade-in duration-200">
          <span>{syncSuccessMsg}</span>
          <button onClick={() => setSyncSuccessMsg('')} class="text-[10px] hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Jobs grid view */}
      {loading ? (
        <div class="flex items-center justify-center py-20">
          <div class="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div class="text-center py-16 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
          No matching jobs found. Try adjusting your filter tags.
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job.id} class="glass-card rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between h-56 relative">
              
              <div>
                {/* Company & Title */}
                <div class="flex justify-between items-start gap-4">
                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">{job.company_name || job.company?.name || 'Company'}</span>
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
                    <h3 class="font-display font-bold text-white text-base hover:text-indigo-400 transition-colors truncate max-w-sm">
                      <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                    </h3>
                  </div>
                  {job.company_logo || job.company?.logo ? (
                    <img src={job.company_logo || job.company.logo} alt="Logo" class="w-10 h-10 rounded-xl object-cover border border-slate-800" />
                  ) : (
                    <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                      <Building size={16} />
                    </div>
                  )}
                </div>

                {/* Job Metadata row */}
                <div class="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-4">
                  <span class="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                  <span class="flex items-center gap-1 uppercase"><Briefcase size={12} /> {job.work_type}</span>
                  <span class="flex items-center gap-1 capitalize"><Clock size={12} /> {job.employment_type}</span>
                  {job.min_salary && (
                    <span class="flex items-center gap-0.5 font-medium text-emerald-400">
                      <DollarSign size={12} />
                      {parseFloat(job.min_salary).toLocaleString(undefined, {maximumFractionDigits: 0})} - {parseFloat(job.max_salary).toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                  )}
                </div>

                {/* Skills tags */}
                <div class="flex flex-wrap gap-1.5 mt-4">
                  {(job.skills_required || []).slice(0, 3).map((skill) => (
                    <span key={skill} class="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-medium">
                      {skill}
                    </span>
                  ))}
                  {(job.skills_required || []).length > 3 && (
                    <span class="px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-800/40 text-[10px] text-slate-500">
                      +{(job.skills_required || []).length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* View details button */}
              <div class="flex justify-end pt-3 border-t border-slate-850/40">
                <Link
                  to={`/jobs/${job.id}`}
                  class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  View Details
                  <ChevronRight size={13} />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
