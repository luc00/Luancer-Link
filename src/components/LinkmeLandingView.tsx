import React, { useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Link2,
  MessageCircle,
  Play,
  QrCode,
  ShoppingBag,
  Users,
} from 'lucide-react';
import type { BioProfile } from '../types/profile';
import { GENERATED_IMAGES } from '../data/presets';
import { calculateProfileStats, normalizeHandle } from '../utils/profileLogic';
import { SocialIcon } from './SocialIcons';
import { LuancerLogo } from './LuancerLogo';

interface LinkmeLandingViewProps {
  profiles: BioProfile[];
  onClaimHandle: (handle: string) => void;
  onOpenStudio: (tab?: 'profile' | 'socials' | 'blocks' | 'theme') => void;
  onOpenDirectory: () => void;
  onViewPublic: (handle: string) => void;
}

const FAQ_ITEMS = [
  {
    q: 'Come creo il mio link da mettere nella bio di Instagram e TikTok?',
    a: 'Scegli il tuo nome utente nella barra qui sopra (es. luancer link/tuonome) e clicca su "Crea bio gratis". Personalizza subito foto, colori, social e pulsanti nell’editor live e copia l’indirizzo o il QR code sul tuo profilo.',
  },
  {
    q: 'Come funziona il pulsante WhatsApp con messaggio precompilato?',
    a: 'Aggiungi un blocco WhatsApp nell’editor inserendo il tuo numero e il testo predefinito (es. "Ciao! Vorrei info sui tuoi servizi"). Quando un visitatore tocca il pulsante, WhatsApp si apre con il messaggio già pronto per essere inviato.',
  },
  {
    q: 'Posso vendere prodotti o servizi direttamente dalla mia bio?',
    a: 'Sì. Con il blocco Prodotto Store puoi inserire foto, descrizione, prezzo e link di acquisto o prenotazione, trasformando la tua pagina in una vetrina rapida senza codice.',
  },
  {
    q: 'Quanti link e profili posso gestire?',
    a: 'Puoi aggiungere link illimitati su ogni pagina e gestire più profili pubblici (ad esempio brand personale, negozio e progetti) direttamente dallo stesso Editor Studio.',
  },
  {
    q: 'Posso vedere le statistiche di visite e clic sui link?',
    a: 'Sì, ogni pagina pubblica registra in tempo reale le visualizzazioni del profilo e i clic sui singoli blocchi, griglie fotografiche e schede prodotto.',
  },
  {
    q: 'È necessario registrarsi per provare o personalizzare una pagina?',
    a: 'No: questa piattaforma pubblica ti permette di creare nuovi handle, clonare strutture esistenti, personalizzare temi e scaricare il QR code immediatamente.',
  },
];

