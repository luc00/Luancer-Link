import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Minus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type {
  BioProfile,
  SocialDividerStyle,
  SocialIconShape,
  SocialLinkItem,
  SocialPlatformId,
  SocialPosition,
  SocialStyle,
} from '../types/profile';
import { SOCIAL_PLATFORMS } from '../data/presets';
import { SocialIcon } from './SocialIcons';
import {
  calculateTotalFollowers,
  formatFollowerCount,
  getSocialIconShapeRadiusClass,
  moveItem,
  normalizeUrl,
} from '../utils/profileLogic';
import { compressImageFileToDataUrl } from '../utils/imageUpload';

interface EditorSocialsTabProps {
  profile: BioProfile;
  onChange: (updater: (prev: BioProfile) => BioProfile) => void;
}

const ICON_SHAPE_OPTIONS: { id: SocialIconShape; label: string; previewRadius: string }[] = [
  { id: 'circle', label: 'Cerchio', previewRadius: 'rounded-full' },
  { id: 'square', label: 'Quadrata', previewRadius: 'rounded-none' },
  { id: 'rounded', label: 'Arrotondati', previewRadius: 'rounded-[2.5px]' },
];

const DIVIDER_STYLE_OPTIONS: { id: SocialDividerStyle; label: string }[] = [
  { id: 'line', label: 'Linea continua' },
  { id: 'dashed', label: 'Tratteggiato' },
  { id: 'dotted', label: 'Punteggiato' },
  { id: 'gradient', label: 'Gradiente' },
];

