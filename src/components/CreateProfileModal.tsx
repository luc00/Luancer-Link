import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { BioProfile } from '../types/profile';
import { THEME_PRESETS } from '../data/presets';
import {
  cloneProfileForRemix,
  normalizeHandle,
  validateProfileInput,
} from '../utils/profileLogic';

interface CreateProfileModalProps {
  isOpen: boolean;
  existingHandles: string[];
  templates: BioProfile[];
  onClose: () => void;
  onCreate: (newProfile: BioProfile) => void;
}

export function CreateProfileModal({
  isOpen,
  existingHandles,
  templates,
  onClose,
  onCreate,
}: CreateProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('');
  const [baseMode, setBaseMode] = useState<'blank' | string>('blank');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateProfileInput({ handle, displayName });
    if (!check.valid) {
      setError(
        check.errors.displayName || check.errors.handle || 'Controlla i campi.'
      );
      return;
    }

    const cleanHandle = normalizeHandle(handle);
    if (existingHandles.includes(cleanHandle)) {
      setError(`L'handle @${cleanHandle} esiste già. Scegline un altro.`);
      return;
    }

    let created: BioProfile;
    const templateSource = templates.find((t) => t.id === baseMode);

    if (templateSource) {
      const remixed = cloneProfileForRemix(templateSource, cleanHandle, displayName);
      created = {
        ...remixed,
        role: role.trim() || 'Creator & Professionista',
        bio: 'Benvenuto nella mia pagina luancer link. Scopri tutti i miei link e contatti principali.',
        verified: false,
        showFollowersCount: true,
        availabilityText: '',
        avatarUrl: '',
        bannerUrl: '',
      };
    } else {
      created = {
        id: `prof_${Date.now().toString(36)}`,
        handle: cleanHandle,
        displayName: displayName.trim(),
        role: role.trim() || 'Creator & Professionista',
        bio: 'Benvenuto nella mia pagina luancer link. Qui trovi tutti i miei collegamenti principali.',
        location: 'Italia',
        category: 'Creator & Media',
        verified: false,
        showFollowersCount: true,
        availabilityText: '',
        avatarUrl: '',
        bannerUrl: '',
        views: 0,
        updatedAt: new Date().toISOString(),
        socials: [
          {
            id: `soc_${Date.now().toString(36)}_1`,
            platform: 'instagram',
            url: `https://instagram.com/${cleanHandle}`,
            label: 'Instagram',
            visible: true,
            followers: 0,
          },
          {
            id: `soc_${Date.now().toString(36)}_2`,
            platform: 'email',
            url: `mailto:${cleanHandle}@example.it`,
            label: 'Email',
            visible: true,
          },
        ],
        blocks: [
          {
            id: `blk_${Date.now().toString(36)}_1`,
            type: 'link',
            visible: true,
            title: 'Il mio sito web ufficiale',
            subtitle: 'Scopri progetti e novità',
            url: 'https://example.com',
            iconName: 'globe',
            highlight: true,
            clicks: 0,
          },
        ],
        theme: { ...THEME_PRESETS[0].theme },
        messages: [],
      };
    }

    setDisplayName('');
    setHandle('');
    setRole('');
    setError('');
    onCreate(created);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-profile-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2
            id="create-profile-title"
            className="text-base font-bold text-zinc-900"
          >
            Crea Nuovo Profilo Pubblico
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi finestra creazione profilo"
            className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="new-prof-name"
              className="block text-xs font-medium text-zinc-700 mb-1"
            >
              Nome Visualizzato
            </label>
            <input
              id="new-prof-name"
              type="text"
              value={displayName}
              onChange={(e) => {
                const val = e.target.value;
                setDisplayName(val);
                if (!handle) {
                  setHandle(normalizeHandle(val));
                }
                setError('');
              }}
              placeholder="Es. Luca Rossi"
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="new-prof-handle"
              className="block text-xs font-medium text-zinc-700 mb-1"
            >
              Handle Pubblico (@)
            </label>
            <div className="flex items-center border border-zinc-200 rounded-lg focus-within:border-zinc-900 overflow-hidden">
              <span className="pl-3 pr-1 text-sm text-zinc-400">@</span>
              <input
                id="new-prof-handle"
                type="text"
                value={handle}
                onChange={(e) => {
                  setHandle(normalizeHandle(e.target.value));
                  setError('');
                }}
                placeholder="luca.music"
                className="w-full py-2 pr-3 text-sm font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="new-prof-role"
              className="block text-xs font-medium text-zinc-700 mb-1"
            >
              Ruolo / Attività (opzionale)
            </label>
            <input
              id="new-prof-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Es. Producer & Sound Designer"
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="new-prof-template"
              className="block text-xs font-medium text-zinc-700 mb-1"
            >
              Modello di Partenza
            </label>
            <select
              id="new-prof-template"
              value={baseMode}
              onChange={(e) => setBaseMode(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
            >
              <option value="blank">Profilo Pulito (Parti da zero)</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  Clona struttura di @{tpl.handle} ({tpl.displayName})
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              Crea e Personalizza
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
