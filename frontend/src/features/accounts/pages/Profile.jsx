import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../config/axios';
import { 
  User, 
  MapPin, 
  Phone, 
  FileText, 
  Globe, 
  Github, 
  Linkedin, 
  Plus, 
  Trash2, 
  Check, 
  Camera, 
  GraduationCap, 
  Briefcase 
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  
  // Tab states: 'profile', 'education', 'experience'
  const [activeTab, setActiveTab] = useState('profile');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Basic Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [jobTitle, setJobTitle] = useState(''); // Recruiter specific

  // Skills (Candidate specific)
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');

  // Profile Picture File
  const [picFile, setPicFile] = useState(null);
  const [picPreview, setPicPreview] = useState('');

  // Education list (Candidate specific)
  const [educationList, setEducationList] = useState([]);
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduInstitution, setEduInstitution] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduStart, setEduStart] = useState('');
  const [eduEnd, setEduEnd] = useState('');
  const [eduCurrent, setEduCurrent] = useState(false);

  // Experience list (Candidate specific)
  const [experienceList, setExperienceList] = useState([]);
  const [showExpForm, setShowExpForm] = useState(false);
  const [expCompany, setExpCompany] = useState('');
  const [expPosition, setExpPosition] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);
  const [expDescription, setExpDescription] = useState('');

  // Initialize fields
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      
      if (user.role === 'candidate') {
        const cp = user.candidate_profile || {};
        setPhone(cp.phone_number || '');
        setLocation(cp.location || '');
        setHeadline(cp.headline || '');
        setSummary(cp.summary || '');
        setGithub(cp.github_url || '');
        setLinkedin(cp.linkedin_url || '');
        setPortfolio(cp.portfolio_url || '');
        setSkills(cp.skills || []);
        setPicPreview(cp.profile_picture || '');
        fetchEducation();
        fetchExperience();
      } else if (user.role === 'recruiter') {
        const rp = user.recruiter_profile || {};
        setJobTitle(rp.job_title || '');
      }
    }
  }, [user]);

  const fetchEducation = async () => {
    try {
      const res = await api.get('/accounts/education/');
      setEducationList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExperience = async () => {
    try {
      const res = await api.get('/accounts/experience/');
      setExperienceList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Picture selection
  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPicFile(file);
      setPicPreview(URL.createObjectURL(file));
    }
  };

  // Submit Profile Changes
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      let data;
      if (user.role === 'candidate') {
        // We use FormData to support image upload
        data = new FormData();
        data.append('first_name', firstName);
        data.append('last_name', lastName);
        data.append('phone_number', phone);
        data.append('location', location);
        data.append('headline', headline);
        data.append('summary', summary);
        data.append('github_url', github);
        data.append('linkedin_url', linkedin);
        data.append('portfolio_url', portfolio);
        
        // Append skills array as JSON string
        data.append('skills', JSON.stringify(skills));
        
        if (picFile) {
          data.append('profile_picture', picFile);
        }
      } else {
        data = {
          first_name: firstName,
          last_name: lastName,
          job_title: jobTitle,
        };
      }

      await updateProfile(data);
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      await refreshUser();
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to update profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Skill tag add/remove
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Education CRUD
  const handleAddEducation = async (e) => {
    e.preventDefault();
    try {
      const data = {
        institution: eduInstitution,
        degree: eduDegree,
        field_of_study: eduField,
        start_date: eduStart,
        end_date: eduCurrent ? null : eduEnd,
        is_current: eduCurrent
      };
      await api.post('/accounts/education/', data);
      
      // Reset form
      setEduInstitution('');
      setEduDegree('');
      setEduField('');
      setEduStart('');
      setEduEnd('');
      setEduCurrent(false);
      setShowEduForm(false);
      
      fetchEducation();
      refreshUser();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to add education record. Check date formatting.');
    }
  };

  const handleDeleteEducation = async (id) => {
    if (window.confirm('Delete this education record?')) {
      try {
        await api.delete(`/accounts/education/${id}/`);
        fetchEducation();
        refreshUser();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Experience CRUD
  const handleAddExperience = async (e) => {
    e.preventDefault();
    try {
      const data = {
        company: expCompany,
        position: expPosition,
        location: expLocation,
        start_date: expStart,
        end_date: expCurrent ? null : expEnd,
        is_current: expCurrent,
        description: expDescription
      };
      await api.post('/accounts/experience/', data);
      
      // Reset form
      setExpCompany('');
      setExpPosition('');
      setExpLocation('');
      setExpStart('');
      setExpEnd('');
      setExpCurrent(false);
      setExpDescription('');
      setShowExpForm(false);
      
      fetchExperience();
      refreshUser();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to add experience record. Check date formatting.');
    }
  };

  const handleDeleteExperience = async (id) => {
    if (window.confirm('Delete this experience record?')) {
      try {
        await api.delete(`/accounts/experience/${id}/`);
        fetchExperience();
        refreshUser();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div class="max-w-4xl mx-auto py-4">
      {/* Profile Header card */}
      <div class="glass border border-slate-800/80 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
        {user?.role === 'candidate' && (
          <div class="relative shrink-0 group">
            {picPreview ? (
              <img 
                src={picPreview} 
                alt="Profile" 
                class="w-24 h-24 rounded-2xl object-cover border border-slate-700 shadow-lg"
              />
            ) : (
              <div class="w-24 h-24 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-slate-800 flex items-center justify-center font-bold text-3xl">
                {user?.first_name?.[0]}
              </div>
            )}
            <label class="absolute inset-0 bg-slate-950/70 text-slate-200 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[10px] font-semibold gap-1">
              <Camera size={16} />
              Change Photo
              <input type="file" accept="image/*" onChange={handlePictureChange} class="hidden" />
            </label>
          </div>
        )}

        <div class="text-center md:text-left flex-grow">
          <div class="flex flex-col md:flex-row md:items-center gap-2">
            <h2 class="font-display font-bold text-2xl text-white">
              {user?.first_name} {user?.last_name}
            </h2>
            <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold self-center md:self-auto capitalize">
              {user?.role}
            </span>
          </div>
          <p class="text-slate-400 text-sm mt-1">{user?.email}</p>
          {user?.role === 'candidate' && (
            <div class="flex items-center gap-4 mt-3 text-xs text-slate-500 justify-center md:justify-start">
              {location && (
                <span class="flex items-center gap-1">
                  <MapPin size={13} />
                  {location}
                </span>
              )}
              <span class="text-slate-400 font-semibold">
                Profile Completion: {user?.candidate_profile?.completion_percentage || 0}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs list (Candidate only gets multi-tab) */}
      {user?.role === 'candidate' && (
        <div class="flex border-b border-slate-800 mb-6 gap-2">
          {['profile', 'education', 'experience'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              class={`pb-3 px-4 text-sm font-semibold capitalize relative cursor-pointer ${
                activeTab === tab ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Feedback notice */}
      {feedback.message && (
        <div class={`mb-6 p-4 rounded-xl text-xs ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* TAB 1: Profile Data Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} class="space-y-6">
          <div class="glass border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 class="font-display font-semibold text-white text-base border-b border-slate-800 pb-2">Personal Credentials</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                />
              </div>
            </div>

            {user?.role === 'recruiter' && (
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Lead HR Manager"
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                />
              </div>
            )}

            {user?.role === 'candidate' && (
              <>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label class="text-xs text-slate-300 font-medium">Contact Phone</label>
                    <div class="relative">
                      <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Phone size={14} /></span>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs text-slate-300 font-medium">Location</label>
                    <div class="relative">
                      <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><MapPin size={14} /></span>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="San Francisco, CA"
                        class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-xs text-slate-300 font-medium">Profile Headline</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><FileText size={14} /></span>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Senior Full Stack Engineer | Python & React Specialist"
                      class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                    />
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-xs text-slate-300 font-medium">Professional Summary</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={4}
                    placeholder="Describe your history, accomplishments, and career objectives..."
                    class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none resize-y"
                  ></textarea>
                </div>
              </>
            )}
          </div>

          {user?.role === 'candidate' && (
            <>
              {/* Skills Tags Segment */}
              <div class="glass border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 class="font-display font-semibold text-white text-base border-b border-slate-800 pb-2">Skills Inventory</h3>
                
                {/* Form to add */}
                <div class="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="e.g. Python, Docker, Machine Learning"
                    class="flex-grow px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                  />
                  <button
                    onClick={handleAddSkill}
                    class="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>

                {/* Tags grid */}
                <div class="flex flex-wrap gap-2 pt-2">
                  {skills.length === 0 ? (
                    <span class="text-slate-500 text-xs">No skills tagged yet. Add skills to compute matching indexes.</span>
                  ) : (
                    skills.map(s => (
                      <span key={s} class="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium hover:border-slate-700 transition-colors">
                        {s}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSkill(s)}
                          class="hover:text-rose-400 cursor-pointer text-slate-500 font-bold ml-1"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Online Social Handles */}
              <div class="glass border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 class="font-display font-semibold text-white text-base border-b border-slate-800 pb-2">Social Portfolios</h3>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="space-y-1">
                    <label class="text-xs text-slate-300 font-medium flex items-center gap-1"><Github size={13} /> Github</label>
                    <input
                      type="url"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/username"
                      class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-xs text-slate-100 outline-none"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs text-slate-300 font-medium flex items-center gap-1"><Linkedin size={13} /> Linkedin</label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-xs text-slate-100 outline-none"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs text-slate-300 font-medium flex items-center gap-1"><Globe size={13} /> Portfolio</label>
                    <input
                      type="url"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="https://mywebsite.com"
                      class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-xs text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white font-semibold text-sm shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Check size={16} /> Save Profiles
              </>
            )}
          </button>
        </form>
      )}

      {/* TAB 2: Education List & Add Form */}
      {activeTab === 'education' && (
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="font-display font-semibold text-lg text-white">Education History</h3>
            <button
              onClick={() => setShowEduForm(!showEduForm)}
              class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> Add School
            </button>
          </div>

          {showEduForm && (
            <form onSubmit={handleAddEducation} class="glass border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
              <h4 class="font-semibold text-sm text-indigo-400 flex items-center gap-1"><GraduationCap size={16} /> Add School Credentials</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-xs text-slate-300">Institution Name</label>
                  <input
                    type="text"
                    required
                    value={eduInstitution}
                    onChange={(e) => setEduInstitution(e.target.value)}
                    placeholder="Stanford University"
                    class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-slate-300">Degree</label>
                  <input
                    type="text"
                    required
                    value={eduDegree}
                    onChange={(e) => setEduDegree(e.target.value)}
                    placeholder="Bachelor of Science"
                    class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                  />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-slate-300">Field of Study</label>
                <input
                  type="text"
                  required
                  value={eduField}
                  onChange={(e) => setEduField(e.target.value)}
                  placeholder="Computer Science"
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div class="space-y-1">
                  <label class="text-xs text-slate-300">Start Date</label>
                  <input
                    type="date"
                    required
                    value={eduStart}
                    onChange={(e) => setEduStart(e.target.value)}
                    class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-slate-300">End Date</label>
                  <input
                    type="date"
                    disabled={eduCurrent}
                    required={!eduCurrent}
                    value={eduEnd}
                    onChange={(e) => setEduEnd(e.target.value)}
                    class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none disabled:opacity-30"
                  />
                </div>
                <div class="flex items-center gap-2 py-3">
                  <input
                    type="checkbox"
                    id="eduCurrent"
                    checked={eduCurrent}
                    onChange={(e) => setEduCurrent(e.target.checked)}
                    class="rounded border-slate-800 bg-slate-950/60 text-indigo-500 focus:ring-indigo-500"
                  />
                  <label htmlFor="eduCurrent" class="text-xs text-slate-300 cursor-pointer select-none">Currently studying</label>
                </div>
              </div>
              
              <div class="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEduForm(false)}
                  class="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Add Record
                </button>
              </div>
            </form>
          )}

          {/* List display */}
          <div class="space-y-4">
            {educationList.length === 0 ? (
              <div class="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
                No education history listed.
              </div>
            ) : (
              educationList.map(edu => (
                <div key={edu.id} class="glass border border-slate-850 p-5 rounded-2xl flex justify-between items-start gap-4">
                  <div class="space-y-1">
                    <h4 class="font-semibold text-white text-sm">{edu.degree} in {edu.field_of_study}</h4>
                    <p class="text-indigo-400 text-xs font-medium">{edu.institution}</p>
                    <p class="text-[11px] text-slate-500 font-mono">
                      {edu.start_date} &mdash; {edu.is_current ? 'Present' : edu.end_date}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteEducation(edu.id)}
                    class="p-2 rounded-xl border border-transparent hover:border-slate-800 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Experience List & Add Form */}
      {activeTab === 'experience' && (
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="font-display font-semibold text-lg text-white">Experience History</h3>
            <button
              onClick={() => setShowExpForm(!showExpForm)}
              class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> Add Role
            </button>
          </div>

          {showExpForm && (
            <form onSubmit={handleAddExperience} class="glass border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
              <h4 class="font-semibold text-sm text-indigo-400 flex items-center gap-1"><Briefcase size={16} /> Add Professional Role</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-xs text-slate-300">Company Name</label>
                  <input
                    type="text"
                    required
                    value={expCompany}
                    onChange={(e) => setExpCompany(e.target.value)}
                    placeholder="Google"
                    class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-slate-300">Position / Title</label>
                  <input
                    type="text"
                    required
                    value={expPosition}
                    onChange={(e) => setExpPosition(e.target.value)}
                    placeholder="Senior Software Engineer"
                    class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                  />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-slate-300">Location (Optional)</label>
                <input
                  type="text"
                  value={expLocation}
                  onChange={(e) => setExpLocation(e.target.value)}
                  placeholder="New York, NY (or Remote)"
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div class="space-y-1">
                  <label class="text-xs text-slate-300">Start Date</label>
                  <input
                    type="date"
                    required
                    value={expStart}
                    onChange={(e) => setExpStart(e.target.value)}
                    class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-slate-300">End Date</label>
                  <input
                    type="date"
                    disabled={expCurrent}
                    required={!expCurrent}
                    value={expEnd}
                    onChange={(e) => setExpEnd(e.target.value)}
                    class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none disabled:opacity-30"
                  />
                </div>
                <div class="flex items-center gap-2 py-3">
                  <input
                    type="checkbox"
                    id="expCurrent"
                    checked={expCurrent}
                    onChange={(e) => setExpCurrent(e.target.checked)}
                    class="rounded border-slate-800 bg-slate-950/60 text-indigo-500 focus:ring-indigo-500"
                  />
                  <label htmlFor="expCurrent" class="text-xs text-slate-300 cursor-pointer select-none">Currently in this role</label>
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs text-slate-300">Job Description</label>
                <textarea
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  rows={3}
                  placeholder="Responsibilities, stack used, and achievements..."
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none resize-y"
                ></textarea>
              </div>
              
              <div class="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpForm(false)}
                  class="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Add Record
                </button>
              </div>
            </form>
          )}

          {/* List display */}
          <div class="space-y-4">
            {experienceList.length === 0 ? (
              <div class="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
                No experience history listed.
              </div>
            ) : (
              experienceList.map(exp => (
                <div key={exp.id} class="glass border border-slate-850 p-5 rounded-2xl flex justify-between items-start gap-4">
                  <div class="space-y-1">
                    <h4 class="font-semibold text-white text-sm">{exp.position}</h4>
                    <p class="text-indigo-400 text-xs font-medium">{exp.company} &bull; <span class="text-slate-500 text-[11px] font-normal">{exp.location}</span></p>
                    <p class="text-[11px] text-slate-500 font-mono">
                      {exp.start_date} &mdash; {exp.is_current ? 'Present' : exp.end_date}
                    </p>
                    {exp.description && (
                      <p class="text-slate-400 text-xs mt-2.5 leading-relaxed bg-slate-950/30 p-3 rounded-lg border border-slate-900/60">
                        {exp.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteExperience(exp.id)}
                    class="p-2 rounded-xl border border-transparent hover:border-slate-800 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
