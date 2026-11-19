import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type {
  BioProfile,
  ButtonShape,
  CardVariant,
  ProfileFont,
  ProfileTheme,
  SpacingDensity,
  ThemeBackgroundType,
  ThemePatternType,
} from '../types/profile';
import { GENERATED_IMAGES, THEME_PRESETS } from '../data/presets';
import { getThemeContrastSummary } from '../utils/profileLogic';

interface EditorThemeTabProps {
  profile: BioProfile;
  onChange: (updater: (prev: BioProfile) => BioProfile) => void;
}

export function EditorThemeTab({ profile, onChange }: EditorThemeTabProps) {
  const { theme } = profile;
  const contrast = getThemeContrastSummary(theme);

  const updateTheme = (patch: Partial<ProfileTheme>) => {
    onChange((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...patch, presetId: patch.presetId ?? 'custom' },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Curated Presets */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Temi Curati
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Applica una palette completa con un clic, poi personalizza ogni dettaglio sotto.
            </p>
          </div>
          <div
            className={`px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              contrast.passesAA
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {contrast.passesAA ? (
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span className="tabular-nums">{contrast.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {THEME_PRESETS.map((preset) => {
            const active = theme.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onChange((prev) => ({
                    ...prev,
                    theme: {
                      ...preset.theme,
                      socialPosition: prev.theme.socialPosition,
                    },
                  }))
                }
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'border-zinc-900 bg-white ring-1 ring-zinc-900'
                    : 'border-zinc-200 bg-white hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    style={{ backgroundColor: preset.theme.backgroundColor }}
                    className="w-5 h-5 rounded-full border border-zinc-300"
                  />
                  <span
                    style={{ backgroundColor: preset.theme.surfaceColor }}
                    className="w-5 h-5 rounded-full border border-zinc-300"
                  />
                  <span
                    style={{ backgroundColor: preset.theme.accentColor }}
                    className="w-5 h-5 rounded-full border border-zinc-300"
                  />
                </div>
                <div className="text-xs font-semibold text-zinc-900 truncate">
                  {preset.name}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <hr className="border-zinc-200" />

      {/* Background Type */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">Sfondo Pagina</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-zinc-100 rounded-lg">
          {(
            [
              { id: 'solid', label: 'Tinta Unita' },
              { id: 'gradient', label: 'Gradiente' },
              { id: 'pattern', label: 'Pattern' },
              { id: 'image', label: 'Immagine' },
            ] as { id: ThemeBackgroundType; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => updateTheme({ backgroundType: opt.id })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                theme.backgroundType === opt.id
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {theme.backgroundType === 'gradient' && (
          <div className="space-y-3 p-3.5 bg-white border border-zinc-200 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                <span>Colore Inizio</span>
                <input
                  type="color"
                  value={theme.gradientStart}
                  onChange={(e) => updateTheme({ gradientStart: e.target.value })}
                  className="w-8 h-6 rounded cursor-pointer border border-zinc-200 shrink-0"
                />
              </label>
              <label className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                <span>Colore Fine</span>
                <input
                  type="color"
                  value={theme.gradientEnd}
                  onChange={(e) => updateTheme({ gradientEnd: e.target.value })}
                  className="w-8 h-6 rounded cursor-pointer border border-zinc-200 shrink-0"
                />
              </label>
              <label className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col justify-center gap-1 text-xs font-medium text-zinc-700">
                <span className="tabular-nums">Angolo ({theme.gradientAngle}°)</span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={theme.gradientAngle}
                  onChange={(e) =>
                    updateTheme({ gradientAngle: Number(e.target.value) })
                  }
                  className="w-full accent-zinc-900"
                />
              </label>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs font-medium text-zinc-600">
                Trama sovrapposta:
              </span>
              <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 rounded-lg flex-1 max-w-xs">
                {(
                  [
                    { id: 'none', label: 'Nessuna' },
                    { id: 'dots', label: 'Punti' },
                    { id: 'grid', label: 'Griglia' },
                    { id: 'diagonal', label: 'Linee' },
                  ] as { id: ThemePatternType; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateTheme({ pattern: opt.id })}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                      theme.pattern === opt.id
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
        )}

        {theme.backgroundType === 'pattern' && (
          <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 rounded-lg">
            {(
              [
                { id: 'none', label: 'Nessuno' },
                { id: 'dots', label: 'Punti' },
                { id: 'grid', label: 'Griglia' },
                { id: 'diagonal', label: 'Diagonale' },
              ] as { id: ThemePatternType; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateTheme({ pattern: opt.id })}
                className={`px-2 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                  theme.pattern === opt.id
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {theme.backgroundType === 'image' && (
          <div className="space-y-2 p-3.5 bg-white border border-zinc-200 rounded-xl">
            <label
              htmlFor="theme-bg-img"
              className="block text-xs font-medium text-zinc-700"
            >
              URL Immagine di Sfondo
            </label>
            <input
              id="theme-bg-img"
              type="text"
              value={theme.backgroundImageUrl}
              onChange={(e) =>
                updateTheme({ backgroundImageUrl: e.target.value })
              }
              placeholder="https://..."
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  updateTheme({
                    backgroundImageUrl: GENERATED_IMAGES.designCover,
                  })
                }
                className="px-2.5 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 rounded-md cursor-pointer"
              >
                Studio Design
              </button>
              <button
                type="button"
                onClick={() =>
                  updateTheme({
                    backgroundImageUrl: GENERATED_IMAGES.vinylCover,
                  })
                }
                className="px-2.5 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 rounded-md cursor-pointer"
              >
                Vinile Analogico
              </button>
            </div>
          </div>
        )}
      </section>

      <hr className="border-zinc-200" />

      {/* Typography, Shape & Card Variant */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">
          Tipografia, Forme e Superfici
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-medium text-zinc-700 mb-1.5">
              Font del Profilo
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'jakarta', label: 'Jakarta Sans' },
                  { id: 'playfair', label: 'Playfair Serif' },
                  { id: 'outfit', label: 'Outfit Display' },
                  { id: 'jetbrains', label: 'JetBrains Mono' },
                ] as { id: ProfileFont; label: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => updateTheme({ font: f.id })}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left cursor-pointer transition-colors ${
                    theme.font === f.id
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="block text-xs font-medium text-zinc-700 mb-1.5">
                Forma Pulsanti
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 rounded-lg">
                {(
                  [
                    { id: 'sharp', label: 'Netta' },
                    { id: 'rounded', label: 'Morbida' },
                    { id: 'pill', label: 'Capsula' },
                  ] as { id: ButtonShape; label: string }[]
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => updateTheme({ buttonShape: s.id })}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                      theme.buttonShape === s.id
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-zinc-700 mb-1.5">
                Densità Spazi
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 rounded-lg">
                {(
                  [
                    { id: 'compact', label: 'Compatta' },
                    { id: 'balanced', label: 'Bilanciata' },
                    { id: 'airy', label: 'Ariosa' },
                  ] as { id: SpacingDensity; label: string }[]
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => updateTheme({ spacing: d.id })}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                      theme.spacing === d.id
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-zinc-700 mb-1.5">
            Stile Card Link
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-zinc-100 rounded-lg">
            {(
              [
                { id: 'filled', label: 'Pieno' },
                { id: 'outline', label: 'Contorno' },
                { id: 'elevated', label: 'Ombra Morbida' },
                { id: 'glass', label: 'Vetro' },
              ] as { id: CardVariant; label: string }[]
            ).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => updateTheme({ cardVariant: v.id })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                  theme.cardVariant === v.id
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-zinc-200" />

      {/* Granular Colors */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900">
          Colori Personalizzati
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(
            [
              { key: 'backgroundColor', label: 'Sfondo' },
              { key: 'surfaceColor', label: 'Superficie Card' },
              { key: 'textColor', label: 'Testo' },
              { key: 'mutedTextColor', label: 'Testo Secondario' },
              { key: 'accentColor', label: 'Colore Accento' },
              { key: 'borderColor', label: 'Bordi' },
            ] as { key: keyof ProfileTheme; label: string }[]
          ).map((item) => (
            <label
              key={item.key}
              className="p-2.5 bg-white border border-zinc-200 rounded-xl flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-800 truncate">
                  {item.label}
                </div>
                <div className="text-[11px] font-mono text-zinc-500 uppercase">
                  {String(theme[item.key])}
                </div>
              </div>
              <input
                type="color"
                value={String(theme[item.key])}
                onChange={(e) =>
                  updateTheme({ [item.key]: e.target.value } as Partial<ProfileTheme>)
                }
                className="w-8 h-8 rounded-md border border-zinc-200 cursor-pointer shrink-0"
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
