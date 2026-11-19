import React from 'react';
import { Upload, Check } from 'lucide-react';
import type { BioProfile, HeroLayoutStyle } from '../types/profile';
import { GENERATED_IMAGES } from '../data/presets';
import { normalizeHandle } from '../utils/profileLogic';

interface EditorProfileTabProps {
  profile: BioProfile;
  onChange: (updater: (prev: BioProfile) => BioProfile) => void;
}

const AVATAR_PRESETS = [
  { label: 'Elena', url: GENERATED_IMAGES.elenaAvatar },
  { label: 'Marco', url: GENERATED_IMAGES.marcoAvatar },
  { label: 'Atelier', url: GENERATED_IMAGES.atelierAvatar },
];

const BANNER_PRESETS = [
  { label: 'Nessuna', url: '' },
  { label: 'Studio Design', url: GENERATED_IMAGES.designCover },
  { label: 'Vinile Analogico', url: GENERATED_IMAGES.vinylCover },
];

export function EditorProfileTab({ profile, onChange }: EditorProfileTabProps) {
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'avatarUrl' | 'bannerUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawDataUrl) return;
      const img = new Image();
      img.onload = () => {
        const maxWidth = field === 'avatarUrl' ? 420 : 900;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onChange((prev) => ({ ...prev, [field]: rawDataUrl }));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        onChange((prev) => ({ ...prev, [field]: compressed }));
      };
      img.onerror = () => {
        onChange((prev) => ({ ...prev, [field]: rawDataUrl }));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Identity Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Identità del Profilo
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Personalizza nome, handle pubblico, biografia, badge verificato e contatore follower.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="profile-display-name"
              className="block text-xs font-medium text-zinc-700 mb-1.5"
            >
              Nome Visualizzato
            </label>
            <input
              id="profile-display-name"
              type="text"
              value={profile.displayName}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, displayName: e.target.value }))
              }
              placeholder="Es. Elena Moretti"
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="profile-handle"
              className="block text-xs font-medium text-zinc-700 mb-1.5"
            >
              Handle Pubblico (@)
            </label>
            <div className="flex items-center bg-white border border-zinc-200 rounded-lg focus-within:border-zinc-900 overflow-hidden">
              <span className="pl-3 pr-1 text-sm text-zinc-400 select-none">@</span>
              <input
                id="profile-handle"
                type="text"
                value={profile.handle}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    handle: normalizeHandle(e.target.value),
                  }))
                }
                placeholder="nome.cognome"
                className="w-full py-2 pr-3 text-sm bg-transparent focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-role"
              className="block text-xs font-medium text-zinc-700 mb-1.5"
            >
              Ruolo o Sottotitolo
            </label>
            <input
              id="profile-role"
              type="text"
              value={profile.role}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, role: e.target.value }))
              }
              placeholder="Es. Product Designer & Art Director"
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="profile-category"
              className="block text-xs font-medium text-zinc-700 mb-1.5"
            >
              Categoria Directory
            </label>
            <select
              id="profile-category"
              value={profile.category}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
            >
              <option value="Design & Arte">Design &amp; Arte</option>
              <option value="Tech & Sviluppo">Tech &amp; Sviluppo</option>
              <option value="Locali & Cultura">Locali &amp; Cultura</option>
              <option value="Musica & Audio">Musica &amp; Audio</option>
              <option value="Creator & Media">Creator &amp; Media</option>
              <option value="Consulenza & Business">Consulenza &amp; Business</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="profile-bio"
              className="block text-xs font-medium text-zinc-700"
            >
              Biografia
            </label>
            <span className="text-[11px] text-zinc-400 tabular-nums">
              {profile.bio.length}/220
            </span>
          </div>
          <textarea
            id="profile-bio"
            rows={3}
            maxLength={220}
            value={profile.bio}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, bio: e.target.value }))
            }
            placeholder="Descrivi cosa fai e cosa possono trovare i visitatori nei tuoi link..."
            className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="profile-location"
              className="block text-xs font-medium text-zinc-700 mb-1.5"
            >
              Città / Località
            </label>
            <input
              id="profile-location"
              type="text"
              value={profile.location}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Es. Milano, Italia"
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-zinc-700 mb-1.5">
              Layout Intestazione
            </span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-lg">
              {(
                [
                  { id: 'fullbleed', label: 'Hero luancer link' },
                  { id: 'avatar', label: 'Avatar Classico' },
                ] as { id: HeroLayoutStyle; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      theme: { ...prev.theme, heroStyle: opt.id },
                    }))
                  }
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                    (profile.theme.heroStyle || 'fullbleed') === opt.id
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

        <div className="flex flex-wrap items-center gap-5 pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={profile.verified}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, verified: e.target.checked }))
              }
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span className="text-sm font-medium text-zinc-800">
              Badge verificato
            </span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={profile.showFollowersCount !== false}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  showFollowersCount: e.target.checked,
                }))
              }
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span className="text-sm font-medium text-zinc-800">
              Mostra contatore Follower Totali
            </span>
          </label>
        </div>
      </section>

      <hr className="border-zinc-200" />

      {/* Avatar / Hero Photo & Cover Banner */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-900">
          Foto Hero / Avatar e Copertina
        </h2>

        <div className="space-y-2.5">
          <label
            htmlFor="profile-avatar-url"
            className="block text-xs font-medium text-zinc-700"
          >
            Foto Principale (URL o carica immagine)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="profile-avatar-url"
              type="text"
              value={profile.avatarUrl}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, avatarUrl: e.target.value }))
              }
              placeholder="https://... oppure scegli un preset"
              className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
            />
            <label className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Carica file</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'avatarUrl')}
                className="sr-only"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-zinc-500">Preset rapidi:</span>
            {AVATAR_PRESETS.map((preset) => {
              const active = profile.avatarUrl === preset.url;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({ ...prev, avatarUrl: preset.url }))
                  }
                  className={`px-2.5 py-1 text-xs rounded-md border inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    active
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {active && <Check className="w-3 h-3" aria-hidden="true" />}
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <label
            htmlFor="profile-banner-url"
            className="block text-xs font-medium text-zinc-700"
          >
            Copertina Secondaria (per layout Avatar Classico)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="profile-banner-url"
              type="text"
              value={profile.bannerUrl}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, bannerUrl: e.target.value }))
              }
              placeholder="URL immagine copertina"
              className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
            />
            <label className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Carica file</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'bannerUrl')}
                className="sr-only"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-zinc-500">Copertine:</span>
            {BANNER_PRESETS.map((preset) => {
              const active = profile.bannerUrl === preset.url;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({ ...prev, bannerUrl: preset.url }))
                  }
                  className={`px-2.5 py-1 text-xs rounded-md border inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    active
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {active && <Check className="w-3 h-3" aria-hidden="true" />}
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
