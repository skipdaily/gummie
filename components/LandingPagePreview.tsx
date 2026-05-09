import React from 'react';
import { GeneratedImage, LandingPageContent } from '../types';
import { ArrowRight, Check, Download } from 'lucide-react';

interface LandingPagePreviewProps {
  content: LandingPageContent;
  concepts: GeneratedImage[];
}

const LandingPagePreview: React.FC<LandingPagePreviewProps> = ({ content, concepts }) => {
  const heroConcept = concepts[0];

  if (!heroConcept) {
    return null;
  }

  return (
    <div className="bg-white text-slate-950 border border-slate-700 rounded-sm overflow-hidden shadow-2xl">
      <section className="relative min-h-[620px] overflow-hidden">
        <img
          src={heroConcept.imageUrl}
          alt={heroConcept.config.productName}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55"></div>
        <div className="relative z-10 min-h-[620px] flex flex-col justify-end px-6 sm:px-10 lg:px-16 pb-14 pt-20 max-w-4xl">
          <div className="text-hazard font-mono text-xs uppercase tracking-widest mb-4">{content.eyebrow}</div>
          <h2 className="text-white font-display font-bold uppercase text-4xl sm:text-6xl lg:text-7xl leading-none max-w-4xl">
            {content.headline}
          </h2>
          <p className="text-slate-200 text-lg sm:text-xl max-w-2xl mt-6">
            {content.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button className="bg-hazard hover:bg-hazard-dark text-black px-6 py-4 font-display font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
              {content.ctaPrimary} <ArrowRight size={18} />
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 font-display font-bold uppercase tracking-widest border border-white/30 transition-colors">
              {content.ctaSecondary}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white px-6 sm:px-10 lg:px-16 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {content.proofPoints.slice(0, 3).map((point) => (
            <div key={point} className="flex items-center gap-3 text-sm font-mono uppercase tracking-wide text-slate-300">
              <span className="bg-hazard text-black p-1 rounded-sm"><Check size={14} /></span>
              {point}
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 sm:px-10 lg:px-16 py-16 bg-white">
        <div className="max-w-3xl">
          <div className="text-slate-500 font-mono text-xs uppercase tracking-widest mb-3">Why It Works</div>
          <h3 className="font-display text-3xl sm:text-5xl font-bold uppercase text-slate-950">{content.featureTitle}</h3>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
          {content.features.slice(0, 3).map((feature) => (
            <div key={feature.title} className="bg-white p-6 min-h-48">
              <h4 className="font-display font-bold uppercase text-xl text-slate-950">{feature.title}</h4>
              <p className="text-slate-600 mt-4 leading-relaxed">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-100 px-6 sm:px-10 lg:px-16 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="text-slate-500 font-mono text-xs uppercase tracking-widest mb-3">Selected Concepts</div>
            <h3 className="font-display text-3xl sm:text-5xl font-bold uppercase text-slate-950">{content.galleryTitle}</h3>
          </div>
          <div className="text-slate-500 font-mono text-xs uppercase">{concepts.length} Asset{concepts.length === 1 ? '' : 's'} Included</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {concepts.map((concept) => (
            <figure key={concept.id} className="bg-white border border-slate-200">
              <img src={concept.imageUrl} alt={concept.config.productName} className="w-full aspect-square object-cover" />
              <figcaption className="p-4">
                <div className="font-display font-bold uppercase text-slate-950">{concept.config.productName}</div>
                <div className="font-mono text-xs text-slate-500 uppercase mt-1">{concept.config.targetAudience}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 text-white px-6 sm:px-10 lg:px-16 py-16">
        <div className="max-w-3xl">
          <h3 className="font-display text-3xl sm:text-5xl font-bold uppercase">{content.closingHeadline}</h3>
          <p className="text-slate-300 mt-5 text-lg">{content.closingBody}</p>
          <button className="mt-8 bg-hazard hover:bg-hazard-dark text-black px-6 py-4 font-display font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
            <Download size={18} /> Save Direction
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPagePreview;
