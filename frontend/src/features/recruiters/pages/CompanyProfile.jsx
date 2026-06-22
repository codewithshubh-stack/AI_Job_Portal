import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../config/axios';
import { 
  Building, 
  Globe, 
  MapPin, 
  Users, 
  FileText, 
  Check, 
  Plus, 
  ShieldAlert, 
  User, 
  Camera,
  Layers
} from 'lucide-react';

const CompanyProfile = () => {
  const { user, refreshUser } = useAuth();
  
  // States
  const [company, setCompany] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('view'); // 'view', 'edit', 'register'
  
  // Registration / Edit Form Fields
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [sizeRange, setSizeRange] = useState('11-50');
  const [headquarters, setHeadquarters] = useState('');
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Feedback
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchCompanyData();
  }, [user]);

  const fetchCompanyData = async () => {
    setLoading(true);
    const companyData = user?.recruiter_profile?.company;
    
    if (companyData) {
      setCompany(companyData);
      setName(companyData.name || '');
      setWebsite(companyData.website || '');
      setIndustry(companyData.industry || '');
      setSizeRange(companyData.size_range || '11-50');
      setHeadquarters(companyData.headquarters || '');
      setDescription(companyData.description || '');
      setLogoPreview(companyData.logo || '');
      setActiveTab('view');
      
      // Fetch teammates
      try {
        const teamRes = await api.get('/recruiters/team/');
        setTeam(teamRes.data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setActiveTab('register');
    }
    setLoading(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    const isEdit = activeTab === 'edit';
    const endpoint = isEdit ? `/recruiters/companies/${company.slug}/` : '/recruiters/companies/';
    const method = isEdit ? 'patch' : 'post';

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('website', website);
      formData.append('industry', industry);
      formData.append('size_range', sizeRange);
      formData.append('headquarters', headquarters);
      formData.append('description', description);
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const res = await api[method](endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFeedback({
        type: 'success',
        message: isEdit ? 'Company profiles updated!' : 'Company successfully registered!'
      });

      // Update local storage user context with company details
      await refreshUser();
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || err.response?.data?.slug?.[0] || 'Operation failed. Verify fields.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div class="flex items-center justify-center min-h-[500px]">
        <div class="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAdmin = user?.recruiter_profile?.is_admin;

  return (
    <div class="max-w-4xl mx-auto py-4 space-y-8 animate-in fade-in duration-300">
      
      {/* Tab Select Header */}
      {company && (
        <div class="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('view')}
            class={`pb-3 px-4 text-sm font-semibold capitalize relative cursor-pointer ${
              activeTab === 'view' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Brand Details
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('edit')}
              class={`pb-3 px-4 text-sm font-semibold capitalize relative cursor-pointer ${
                activeTab === 'edit' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Edit Company Info
            </button>
          )}
        </div>
      )}

      {/* FEEDBACK BANNER */}
      {feedback.message && (
        <div class={`p-4 rounded-xl text-xs ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* TABS 1: VIEW DETAILS */}
      {activeTab === 'view' && company && (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main profile */}
          <div class="lg:col-span-2 space-y-6">
            <div class="glass border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex items-start gap-4">
              <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" class="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Building size={28} />
                )}
              </div>
              <div class="space-y-1">
                <h2 class="font-display font-bold text-2xl text-white">{company.name}</h2>
                <span class="inline-block px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-400 capitalize">
                  {industry}
                </span>
                
                <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 font-medium">
                  <span class="flex items-center gap-1"><MapPin size={13} /> {headquarters}</span>
                  <span class="flex items-center gap-1"><Users size={13} /> {sizeRange} employees</span>
                  {website && (
                    <a href={website} target="_blank" rel="noreferrer" class="flex items-center gap-1 text-indigo-400 hover:underline">
                      <Globe size={13} /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div class="glass border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 class="font-display font-semibold text-white text-sm">About corporate</h3>
              <p class="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{company.description}</p>
            </div>
          </div>

          {/* Sidebar: Teammate roster */}
          <div class="space-y-4">
            <h3 class="font-display font-semibold text-sm text-slate-200 flex items-center gap-1.5">
              <Users size={16} class="text-indigo-400" />
              Company Team ({team.length})
            </h3>
            
            <div class="space-y-3">
              {team.map(member => (
                <div key={member.id} class="glass border border-slate-850 p-4 rounded-xl flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-slate-800 flex items-center justify-center font-bold text-xs">
                    {member.first_name[0]}
                  </div>
                  <div class="min-w-0 flex-grow">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <p class="font-semibold text-white text-xs truncate">{member.first_name} {member.last_name}</p>
                      {member.is_admin && (
                        <span class="px-1.5 py-0.2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded text-[8px] font-bold">
                          Admin
                        </span>
                      )}
                    </div>
                    <p class="text-[10px] text-slate-500 truncate">{member.job_title || 'Recruiter'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TABS 2: EDIT & REGISTER FORMS */}
      {(activeTab === 'edit' || activeTab === 'register') && (
        <form onSubmit={handleSubmit} class="glass border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
          <div>
            <h2 class="font-display font-bold text-xl text-white">
              {activeTab === 'edit' ? 'Edit Corporate Profile' : 'Register Your Company'}
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              {activeTab === 'edit' ? 'Update corporate branding guidelines and details.' : 'Boost hiring speed by registering your organization profile.'}
            </p>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-850 pb-5">
            <div class="relative shrink-0 group">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" class="w-16 h-16 rounded-xl object-cover border border-slate-800" />
              ) : (
                <div class="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <Building size={24} />
                </div>
              )}
              <label class="absolute inset-0 bg-slate-950/70 text-slate-200 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[9px] font-semibold gap-0.5">
                <Camera size={14} /> Logo
                <input type="file" accept="image/*" onChange={handleLogoChange} class="hidden" />
              </label>
            </div>
            <div>
              <p class="text-xs font-semibold text-white">Corporate Brand Logo</p>
              <p class="text-[10px] text-slate-500 mt-0.5">PNG or JPEG format image. Max file size 2MB.</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">Company Name</label>
                <input
                  type="text"
                  required
                  disabled={activeTab === 'edit'} // edit disables name modification in standard flows to prevent slug breakdown
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none disabled:opacity-50"
                />
              </div>

              {/* Website */}
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">Corporate Website</label>
                <input
                  type="url"
                  required
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://acme.org"
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Industry */}
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">Industry</label>
                <input
                  type="text"
                  required
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Technology"
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                />
              </div>

              {/* HQ */}
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">Headquarters</label>
                <input
                  type="text"
                  required
                  value={headquarters}
                  onChange={(e) => setHeadquarters(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                />
              </div>

              {/* Size */}
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">Company Size</label>
                <select
                  value={sizeRange}
                  onChange={(e) => setSizeRange(e.target.value)}
                  class="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-300 outline-none"
                >
                  <option value="1-10">1-10 Employees</option>
                  <option value="11-50">11-50 Employees</option>
                  <option value="51-200">51-200 Employees</option>
                  <option value="201-500">201-500 Employees</option>
                  <option value="500+">500+ Employees</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div class="space-y-1">
              <label class="text-xs text-slate-300 font-medium">Company Description</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Give details about your company mission, hiring policies, and team environment..."
                class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-100 outline-none resize-y"
              ></textarea>
            </div>
          </div>

          {/* Submit */}
          <div class="flex justify-end gap-3 pt-3 border-t border-slate-850">
            {activeTab === 'edit' && (
              <button
                type="button"
                onClick={() => setActiveTab('view')}
                class="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-900 cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check size={14} />
                  {activeTab === 'edit' ? 'Update Profile' : 'Register Organization'}
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
};

export default CompanyProfile;
