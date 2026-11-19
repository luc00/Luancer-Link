import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Columns2,
  Copy,
  Eye,
  EyeOff,
  Grid2x2,
  Grid3x3,
  Heading,
  Image as ImageIcon,
  ImagePlus,
  Link2,
  Mail,
  MessageCircle,
  Minus,
  PlayCircle,
  Plus,
  Repeat,
  Search,
  ShoppingBag,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import type {
  BioBlock,
  BioProfile,
  BlockIconName,
  BlockType,
  PhotoGridItem,
  QuickGridItem,
  SocialGridTile,
  SocialIconShape,
} from '../types/profile';
import { BLOCK_ICON_OPTIONS, GENERATED_IMAGES } from '../data/presets';
import { compressImageFileToDataUrl } from '../utils/imageUpload';
import {
  filterBlocks,
  moveItem,
  parseVideoUrl,
  sanitizePastedUrl,
} from '../utils/profileLogic';
import { BlockIcon } from './SocialIcons';

interface EditorBlocksTabProps {
  profile: BioProfile;
  onChange: (updater: (prev: BioProfile) => BioProfile) => void;
}

const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  link: 'Link Veloce',
  whatsapp: 'WhatsApp Diretto',
  product: 'Prodotto Store',
  featured: 'Banner Visivo',
  video: 'Video Anteprima / Loop',
  photo_grid: 'Griglia Foto 2×',
  social_grid: 'Griglia Esplora 3×',
  grid: 'Griglia Icone 2×2',
  media: 'Player Media',
  header: 'Intestazione',
  divider: 'Divisore Personalizzato',
  contact: 'Iscrizione Email',
};

