import React, { useRef } from 'react';
import { ProductConfig } from '../types';
import { Settings2, RefreshCw, AlertTriangle, Upload, X, Image as ImageIcon } from 'lucide-react';

interface ControlsProps {
  config: ProductConfig;
  onChange: (newConfig: ProductConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isDrafting?: boolean;
}

const Controls: React.FC<ControlsProps> = ({ config, onChange, onGenerate, isGenerating, isDrafting = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof ProductConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const handleImageUpload = (field: 'referenceImage' | 'logoImage', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...config, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearReferenceImage = () => {
    onChange({ ...config, referenceImage: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearLogoImage = () => {
    onChange({ ...config, logoImage: null });
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-sm p-6 shadow-2xl relative overflow-hidden group">
      {/* Industrial decoration */}
      <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
        <Settings2 size={120} />
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        <div className="w-1 h-6 bg-hazard"></div>
        <h2 className="text-xl font-display font-bold uppercase text-white">Product Specs</h2>
      </div>

      <div className="space-y-6">
        {/* Asset Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/50 border-2 border-dashed border-slate-700 rounded-sm p-4 hover:border-hazard/50 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono text-hazard uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={14} /> Hero Reference Image
              </label>
              {config.referenceImage && (
                <button 
                  onClick={clearReferenceImage}
                  className="text-xs text-red-500 hover:text-red-400 font-mono flex items-center gap-1 uppercase"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            
            {config.referenceImage ? (
              <div className="relative group rounded-sm overflow-hidden border border-slate-600">
                <img 
                  src={config.referenceImage} 
                  alt="Reference" 
                  className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2 pointer-events-none">
                  <span className="text-xs text-white font-mono">ACTIVE_REFERENCE_SOURCE.JPG</span>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="h-32 flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Upload size={24} className="mb-2" />
                <span className="text-xs font-mono uppercase">Upload Source Style</span>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload('referenceImage', e)} 
                  className="hidden" 
                />
              </div>
            )}
          </div>

          <div className="bg-slate-950/50 border-2 border-dashed border-slate-700 rounded-sm p-4 hover:border-hazard/50 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono text-hazard uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={14} /> Logo Image
              </label>
              {config.logoImage && (
                <button 
                  onClick={clearLogoImage}
                  className="text-xs text-red-500 hover:text-red-400 font-mono flex items-center gap-1 uppercase"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            
            {config.logoImage ? (
              <div className="relative group rounded-sm overflow-hidden border border-slate-600 bg-slate-950">
                <img 
                  src={config.logoImage} 
                  alt="Logo" 
                  className="w-full h-32 object-contain p-3 opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2 pointer-events-none">
                  <span className="text-xs text-white font-mono">ACTIVE_LOGO_SOURCE.PNG</span>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="h-32 flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Upload size={24} className="mb-2" />
                <span className="text-xs font-mono uppercase">Upload Logo</span>
                <input 
                  ref={logoInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload('logoImage', e)} 
                  className="hidden" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Product Identity */}
        <div className="space-y-4 border-b border-slate-800 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-hazard mb-1 uppercase tracking-wider">Product Name</label>
              <input
                type="text"
                value={config.productName}
                onChange={(e) => handleChange('productName', e.target.value)}
                placeholder="e.g. FIELDKIT COOLER"
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard font-display uppercase tracking-wide placeholder-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-hazard mb-1 uppercase tracking-wider">Tagline / Subtitle</label>
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder="e.g. Built for long days in rough conditions"
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-mono text-hazard mb-1 uppercase tracking-wider">Label Artwork / Icon</label>
            <input
              type="text"
              value={config.labelImageDescription}
              onChange={(e) => handleChange('labelImageDescription', e.target.value)}
              placeholder="e.g. A mountain badge, abstract monogram, or clean technical icon"
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700 text-sm"
            />
          </div>
        </div>

        {/* Target & Environment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">Target Audience</label>
            <input
              type="text"
              value={config.targetAudience}
              onChange={(e) => handleChange('targetAudience', e.target.value)}
              placeholder="e.g. Outdoor crews, home cooks, remote workers"
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">Package / Form Style</label>
            <input
              type="text"
              value={config.packageStyle}
              onChange={(e) => handleChange('packageStyle', e.target.value)}
              placeholder="e.g. Glass jar, travel pouch, folding case"
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700 text-sm"
            />
          </div>
        </div>

        {/* Scene Description */}
        <div>
          <label className="block text-xs font-mono text-hazard mb-1 uppercase tracking-wider">Scene / Action Description</label>
          <textarea
            value={config.sceneDescription}
            onChange={(e) => handleChange('sceneDescription', e.target.value)}
            placeholder="e.g. Product on a kitchen counter, trailhead table, studio desk, or retail shelf"
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700 resize-none text-sm"
          />
        </div>

        {/* Environment Details */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">Background Props & Setting</label>
          <textarea
            value={config.environmentDetails}
            onChange={(e) => handleChange('environmentDetails', e.target.value)}
            placeholder="Describe the background props and setting..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700 resize-none text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">Product Details</label>
            <input
              type="text"
              value={config.productDetails}
              onChange={(e) => handleChange('productDetails', e.target.value)}
              placeholder="Materials, features, finishes, accessories"
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700 text-sm"
            />
          </div>
           <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">Accent Color</label>
            <input
              type="text"
              value={config.accentColor}
              onChange={(e) => handleChange('accentColor', e.target.value)}
              placeholder="e.g. Cobalt Blue, #FFB800, Forest Green"
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700 text-sm"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={onGenerate}
            disabled={isGenerating || isDrafting}
            className={`w-full relative overflow-hidden group flex items-center justify-center gap-3 py-4 px-6 font-display font-bold text-lg uppercase tracking-widest transition-all
              ${isGenerating || isDrafting 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700' 
                : 'bg-hazard hover:bg-hazard-dark text-black border-hazard-dark'
              } border-b-4 active:border-b-0 active:translate-y-1`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <AlertTriangle size={24} strokeWidth={2.5} /> Generate Product
              </>
            )}
            
            {/* Striped overlay for button */}
            {!isGenerating && (
              <div className="absolute inset-0 opacity-10 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAOklEQVQYV2NkYGAwYmBg0AFiFQY0wEwkSaKYpqqq6j82jVA1UJIgC8KVwBSIzWJ4G6E0IisixqO02QAABiwf8rF5g4kAAAAASUVORK5CYII=')]"></div>
            )}
          </button>
          <p className="text-center mt-3 text-xs text-slate-500 font-mono">
            *GENERATES ONE (1) HIGH-RESOLUTION PRODUCT MOCKUP
          </p>
        </div>
      </div>
    </div>
  );
};

export default Controls;