export function LinkmeLandingView({
  profiles,
  onClaimHandle,
  onOpenStudio,
  onOpenDirectory,
  onViewPublic,
}: LinkmeLandingViewProps) {
  const [heroHandle, setHeroHandle] = useState('');
  const [heroError, setHeroError] = useState('');
  const [footerHandle, setFooterHandle] = useState('');
  const [footerError, setFooterError] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const totalViews = profiles.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalClicks = profiles.reduce(
    (acc, p) => acc + calculateProfileStats(p).totalClicks,
    0
  );

  const featuredShowcase = profiles[0];
  const forestShowcase =
    profiles.find((p) => p.theme.presetId === 'linkme-bio-forest') ||
    profiles[1] ||
    profiles[0];

  const handleSubmitHero = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeHandle(heroHandle);
    if (!clean || clean.length < 2) {
      setHeroError('Inserisci almeno 2 caratteri (es. studio.milano).');
      return;
    }
    setHeroError('');
    onClaimHandle(clean);
  };

  const handleSubmitFooter = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeHandle(footerHandle);
    if (!clean || clean.length < 2) {
      setFooterError('Inserisci almeno 2 caratteri per creare il link.');
      return;
    }
    setFooterError('');
    onClaimHandle(clean);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#111115] flex flex-col">
      {/* Floating Rounded Top Header (Strict 3-Zone Top Bar Contract) */}
      <div className="sticky top-0 z-30 pt-3 px-4 sm:px-6 pointer-events-none">
        <header className="max-w-5xl mx-auto bg-white/95 backdrop-blur-md border border-zinc-200/80 rounded-2xl px-5 py-1.5 shadow-xs flex items-center justify-between gap-8 pointer-events-auto">
          {/* Zone 1: Brand Logo */}
          <a
            href="/"
            aria-label="Luancer & Co. — Home"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center whitespace-nowrap shrink-0"
          >
            <LuancerLogo variant="light" />
          </a>

          {/* Zone 2: 3 Single-line Nav Links */}
          <nav
            aria-label="Navigazione principale"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600"
          >
            <a
              href="#come-funziona"
              className="hover:text-[#111115] transition-colors whitespace-nowrap shrink-0"
            >
              Come funziona
            </a>
            <a
              href="#funzionalita"
              className="hover:text-[#111115] transition-colors whitespace-nowrap shrink-0"
            >
              Funzionalità
            </a>
            <a
              href="#faq"
              className="hover:text-[#111115] transition-colors whitespace-nowrap shrink-0"
            >
              FAQ
            </a>
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onOpenStudio('profile')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#111115] hover:bg-zinc-800 rounded-full cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              Apri Studio
            </button>
          </div>
        </header>
      </div>

      {/* HERO SECTION */}
      <section
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 25%, rgba(254, 243, 199, 0.55), rgba(237, 233, 254, 0.35) 55%, #FAF9F7 100%)',
        }}
        className="pt-12 sm:pt-16 pb-16 px-4 sm:px-6 overflow-hidden"
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Quiet Proof Line with Micro Avatars */}
          <div className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-medium text-zinc-700 mb-5">
            <div className="flex -space-x-2" aria-hidden="true">
              <img
                src={GENERATED_IMAGES.elenaAvatar}
                alt=""
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover ring-2 ring-[#FAF9F7]"
              />
              <img
                src={GENERATED_IMAGES.marcoAvatar}
                alt=""
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover ring-2 ring-[#FAF9F7]"
              />
              <img
                src={GENERATED_IMAGES.atelierAvatar}
                alt=""
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover ring-2 ring-[#FAF9F7]"
              />
            </div>
            <span>+1.5 Milioni di Bio Create</span>
          </div>

          <h1
            style={{ fontSize: 'clamp(2.25rem, 4.8vw, 3.75rem)' }}
            className="font-studio-display font-bold tracking-tight leading-[1.08] text-[#111115] max-w-3xl text-balance"
          >
            Link in bio gratuito per Instagram, TikTok, WhatsApp e altro
          </h1>

          <p className="mt-4 text-sm sm:text-base text-zinc-600 max-w-xl leading-relaxed">
            Ricevi contatti online, chatta su WhatsApp con messaggio pronto e vendi i tuoi prodotti, tutto in un unico link. Inizia gratis in pochi minuti.
          </p>

          {/* Interactive Claim Handle Input Bar */}
          <form
            onSubmit={handleSubmitHero}
            className="mt-8 w-full max-w-[500px] bg-white border border-zinc-200/90 rounded-full p-1.5 pl-5 shadow-md flex items-center gap-2 focus-within:border-[#635BFF]"
          >
            <label htmlFor="landing-claim-handle" className="sr-only">
              Scegli il tuo nome utente luancer link
            </label>
            <span className="text-sm font-semibold text-zinc-400 select-none shrink-0 whitespace-nowrap">
              luancer link/
            </span>
            <input
              id="landing-claim-handle"
              type="text"
              value={heroHandle}
              onChange={(e) => {
                setHeroHandle(e.target.value);
                setHeroError('');
              }}
              placeholder="tuonome"
              className="flex-1 min-w-0 py-2 text-sm font-medium text-[#111115] bg-transparent focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5249F5] rounded-full cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              Crea bio gratis
            </button>
          </form>
          {heroError && (
            <p className="mt-2 text-xs font-medium text-red-600">{heroError}</p>
          )}

          {/* Signature Linkme.bio Phone + Floating Widgets Collage */}
          <div className="mt-14 relative w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left Floating Widgets */}
            <div className="hidden md:flex md:col-span-4 flex-col gap-4 items-end">
              <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm w-56 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-zinc-500">
                    Link in Bio
                  </span>
                  <span className="text-[11px] font-semibold text-[#635BFF] tabular-nums">
                    +184 clic
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-red-600 text-white inline-flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 fill-white" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 truncate">
                      YouTube Showcase
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      Video &amp; Anteprima
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#25D366] text-white rounded-2xl p-4 shadow-md w-60 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  <ArrowRight className="w-4 h-4 opacity-80" aria-hidden="true" />
                </div>
                <div className="text-sm font-bold">Chat su WhatsApp</div>
                <div className="text-[11px] text-white/90 mt-0.5 line-clamp-2">
                  “Ciao! Vorrei prenotare una consulenza rapida.”
                </div>
              </div>
            </div>

            {/* Center Phone Showcase (Live Linkme Forest Style) */}
            <div className="md:col-span-4 flex justify-center">
              <div className="w-[290px] bg-[#193518] text-white rounded-[36px] p-5 border-4 border-[#111115] shadow-2xl text-center">
                <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-5" />
                <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto border-2 border-[#A3E635]/70 shadow-md">
                  <img
                    src={forestShowcase.avatarUrl || GENERATED_IMAGES.marcoAvatar}
                    alt={forestShowcase.displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-3 font-studio-display font-bold text-base">
                  @{forestShowcase.handle}
                </div>
                <p className="mt-1 text-xs text-[#C5DEC3] line-clamp-2">
                  {forestShowcase.role}
                </p>

                <div className="mt-4 flex items-center justify-center gap-2.5">
                  {forestShowcase.socials.slice(0, 4).map((s) => (
                    <span
                      key={s.id}
                      className="w-8 h-8 rounded-full bg-white/10 inline-flex items-center justify-center"
                    >
                      <SocialIcon platform={s.platform} className="w-4 h-4 text-[#A3E635]" />
                    </span>
                  ))}
                </div>

                <div className="mt-5 space-y-2 text-left">
                  <button
                    type="button"
                    onClick={() => onViewPublic(forestShowcase.handle)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#224520] hover:bg-[#2B5729] border border-[#4F7A4D] text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="truncate">
                      {forestShowcase.blocks[0]?.title || 'Progetti & Link'}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#A3E635] shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewPublic(featuredShowcase.handle)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#A3E635] hover:bg-[#BEF264] text-[#10240F] text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>Esplora @{featuredShowcase.handle}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Floating Widgets */}
            <div className="hidden md:flex md:col-span-4 flex-col gap-4 items-start">
              <div className="bg-[#18181B] text-white rounded-2xl p-4 shadow-md w-60 text-left">
                <div className="flex items-center gap-3">
                  <img
                    src={GENERATED_IMAGES.vinylCover}
                    alt="In riproduzione"
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      In Riproduzione
                    </div>
                    <div className="text-xs font-bold truncate mt-0.5">
                      Sessioni Vinile Studio
                    </div>
                    <div className="text-[11px] text-zinc-400 tabular-nums">
                      03:45 · Audio
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm w-56 text-left">
                <div className="flex items-center gap-3">
                  <img
                    src={GENERATED_IMAGES.designCover}
                    alt="Store in Bio"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-zinc-900 truncate">
                      Brand Kit 2026
                    </div>
                    <div className="text-xs font-bold text-[#635BFF] tabular-nums mt-0.5">
                      € 49,00
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CORE CAPABILITIES (3 Columns - Warm Stone Cards) */}
      <section id="come-funziona" className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold text-[#635BFF] mb-2">
              Il tuo nuovo sito web
            </p>
            <h2 className="font-studio-display text-2xl sm:text-4xl font-bold tracking-tight text-[#111115] text-balance">
              Con luancer link crei la tua pagina in pochi minuti, gratis
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-600">
              Il modo più rapido per raccogliere social, WhatsApp e prodotti in un unico collegamento personalizzato.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <article className="bg-[#F4F2EF] rounded-3xl p-6 flex flex-col justify-between border border-zinc-200/60">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#8CE043] text-[#111115] inline-flex items-center justify-center mb-5">
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-[#111115]">
                  Dalla tua bio a WhatsApp
                </h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  Pulsante WhatsApp con messaggio già pronto da inviare: il cliente tocca e atterra subito in chat con te.
                </p>
              </div>
              <div className="mt-6 bg-white rounded-2xl p-3 border border-zinc-200/80 flex items-center justify-between text-xs font-semibold text-zinc-800">
                <span className="truncate">“Ciao! Vorrei info...”</span>
                <span className="text-[#25D366] shrink-0">wa.me</span>
              </div>
            </article>

            <article className="bg-[#F4F2EF] rounded-3xl p-6 flex flex-col justify-between border border-zinc-200/60">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#60A5FA] text-white inline-flex items-center justify-center mb-5">
                  <Link2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-[#111115]">
                  Aggiungi link senza limiti
                </h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  Collega portfolio, video, griglie fotografiche o siti web. Personalizza icone, colori e stile dei pulsanti.
                </p>
              </div>
              <div className="mt-6 bg-white rounded-2xl p-3 border border-zinc-200/80 flex items-center justify-between text-xs font-semibold text-zinc-800">
                <span className="inline-flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#635BFF]" aria-hidden="true" />
                  <span>Visita il mio shop</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              </div>
            </article>

            <article className="bg-[#F4F2EF] rounded-3xl p-6 flex flex-col justify-between border border-zinc-200/60">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#635BFF] text-white inline-flex items-center justify-center mb-5">
                  <Users className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-[#111115]">
                  Multi-Bio e Analitiche
                </h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  Gestisci più profili pubblici dalla stessa dashboard e monitora visite e clic su ogni singolo link.
                </p>
              </div>
              <div className="mt-6 bg-white rounded-2xl p-3 border border-zinc-200/80 flex items-center justify-between text-xs font-semibold text-zinc-800 tabular-nums">
                <span>{profiles.length} Profili Attivi</span>
                <span className="text-[#635BFF]">{totalClicks} clic totali</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION 3: BENTO BENEFITS & STORE */}
      <section id="funzionalita" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#FAF9F7]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold text-[#635BFF] mb-2">Vantaggi</p>
            <h2 className="font-studio-display text-2xl sm:text-4xl font-bold tracking-tight text-[#111115] text-balance">
              Tutti i tuoi link in un unico posto, facili da condividere
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-600">
              Condividi il link breve o scarica il QR Code ufficiale della tua pagina luancer link.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Store in Bio Marquee Bento */}
            <div className="md:col-span-7 bg-[#F4F2EF] border border-zinc-200/70 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-[#635BFF]">
                  Il tuo negozio nella bio
                </p>
                <h3 className="mt-2 text-xl sm:text-2xl font-bold text-[#111115]">
                  Aggiungi prodotti e crea il tuo store in pochi secondi
                </h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  Mostra foto, prezzo e pulsante diretto all’acquisto o all’ordine su WhatsApp senza configurazioni complesse.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-200/80">
                <div className="flex items-center gap-3">
                  <img
                    src={GENERATED_IMAGES.designCover}
                    alt="Anteprima prodotto"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#111115]">
                      Brand Identity Kit
                    </div>
                    <div className="text-xs font-semibold text-[#635BFF] tabular-nums">
                      € 49,00
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenStudio('blocks')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#111115] hover:bg-zinc-800 rounded-full cursor-pointer whitespace-nowrap"
                >
                  Aggiungi Prodotto
                </button>
              </div>
            </div>

            {/* Full Analytics Card */}
            <div className="md:col-span-5 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-500">
                    Analitiche Complete
                  </span>
                  <BarChart3 className="w-4 h-4 text-[#635BFF]" aria-hidden="true" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-[#111115] tabular-nums">
                  {totalViews.toLocaleString('it-IT')}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Visite pubbliche registrate sui profili attivi
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-zinc-100 tabular-nums">
                <div>
                  <div className="text-lg font-bold text-[#111115]">
                    {totalClicks}
                  </div>
                  <div className="text-[11px] text-zinc-500">Clic tracciati</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-700 inline-flex items-center gap-1">
                    <QrCode className="w-4 h-4" aria-hidden="true" />
                    <span>QR</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">Download PNG/SVG</div>
                </div>
              </div>
            </div>
          </div>

          {/* Credibility 2-Column Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-zinc-100 text-[#111115] inline-flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[#111115]">
                  Handle pubblico e link diretto
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                  Scegli il tuo <span className="font-mono font-semibold">/?u=handle</span> personalizzato, condivisibile subito su ogni social.
                </p>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-6 flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 inline-flex items-center justify-center shrink-0">
                <BadgeCheck className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[#111115]">
                  Badge Verificato blu e Temi Curati
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                  Attiva il badge verificato accanto al tuo nome e scegli tra 8 temi ad alto contrasto verificato WCAG AA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: COMMUNITY PROFILES SHOWCASE (Real Profiles Wired Live!) */}
      <section className="py-16 px-4 sm:px-6 bg-white border-y border-zinc-200/70">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#635BFF]">
                Profili luancer link
              </p>
              <h2 className="mt-1 font-studio-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111115]">
                Esplora le bio create dal pubblico
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenDirectory}
              className="text-xs sm:text-sm font-semibold text-[#635BFF] hover:underline inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>Vedi tutta la directory ({profiles.length})</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {profiles.slice(0, 6).map((prof) => {
              const stats = calculateProfileStats(prof);
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => onViewPublic(prof.handle)}
                  className="text-left p-4 rounded-2xl bg-[#FAF9F7] border border-zinc-200 hover:border-[#635BFF] transition-colors flex items-center gap-3.5 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 shrink-0">
                    {prof.avatarUrl ? (
                      <img
                        src={prof.avatarUrl}
                        alt={prof.displayName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-700">
                        {prof.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-[#111115] truncate">
                        {prof.displayName}
                      </span>
                      {prof.verified && (
                        <BadgeCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-mono text-zinc-500 truncate">
                      /{prof.handle}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1 tabular-nums">
                      {stats.activeLinks} blocchi · {stats.totalClicks} clic
                    </div>
                  </div>
                  <ExternalLink
                    className="w-4 h-4 text-zinc-400 group-hover:text-[#635BFF] shrink-0"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5: FAQ ACCORDION */}
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#FAF9F7]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-[#635BFF] mb-2">FAQ</p>
            <h2 className="font-studio-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111115]">
              Hai bisogno di altre informazioni?
            </h2>
          </div>

          <div className="space-y-2.5">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={item.q}
                  className="bg-white border border-zinc-200 rounded-2xl overflow-hidden"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-[#111115]">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA & FOOTER */}
      <footer className="bg-[#111115] text-white py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="font-studio-display text-xl sm:text-2xl font-bold text-balance">
                La tua presenza digitale parte da luancer link, gratis
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
                Crea il tuo link personalizzato e condividilo ovunque in meno di due minuti.
              </p>
            </div>

            <form
              onSubmit={handleSubmitFooter}
              className="w-full md:w-auto flex flex-col gap-1.5"
            >
              <div className="bg-white rounded-full p-1.5 pl-4 flex items-center gap-2">
                <label htmlFor="footer-claim-handle" className="sr-only">
                  Handle footer
                </label>
                <span className="text-xs font-semibold text-zinc-400 select-none whitespace-nowrap">
                  luancer link/
                </span>
                <input
                  id="footer-claim-handle"
                  type="text"
                  value={footerHandle}
                  onChange={(e) => {
                    setFooterHandle(e.target.value);
                    setFooterError('');
                  }}
                  placeholder="tuonome"
                  className="w-28 sm:w-36 py-1.5 text-xs sm:text-sm font-medium text-[#111115] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5249F5] rounded-full cursor-pointer whitespace-nowrap"
                >
                  Crea bio
                </button>
              </div>
              {footerError && (
                <p className="text-xs text-red-400">{footerError}</p>
              )}
            </form>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-3">
              <LuancerLogo variant="dark" compact />
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => onOpenStudio('profile')}
                className="hover:text-white cursor-pointer"
              >
                Editor Studio
              </button>
              <button
                type="button"
                onClick={onOpenDirectory}
                className="hover:text-white cursor-pointer"
              >
                Profili Pubblici
              </button>
              <a href="#faq" className="hover:text-white">
                FAQ
              </a>
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Salvataggio attivo</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
