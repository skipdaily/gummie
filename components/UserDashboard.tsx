import React from 'react';
import { SavedConcept } from '../types';
import { Download, RefreshCw, UploadCloud } from 'lucide-react';

interface UserDashboardProps {
  concepts: SavedConcept[];
  isLoading: boolean;
  isSavingAssets: boolean;
  canSaveCurrentAssets: boolean;
  error: string;
  onRefresh: () => void;
  onSaveCurrentAssets: () => void;
  onLoadConcept: (concept: SavedConcept) => void;
  onUseReference: (url: string) => void;
  onUseLogo: (url: string) => void;
}

interface AssetColumnProps {
  title: string;
  count: number;
  emptyText: string;
  children: React.ReactNode;
}

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date(value));

const AssetColumn: React.FC<AssetColumnProps> = ({ title, count, emptyText, children }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 min-h-[280px]">
    <div className="flex items-center justify-between gap-3 mb-3 border-b border-slate-200 pb-3">
      <h3 className="font-display font-bold uppercase text-slate-950 text-sm tracking-wide">{title}</h3>
      <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 rounded-sm px-2 py-1">
        {count}
      </span>
    </div>
    {count > 0 ? (
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {children}
      </div>
    ) : (
      <div className="h-48 flex items-center justify-center text-center text-slate-400 text-xs font-mono uppercase tracking-wide">
        {emptyText}
      </div>
    )}
  </div>
);

const UserDashboard: React.FC<UserDashboardProps> = ({
  concepts,
  isLoading,
  isSavingAssets,
  canSaveCurrentAssets,
  error,
  onRefresh,
  onSaveCurrentAssets,
  onLoadConcept,
  onUseReference,
  onUseLogo,
}) => {
  const generatedConcepts = concepts.filter(concept => concept.generatedImageUrl);
  const heroConcepts = concepts.filter(concept => concept.referenceImageUrl);
  const logoConcepts = concepts.filter(concept => concept.logoImageUrl);

  const renderAssetCard = (
    concept: SavedConcept,
    imageUrl: string,
    imageClassName: string,
    actionLabel: string,
    onAction: () => void
  ) => (
    <div key={`${concept.id}-${actionLabel}`} className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
      <div className="aspect-[4/3] bg-slate-100 border-b border-slate-200">
        <img
          src={imageUrl}
          alt={concept.productName}
          className={`w-full h-full ${imageClassName}`}
        />
      </div>
      <div className="p-3">
        <div className="font-display text-sm font-bold text-slate-950 uppercase truncate">
          {concept.productName}
        </div>
        <div className="text-xs text-slate-500 font-mono truncate">
          {concept.targetAudience}
        </div>
        <div className="text-[11px] text-slate-400 font-mono mt-1">
          {formatDate(concept.createdAt)}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onAction}
            className="flex-1 bg-slate-950 hover:bg-slate-800 text-white px-3 py-2 rounded-sm text-xs font-display font-bold uppercase tracking-wider transition-colors"
          >
            {actionLabel}
          </button>
          <a
            href={imageUrl}
            download
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-sm border border-slate-300 transition-colors"
            title="Download"
          >
            <Download size={16} />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <section className="mb-8 bg-white border border-slate-200 rounded-sm p-6 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-hazard"></div>
          <div>
            <h2 className="text-xl font-display font-bold uppercase text-slate-950">Asset Dashboard</h2>
            <div className="flex flex-wrap gap-3 text-xs font-mono text-slate-500 uppercase mt-1">
              <span>{generatedConcepts.length} Generated</span>
              <span>{heroConcepts.length} Hero</span>
              <span>{logoConcepts.length} Logo</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onSaveCurrentAssets}
            disabled={!canSaveCurrentAssets || isSavingAssets}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-display font-bold uppercase tracking-widest border-b-4 transition-all ${
              !canSaveCurrentAssets || isSavingAssets
                ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed'
                : 'bg-hazard hover:bg-hazard-dark text-black border-hazard-dark active:border-b-0 active:translate-y-1'
            }`}
          >
            {isSavingAssets ? (
              <>
                <RefreshCw className="animate-spin" size={18} /> Saving
              </>
            ) : (
              <>
                <UploadCloud size={18} /> Save Current Assets
              </>
            )}
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm border border-slate-300 font-display font-bold uppercase tracking-widest transition-colors disabled:opacity-60"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-red-700 font-mono text-xs break-all bg-red-50 border border-red-200 rounded p-3">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AssetColumn title="Created Images" count={generatedConcepts.length} emptyText="No created images">
          {generatedConcepts.map(concept => renderAssetCard(
            concept,
            concept.generatedImageUrl as string,
            'object-cover',
            'Open',
            () => onLoadConcept(concept)
          ))}
        </AssetColumn>

        <AssetColumn title="Hero Images" count={heroConcepts.length} emptyText="No hero images">
          {heroConcepts.map(concept => renderAssetCard(
            concept,
            concept.referenceImageUrl as string,
            'object-cover',
            'Use Hero',
            () => onUseReference(concept.referenceImageUrl as string)
          ))}
        </AssetColumn>

        <AssetColumn title="Logos" count={logoConcepts.length} emptyText="No logos">
          {logoConcepts.map(concept => renderAssetCard(
            concept,
            concept.logoImageUrl as string,
            'object-contain p-4',
            'Use Logo',
            () => onUseLogo(concept.logoImageUrl as string)
          ))}
        </AssetColumn>
      </div>

      {isLoading && concepts.length === 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-slate-500 font-mono text-xs uppercase">
          <RefreshCw className="animate-spin" size={16} /> Loading Saved Assets
        </div>
      )}
    </section>
  );
};

export default UserDashboard;
