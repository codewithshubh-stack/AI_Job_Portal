import React from 'react';

const Footer = () => {
  return (
    <footer class="border-t border-slate-900 bg-slate-950/40 backdrop-blur-md py-6 mt-16 relative z-10">
      <div class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div>
          <span class="font-display font-bold text-sm tracking-tight text-white">
            Talent<span class="text-indigo-400">AI</span>
          </span>
          <p class="text-xs text-slate-500 mt-1">
            Connecting premium talent with AI-Powered Semantic Vector Matching.
          </p>
        </div>
        <div class="text-xs text-slate-600">
          <p>&copy; {new Date().getFullYear()} TalentAI Inc. All rights reserved.</p>
          <p class="mt-0.5 font-mono text-[10px]">v1.0.0 (Stable Production Build)</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
