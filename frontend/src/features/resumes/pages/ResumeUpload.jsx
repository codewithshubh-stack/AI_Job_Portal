import React, { useEffect, useState } from 'react';
import api from '../../../config/axios';
import { 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle, 
  Sparkles, 
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Eye,
  Check
} from 'lucide-react';

const ResumeUpload = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  // File Upload State
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Expand Resume details State
  const [expandedResumeId, setExpandedResumeId] = useState(null);

  // AI Analyzer States
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzerResult, setAnalyzerResult] = useState(null);
  const [analyzerError, setAnalyzerError] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/resumes/');
      setResumes(res.data);
      if (res.data.length > 0) {
        setSelectedResumeId(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setUploadError('');
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setUploadError('Only PDF files are supported.');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setUploadError('File size exceeds the 5MB limit.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a PDF file first.');
      return;
    }

    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/resumes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      fetchResumes();
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.file?.[0] || err.response?.data?.detail || 'Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleMakePrimary = async (id) => {
    try {
      await api.post(`/resumes/${id}/make-primary/`);
      fetchResumes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteResume = async (id) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await api.delete(`/resumes/${id}/`);
        setResumes(resumes.filter(r => r.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRunAIAnalysis = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !jobDescription.trim()) {
      setAnalyzerError('Please select a resume and fill in the job description.');
      return;
    }

    setAnalyzing(true);
    setAnalyzerError('');
    setAnalyzerResult(null);

    try {
      const res = await api.post('/analytics/ai/analyze-resume/', {
        resume_id: selectedResumeId,
        job_description: jobDescription
      });
      setAnalyzerResult(res.data);
    } catch (err) {
      console.error(err);
      setAnalyzerError(err.response?.data?.detail || 'AI Analysis failed. Make sure your resume parsing is completed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleExpandResume = (id) => {
    setExpandedResumeId(expandedResumeId === id ? null : id);
  };

  return (
    <div class="max-w-5xl mx-auto py-4 space-y-8 animate-in fade-in duration-350">
      
      {/* Header segment */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="font-display font-bold text-2xl text-white">Manage My Resumes</h1>
          <p class="text-xs text-slate-400 mt-0.5">Upload resumes and run AI analysis audits against job posts.</p>
        </div>
        
        <button
          onClick={() => setAnalyzerOpen(!analyzerOpen)}
          disabled={resumes.length === 0}
          class="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-indigo-400 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <BrainCircuit size={15} />
          {analyzerOpen ? 'View Resumes List' : 'Open AI Analyzer'}
        </button>
      </div>

      {!analyzerOpen ? (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Uploader Card Column */}
          <div class="space-y-4">
            <h3 class="font-display font-semibold text-base text-slate-200">Upload PDF</h3>
            
            <form onSubmit={handleUploadSubmit} class="glass border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div class="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-indigo-500/30 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload size={32} class="mx-auto text-slate-500 mb-3" />
                <p class="text-xs font-semibold text-slate-300">Drag & drop your resume PDF</p>
                <p class="text-[10px] text-slate-500 mt-1">PDF file format (Max 5MB)</p>
              </div>

              {file && (
                <div class="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-2.5">
                  <FileText size={16} class="text-indigo-400 shrink-0" />
                  <div class="min-w-0 flex-grow">
                    <p class="text-xs text-white truncate font-medium">{file.name}</p>
                    <p class="text-[10px] text-slate-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              )}

              {uploadError && (
                <p class="text-[11px] text-rose-400 bg-rose-500/5 p-2.5 rounded-lg border border-rose-500/20">{uploadError}</p>
              )}

              <button
                type="submit"
                disabled={uploading || !file}
                class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploading ? 'Uploading & Parsing...' : 'Upload PDF'}
              </button>
            </form>
          </div>

          {/* Resumes List Display Column */}
          <div class="lg:col-span-2 space-y-4">
            <h3 class="font-display font-semibold text-base text-slate-200">Uploaded documents</h3>
            
            {loading ? (
              <div class="flex justify-center py-10"><div class="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : resumes.length === 0 ? (
              <div class="text-center py-16 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
                No resumes uploaded yet. Upload a PDF to start matching.
              </div>
            ) : (
              <div class="space-y-4">
                {resumes.map((resume) => {
                  const isExpanded = expandedResumeId === resume.id;
                  return (
                    <div key={resume.id} class="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
                      
                      <div class="flex justify-between items-center gap-4">
                        <div class="flex items-center gap-3">
                          <div class="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                            <FileText size={18} />
                          </div>
                          <div>
                            <h4 class="font-semibold text-white text-sm truncate max-w-sm">{resume.file_name}</h4>
                            <div class="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-mono">
                              <span>{(resume.file_size / 1024).toFixed(0)} KB</span>
                              <span>Uploaded {new Date(resume.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div class="flex items-center gap-1">
                          <button
                            onClick={() => toggleExpandResume(resume.id)}
                            class="p-2 rounded-xl text-slate-500 hover:text-slate-200 cursor-pointer"
                            title="Inspect parsed content"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button
                            onClick={() => handleDeleteResume(resume.id)}
                            class="p-2 rounded-xl text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Delete resume"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Primary resume configuration row */}
                      <div class="flex justify-between items-center pt-3 border-t border-slate-850/60 text-xs">
                        <div class="flex items-center gap-2">
                          <span class={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            resume.parsing_status === 'completed' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : resume.parsing_status === 'failed' 
                              ? 'bg-rose-500/10 text-rose-400' 
                              : 'bg-indigo-500/10 text-indigo-400 animate-pulse'
                          }`}>
                            {resume.parsing_status}
                          </span>
                          
                          {resume.parsing_status === 'completed' && (
                            <a 
                              href={resume.file_url} 
                              target="_blank" 
                              rel="noreferrer"
                              class="text-[10px] text-indigo-400 hover:underline"
                            >
                              Download PDF
                            </a>
                          )}
                        </div>

                        {resume.is_primary ? (
                          <span class="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <Check size={11} /> Primary Application Resume
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMakePrimary(resume.id)}
                            class="text-[10px] font-semibold text-slate-400 hover:text-white cursor-pointer"
                          >
                            Set Primary
                          </button>
                        )}
                      </div>

                      {/* Expanded parsed content view */}
                      {isExpanded && (
                        <div class="mt-2 p-4 rounded-xl bg-slate-950/60 border border-slate-850/80 text-xs space-y-4 animate-in slide-in-from-top-2 duration-300">
                          <div>
                            <span class="text-slate-500 font-semibold block mb-1">Extracted Skills:</span>
                            <div class="flex flex-wrap gap-1">
                              {resume.parsed_content?.skills?.length > 0 ? (
                                resume.parsed_content.skills.map((s) => (
                                  <span key={s} class="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-[10px] text-slate-400 rounded">{s}</span>
                                ))
                              ) : (
                                <span class="text-slate-600">No skills parsed from document. Make sure it is text-selectable.</span>
                              )}
                            </div>
                          </div>

                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span class="text-slate-500 font-semibold block mb-1">Parsed Education:</span>
                              {resume.parsed_content?.education?.length > 0 ? (
                                <ul class="list-disc pl-4 space-y-1 text-slate-400">
                                  {resume.parsed_content.education.map((e, idx) => (
                                    <li key={idx} class="text-[11px]">{e.degree} &bull; {e.institution}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span class="text-slate-600 text-[11px]">No education details extracted.</span>
                              )}
                            </div>
                            <div>
                              <span class="text-slate-500 font-semibold block mb-1">Parsed Experience:</span>
                              {resume.parsed_content?.experience?.length > 0 ? (
                                <ul class="list-disc pl-4 space-y-1 text-slate-400">
                                  {resume.parsed_content.experience.map((ex, idx) => (
                                    <li key={idx} class="text-[11px]">{ex.position} at {ex.company}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span class="text-slate-600 text-[11px]">No experience details extracted.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* AI ANALYZER VIEW PANEL */
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form input details */}
          <div class="lg:col-span-1 space-y-4">
            <h3 class="font-display font-semibold text-base text-slate-200">Audit Setup</h3>
            
            <form onSubmit={handleRunAIAnalysis} class="glass border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
              {/* Select Resume */}
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">Select Resume File</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  class="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-sm text-slate-300 outline-none"
                >
                  {resumes.filter(r => r.parsing_status === 'completed').map(r => (
                    <option key={r.id} value={r.id}>{r.file_name}</option>
                  ))}
                </select>
              </div>

              {/* Job Description Textarea */}
              <div class="space-y-1">
                <label class="text-xs text-slate-300 font-medium">Target Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={8}
                  placeholder="Paste the job description of the role you want to analyze..."
                  class="w-full px-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-indigo-500 text-xs text-slate-100 outline-none resize-none"
                ></textarea>
              </div>

              {analyzerError && (
                <p class="text-rose-400 text-xs bg-rose-500/5 p-2 rounded border border-rose-500/20">{analyzerError}</p>
              )}

              <button
                type="submit"
                disabled={analyzing || !selectedResumeId || !jobDescription.trim()}
                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {analyzing ? (
                  <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <BrainCircuit size={16} />
                    Run AI Audit
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Audit Results display panel */}
          <div class="lg:col-span-2 space-y-4">
            <h3 class="font-display font-semibold text-base text-slate-200">Analysis Output</h3>
            
            {analyzing ? (
              <div class="glass border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-4">
                <div class="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <div>
                  <p class="text-sm font-semibold text-white">AI Engine parsing details...</p>
                  <p class="text-xs text-slate-500 mt-1">Comparing parsed PDF text with targeted requirements via cosine similarity.</p>
                </div>
              </div>
            ) : !analyzerResult ? (
              <div class="glass border border-slate-850 p-16 rounded-2xl text-center text-slate-500 text-sm">
                Paste a job description and click "Run AI Audit" to fetch match scores and suggestions.
              </div>
            ) : (
              <div class="glass border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-300">
                {/* Score Section */}
                <div class="flex items-center gap-4 border-b border-slate-850 pb-5">
                  <div class="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col items-center justify-center text-indigo-400">
                    <span class="text-2xl font-bold font-display">{Math.round(analyzerResult.match_score)}%</span>
                    <span class="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">Match</span>
                  </div>
                  <div>
                    <h4 class="font-semibold text-white text-base flex items-center gap-1">
                      <Sparkles size={16} class="text-indigo-400" />
                      AI Resume Audit Summary
                    </h4>
                    <p class="text-xs text-slate-400 mt-1">Computed match score based on extracted qualifications, skills, and titles.</p>
                  </div>
                </div>

                {/* Grid Lists: Strengths vs Weaknesses */}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div class="space-y-2">
                    <span class="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={14} /> Strengths & Fits
                    </span>
                    <ul class="list-disc pl-4 space-y-1.5 text-xs text-slate-300 leading-normal">
                      {analyzerResult.strengths?.length > 0 ? (
                        analyzerResult.strengths.map((str, idx) => <li key={idx}>{str}</li>)
                      ) : (
                        <li class="text-slate-500 italic">No standout strengths detected.</li>
                      )}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div class="space-y-2">
                    <span class="text-xs font-semibold text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={14} /> Gaps & Weaknesses
                    </span>
                    <ul class="list-disc pl-4 space-y-1.5 text-xs text-slate-300 leading-normal">
                      {analyzerResult.weaknesses?.length > 0 ? (
                        analyzerResult.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)
                      ) : (
                        <li class="text-slate-500 italic">No critical gaps identified.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Missing Skills tags */}
                <div class="space-y-2 pt-2">
                  <span class="text-xs font-semibold text-slate-400">Missing Key Skills:</span>
                  <div class="flex flex-wrap gap-1">
                    {analyzerResult.missing_skills?.length > 0 ? (
                      analyzerResult.missing_skills.map((skill) => (
                        <span key={skill} class="px-2.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-semibold">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span class="text-slate-500 text-xs">No missing skills detected! Excellent alignment.</span>
                    )}
                  </div>
                </div>

                {/* Suggestions text */}
                <div class="space-y-2 pt-2 border-t border-slate-850/60">
                  <span class="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Info size={14} /> Optimizations Suggestions:
                  </span>
                  <ul class="list-disc pl-4 space-y-1 text-xs text-slate-300 leading-normal">
                    {analyzerResult.suggestions?.length > 0 ? (
                      analyzerResult.suggestions.map((sug, idx) => <li key={idx}>{sug}</li>)
                    ) : (
                      <li class="text-slate-500 italic">No specific optimizations suggested.</li>
                    )}
                  </ul>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ResumeUpload;
