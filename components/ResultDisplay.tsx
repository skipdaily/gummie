import React, { useEffect, useState } from 'react';
import { GeneratedImage, GenerationStatus } from '../types';
import { Download, Maximize2, X } from 'lucide-react';

interface ResultDisplayProps {
  currentImage: GeneratedImage | null;
  status: GenerationStatus;
  errorMessage?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ currentImage, status, errorMessage }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage.imageUrl;
      link.download = `product-concept-${currentImage.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (status === GenerationStatus.ERROR) {
    return (
      <div className="h-full min-h-[500px] flex items-center justify-center bg-white border-2 border-red-200 border-dashed rounded-sm p-8 shadow-sm">
        <div className="text-center max-w-md">
          <div className="text-red-500 font-display text-4xl font-bold mb-4">SYSTEM FAILURE</div>
          <p className="text-slate-600">The machinery jammed. Please check your inputs and API key, then try again.</p>
          {errorMessage && (
            <p className="text-red-700 font-mono text-xs mt-4 break-all bg-red-50 border border-red-200 rounded p-3">{errorMessage}</p>
          )}
        </div>
      </div>
    );
  }

  if (status === GenerationStatus.GENERATING) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white border border-slate-200 rounded-sm relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 border-4 border-slate-200 border-t-hazard rounded-full animate-spin mb-6"></div>
          <h3 className="text-2xl font-display font-bold text-slate-950 uppercase tracking-widest animate-pulse">Generating Image...</h3>
          <p className="text-hazard font-mono text-sm mt-2">RENDERING PRODUCT DETAILS</p>
        </div>
        
        {/* Scrolling terminal text effect */}
        <div className="absolute bottom-4 left-4 text-xs font-mono text-slate-400 opacity-80">
            <div>&gt; INIT_MODEL: GEMINI-3.1-FLASH-IMAGE-PREVIEW</div>
           <div>&gt; LOADING_TEXTURES: PRODUCT_MATERIALS</div>
           <div>&gt; ADJUSTING_LIGHTING: STUDIO_SCENE</div>
        </div>
      </div>
    );
  }

  if (!currentImage) {
    return (
      <div className="h-full min-h-[500px] flex items-center justify-center bg-white border border-slate-200 rounded-sm relative overflow-hidden shadow-sm">
        <div className="text-center opacity-30">
          <div className="font-display text-6xl font-bold text-slate-500 mb-2">NO SIGNAL</div>
          <p className="font-mono text-slate-500 uppercase tracking-widest">Awaiting Concept Specs</p>
        </div>
        {/* Placeholder Grid */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.06) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative group bg-white border border-slate-200 rounded-sm overflow-hidden shadow-lg">
        <img 
          src={currentImage.imageUrl} 
          alt={currentImage.config.productName} 
          className="w-full h-auto object-cover max-h-[700px] hover:scale-[1.01] transition-transform duration-500 ease-out"
        />
        
        {/* Overlay controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
          <div>
            <h3 className="text-white font-display font-bold text-xl uppercase">{currentImage.config.productName}</h3>
            <p className="text-hazard text-xs font-mono">{currentImage.config.targetAudience} Concept</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownload} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-sm border border-slate-600 transition-colors" title="Download High Res">
              <Download size={20} />
            </button>
             <button onClick={() => setIsExpanded(true)} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-sm border border-slate-600 transition-colors" title="View Fullscreen">
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
        
        {/* Watermark style badge */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1 text-[10px] font-mono text-white/50 uppercase tracking-widest pointer-events-none">
          AI GENERATED MOCKUP
        </div>
      </div>
      
      {/* Specs read-out */}
      <div className="bg-white border border-slate-200 p-4 rounded-sm flex justify-between items-center text-xs font-mono text-slate-500 shadow-sm">
        <div>ID: {currentImage.id.substring(0, 8).toUpperCase()}</div>
        <div>{new Date(currentImage.timestamp).toLocaleString()}</div>
      </div>

      {isExpanded && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={`${currentImage.config.productName} fullscreen preview`}
          onClick={() => setIsExpanded(false)}
        >
          <button
            onClick={(event) => {
              event.stopPropagation();
              setIsExpanded(false);
            }}
            className="absolute top-4 right-4 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-sm border border-slate-700 transition-colors"
            title="Close Fullscreen"
          >
            <X size={22} />
          </button>

          <button
            onClick={(event) => {
              event.stopPropagation();
              handleDownload();
            }}
            className="absolute top-4 right-20 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-sm border border-slate-700 transition-colors"
            title="Download High Res"
          >
            <Download size={22} />
          </button>

          <img
            src={currentImage.imageUrl}
            alt={currentImage.config.productName}
            onClick={(event) => event.stopPropagation()}
            className="max-w-full max-h-full object-contain shadow-2xl border border-white/10"
          />
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