const DEMO_LOOP_VIDEO_URL =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export function EditorBlocksTab({ profile, onChange }: EditorBlocksTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(
    profile.blocks[0]?.id ?? null
  );

  // Quick-add form state for fast link creation
  const [quickTitle, setQuickTitle] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickIconImageUrl, setQuickIconImageUrl] = useState('');
  const [quickIconShape, setQuickIconShape] = useState<SocialIconShape>('rounded');
  const [quickError, setQuickError] = useState('');
  const [coverErrorById, setCoverErrorById] = useState<Record<string, string>>({});

  const addBlock = (type: BlockType) => {
    const id = `blk_${Date.now().toString(36)}`;
    let newBlock: BioBlock;

    switch (type) {
      case 'whatsapp':
        newBlock = {
          id,
          type: 'whatsapp',
          visible: true,
          title: 'Scrivimi su WhatsApp',
          subtitle: 'Chat diretta con messaggio pronto',
          whatsappPhone: '393401234567',
          whatsappMessage: 'Ciao! Ti contatto dalla tua pagina luancer link.',
          clicks: 0,
        };
        break;
      case 'product':
        newBlock = {
          id,
          type: 'product',
          visible: true,
          title: 'Nuovo Prodotto in Bio',
          subtitle: 'Descrizione breve del prodotto o servizio',
          url: 'https://example.com/shop',
          imageUrl: GENERATED_IMAGES.designCover,
          productPrice: '€ 29,00',
          productBadge: 'Store in Bio',
          clicks: 0,
        };
        break;
      case 'featured':
        newBlock = {
          id,
          type: 'featured',
          visible: true,
          title: 'Nuovo Banner Visivo luancer link',
          subtitle: 'Progetto o lancio principale in evidenza',
          url: 'https://example.com',
          imageUrl: GENERATED_IMAGES.designCover,
          clicks: 0,
        };
        break;
      case 'photo_grid':
        newBlock = {
          id,
          type: 'photo_grid',
          visible: true,
          title: 'Card Foto Affiancate',
          clicks: 0,
          photoGridItems: [
            {
              id: `pg_${Date.now().toString(36)}_1`,
              title: 'Primo Progetto',
              url: 'https://example.com',
              imageUrl: GENERATED_IMAGES.designCover,
              clicks: 0,
            },
            {
              id: `pg_${Date.now().toString(36)}_2`,
              title: 'Secondo Progetto',
              url: 'https://example.com',
              imageUrl: GENERATED_IMAGES.vinylCover,
              clicks: 0,
            },
          ],
        };
        break;
      case 'social_grid':
        newBlock = {
          id,
          type: 'social_grid',
          visible: true,
          title: 'Griglia Esplora 3×',
          clicks: 0,
          socialGridItems: [
            {
              id: `sg_${Date.now().toString(36)}_1`,
              caption: 'Nuovo scatto in studio',
              url: 'https://instagram.com',
              imageUrl: GENERATED_IMAGES.designCover,
              mediaKind: 'carousel',
              clicks: 0,
            },
            {
              id: `sg_${Date.now().toString(36)}_2`,
              caption: 'Dietro le quinte',
              url: 'https://instagram.com',
              imageUrl: GENERATED_IMAGES.vinylCover,
              mediaKind: 'video',
              clicks: 0,
            },
            {
              id: `sg_${Date.now().toString(36)}_3`,
              caption: 'Ritratto editoriale',
              url: 'https://instagram.com',
              imageUrl: GENERATED_IMAGES.elenaAvatar,
              mediaKind: 'image',
              clicks: 0,
            },
          ],
        };
        break;
      case 'grid':
        newBlock = {
          id,
          type: 'grid',
          visible: true,
          title: 'Link Rapidi',
          clicks: 0,
          gridItems: [
            {
              id: `g_${Date.now().toString(36)}_1`,
              title: 'Portfolio',
              subtitle: 'Lavori recenti',
              url: 'https://example.com',
              iconName: 'briefcase',
              clicks: 0,
            },
            {
              id: `g_${Date.now().toString(36)}_2`,
              title: 'Contatti',
              subtitle: 'Prenota call',
              url: 'https://cal.com',
              iconName: 'calendar',
              clicks: 0,
            },
          ],
        };
        break;
      case 'media':
        newBlock = {
          id,
          type: 'media',
          visible: true,
          title: 'Nuova Traccia o Episodio',
          subtitle: 'Podcast / Playlist / Video demo',
          url: 'https://open.spotify.com',
          mediaType: 'audio',
          mediaDuration: '12:40',
          clicks: 0,
        };
        break;
      case 'video':
        newBlock = {
          id,
          type: 'video',
          visible: true,
          title: 'Anteprima Video in Bio',
          subtitle: 'Guarda la clip direttamente nella pagina',
          videoUrl: DEMO_LOOP_VIDEO_URL,
          imageUrl: GENERATED_IMAGES.designCover,
          videoAspect: '16:9',
          videoLoop: false,
          mediaDuration: '00:15',
          clicks: 0,
        };
        break;
      case 'header':
        newBlock = {
          id,
          type: 'header',
          visible: true,
          title: 'NUOVA SEZIONE',
          clicks: 0,
        };
        break;
      case 'divider':
        newBlock = {
          id,
          type: 'divider',
          visible: true,
          title: 'In Evidenza',
          dividerStyle: 'line',
          dividerThickness: 1,
          dividerWidth: 'full',
          clicks: 0,
        };
        break;
      case 'contact':
        newBlock = {
          id,
          type: 'contact',
          visible: true,
          title: 'Iscriviti agli aggiornamenti',
          subtitle: 'Inserisci la tua email per ricevere novità dirette.',
          contactPlaceholder: 'tua@email.it',
          contactButtonText: 'Iscriviti',
          clicks: 0,
        };
        break;
      case 'link':
      default:
        newBlock = {
          id,
          type: 'link',
          visible: true,
          title: 'Nuovo Link Veloce',
          subtitle: 'Descrizione breve opzionale',
          url: 'https://example.com',
          iconName: 'link',
          clicks: 0,
        };
        break;
    }

    onChange((prev) => ({
      ...prev,
      blocks: [newBlock, ...prev.blocks],
    }));
    setExpandedId(id);
  };

  const handleQuickAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickUrl.trim()) {
      setQuickError('Inserisci sia il titolo che l’URL del link.');
      return;
    }
    const id = `blk_${Date.now().toString(36)}`;
    const cleanPhoto = quickIconImageUrl.trim();
    const block: BioBlock = {
      id,
      type: 'link',
      visible: true,
      title: quickTitle.trim(),
      url: quickUrl.trim(),
      iconName: 'link',
      ...(cleanPhoto ? { iconImageUrl: cleanPhoto, iconShape: quickIconShape } : {}),
      clicks: 0,
    };
    onChange((prev) => ({
      ...prev,
      blocks: [block, ...prev.blocks],
    }));
    setQuickTitle('');
    setQuickUrl('');
    setQuickIconImageUrl('');
    setQuickIconShape('rounded');
    setQuickError('');
    setExpandedId(id);
  };

  const updateBlock = (id: string, patch: Partial<BioBlock>) => {
    onChange((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const updateGridItem = (
    blockId: string,
    itemId: string,
    patch: Partial<QuickGridItem>
  ) => {
    onChange((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id !== blockId || !b.gridItems) return b;
        return {
          ...b,
          gridItems: b.gridItems.map((g) =>
            g.id === itemId ? { ...g, ...patch } : g
          ),
        };
      }),
    }));
  };

  const updatePhotoGridItem = (
    blockId: string,
    itemId: string,
    patch: Partial<PhotoGridItem>
  ) => {
    onChange((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id !== blockId || !b.photoGridItems) return b;
        return {
          ...b,
          photoGridItems: b.photoGridItems.map((p) =>
            p.id === itemId ? { ...p, ...patch } : p
          ),
        };
      }),
    }));
  };

  const updateSocialGridTile = (
    blockId: string,
    itemId: string,
    patch: Partial<SocialGridTile>
  ) => {
    onChange((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id !== blockId || !b.socialGridItems) return b;
        return {
          ...b,
          socialGridItems: b.socialGridItems.map((t) =>
            t.id === itemId ? { ...t, ...patch } : t
          ),
        };
      }),
    }));
  };

  const addGridTile = (blockId: string) => {
    onChange((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id !== blockId) return b;
        const current = b.gridItems || [];
        const newTile: QuickGridItem = {
          id: `g_${Date.now().toString(36)}`,
          title: `Voce ${current.length + 1}`,
          subtitle: 'Link rapido',
          url: 'https://example.com',
          iconName: 'star',
          clicks: 0,
        };
        return { ...b, gridItems: [...current, newTile] };
      }),
    }));
  };

  const removeGridTile = (blockId: string, itemId: string) => {
    onChange((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id !== blockId || !b.gridItems) return b;
        return {
          ...b,
          gridItems: b.gridItems.filter((g) => g.id !== itemId),
        };
      }),
    }));
  };

  const duplicateBlock = (block: BioBlock) => {
    const copyId = `blk_${Date.now().toString(36)}`;
    const cloned: BioBlock = {
      ...block,
      id: copyId,
      title: `${block.title} (Copia)`,
      clicks: 0,
      gridItems: block.gridItems?.map((g, i) => ({
        ...g,
        id: `g_${Date.now().toString(36)}_${i}`,
        clicks: 0,
      })),
      photoGridItems: block.photoGridItems?.map((p, i) => ({
        ...p,
        id: `pg_${Date.now().toString(36)}_${i}`,
        clicks: 0,
      })),
      socialGridItems: block.socialGridItems?.map((t, i) => ({
        ...t,
        id: `sg_${Date.now().toString(36)}_${i}`,
        clicks: 0,
      })),
    };
    onChange((prev) => ({
      ...prev,
      blocks: [cloned, ...prev.blocks],
    }));
    setExpandedId(copyId);
  };

  const removeBlock = (id: string) => {
    onChange((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
  };

  const moveBlock = (id: string, dir: 'up' | 'down') => {
    onChange((prev) => {
      const idx = prev.blocks.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      return {
        ...prev,
        blocks: moveItem(prev.blocks, idx, dir),
      };
    });
  };

  const visibleList = filterBlocks(profile.blocks, searchQuery);

  return (
    <div className="space-y-6">
      {/* Fast Quick-Link Creator */}
      <section className="p-4 bg-white border border-zinc-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Aggiunta Rapida Link Veloce
          </h2>
          <span className="text-xs text-zinc-500">Istantaneo</span>
        </div>
        <form
          onSubmit={handleQuickAddLink}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
        >
          <div className="sm:col-span-5">
            <label htmlFor="quick-link-title" className="sr-only">
              Titolo link rapido
            </label>
            <input
              id="quick-link-title"
              type="text"
              value={quickTitle}
              onChange={(e) => {
                setQuickTitle(e.target.value);
                setQuickError('');
              }}
              placeholder="Titolo (es. Portfolio 2026)"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900"
            />
          </div>
          <div className="sm:col-span-5">
            <label htmlFor="quick-link-url" className="sr-only">
              URL link rapido
            </label>
            <input
              id="quick-link-url"
              type="text"
              value={quickUrl}
              onChange={(e) => {
                setQuickUrl(e.target.value);
                setQuickError('');
              }}
              placeholder="URL (es. miosito.it)"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900"
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
          <div className="sm:col-span-12 p-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <span
                className={`w-8 h-8 border border-zinc-200 bg-white overflow-hidden inline-flex items-center justify-center shrink-0 ${
                  quickIconShape === 'circle'
                    ? 'rounded-full'
                    : quickIconShape === 'square'
                      ? 'rounded-none'
                      : 'rounded-lg'
                }`}
              >
                {quickIconImageUrl ? (
                  <img
                    src={quickIconImageUrl}
                    alt="Anteprima icona link"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BlockIcon name="link" className="w-4 h-4 text-zinc-500" />
                )}
              </span>

              <label className="px-2.5 py-1.5 text-xs font-medium text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{quickIconImageUrl ? 'Cambia foto icona' : 'Foto come icona'}</span>
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Carica foto come icona link rapido"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    try {
                      const dataUrl = await compressImageFileToDataUrl(file, 160, 20000);
                      setQuickIconImageUrl(dataUrl);
                      setQuickError('');
                    } catch (err) {
                      setQuickError(
                        err instanceof Error ? err.message : 'Errore caricamento foto icona.'
                      );
                    }
                  }}
                  className="sr-only"
                />
              </label>

              <input
                type="text"
                aria-label="URL foto icona link rapido"
                value={quickIconImageUrl.startsWith('data:') ? '' : quickIconImageUrl}
                onChange={(e) => setQuickIconImageUrl(e.target.value)}
                placeholder={
                  quickIconImageUrl.startsWith('data:')
                    ? 'Foto caricata dal dispositivo'
                    : 'oppure URL foto icona...'
                }
                className="flex-1 min-w-[140px] px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
              />

              {quickIconImageUrl && (
                <button
                  type="button"
                  onClick={() => setQuickIconImageUrl('')}
                  aria-label="Rimuovi foto icona link rapido"
                  className="p-1.5 text-zinc-500 hover:text-red-600 bg-white border border-zinc-200 rounded-lg hover:bg-red-50 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-medium text-zinc-600 whitespace-nowrap">
                Forma:
              </span>
              <div
                role="group"
                aria-label="Forma foto icona link rapido"
                className="inline-flex items-center gap-1 p-0.5 bg-zinc-200/70 rounded-lg"
              >
                {(
                  [
                    { id: 'circle', label: 'Cerchio' },
                    { id: 'square', label: 'Quadrata' },
                    { id: 'rounded', label: 'Arrotondati' },
                  ] as { id: SocialIconShape; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={quickIconShape === opt.id}
                    onClick={() => setQuickIconShape(opt.id)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md cursor-pointer whitespace-nowrap ${
                      quickIconShape === opt.id
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
        {quickError && (
          <p className="text-xs text-red-600 font-medium">{quickError}</p>
        )}

        {/* Rich luancer link Block Type Buttons */}
        <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-500 mr-1">Blocchi luancer link:</span>
          <button
            type="button"
            onClick={() => addBlock('whatsapp')}
            className="px-2.5 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" aria-hidden="true" />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('product')}
            className="px-2.5 py-1.5 text-xs font-medium text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#635BFF]" aria-hidden="true" />
            <span>Prodotto Store</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('featured')}
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Banner Visivo</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('photo_grid')}
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Griglia Foto 2×</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('social_grid')}
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Grid3x3 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Esplora 3×</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('grid')}
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Grid2x2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Icone 2×2</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('video')}
            className="px-2.5 py-1.5 text-xs font-medium text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Video className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
            <span>Video / Loop</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('media')}
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Media</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('contact')}
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Iscrizione</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('header')}
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Heading className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Intestazione</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('divider')}
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Divisore</span>
          </button>
        </div>
      </section>

      {/* Search & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">
          Blocchi e Link ({profile.blocks.length})
        </h3>
        <div className="relative w-full sm:w-64">
          <Search
            className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Filtra blocchi e link"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca tra i link..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
          />
        </div>
      </div>

      {/* Blocks Accordion List */}
      {visibleList.length === 0 ? (
        <div className="border border-dashed border-zinc-300 rounded-xl py-8 px-4 text-center text-sm text-zinc-500">
          Nessun blocco trovato. Prova a cambiare ricerca o aggiungi un nuovo link.
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleList.map((block) => {
            const isExpanded = expandedId === block.id;
            const globalIndex = profile.blocks.findIndex((b) => b.id === block.id);
            const nestedClicks =
              (block.gridItems?.reduce((acc, g) => acc + g.clicks, 0) ?? 0) +
              (block.photoGridItems?.reduce((acc, p) => acc + p.clicks, 0) ?? 0) +
              (block.socialGridItems?.reduce((acc, s) => acc + s.clicks, 0) ?? 0);
            const clickTotal = block.clicks + nestedClicks;

            return (
              <div
                key={block.id}
                className={`bg-white border border-zinc-200 rounded-xl overflow-hidden transition-opacity ${
                  !block.visible ? 'opacity-65' : ''
                }`}
              >
                {/* Block Row Header */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : block.id)}
                    aria-expanded={isExpanded}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <span
                      className={`w-8 h-8 bg-zinc-100 text-zinc-700 overflow-hidden inline-flex items-center justify-center shrink-0 ${
                        block.type === 'link' && block.iconImageUrl
                          ? block.iconShape === 'circle'
                            ? 'rounded-full'
                            : block.iconShape === 'square'
                              ? 'rounded-none'
                              : 'rounded-lg'
                          : 'rounded-lg'
                      }`}
                    >
                      {block.type === 'link' ? (
                        block.iconImageUrl ? (
                          <img
                            src={block.iconImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BlockIcon name={block.iconName} className="w-4 h-4" />
                        )
                      ) : block.type === 'whatsapp' ? (
                        <MessageCircle className="w-4 h-4 text-[#25D366]" aria-hidden="true" />
                      ) : block.type === 'product' ? (
                        <ShoppingBag className="w-4 h-4 text-[#635BFF]" aria-hidden="true" />
                      ) : block.type === 'featured' ? (
                        <ImageIcon className="w-4 h-4" aria-hidden="true" />
                      ) : block.type === 'photo_grid' ? (
                        <Columns2 className="w-4 h-4" aria-hidden="true" />
                      ) : block.type === 'social_grid' ? (
                        <Grid3x3 className="w-4 h-4" aria-hidden="true" />
                      ) : block.type === 'grid' ? (
                        <Grid2x2 className="w-4 h-4" aria-hidden="true" />
                      ) : block.type === 'video' ? (
                        <Video className="w-4 h-4 text-rose-600" aria-hidden="true" />
                      ) : block.type === 'media' ? (
                        <PlayCircle className="w-4 h-4" aria-hidden="true" />
                      ) : block.type === 'divider' ? (
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      ) : block.type === 'contact' ? (
                        <Mail className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Link2 className="w-4 h-4" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900 truncate">
                        {block.title || (block.type === 'divider' ? 'Divisore senza titolo' : 'Senza titolo')}
                      </div>
                      <div className="text-xs text-zinc-500 truncate mt-0.5 tabular-nums">
                        {BLOCK_TYPE_LABEL[block.type]}
                        {block.type === 'video' && (
                          <> · {block.videoLoop ? 'Loop continuo' : 'Anteprima Play'}</>
                        )}
                        {block.type !== 'header' && block.type !== 'divider' && (
                          <> · {clickTotal} clic</>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={globalIndex === 0}
                      onClick={() => moveBlock(block.id, 'up')}
                      aria-label={`Sposta su '${block.title}'`}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer rounded-md hover:bg-zinc-100"
                    >
                      <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={globalIndex === profile.blocks.length - 1}
                      onClick={() => moveBlock(block.id, 'down')}
                      aria-label={`Sposta giù '${block.title}'`}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer rounded-md hover:bg-zinc-100"
                    >
                      <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(block.id, { visible: !block.visible })
                      }
                      aria-label={
                        block.visible
                          ? `Nascondi '${block.title}'`
                          : `Mostra '${block.title}'`
                      }
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 cursor-pointer rounded-md hover:bg-zinc-100"
                    >
                      {block.visible ? (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateBlock(block)}
                      aria-label={`Duplica '${block.title}'`}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 cursor-pointer rounded-md hover:bg-zinc-100"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      aria-label={`Elimina '${block.title}'`}
                      className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer rounded-md hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : block.id)}
                      aria-label={
                        isExpanded
                          ? `Comprimi '${block.title}'`
                          : `Modifica '${block.title}'`
                      }
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 cursor-pointer rounded-md hover:bg-zinc-100"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Inline Editor */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-3 border-t border-zinc-100 bg-zinc-50/70 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor={`blk-title-${block.id}`}
                          className="block text-xs font-medium text-zinc-700 mb-1"
                        >
                          {block.type === 'divider'
                            ? 'Titolo sul divisore (opzionale)'
                            : 'Titolo'}
                        </label>
                        <input
                          id={`blk-title-${block.id}`}
                          type="text"
                          value={block.title}
                          onChange={(e) =>
                            updateBlock(block.id, { title: e.target.value })
                          }
                          placeholder={
                            block.type === 'divider'
                              ? 'Lascia vuoto per sola linea'
                              : undefined
                          }
                          className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      {(block.type === 'link' ||
                        block.type === 'product' ||
                        block.type === 'featured' ||
                        block.type === 'video' ||
                        block.type === 'media') && (
                        <div>
                          <label
                            htmlFor={`blk-url-${block.id}`}
                            className="block text-xs font-medium text-zinc-700 mb-1"
                          >
                            {block.type === 'video'
                              ? 'Link Pulsante Esterno (opzionale)'
                              : 'URL Destinazione'}
                          </label>
                          <input
                            id={`blk-url-${block.id}`}
                            type="text"
                            value={block.url || ''}
                            onChange={(e) =>
                              updateBlock(block.id, { url: e.target.value })
                            }
                            placeholder="https://..."
                            className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                      )}

                      {block.type === 'whatsapp' && (
                        <div>
                          <label
                            htmlFor={`blk-waphone-${block.id}`}
                            className="block text-xs font-medium text-zinc-700 mb-1"
                          >
                            Numero WhatsApp (con prefisso)
                          </label>
                          <input
                            id={`blk-waphone-${block.id}`}
                            type="text"
                            value={block.whatsappPhone || ''}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                whatsappPhone: e.target.value,
                              })
                            }
                            placeholder="393401234567"
                            className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 font-mono"
                          />
                        </div>
                      )}
                    </div>

                    {block.type === 'whatsapp' && (
                      <div>
                        <label
                          htmlFor={`blk-wamsg-${block.id}`}
                          className="block text-xs font-medium text-zinc-700 mb-1"
                        >
                          Messaggio Precompilato
                        </label>
                        <input
                          id={`blk-wamsg-${block.id}`}
                          type="text"
                          value={block.whatsappMessage || ''}
                          onChange={(e) =>
                            updateBlock(block.id, {
                              whatsappMessage: e.target.value,
                            })
                          }
                          placeholder="Ciao! Vorrei avere maggiori informazioni..."
                          className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                        />
                      </div>
                    )}

                    {block.type === 'product' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor={`blk-price-${block.id}`}
                            className="block text-xs font-medium text-zinc-700 mb-1"
                          >
                            Prezzo Prodotto
                          </label>
                          <input
                            id={`blk-price-${block.id}`}
                            type="text"
                            value={block.productPrice || ''}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                productPrice: e.target.value,
                              })
                            }
                            placeholder="€ 29,00"
                            className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 tabular-nums"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`blk-prodimg-${block.id}`}
                            className="block text-xs font-medium text-zinc-700 mb-1"
                          >
                            Foto Prodotto (URL)
                          </label>
                          <input
                            id={`blk-prodimg-${block.id}`}
                            type="text"
                            value={block.imageUrl || ''}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                imageUrl: e.target.value,
                              })
                            }
                            placeholder="/src/assets/..."
                            className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                      </div>
                    )}

                    {block.type === 'video' && (() => {
                      const rawVideoUrl = block.videoUrl || '';
                      const parsedVideo = parseVideoUrl(
                        rawVideoUrl,
                        Boolean(block.videoLoop)
                      );
                      const hasUrl = rawVideoUrl.trim().length > 0;
                      const statusMessage = !hasUrl
                        ? 'Supporta YouTube, Shorts, Vimeo, Google Drive ("Chiunque abbia il link"), Dropbox, Loom, Streamable o .mp4/.webm.'
                        : parsedVideo.provider === 'gdrive'
                          ? block.videoLoop
                            ? 'Google Drive rilevato (player incorporato attivo; per il loop continuo automatico usa .mp4, Dropbox, YouTube o Vimeo).'
                            : 'Google Drive rilevato: assicurati che il file sia condiviso con "Chiunque abbia il link".'
                          : parsedVideo.provider === 'youtube'
                            ? 'YouTube rilevato: anteprima e player inline pronti.'
                            : parsedVideo.provider === 'vimeo'
                              ? 'Vimeo rilevato: anteprima e player inline pronti.'
                              : parsedVideo.provider === 'loom' ||
                                  parsedVideo.provider === 'streamable'
                                ? 'Player video incorporato pronto.'
                                : parsedVideo.provider === 'direct'
                                  ? 'Video diretto rilevato: anteprima, play e loop continuo pronti.'
                                  : 'Link non incorporabile direttamente: verrà aperto come collegamento esterno.';
                      const isRecognized =
                        hasUrl && parsedVideo.provider !== 'external';

                      return (
                      <div className="p-3 bg-white border border-zinc-200 rounded-lg space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label
                              htmlFor={`blk-vurl-${block.id}`}
                              className="text-xs font-medium text-zinc-700"
                            >
                              URL Video (YouTube, Vimeo, Google Drive, Dropbox o .mp4/.webm)
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(block.id, {
                                  videoUrl: DEMO_LOOP_VIDEO_URL,
                                })
                              }
                              className="text-[11px] font-medium text-zinc-600 hover:text-zinc-900 underline cursor-pointer"
                            >
                              Usa video demo MP4
                            </button>
                          </div>
                          <input
                            id={`blk-vurl-${block.id}`}
                            type="text"
                            value={rawVideoUrl}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const cleaned = /^[a-z0-9"'`(\[{<]{1,3}(https?:\/\/.+)$/i.test(
                                raw.trim()
                              )
                                ? sanitizePastedUrl(raw)
                                : raw;
                              updateBlock(block.id, { videoUrl: cleaned });
                            }}
                            placeholder="https://youtube.com/watch?v=... oppure https://drive.google.com/file/d/..."
                            className="w-full px-3 py-1.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900"
                          />
                          <p
                            className={`text-[11px] ${
                              !hasUrl
                                ? 'text-zinc-500'
                                : isRecognized
                                  ? 'text-emerald-700 font-medium'
                                  : 'text-amber-700 font-medium'
                            }`}
                          >
                            {statusMessage}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="block text-xs font-medium text-zinc-700 mb-1">
                              Modalità Riproduzione
                            </span>
                            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 w-full">
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, { videoLoop: false })
                                }
                                className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                                  !block.videoLoop
                                    ? 'bg-white text-zinc-900 shadow-xs'
                                    : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                              >
                                <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Anteprima Play</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, { videoLoop: true })
                                }
                                className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                                  block.videoLoop
                                    ? 'bg-white text-zinc-900 shadow-xs'
                                    : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                              >
                                <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Video in Loop</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="block text-xs font-medium text-zinc-700 mb-1">
                              Formato Schermo
                            </span>
                            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 w-full">
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, { videoAspect: '16:9' })
                                }
                                className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                                  (block.videoAspect || '16:9') === '16:9'
                                    ? 'bg-white text-zinc-900 shadow-xs'
                                    : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                              >
                                16:9 Orizzontale
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, { videoAspect: '9:16' })
                                }
                                className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                                  block.videoAspect === '9:16'
                                    ? 'bg-white text-zinc-900 shadow-xs'
                                    : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                              >
                                9:16 Verticale
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                          <div className="sm:col-span-6">
                            <label
                              htmlFor={`blk-vposter-${block.id}`}
                              className="block text-xs font-medium text-zinc-700 mb-1"
                            >
                              Copertina Anteprima (URL o carica)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 cursor-pointer shrink-0 whitespace-nowrap">
                                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Carica</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = '';
                                    if (!file) return;
                                    try {
                                      const dataUrl =
                                        await compressImageFileToDataUrl(
                                          file,
                                          480,
                                          28000
                                        );
                                      updateBlock(block.id, { imageUrl: dataUrl });
                                      setCoverErrorById((prev) => ({
                                        ...prev,
                                        [block.id]: '',
                                      }));
                                    } catch (err) {
                                      setCoverErrorById((prev) => ({
                                        ...prev,
                                        [block.id]:
                                          err instanceof Error
                                            ? err.message
                                            : 'Errore immagine',
                                      }));
                                    }
                                  }}
                                />
                              </label>
                              <input
                                id={`blk-vposter-${block.id}`}
                                type="text"
                                value={
                                  block.imageUrl?.startsWith('data:')
                                    ? ''
                                    : block.imageUrl || ''
                                }
                                onChange={(e) =>
                                  updateBlock(block.id, { imageUrl: e.target.value })
                                }
                                placeholder={
                                  block.imageUrl?.startsWith('data:')
                                    ? 'Copertina caricata'
                                    : 'URL copertina...'
                                }
                                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-6">
                            <label
                              htmlFor={`blk-vdur-${block.id}`}
                              className="block text-xs font-medium text-zinc-700 mb-1"
                            >
                              Badge Durata (es. 00:15)
                            </label>
                            <input
                              id={`blk-vdur-${block.id}`}
                              type="text"
                              value={block.mediaDuration || ''}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  mediaDuration: e.target.value,
                                })
                              }
                              placeholder="00:15"
                              className="w-full px-3 py-1.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900 font-mono"
                            />
                          </div>
                        </div>

                        {coverErrorById[block.id] && (
                          <p className="text-xs text-red-600 font-medium">
                            {coverErrorById[block.id]}
                          </p>
                        )}
                      </div>
                      );
                    })()}

                    {block.type === 'divider' && (
                      <div className="p-3 bg-white border border-zinc-200 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label
                            htmlFor={`blk-divstyle-${block.id}`}
                            className="block text-xs font-medium text-zinc-700 mb-1"
                          >
                            Stile Linea
                          </label>
                          <select
                            id={`blk-divstyle-${block.id}`}
                            value={block.dividerStyle || 'line'}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                dividerStyle: e.target.value as BioBlock['dividerStyle'],
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg"
                          >
                            <option value="line">Linea continua</option>
                            <option value="dashed">Tratteggiato</option>
                            <option value="dotted">Punteggiato</option>
                            <option value="gradient">Sfumato (Gradiente)</option>
                            <option value="space">Solo spazio</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`blk-divthick-${block.id}`}
                            className="block text-xs font-medium text-zinc-700 mb-1"
                          >
                            Spessore
                          </label>
                          <select
                            id={`blk-divthick-${block.id}`}
                            value={block.dividerThickness || 1}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                dividerThickness: Number(e.target.value) as 1 | 2 | 3 | 4,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg"
                          >
                            <option value={1}>Sottile (1px)</option>
                            <option value={2}>Medio (2px)</option>
                            <option value={3}>Marcato (3px)</option>
                            <option value={4}>Spesso (4px)</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`blk-divwidth-${block.id}`}
                            className="block text-xs font-medium text-zinc-700 mb-1"
                          >
                            Larghezza
                          </label>
                          <select
                            id={`blk-divwidth-${block.id}`}
                            value={block.dividerWidth || 'full'}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                dividerWidth: e.target.value as BioBlock['dividerWidth'],
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg"
                          >
                            <option value="full">Intera (100%)</option>
                            <option value="medium">Media (66%)</option>
                            <option value="short">Corta</option>
                          </select>
                        </div>

                        <div>
                          <span className="block text-xs font-medium text-zinc-700 mb-1">
                            Colore Linea
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              aria-label="Colore divisore"
                              value={block.dividerColor || profile.theme.borderColor || '#E4E4E7'}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  dividerColor: e.target.value,
                                })
                              }
                              className="w-8 h-8 rounded border border-zinc-200 cursor-pointer shrink-0"
                            />
                            {block.dividerColor && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, { dividerColor: undefined })
                                }
                                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                              >
                                Tema
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {(block.type === 'link' ||
                      block.type === 'product' ||
                      block.type === 'featured' ||
                      block.type === 'video' ||
                      block.type === 'media' ||
                      block.type === 'contact') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor={`blk-sub-${block.id}`}
                            className="block text-xs font-medium text-zinc-700 mb-1"
                          >
                            Sottotitolo / Descrizione
                          </label>
                          <input
                            id={`blk-sub-${block.id}`}
                            type="text"
                            value={block.subtitle || ''}
                            onChange={(e) =>
                              updateBlock(block.id, { subtitle: e.target.value })
                            }
                            placeholder="Opzionale"
                            className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                          />
                        </div>

                        {block.type === 'link' && (
                          <div>
                            <label
                              htmlFor={`blk-badge-${block.id}`}
                              className="block text-xs font-medium text-zinc-700 mb-1"
                            >
                              Etichetta breve (opzionale)
                            </label>
                            <input
                              id={`blk-badge-${block.id}`}
                              type="text"
                              value={block.badgeText || ''}
                              onChange={(e) =>
                                updateBlock(block.id, { badgeText: e.target.value })
                              }
                              placeholder="Es. Nuovo, Gratis, PDF"
                              className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                        )}

                        {block.type === 'featured' && (
                          <div>
                            <label
                              htmlFor={`blk-img-${block.id}`}
                              className="block text-xs font-medium text-zinc-700 mb-1"
                            >
                              Immagine Card (URL)
                            </label>
                            <input
                              id={`blk-img-${block.id}`}
                              type="text"
                              value={block.imageUrl || ''}
                              onChange={(e) =>
                                updateBlock(block.id, { imageUrl: e.target.value })
                              }
                              className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                        )}

                        {block.type === 'media' && (
                          <div>
                            <label
                              htmlFor={`blk-dur-${block.id}`}
                              className="block text-xs font-medium text-zinc-700 mb-1"
                            >
                              Durata (mm:ss)
                            </label>
                            <input
                              id={`blk-dur-${block.id}`}
                              type="text"
                              value={block.mediaDuration || ''}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  mediaDuration: e.target.value,
                                })
                              }
                              placeholder="03:45"
                              className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 font-mono"
                            />
                          </div>
                        )}

                        {block.type === 'contact' && (
                          <div>
                            <label
                              htmlFor={`blk-btn-${block.id}`}
                              className="block text-xs font-medium text-zinc-700 mb-1"
                            >
                              Testo Bottone Invio
                            </label>
                            <input
                              id={`blk-btn-${block.id}`}
                              type="text"
                              value={block.contactButtonText || ''}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  contactButtonText: e.target.value,
                                })
                              }
                              placeholder="Iscriviti"
                              className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === 'link' && (
                      <div className="space-y-3 pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={`blk-icon-${block.id}`}
                              className="text-xs font-medium text-zinc-700"
                            >
                              Icona predefinita:
                            </label>
                            <select
                              id={`blk-icon-${block.id}`}
                              value={block.iconName || 'link'}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  iconName: e.target.value as BlockIconName,
                                })
                              }
                              className="px-2.5 py-1 text-xs bg-white border border-zinc-200 rounded-lg"
                            >
                              {BLOCK_ICON_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(block.highlight)}
                              onChange={(e) =>
                                updateBlock(block.id, { highlight: e.target.checked })
                              }
                              className="w-4 h-4 accent-blue-600 rounded"
                            />
                            <span>Metti in risalto (colore accento)</span>
                          </label>
                        </div>

                        <div className="p-2.5 bg-white border border-zinc-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                            <span
                              className={`w-8 h-8 border border-zinc-200 bg-zinc-50 overflow-hidden inline-flex items-center justify-center shrink-0 ${
                                block.iconShape === 'circle'
                                  ? 'rounded-full'
                                  : block.iconShape === 'square'
                                    ? 'rounded-none'
                                    : 'rounded-lg'
                              }`}
                            >
                              {block.iconImageUrl ? (
                                <img
                                  src={block.iconImageUrl}
                                  alt={`Foto icona ${block.title}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <BlockIcon name={block.iconName} className="w-4 h-4 text-zinc-600" />
                              )}
                            </span>

                            <label className="px-2.5 py-1.5 text-xs font-medium text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                              <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{block.iconImageUrl ? 'Cambia foto icona' : 'Foto come icona'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                aria-label={`Carica foto icona per ${block.title}`}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = '';
                                  if (!file) return;
                                  try {
                                    const dataUrl = await compressImageFileToDataUrl(file, 160, 20000);
                                    updateBlock(block.id, {
                                      iconImageUrl: dataUrl,
                                      iconShape: block.iconShape || 'rounded',
                                    });
                                    setCoverErrorById((prev) => ({
                                      ...prev,
                                      [block.id]: '',
                                    }));
                                  } catch (err) {
                                    setCoverErrorById((prev) => ({
                                      ...prev,
                                      [block.id]:
                                        err instanceof Error ? err.message : 'Errore foto icona',
                                    }));
                                  }
                                }}
                                className="sr-only"
                              />
                            </label>

                            <input
                              type="text"
                              aria-label={`URL foto icona per ${block.title}`}
                              value={
                                block.iconImageUrl?.startsWith('data:')
                                  ? ''
                                  : block.iconImageUrl || ''
                              }
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  iconImageUrl: e.target.value,
                                  iconShape: block.iconShape || 'rounded',
                                })
                              }
                              placeholder={
                                block.iconImageUrl?.startsWith('data:')
                                  ? 'Foto caricata dal dispositivo'
                                  : 'oppure URL immagine...'
                              }
                              className="flex-1 min-w-[120px] px-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900"
                            />

                            {block.iconImageUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, { iconImageUrl: undefined })
                                }
                                aria-label={`Rimuovi foto icona per ${block.title}`}
                                className="p-1 text-zinc-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer shrink-0"
                              >
                                <X className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1 p-0.5 bg-zinc-100 rounded-lg shrink-0">
                            {(
                              [
                                { id: 'circle', label: 'Cerchio' },
                                { id: 'square', label: 'Quadrata' },
                                { id: 'rounded', label: 'Arrotondati' },
                              ] as { id: SocialIconShape; label: string }[]
                            ).map((opt) => {
                              const activeShape = block.iconShape || 'rounded';
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  aria-pressed={activeShape === opt.id}
                                  onClick={() =>
                                    updateBlock(block.id, { iconShape: opt.id })
                                  }
                                  className={`px-2 py-1 text-[11px] font-medium rounded-md cursor-pointer whitespace-nowrap ${
                                    activeShape === opt.id
                                      ? 'bg-white text-zinc-900 shadow-xs'
                                      : 'text-zinc-600 hover:text-zinc-900'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {coverErrorById[block.id] && (
                          <p className="text-xs text-red-600 font-medium">
                            {coverErrorById[block.id]}
                          </p>
                        )}
                      </div>
                    )}

                    {block.type === 'photo_grid' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {(block.photoGridItems || []).map((item, idx) => (
                          <div
                            key={item.id}
                            className="p-2.5 bg-white border border-zinc-200 rounded-lg space-y-2"
                          >
                            <div className="text-[11px] font-semibold text-zinc-500">
                              Card Foto {idx + 1}
                            </div>
                            <input
                              type="text"
                              aria-label={`Titolo card foto ${idx + 1}`}
                              value={item.title}
                              onChange={(e) =>
                                updatePhotoGridItem(block.id, item.id, {
                                  title: e.target.value,
                                })
                              }
                              placeholder="Titolo card"
                              className="w-full px-2 py-1 text-xs border border-zinc-200 rounded"
                            />
                            <input
                              type="text"
                              aria-label={`URL card foto ${idx + 1}`}
                              value={item.url}
                              onChange={(e) =>
                                updatePhotoGridItem(block.id, item.id, {
                                  url: e.target.value,
                                })
                              }
                              placeholder="https://..."
                              className="w-full px-2 py-1 text-xs border border-zinc-200 rounded"
                            />
                            <input
                              type="text"
                              aria-label={`Immagine card foto ${idx + 1}`}
                              value={item.imageUrl}
                              onChange={(e) =>
                                updatePhotoGridItem(block.id, item.id, {
                                  imageUrl: e.target.value,
                                })
                              }
                              placeholder="URL immagine"
                              className="w-full px-2 py-1 text-xs border border-zinc-200 rounded"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {block.type === 'social_grid' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        {(block.socialGridItems || []).map((tile, idx) => (
                          <div
                            key={tile.id}
                            className="p-2.5 bg-white border border-zinc-200 rounded-lg space-y-2"
                          >
                            <div className="text-[11px] font-semibold text-zinc-500">
                              Riquadro {idx + 1}
                            </div>
                            <input
                              type="text"
                              aria-label={`Didascalia riquadro ${idx + 1}`}
                              value={tile.caption}
                              onChange={(e) =>
                                updateSocialGridTile(block.id, tile.id, {
                                  caption: e.target.value,
                                })
                              }
                              placeholder="Didascalia"
                              className="w-full px-2 py-1 text-xs border border-zinc-200 rounded"
                            />
                            <input
                              type="text"
                              aria-label={`URL riquadro ${idx + 1}`}
                              value={tile.url}
                              onChange={(e) =>
                                updateSocialGridTile(block.id, tile.id, {
                                  url: e.target.value,
                                })
                              }
                              placeholder="https://..."
                              className="w-full px-2 py-1 text-xs border border-zinc-200 rounded"
                            />
                            <input
                              type="text"
                              aria-label={`Immagine riquadro ${idx + 1}`}
                              value={tile.imageUrl}
                              onChange={(e) =>
                                updateSocialGridTile(block.id, tile.id, {
                                  imageUrl: e.target.value,
                                })
                              }
                              placeholder="URL immagine"
                              className="w-full px-2 py-1 text-xs border border-zinc-200 rounded"
                            />
                            <select
                              aria-label={`Tipo media riquadro ${idx + 1}`}
                              value={tile.mediaKind}
                              onChange={(e) =>
                                updateSocialGridTile(block.id, tile.id, {
                                  mediaKind: e.target.value as 'image' | 'video' | 'carousel',
                                })
                              }
                              className="w-full px-2 py-1 text-xs border border-zinc-200 rounded bg-white"
                            >
                              <option value="image">Foto</option>
                              <option value="carousel">Carosello</option>
                              <option value="video">Video</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    {block.type === 'grid' && (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-700">
                            Riquadri Griglia ({block.gridItems?.length || 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => addGridTile(block.id)}
                            className="px-2.5 py-1 text-xs font-medium text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" aria-hidden="true" />
                            <span>Aggiungi riquadro</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(block.gridItems || []).map((tile) => (
                            <div
                              key={tile.id}
                              className="p-2.5 bg-white border border-zinc-200 rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  aria-label="Titolo riquadro"
                                  value={tile.title}
                                  onChange={(e) =>
                                    updateGridItem(block.id, tile.id, {
                                      title: e.target.value,
                                    })
                                  }
                                  className="flex-1 min-w-0 px-2 py-1 text-xs font-medium border border-zinc-200 rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeGridTile(block.id, tile.id)}
                                  aria-label={`Elimina riquadro ${tile.title}`}
                                  className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                              </div>
                              <input
                                type="text"
                                aria-label="URL riquadro"
                                value={tile.url}
                                onChange={(e) =>
                                  updateGridItem(block.id, tile.id, {
                                    url: e.target.value,
                                  })
                                }
                                placeholder="https://..."
                                className="w-full px-2 py-1 text-xs border border-zinc-200 rounded"
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  aria-label="Sottotitolo riquadro"
                                  value={tile.subtitle || ''}
                                  onChange={(e) =>
                                    updateGridItem(block.id, tile.id, {
                                      subtitle: e.target.value,
                                    })
                                  }
                                  placeholder="Sottotitolo"
                                  className="flex-1 min-w-0 px-2 py-1 text-xs border border-zinc-200 rounded"
                                />
                                <select
                                  aria-label="Icona riquadro"
                                  value={tile.iconName}
                                  onChange={(e) =>
                                    updateGridItem(block.id, tile.id, {
                                      iconName: e.target.value as BlockIconName,
                                    })
                                  }
                                  className="px-1.5 py-1 text-xs border border-zinc-200 rounded bg-white"
                                >
                                  {BLOCK_ICON_OPTIONS.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-100">
                                <span
                                  className={`w-6 h-6 border border-zinc-200 bg-zinc-50 overflow-hidden inline-flex items-center justify-center shrink-0 ${
                                    tile.iconShape === 'circle'
                                      ? 'rounded-full'
                                      : tile.iconShape === 'square'
                                        ? 'rounded-none'
                                        : 'rounded-md'
                                  }`}
                                >
                                  {tile.iconImageUrl ? (
                                    <img
                                      src={tile.iconImageUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <BlockIcon name={tile.iconName} className="w-3.5 h-3.5 text-zinc-500" />
                                  )}
                                </span>
                                <label className="px-2 py-1 text-[11px] font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded hover:bg-zinc-100 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap">
                                  <ImagePlus className="w-3 h-3" aria-hidden="true" />
                                  <span>{tile.iconImageUrl ? 'Cambia foto' : 'Foto icona'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    aria-label={`Carica foto icona per ${tile.title}`}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      e.target.value = '';
                                      if (!file) return;
                                      try {
                                        const dataUrl = await compressImageFileToDataUrl(file, 160, 18000);
                                        updateGridItem(block.id, tile.id, {
                                          iconImageUrl: dataUrl,
                                          iconShape: tile.iconShape || 'rounded',
                                        });
                                      } catch {
                                        // Ignore invalid image files cleanly
                                      }
                                    }}
                                    className="sr-only"
                                  />
                                </label>
                                <select
                                  aria-label={`Forma foto icona per ${tile.title}`}
                                  value={tile.iconShape || 'rounded'}
                                  onChange={(e) =>
                                    updateGridItem(block.id, tile.id, {
                                      iconShape: e.target.value as SocialIconShape,
                                    })
                                  }
                                  className="px-1.5 py-1 text-[11px] border border-zinc-200 rounded bg-white"
                                >
                                  <option value="rounded">Arrotondati</option>
                                  <option value="circle">Cerchio</option>
                                  <option value="square">Quadrata</option>
                                </select>
                                {tile.iconImageUrl && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateGridItem(block.id, tile.id, {
                                        iconImageUrl: undefined,
                                      })
                                    }
                                    aria-label={`Rimuovi foto icona per ${tile.title}`}
                                    className="p-1 text-zinc-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer ml-auto"
                                  >
                                    <X className="w-3 h-3" aria-hidden="true" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
