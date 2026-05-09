import React, { ReactNode } from 'react';
import { Boxes, Lightbulb, Sparkles } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-hazard selection:text-black">
      {/* Striped header accent */}
      <div className="h-4 w-full bg-hazard flex overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-20 h-full -skew-x-12 bg-black/20 mx-4 border-r-2 border-black/10"></div>
        ))}
      </div>

      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-hazard p-2 rounded-sm text-black shadow-lg shadow-hazard/20">
              <Boxes size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold uppercase tracking-wider text-white">
                Product Concept <span className="text-hazard">Studio</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">AI Product Idea Generator</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-slate-500 text-sm font-mono">
            <span className="flex items-center gap-2"><Lightbulb size={14} /> CONCEPT MODE</span>
            <span className="flex items-center gap-2"><Sparkles size={14} /> IMAGE AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-800 mt-12 py-8 text-center text-slate-600 text-sm font-mono">
        <p>BUILT FOR PRODUCT IDEAS. POWERED BY GEMINI.</p>
      </footer>
    </div>
  );
};

export default Layout;
