import React, { useEffect, useState } from 'react';
import api from '../../../config/axios';
import { Award, BookOpen, ChevronRight, Loader2, Sparkles, CheckCircle2, Milestone } from 'lucide-react';

const CareerAdvisor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCareerAdvice();
  }, []);

  const fetchCareerAdvice = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/analytics/ai/career-advisor/');
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch career advice. Make sure your profile details are completed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 size={36} class="text-indigo-500 animate-spin" />
        <p class="text-xs text-slate-400 font-medium">Generating your AI career advisor roadmap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div class="glass border border-rose-500/20 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-3">
        <p class="text-xs text-rose-300 font-semibold">{error}</p>
        <button
          onClick={fetchCareerAdvice}
          class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div class="max-w-5xl mx-auto py-4 space-y-8 animate-in fade-in duration-350">
      <div>
        <h1 class="font-display font-bold text-2xl text-white flex items-center gap-2">
          <Milestone size={24} class="text-indigo-400" />
          AI Career Advisor & Learning Roadmap
        </h1>
        <p class="text-xs text-slate-400 mt-1">Receive automated advice on milestones, suggested industry certifications, and learning goals.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roadmap section: Left and middle column */}
        <div class="lg:col-span-2 space-y-6">
          <div class="glass border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 class="font-display font-bold text-base text-white flex items-center gap-2">
              <BookOpen size={18} class="text-indigo-400" />
              Suggested Learning Roadmaps
            </h3>

            {/* Timelines list */}
            <div class="relative border-l border-slate-800 pl-6 ml-3 space-y-8">
              {data?.roadmap?.map((rm, idx) => (
                <div key={idx} class="relative">
                  {/* Circle dot on line */}
                  <div class="absolute -left-[31px] top-1.5 p-1 w-6 h-6 rounded-full bg-slate-950 border border-indigo-500 flex items-center justify-center text-[10px] font-bold text-indigo-400 shadow-md">
                    {idx + 1}
                  </div>

                  <div class="space-y-2">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <h4 class="font-semibold text-white text-sm leading-relaxed">{rm.milestone}</h4>
                      <span class="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold self-start sm:self-auto">
                        {rm.duration}
                      </span>
                    </div>
                    <p class="text-xs text-slate-400 leading-relaxed">{rm.description}</p>
                    
                    <div class="flex gap-1.5 flex-wrap pt-1">
                      {rm.learning_topics?.map((topic, tidx) => (
                        <span
                          key={tidx}
                          class="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-850 text-slate-500 text-[10px] font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action goals */}
          <div class="glass border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 class="font-display font-bold text-base text-white flex items-center gap-2">
              <CheckCircle2 size={18} class="text-indigo-400" />
              Immediate Targets & Action Checklist
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data?.next_goals?.map((goal, idx) => (
                <div key={idx} class="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-2 hover:border-slate-800 transition-colors">
                  <div class="flex justify-between items-center">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Goal {idx + 1}</span>
                    <span class="text-[9px] font-mono text-slate-500">{goal.timeframe}</span>
                  </div>
                  <h4 class="font-semibold text-white text-xs leading-normal">{goal.goal}</h4>
                  <p class="text-[11px] text-slate-400 leading-relaxed">{goal.action_plan}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Certifications: Right column */}
        <div class="space-y-6">
          <div class="glass border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 class="font-display font-bold text-sm text-white flex items-center gap-2">
              <Award size={18} class="text-indigo-400" />
              Recommended Credentials
            </h3>

            <div class="space-y-4">
              {data?.suggested_certifications?.map((cert, idx) => (
                <div key={idx} class="p-3.5 rounded-xl border border-slate-850 bg-slate-950/40 space-y-1.5 hover:border-slate-800 transition-colors">
                  <h4 class="font-semibold text-white text-xs leading-snug">{cert.name}</h4>
                  <p class="text-[10px] text-slate-500 font-medium">Issued by {cert.provider}</p>
                  <p class="text-[10px] text-slate-400 leading-relaxed mt-1">{cert.relevance}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerAdvisor;
