import React, { useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import Layout from './components/Layout';
import AuthPanel from './components/AuthPanel';
import Controls from './components/Controls';
import LandingPagePreview from './components/LandingPagePreview';
import ResultDisplay from './components/ResultDisplay';
import { ProductConfig, GeneratedImage, GenerationStatus, LandingPageContent } from './types';
import { generateLandingPageContent, generateProductDraft, generateProductImage } from './services/geminiService';
import { getSession, onAuthChange, saveGeneratedConcept, saveLandingPage, signOut } from './services/supabaseService';
import { Check, FileText, History, LogOut, RefreshCw, WandSparkles } from 'lucide-react';

const INITIAL_CONFIG: ProductConfig = {
  productName: 'FIELDKIT COOLER',
  tagline: 'Built for long days, rough weather, and gear that needs to stay ready',
  targetAudience: 'Outdoor crews',
  productDetails: 'Insulated storage, rugged latches, modular divider inserts',
  packageStyle: 'hard-shell equipment case',
  accentColor: 'Safety Yellow',
  environmentDetails: 'A work truck tailgate, coiled rope, weathered tools, and dusty ground',
  sceneDescription: 'The product sitting open on a worksite tailgate with accessories arranged nearby',
  labelImageDescription: 'A bold mountain badge with utility markings and a compact gear icon',
  referenceImage: null,
  logoImage: null
};

const App: React.FC = () => {
  const [config, setConfig] = useState<ProductConfig>(INITIAL_CONFIG);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [idea, setIdea] = useState<string>('');
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [draftError, setDraftError] = useState<string>('');
  const [selectedConceptIds, setSelectedConceptIds] = useState<string[]>([]);
  const [landingPage, setLandingPage] = useState<LandingPageContent | null>(null);
  const [landingError, setLandingError] = useState<string>('');
  const [isGeneratingLanding, setIsGeneratingLanding] = useState<boolean>(false);
  const [saveNotice, setSaveNotice] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const landingPreviewRef = useRef<HTMLDivElement>(null);

  const selectedConcepts = history.filter(img => selectedConceptIds.includes(img.id));

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } = { unsubscribe: () => {} };

    const setupAuth = async () => {
      try {
        const currentSession = await getSession();
        if (isMounted) {
          setSession(currentSession);
          setIsAuthLoading(false);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }

      subscription = await onAuthChange((event, nextSession) => {
        setSession(nextSession);
        setIsAuthLoading(false);
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }
      });
    };

    setupAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setSession(null);
    setCurrentImage(null);
    setHistory([]);
    setSelectedConceptIds([]);
    setLandingPage(null);
    setSaveNotice('');
  };

  const handleDraftSpecs = async () => {
    const trimmedIdea = idea.trim();
    if (!trimmedIdea || isDrafting) return;

    setIsDrafting(true);
    setDraftError('');

    try {
      const draft = await generateProductDraft(trimmedIdea);
      setConfig(prev => ({
        ...draft,
        referenceImage: prev.referenceImage ?? null,
        logoImage: prev.logoImage ?? null
      }));
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      console.error(msg, error);
      setDraftError(msg);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleGenerate = async () => {
    if (status === GenerationStatus.GENERATING || isDrafting) return;

    setStatus(GenerationStatus.GENERATING);
    setErrorMessage('');
    setSaveNotice('');

    try {
      const imageUrl = await generateProductImage(config);
      
      const newImage: GeneratedImage = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        imageUrl,
        promptUsed: 'Generated via Gemini 3.1 Flash Image Preview',
        config: { ...config },
        timestamp: Date.now()
      };

      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
      setSelectedConceptIds(prev => [newImage.id, ...prev]);
      setStatus(GenerationStatus.SUCCESS);

      try {
        const savedImage = await saveGeneratedConcept(newImage);
        setCurrentImage(savedImage);
        setHistory(prev => prev.map(img => img.id === savedImage.id ? savedImage : img));
        setSaveNotice(savedImage.supabaseConceptId ? 'Saved concept and images to Supabase.' : 'Generated locally. Supabase env vars are missing, so it was not saved.');
      } catch (saveError: any) {
        const msg = saveError?.message || 'Unknown Supabase save error';
        console.error(msg, saveError);
        setSaveNotice(`Generated image, but Supabase save failed: ${msg}`);
      }
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      console.error(msg, error);
      setErrorMessage(msg);
      setStatus(GenerationStatus.ERROR);
    }
  };

  const loadFromHistory = (img: GeneratedImage) => {
    setCurrentImage(img);
    setConfig(img.config);
    setStatus(GenerationStatus.SUCCESS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleConceptSelection = (id: string) => {
    setSelectedConceptIds(prev => (
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [id, ...prev]
    ));
  };

  const handleGenerateLandingPage = async () => {
    if (selectedConcepts.length === 0 || isGeneratingLanding) return;

    setIsGeneratingLanding(true);
    setLandingError('');
    setSaveNotice('');

    try {
      const content = await generateLandingPageContent(selectedConcepts);
      setLandingPage(content);
      try {
        const landingId = await saveLandingPage(content, selectedConcepts);
        setSaveNotice(landingId ? 'Saved landing page to Supabase.' : 'Generated landing page locally. Supabase env vars are missing, so it was not saved.');
      } catch (saveError: any) {
        const msg = saveError?.message || 'Unknown Supabase save error';
        console.error(msg, saveError);
        setSaveNotice(`Generated landing page, but Supabase save failed: ${msg}`);
      }
      setTimeout(() => {
        landingPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      console.error(msg, error);
      setLandingError(msg);
    } finally {
      setIsGeneratingLanding(false);
    }
  };

  if (isAuthLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-220px)] flex items-center justify-center text-slate-500 font-mono uppercase">
          Checking Session...
        </div>
      </Layout>
    );
  }

  if (!session || isPasswordRecovery) {
    return (
      <Layout>
        <AuthPanel
          recoveryMode={isPasswordRecovery}
          onAuthComplete={() => getSession().then(setSession)}
          onRecoveryComplete={() => setIsPasswordRecovery(false)}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4 flex justify-end">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-sm px-4 py-3">
          <div className="text-right">
            <div className="text-xs font-mono text-slate-500 uppercase">Signed In</div>
            <div className="text-sm text-white">{session.user.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-sm border border-slate-600 transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="mb-8 bg-slate-900 border border-slate-700 rounded-sm p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
          <WandSparkles size={120} />
        </div>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
          <div className="w-1 h-6 bg-hazard"></div>
          <h2 className="text-xl font-display font-bold uppercase text-white">Start With A Rough Idea</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end relative z-10">
          <div>
            <label className="block text-xs font-mono text-hazard mb-1 uppercase tracking-wider">General Thought</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A smart lunchbox for nurses working long shifts, something clean, durable, and premium"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700 resize-none text-sm"
            />
          </div>
          <button
            onClick={handleDraftSpecs}
            disabled={!idea.trim() || isDrafting || status === GenerationStatus.GENERATING}
            className={`min-h-[52px] flex items-center justify-center gap-3 px-6 font-display font-bold uppercase tracking-widest transition-all border-b-4
              ${!idea.trim() || isDrafting || status === GenerationStatus.GENERATING
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
                : 'bg-hazard hover:bg-hazard-dark text-black border-hazard-dark active:border-b-0 active:translate-y-1'
              }`}
          >
            {isDrafting ? (
              <>
                <RefreshCw className="animate-spin" size={20} /> Filling Specs
              </>
            ) : (
              <>
                <WandSparkles size={20} strokeWidth={2.5} /> Fill Specs
              </>
            )}
          </button>
        </div>
        {draftError && (
          <p className="mt-3 text-red-400/80 font-mono text-xs break-all bg-red-950/30 border border-red-900/30 rounded p-3">
            {draftError}
          </p>
        )}
        {saveNotice && (
          <p className="mt-3 text-hazard/90 font-mono text-xs break-all bg-hazard/10 border border-hazard/20 rounded p-3">
            {saveNotice}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          <Controls 
            config={config} 
            onChange={setConfig} 
            onGenerate={handleGenerate}
            isGenerating={status === GenerationStatus.GENERATING}
            isDrafting={isDrafting}
          />

          {/* History List (Mobile/Desktop) */}
          {history.length > 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-slate-800 pb-2">
                <History size={16} />
                <h3 className="text-sm font-bold uppercase font-display">Recent Concepts</h3>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {history.map(img => (
                  <div 
                    key={img.id}
                    onClick={() => loadFromHistory(img)}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors border ${
                      currentImage?.id === img.id ? 'bg-slate-800 border-hazard/50' : 'hover:bg-slate-800 border-transparent'
                    }`}
                  >
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleConceptSelection(img.id);
                      }}
                      className={`w-5 h-5 shrink-0 border rounded-sm flex items-center justify-center transition-colors ${
                        selectedConceptIds.includes(img.id)
                          ? 'bg-hazard border-hazard text-black'
                          : 'border-slate-600 hover:border-hazard text-transparent'
                      }`}
                      title={selectedConceptIds.includes(img.id) ? 'Remove from landing page' : 'Add to landing page'}
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                    <img src={img.imageUrl} alt="thumbnail" className="w-12 h-12 object-cover rounded-sm bg-slate-950" />
                    <div className="overflow-hidden">
                      <div className="text-white font-display text-sm truncate font-bold">{img.config.productName}</div>
                      <div className="text-slate-500 text-xs font-mono truncate">{img.config.targetAudience}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <button
                  onClick={handleGenerateLandingPage}
                  disabled={selectedConcepts.length === 0 || isGeneratingLanding}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-display font-bold uppercase tracking-widest border-b-4 transition-all ${
                    selectedConcepts.length === 0 || isGeneratingLanding
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
                      : 'bg-hazard hover:bg-hazard-dark text-black border-hazard-dark active:border-b-0 active:translate-y-1'
                  }`}
                >
                  {isGeneratingLanding ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} /> Building Page
                    </>
                  ) : (
                    <>
                      <FileText size={18} /> Generate Landing Page
                    </>
                  )}
                </button>
                <p className="text-center mt-2 text-xs text-slate-500 font-mono">
                  {selectedConcepts.length} SELECTED CONCEPT{selectedConcepts.length === 1 ? '' : 'S'}
                </p>
                {landingError && (
                  <p className="mt-3 text-red-400/80 font-mono text-xs break-all bg-red-950/30 border border-red-900/30 rounded p-3">
                    {landingError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Display (8 cols) */}
        <div className="lg:col-span-8">
          <ResultDisplay currentImage={currentImage} status={status} errorMessage={errorMessage} />
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-sm">
              <h4 className="text-hazard font-mono text-xs uppercase mb-2">Consistency Protocol</h4>
              <p className="text-slate-500 text-sm">
                The AI uses a consistent product photography prompt so each concept feels polished while still following your inputs.
              </p>
            </div>
            <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-sm">
              <h4 className="text-hazard font-mono text-xs uppercase mb-2">Text Rendering</h4>
              <p className="text-slate-500 text-sm">
                AI may misspell small text. Focus on the main logo and overall "vibe" for best results.
              </p>
            </div>
             <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-sm">
              <h4 className="text-hazard font-mono text-xs uppercase mb-2">Image Model</h4>
              <p className="text-slate-500 text-sm">
                Powered by Gemini 3.1 Flash Image Preview. Optimized for high-speed concept iteration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {landingPage && selectedConcepts.length > 0 && (
        <div ref={landingPreviewRef} className="mt-10">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
            <div className="w-1 h-6 bg-hazard"></div>
            <h2 className="text-xl font-display font-bold uppercase text-white">Generated Landing Page</h2>
          </div>
          <LandingPagePreview content={landingPage} concepts={selectedConcepts} />
        </div>
      )}
    </Layout>
  );
};

export default App;
