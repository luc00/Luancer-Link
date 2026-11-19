import React, { useMemo, useState } from 'react';
import {
  BadgeCheck,
  ExternalLink,
  PenLine,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { BioProfile } from '../types/profile';
import { calculateProfileStats } from '../utils/profileLogic';

interface DirectoryViewProps {
  profiles: BioProfile[];
  activeHandle: string;
  onEditProfile: (handle: string) => void;
  onViewPublic: (handle: string) => void;
  onOpenCreate: () => void;
  onDeleteProfile: (handle: string) => void;
}

export function DirectoryView({
  profiles,
  activeHandle,
  onEditProfile,
  onViewPublic,
  onOpenCreate,
  onDeleteProfile,
}: DirectoryViewProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tutte');

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(profiles.map((p) => p.category || 'Altro'))
    );
    return ['Tutte', ...unique];
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      const catMatch =
        categoryFilter === 'Tutte' || p.category === categoryFilter;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        p.displayName.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    });
  }, [profiles, query, categoryFilter]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-studio-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Directory Profili Pubblici
          </h1>
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
            Esplora le pagine create dal pubblico, apri la vista condivisibile o personalizza qualsiasi profilo nell&apos;editor studio.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="px-4 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Crea Profilo Pubblico</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-200">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-200/70 rounded-lg">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Cerca profili pubblici"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca nome, @handle o città..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
          />
        </div>
      </div>

      {/* Profiles Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-300 rounded-2xl py-12 px-6 text-center space-y-3">
          <p className="text-sm text-zinc-600">
            Nessun profilo corrisponde alla ricerca selezionata.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategoryFilter('Tutte');
            }}
            className="px-4 py-2 text-xs font-medium text-zinc-800 bg-zinc-100 rounded-lg hover:bg-zinc-200 cursor-pointer"
          >
            Mostra tutti i profili
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prof) => {
            const stats = calculateProfileStats(prof);
            const isActive = prof.handle === activeHandle;
            const initials = prof.displayName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((s) => s[0]?.toUpperCase())
              .join('');

            return (
              <article
                key={prof.id}
                className={`bg-white border rounded-2xl overflow-hidden flex flex-col justify-between transition-colors ${
                  isActive ? 'border-zinc-900' : 'border-zinc-200'
                }`}
              >
                <div>
                  {/* Color Accent Strip using the profile's own theme */}
                  <div
                    style={{
                      backgroundColor: prof.theme.backgroundColor,
                      borderBottom: `1px solid ${prof.theme.borderColor}`,
                    }}
                    className="h-16 px-4 flex items-center justify-between"
                  >
                    <span
                      style={{ color: prof.theme.mutedTextColor }}
                      className="text-xs font-mono"
                    >
                      @{prof.handle}
                    </span>
                    <span
                      style={{
                        backgroundColor: prof.theme.accentColor,
                        color: prof.theme.accentTextColor,
                      }}
                      className="w-3 h-3 rounded-full shrink-0"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="px-5 pb-5 -mt-7">
                    <div className="flex items-end justify-between gap-3 mb-3">
                      <div className="w-14 h-14 rounded-full border-4 border-white bg-zinc-100 overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                        {prof.avatarUrl ? (
                          <img
                            src={prof.avatarUrl}
                            alt={prof.displayName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-zinc-700">
                            {initials}
                          </span>
                        )}
                      </div>

                      {profiles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteProfile(prof.handle)}
                          aria-label={`Elimina profilo @${prof.handle}`}
                          className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base font-bold text-zinc-900 truncate">
                        {prof.displayName}
                      </h2>
                      {prof.verified && (
                        <BadgeCheck
                          className="w-4 h-4 text-blue-600 shrink-0"
                          aria-label="Verificato"
                        />
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 mt-0.5 truncate">
                      {prof.role || prof.category}
                      {prof.location ? ` · ${prof.location}` : ''}
                    </p>

                    <p className="text-xs text-zinc-700 mt-2.5 line-clamp-2 leading-relaxed min-h-[2.25rem]">
                      {prof.bio || 'Nessuna biografia impostata.'}
                    </p>

                    {/* Unboxed Typographic Metadata */}
                    <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-500 tabular-nums">
                      <span>{stats.activeLinks} link</span>
                      <span aria-hidden="true">·</span>
                      <span>{stats.activeSocials} social</span>
                      <span aria-hidden="true">·</span>
                      <span>{stats.totalClicks} clic</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditProfile(prof.handle)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <PenLine className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Personalizza</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewPublic(prof.handle)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Vedi Pagina</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
