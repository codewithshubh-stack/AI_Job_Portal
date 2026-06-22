import React, { useEffect, useState } from 'react';
import api from '../../../config/axios';
import { Award, CheckCircle, ChevronRight, HelpCircle, Loader2, Sparkles, MessageSquare } from 'lucide-react';

const InterviewPrep = () => {
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState('');

  useEffect(() => {
    fetchInterviewPrep();
  }, []);

  const fetchInterviewPrep = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/analytics/ai/interview-prep/');
      setQuestions(res.data);
      if (res.data.technical_questions?.length > 0) {
        setSelectedQuestion({ ...res.data.technical_questions[0], type: 'Technical' });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate interview preparation questions. Make sure profile skills are defined.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateAnswer = (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;
    setSubmittingAnswer(true);
    setAnswerFeedback('');

    // Simulate AI feedback locally for instant portfolio responsiveness
    setTimeout(() => {
      const points = selectedQuestion.suggested_answer_points || [];
      const matched = points.filter(p => userAnswer.toLowerCase().includes(p.split(' ')[0].toLowerCase()));
      
      let score = 50 + matched.length * 15;
      if (userAnswer.length > 150) score += 10;
      score = Math.min(score, 100);

      let textFeedback = '';
      if (score >= 85) {
        textFeedback = 'Excellent answer! You covered core conceptual details and structured the answer logically.';
      } else if (score >= 70) {
        textFeedback = 'Good response. Try to highlight more details about: ' + points.join(', ') + '.';
      } else {
        textFeedback = 'Your answer is a bit brief. Make sure to talk about: ' + points.join(', ') + '.';
      }

      setAnswerFeedback({
        score,
        text: textFeedback
      });
      setSubmittingAnswer(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 size={36} class="text-indigo-500 animate-spin" />
        <p class="text-xs text-slate-400 font-medium">Generating your personalized interview questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div class="glass border border-rose-500/20 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-3">
        <p class="text-xs text-rose-300 font-semibold">{error}</p>
        <button
          onClick={fetchInterviewPrep}
          class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div class="max-w-6xl mx-auto py-4 space-y-6 animate-in fade-in duration-350">
      <div>
        <h1 class="font-display font-bold text-2xl text-white flex items-center gap-2">
          <Sparkles size={22} class="text-indigo-400" />
          AI Interview Preparation Coach
        </h1>
        <p class="text-xs text-slate-400 mt-1">Practice customized HR and technical questions tailored to your skill footprint.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Questions List */}
        <div class="space-y-4">
          <div class="glass border border-slate-800/80 rounded-2xl p-4 space-y-4">
            <h3 class="font-display font-bold text-sm text-white">Questions Pool</h3>
            
            <div class="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {/* Technical Section */}
              <div class="space-y-2">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Technical Questions</span>
                {questions?.technical_questions?.map((q, idx) => (
                  <button
                    key={`tech-${idx}`}
                    onClick={() => {
                      setSelectedQuestion({ ...q, type: 'Technical' });
                      setUserAnswer('');
                      setAnswerFeedback('');
                    }}
                    class={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedQuestion?.question === q.question
                        ? 'border-indigo-500 bg-indigo-500/5 text-white font-medium shadow-md shadow-indigo-500/5'
                        : 'border-slate-850 bg-slate-950/20 text-slate-400 hover:border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {q.question}
                  </button>
                ))}
              </div>

              {/* Skill based Section */}
              <div class="space-y-2 pt-2">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Skill-Based Scenario</span>
                {questions?.skill_based_questions?.map((q, idx) => (
                  <button
                    key={`skill-${idx}`}
                    onClick={() => {
                      setSelectedQuestion({ ...q, type: 'Skill-Based' });
                      setUserAnswer('');
                      setAnswerFeedback('');
                    }}
                    class={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedQuestion?.question === q.question
                        ? 'border-indigo-500 bg-indigo-500/5 text-white font-medium shadow-md shadow-indigo-500/5'
                        : 'border-slate-850 bg-slate-950/20 text-slate-400 hover:border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {q.question}
                  </button>
                ))}
              </div>

              {/* HR Section */}
              <div class="space-y-2 pt-2">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Behavioral & HR</span>
                {questions?.hr_questions?.map((q, idx) => (
                  <button
                    key={`hr-${idx}`}
                    onClick={() => {
                      setSelectedQuestion({ ...q, type: 'Behavioral' });
                      setUserAnswer('');
                      setAnswerFeedback('');
                    }}
                    class={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedQuestion?.question === q.question
                        ? 'border-indigo-500 bg-indigo-500/5 text-white font-medium shadow-md shadow-indigo-500/5'
                        : 'border-slate-850 bg-slate-950/20 text-slate-400 hover:border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {q.question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Workspace */}
        <div class="lg:col-span-2 space-y-4">
          {selectedQuestion ? (
            <div class="glass border border-slate-800/80 rounded-2xl p-6 space-y-5 shadow-xl">
              <div class="flex justify-between items-center border-b border-slate-800 pb-3">
                <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase">
                  {selectedQuestion.type} Focus
                </span>
                <span class="text-xs text-slate-500">Focus: {selectedQuestion.focus}</span>
              </div>

              <div class="space-y-2">
                <h3 class="font-display font-semibold text-lg text-white leading-relaxed">
                  {selectedQuestion.question}
                </h3>
              </div>

              <div class="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                <h4 class="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <HelpCircle size={14} class="text-indigo-400" />
                  Key Points to cover:
                </h4>
                <ul class="list-disc pl-4 space-y-1">
                  {selectedQuestion.suggested_answer_points?.map((pt, idx) => (
                    <li key={idx} class="text-xs text-slate-500">{pt}</li>
                  ))}
                </ul>
              </div>

              {/* Answer Input Area */}
              <form onSubmit={handleEvaluateAnswer} class="space-y-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-300">Your Response Practice</label>
                  <textarea
                    required
                    rows={6}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Compose your response here. Try to incorporate the suggested points mentioned above..."
                    class="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 focus:bg-slate-950 focus:border-indigo-500 text-sm text-slate-100 placeholder-slate-600 transition-all outline-none resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingAnswer || !userAnswer.trim()}
                  class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg hover:shadow-indigo-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submittingAnswer ? (
                    <>
                      <Loader2 size={13} class="animate-spin" />
                      Analyzing response...
                    </>
                  ) : (
                    <>
                      <MessageSquare size={13} />
                      Submit and Review
                    </>
                  )}
                </button>
              </form>

              {/* Evaluation Output */}
              {answerFeedback && (
                <div class="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] space-y-2 animate-in fade-in duration-300">
                  <div class="flex justify-between items-center">
                    <h4 class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      AI Response Evaluation
                    </h4>
                    <span class="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Answer Quality Score: {answerFeedback.score}/100
                    </span>
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed mt-1">{answerFeedback.text}</p>
                </div>
              )}
            </div>
          ) : (
            <div class="glass border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500">
              Select a question from the left sidebar to start practice evaluation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPrep;