export function EditorSocialsTab({ profile, onChange }: EditorSocialsTabProps) {
  const [newPlatform, setNewPlatform] = useState<SocialPlatformId>('github');
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newFollowers, setNewFollowers] = useState('');
  const [newIconImageUrl, setNewIconImageUrl] = useState('');
  const [newIconShape, setNewIconShape] = useState<SocialIconShape>('circle');
  const [newDividerTitle, setNewDividerTitle] = useState('');
  const [newDividerStyle, setNewDividerStyle] = useState<SocialDividerStyle>('line');
  const [newDividerColor, setNewDividerColor] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedMeta =
    SOCIAL_PLATFORMS.find((p) => p.id === newPlatform) || SOCIAL_PLATFORMS[0];
  const totalFollowers = calculateTotalFollowers(profile.socials);

  const handleNewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setNewIconImageUrl(compressed);
      setErrorMsg('');
    } catch {
      setErrorMsg('Impossibile elaborare la foto selezionata.');
    }
  };

  const handleExistingPhotoUpload = async (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file);
      const current = profile.socials.find((s) => s.id === id);
      updateSocial(id, {
        iconImageUrl: compressed,
        iconShape: current?.iconShape || 'circle',
      });
    } catch {
      setErrorMsg('Impossibile elaborare la foto selezionata.');
    }
  };

  const handleAddSocial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) {
      setErrorMsg('Inserisci un username o un link valido.');
      return;
    }
    const normalized = normalizeUrl(newUrl, newPlatform);
    const parsedFollowers = Number(newFollowers.replace(/[^0-9]/g, ''));
    const cleanPhoto = newIconImageUrl.trim();
    const customLabel = newLabel.trim() || selectedMeta.name;
    const nextItem: SocialLinkItem = {
      id: `soc_${Date.now().toString(36)}`,
      kind: 'link',
      platform: newPlatform,
      url: normalized,
      label: customLabel,
      visible: true,
      followers: parsedFollowers > 0 ? parsedFollowers : undefined,
      ...(cleanPhoto ? { iconImageUrl: cleanPhoto, iconShape: newIconShape } : {}),
      ...(!cleanPhoto && newIconShape !== 'circle' ? { iconShape: newIconShape } : {}),
    };
    onChange((prev) => ({
      ...prev,
      socials: [...prev.socials, nextItem],
    }));
    setNewUrl('');
    setNewLabel('');
    setNewFollowers('');
    setNewIconImageUrl('');
    setNewIconShape('circle');
    setErrorMsg('');
  };

  const handleAddDivider = () => {
    const nextDivider: SocialLinkItem = {
      id: `soc_div_${Date.now().toString(36)}`,
      kind: 'divider',
      platform: 'website',
      url: '',
      label: newDividerTitle.trim(),
      visible: true,
      dividerStyle: newDividerStyle,
      ...(newDividerColor ? { dividerColor: newDividerColor } : {}),
    };
    onChange((prev) => ({
      ...prev,
      socials: [...prev.socials, nextDivider],
    }));
    setNewDividerTitle('');
  };

  const updateSocial = (id: string, patch: Partial<SocialLinkItem>) => {
    onChange((prev) => ({
      ...prev,
      socials: prev.socials.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const removeSocial = (id: string) => {
    onChange((prev) => ({
      ...prev,
      socials: prev.socials.filter((s) => s.id !== id),
    }));
  };

  const moveSocial = (index: number, dir: 'up' | 'down') => {
    onChange((prev) => ({
      ...prev,
      socials: moveItem(prev.socials, index, dir),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Add Social Form */}
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Aggiungi Icona Social
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Supporta 20 piattaforme, foto personalizzate come icona, titoli e divisori tra gruppi.
            </p>
          </div>
          {totalFollowers > 0 && (
            <div className="px-2.5 py-1 bg-zinc-100 rounded-md text-xs font-semibold text-zinc-800 tabular-nums whitespace-nowrap shrink-0">
              {formatFollowerCount(totalFollowers)} Totali
            </div>
          )}
        </div>

        <form onSubmit={handleAddSocial} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-3">
              <label htmlFor="social-platform-select" className="sr-only">
                Piattaforma social
              </label>
              <select
                id="social-platform-select"
                value={newPlatform}
                onChange={(e) => {
                  setNewPlatform(e.target.value as SocialPlatformId);
                  setErrorMsg('');
                }}
                className="w-full px-2.5 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="social-url-input" className="sr-only">
                Username o URL social
              </label>
              <input
                id="social-url-input"
                type="text"
                value={newUrl}
                onChange={(e) => {
                  setNewUrl(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={selectedMeta.placeholder}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="social-label-input" className="sr-only">
                Titolo icona (opzionale)
              </label>
              <input
                id="social-label-input"
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder={`Titolo (${selectedMeta.name})`}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full px-3 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Aggiungi</span>
              </button>
            </div>
          </div>

          {/* Custom Icon Photo + Shape + Optional Followers */}
          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex flex-col gap-2.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                <span
                  className={`w-9 h-9 border border-zinc-200 bg-white overflow-hidden inline-flex items-center justify-center shrink-0 shadow-xs ${getSocialIconShapeRadiusClass(
                    newIconShape,
                    profile.theme.socialStyle
                  )}`}
                >
                  {newIconImageUrl ? (
                    <img
                      src={newIconImageUrl}
                      alt="Anteprima foto icona"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <SocialIcon platform={newPlatform} fullColor className="w-4 h-4" />
                  )}
                </span>

                <label className="px-3 py-1.5 text-xs font-medium text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                  <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{newIconImageUrl ? 'Cambia foto icona' : 'Foto come icona'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    aria-label="Carica foto come icona"
                    onChange={handleNewPhotoUpload}
                    className="sr-only"
                  />
                </label>

                <input
                  type="text"
                  aria-label="URL foto icona (opzionale)"
                  value={newIconImageUrl.startsWith('data:') ? '' : newIconImageUrl}
                  onChange={(e) => setNewIconImageUrl(e.target.value)}
                  placeholder={
                    newIconImageUrl.startsWith('data:')
                      ? 'Foto caricata dal dispositivo'
                      : 'oppure URL immagine icona...'
                  }
                  className="flex-1 min-w-[140px] px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                />

                {newIconImageUrl && (
                  <button
                    type="button"
                    onClick={() => setNewIconImageUrl('')}
                    aria-label="Rimuovi foto icona selezionata"
                    className="p-1.5 text-zinc-500 hover:text-red-600 bg-white border border-zinc-200 rounded-lg hover:bg-red-50 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium text-zinc-600 whitespace-nowrap">
                  Forma:
                </span>
                <div
                  role="group"
                  aria-label="Forma foto icona"
                  className="inline-flex items-center gap-1 p-1 bg-zinc-200/70 rounded-lg"
                >
                  {ICON_SHAPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={newIconShape === opt.id}
                      onClick={() => setNewIconShape(opt.id)}
                      className={`px-2 py-1 text-[11px] font-medium rounded-md inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                        newIconShape === opt.id
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-2.5 h-2.5 border border-current ${opt.previewRadius}`}
                      />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
                <input
                  id="social-followers-input"
                  type="number"
                  min={0}
                  aria-label="Follower (opzionale)"
                  value={newFollowers}
                  onChange={(e) => setNewFollowers(e.target.value)}
                  placeholder="Follower"
                  className="w-24 px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 tabular-nums"
                />
              </div>
            </div>
          </div>
        </form>
        {errorMsg && <p className="text-xs text-red-600 font-medium">{errorMsg}</p>}

        {/* Add Custom Social Divider Bar */}
        <div className="p-3 bg-white border border-zinc-200 rounded-xl flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-700 inline-flex items-center gap-1.5 mr-1 whitespace-nowrap">
            <Minus className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
            <span>Divisore personalizzato:</span>
          </span>
          <input
            type="text"
            aria-label="Titolo divisore social (opzionale)"
            value={newDividerTitle}
            onChange={(e) => setNewDividerTitle(e.target.value)}
            placeholder="Titolo sul divisore (opzionale, es. Shop & Contatti)"
            className="flex-1 min-w-[180px] px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900"
          />
          <select
            aria-label="Stile nuovo divisore social"
            value={newDividerStyle}
            onChange={(e) => setNewDividerStyle(e.target.value as SocialDividerStyle)}
            className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
          >
            {DIVIDER_STYLE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="color"
            aria-label="Colore divisore social"
            value={newDividerColor || profile.theme.borderColor || '#D4D4D8'}
            onChange={(e) => setNewDividerColor(e.target.value)}
            title="Colore divisore"
            className="w-8 h-8 p-0.5 bg-white border border-zinc-200 rounded-lg cursor-pointer shrink-0"
          />
          <button
            type="button"
            onClick={handleAddDivider}
            className="px-3 py-1.5 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Aggiungi Divisore</span>
          </button>
        </div>
      </section>

      <hr className="border-zinc-200" />

      {/* Section Title, Labels, Placement & Icon Style */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label
              htmlFor="social-section-title"
              className="block text-xs font-medium text-zinc-700 mb-1.5"
            >
              Titolo Barra Social (opzionale)
            </label>
            <input
              id="social-section-title"
              type="text"
              maxLength={80}
              value={profile.theme.socialSectionTitle || ''}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  theme: { ...prev.theme, socialSectionTitle: e.target.value },
                }))
              }
              placeholder="Es. Seguimi sui social"
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
            />
          </div>

          <label className="inline-flex items-center gap-2 py-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(profile.theme.showSocialLabels)}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  theme: { ...prev.theme, showSocialLabels: e.target.checked },
                }))
              }
              className="w-4 h-4 accent-zinc-900 rounded"
            />
            <span className="text-xs font-medium text-zinc-800">
              Mostra titolo sotto ogni icona nella bio
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-medium text-zinc-700 mb-1.5">
              Posizione Barra Social
            </span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-lg">
              {(
                [
                  { id: 'top', label: 'Sopra i link' },
                  { id: 'bottom', label: 'Sotto i link' },
                ] as { id: SocialPosition; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      theme: { ...prev.theme, socialPosition: opt.id },
                    }))
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                    profile.theme.socialPosition === opt.id
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-zinc-700 mb-1.5">
              Stile Icone
            </span>
            <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 rounded-lg">
              {(
                [
                  { id: 'brand', label: 'luancer link' },
                  { id: 'minimal', label: 'Minimale' },
                  { id: 'circle', label: 'Cerchio' },
                  { id: 'square', label: 'Quadrato' },
                ] as { id: SocialStyle; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      theme: { ...prev.theme, socialStyle: opt.id },
                    }))
                  }
                  className={`px-2 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                    profile.theme.socialStyle === opt.id
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="border-zinc-200" />

      {/* Active Socials & Dividers List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">
            Social configurati ({profile.socials.length})
          </h3>
        </div>

        {profile.socials.length === 0 ? (
          <div className="border border-dashed border-zinc-300 rounded-xl py-8 px-4 text-center text-sm text-zinc-500">
            Nessun social aggiunto. Seleziona una piattaforma sopra per iniziare.
          </div>
        ) : (
          <div className="space-y-2.5">
            {profile.socials.map((soc, idx) => {
              if (soc.kind === 'divider') {
                return (
                  <div
                    key={soc.id}
                    className={`p-3 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl flex flex-wrap items-center gap-2.5 ${
                      !soc.visible ? 'opacity-60' : ''
                    }`}
                  >
                    <span className="px-2 py-1 text-[11px] font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-md inline-flex items-center gap-1 shrink-0">
                      <Minus className="w-3 h-3" aria-hidden="true" />
                      <span>Divisore</span>
                    </span>

                    <input
                      type="text"
                      aria-label="Titolo divisore"
                      value={soc.label}
                      onChange={(e) => updateSocial(soc.id, { label: e.target.value })}
                      placeholder="Titolo divisore (opzionale)"
                      className="flex-1 min-w-[140px] px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                    />

                    <select
                      aria-label="Stile divisore"
                      value={soc.dividerStyle || 'line'}
                      onChange={(e) =>
                        updateSocial(soc.id, {
                          dividerStyle: e.target.value as SocialDividerStyle,
                        })
                      }
                      className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg"
                    >
                      {DIVIDER_STYLE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="color"
                      aria-label="Colore divisore"
                      value={soc.dividerColor || profile.theme.borderColor || '#D4D4D8'}
                      onChange={(e) =>
                        updateSocial(soc.id, { dividerColor: e.target.value })
                      }
                      className="w-7 h-7 p-0.5 bg-white border border-zinc-200 rounded cursor-pointer shrink-0"
                    />

                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSocial(idx, 'up')}
                        aria-label="Sposta su divisore"
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer rounded-md hover:bg-zinc-200/70"
                      >
                        <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === profile.socials.length - 1}
                        onClick={() => moveSocial(idx, 'down')}
                        aria-label="Sposta giù divisore"
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer rounded-md hover:bg-zinc-200/70"
                      >
                        <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSocial(soc.id, { visible: !soc.visible })}
                        aria-label={soc.visible ? 'Nascondi divisore' : 'Mostra divisore'}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 cursor-pointer rounded-md hover:bg-zinc-200/70"
                      >
                        {soc.visible ? (
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSocial(soc.id)}
                        aria-label="Elimina divisore"
                        className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              }

              const activeShape: SocialIconShape = soc.iconShape || 'circle';
              const shapeRadiusClass = getSocialIconShapeRadiusClass(
                soc.iconShape,
                profile.theme.socialStyle
              );
              return (
                <div
                  key={soc.id}
                  className={`p-3 bg-white border border-zinc-200 rounded-xl space-y-2.5 ${
                    !soc.visible ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`w-9 h-9 bg-white border border-zinc-200 overflow-hidden inline-flex items-center justify-center shadow-xs ${shapeRadiusClass}`}
                      >
                        {soc.iconImageUrl ? (
                          <img
                            src={soc.iconImageUrl}
                            alt={soc.label || soc.platform}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <SocialIcon platform={soc.platform} fullColor className="w-4 h-4" />
                        )}
                      </span>
                      <input
                        type="text"
                        aria-label={`Titolo per ${soc.label || soc.platform}`}
                        value={soc.label}
                        onChange={(e) => updateSocial(soc.id, { label: e.target.value })}
                        placeholder={soc.platform}
                        className="w-24 px-2 py-1.5 text-xs font-semibold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900"
                      />
                    </div>

                    <input
                      type="text"
                      aria-label={`URL per ${soc.label || soc.platform}`}
                      value={soc.url}
                      onChange={(e) => updateSocial(soc.id, { url: e.target.value })}
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900"
                    />

                    <input
                      type="number"
                      min={0}
                      aria-label={`Follower per ${soc.label || soc.platform}`}
                      value={soc.followers ?? ''}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        updateSocial(soc.id, {
                          followers: Number.isFinite(num) && num > 0 ? num : undefined,
                        });
                      }}
                      placeholder="Follower"
                      className="w-full sm:w-20 px-2 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900 tabular-nums"
                    />

                    <div className="flex items-center gap-1 shrink-0 justify-end">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSocial(idx, 'up')}
                        aria-label={`Sposta su ${soc.label || soc.platform}`}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer rounded-md hover:bg-zinc-100"
                      >
                        <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === profile.socials.length - 1}
                        onClick={() => moveSocial(idx, 'down')}
                        aria-label={`Sposta giù ${soc.label || soc.platform}`}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer rounded-md hover:bg-zinc-100"
                      >
                        <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSocial(soc.id, { visible: !soc.visible })}
                        aria-label={
                          soc.visible
                            ? `Nascondi ${soc.label || soc.platform}`
                            : `Mostra ${soc.label || soc.platform}`
                        }
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 cursor-pointer rounded-md hover:bg-zinc-100"
                      >
                        {soc.visible ? (
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSocial(soc.id)}
                        aria-label={`Elimina ${soc.label || soc.platform}`}
                        className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Per-item Photo Icon & Shape Controls */}
                  <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                      <label className="px-2.5 py-1 text-[11px] font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md hover:bg-zinc-100 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                        <ImagePlus className="w-3 h-3" aria-hidden="true" />
                        <span>{soc.iconImageUrl ? 'Cambia foto' : 'Foto icona'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          aria-label={`Carica foto icona per ${soc.label || soc.platform}`}
                          onChange={(e) => handleExistingPhotoUpload(soc.id, e)}
                          className="sr-only"
                        />
                      </label>
                      <input
                        type="text"
                        aria-label={`URL foto icona per ${soc.label || soc.platform}`}
                        value={
                          soc.iconImageUrl?.startsWith('data:')
                            ? ''
                            : soc.iconImageUrl || ''
                        }
                        onChange={(e) =>
                          updateSocial(soc.id, {
                            iconImageUrl: e.target.value || undefined,
                            iconShape: soc.iconShape || 'circle',
                          })
                        }
                        placeholder={
                          soc.iconImageUrl?.startsWith('data:')
                            ? 'Foto caricata dal dispositivo'
                            : 'URL foto icona (opzionale)'
                        }
                        className="flex-1 min-w-[140px] max-w-[260px] px-2 py-1 text-[11px] bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:bg-white focus:border-zinc-900"
                      />
                      {soc.iconImageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            updateSocial(soc.id, { iconImageUrl: undefined })
                          }
                          aria-label={`Rimuovi foto da ${soc.label || soc.platform}`}
                          className="px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded-md cursor-pointer whitespace-nowrap"
                        >
                          Usa icona social
                        </button>
                      )}
                    </div>

                    <div
                      role="group"
                      aria-label={`Forma icona ${soc.label || soc.platform}`}
                      className="inline-flex items-center gap-0.5 p-0.5 bg-zinc-100 rounded-md shrink-0"
                    >
                      {ICON_SHAPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          aria-pressed={activeShape === opt.id}
                          onClick={() => updateSocial(soc.id, { iconShape: opt.id })}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                            activeShape === opt.id
                              ? 'bg-white text-zinc-900 shadow-xs'
                              : 'text-zinc-500 hover:text-zinc-900'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`w-2 h-2 border border-current ${opt.previewRadius}`}
                          />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
