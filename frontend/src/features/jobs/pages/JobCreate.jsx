import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../config/axios';
import { Briefcase, MapPin, DollarSign, ListChecks, FileText, CheckCircle, ArrowLeft } from 'lucide-react';

const JobCreate = () => {
  const navigate = useNavigate();

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState('onsite');
  const [employmentType, setEmploymentType] = useState('full-time');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [skillsRequiredText, setSkillsRequiredText] = useState('');
  const [status, setStatus] = useState('published'); // default to publish

  // Status indicators
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Parse comma separated skills list
    const skills_required = skillsRequiredText
      ? skillsRequiredText.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const data = {
      title,
      description,
      requirements,
      location,
      work_type: workType,
      employment_type: employmentType,
      experience_level: experienceLevel,
      min_salary: minSalary ? parseFloat(minSalary) : null,
      max_salary: maxSalary ? parseFloat(maxSalary) : null,
      currency,
      skills_required,
      status
    };

    try {
      const res = await api.post('/jobs/', data);
      navigate(`/jobs/${res.data.id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create job posting. Make sure your account is linked to a Company profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="max-w-3xl mx-auto py-4 space-y-6 animate-in fade-in duration-300">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          class="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs font-semibold bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div class="glass border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
        <div>
          <h1 class="font-display font-bold text-2xl text-white">Create New Job Posting</h1>
          <p class="text-xs text-slate-400 mt-1">Publish a vacancy to candidates matched with smart analytics matching.</p>
        </div>

        {error && (
          <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-5">
          
          {/* Title */}
          <div class="space-y-1">
            <label class="text-xs text-slate-300 font-medium">Job Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer (Django)"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
            />
          </div>

          {/* Type selections */}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Work Type */}
            <div class="space-y-1">
              <label class="text-xs text-slate-300 font-medium">Work Style</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                class="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-300 outline-none"
              >
                <option value="onsite">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Employment Type */}
            <div class="space-y-1">
              <label class="text-xs text-slate-300 font-medium">Job Classification</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                class="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-300 outline-none"
              >
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            {/* Experience Level */}
            <div class="space-y-1">
              <label class="text-xs text-slate-300 font-medium">Desired Seniority</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                class="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-300 outline-none"
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>

          {/* Location & Salary Range */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div class="space-y-1">
              <label class="text-xs text-slate-300 font-medium flex items-center gap-1"><MapPin size={13} /> Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA (or Remote)"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
              />
            </div>

            {/* Salary Grid */}
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium flex items-center gap-0.5"><DollarSign size={13} /> Min Salary</label>
                <input
                  type="number"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  placeholder="80000"
                  class="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium flex items-center gap-0.5"><DollarSign size={13} /> Max Salary</label>
                <input
                  type="number"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  placeholder="120000"
                  class="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Skills Required */}
          <div class="space-y-1">
            <label class="text-xs text-slate-300 font-medium flex items-center gap-1"><ListChecks size={13} /> Required Skills (comma separated)</label>
            <input
              type="text"
              required
              value={skillsRequiredText}
              onChange={(e) => setSkillsRequiredText(e.target.value)}
              placeholder="Python, Django, PostgreSQL, REST APIs, Docker"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
            />
          </div>

          {/* Description */}
          <div class="space-y-1">
            <label class="text-xs text-slate-300 font-medium flex items-center gap-1"><FileText size={13} /> Job Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Outline the responsibilities, project scope, team layout, and stack..."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none resize-y"
            ></textarea>
          </div>

          {/* Requirements */}
          <div class="space-y-1">
            <label class="text-xs text-slate-300 font-medium flex items-center gap-1"><ListChecks size={13} /> Requirements / Qualifications</label>
            <textarea
              required
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={4}
              placeholder="Outline experience years, education prerequisites, and must-have technological skillsets..."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none resize-y"
            ></textarea>
          </div>

          {/* Submit / status segment */}
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-850">
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-400 font-medium">Publishing Status:</span>
              <div class="flex border border-slate-800 rounded-lg bg-slate-950 p-1">
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  class={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                    status === 'published' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Published
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  class={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                    status === 'draft' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Draft
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              class="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white font-semibold text-sm shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle size={16} /> Publish Post
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default JobCreate;
