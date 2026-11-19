import type {
  BioBlock,
  BioProfile,
  ProfileTheme,
  SocialIconShape,
  SocialLinkItem,
  SocialPlatformId,
  SocialStyle,
} from '../types/profile';

export const SOCIAL_BASE_URLS: Record<SocialPlatformId, string> = {
  instagram: 'https://instagram.com/',
  tiktok: 'https://tiktok.com/@',
  youtube: 'https://youtube.com/@',
  x: 'https://x.com/',
  linkedin: 'https://linkedin.com/in/',
  github: 'https://github.com/',
  spotify: 'https://open.spotify.com/artist/',
  twitch: 'https://twitch.tv/',
  discord: 'https://discord.gg/',
  telegram: 'https://t.me/',
  whatsapp: 'https://wa.me/',
  behance: 'https://behance.net/',
  dribbble: 'https://dribbble.com/',
  pinterest: 'https://pinterest.com/',
  threads: 'https://threads.net/@',
  substack: 'https://substack.com/@',
  applemusic: 'https://music.apple.com/',
  soundcloud: 'https://soundcloud.com/',
  email: 'mailto:',
  website: 'https://',
};

export function normalizeHandle(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/^@+/, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '');
}

export function sanitizePastedUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const strayHttp = trimmed.match(/^[a-z0-9"'`(\[{<]{1,3}(https?:\/\/.+)$/i);
  if (strayHttp) {
    return strayHttp[1];
  }
  return trimmed;
}

export function normalizeUrl(raw: string, platform?: SocialPlatformId): string {
  const trimmed = sanitizePastedUrl(raw);
  if (!trimmed) return '';

  if (platform === 'email') {
    if (trimmed.startsWith('mailto:')) return trimmed;
    return `mailto:${trimmed.replace(/^@/, '')}`;
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('@') && platform && SOCIAL_BASE_URLS[platform]) {
    const cleanUser = trimmed.slice(1);
    return `${SOCIAL_BASE_URLS[platform]}${cleanUser}`;
  }

  if (
    platform &&
    platform !== 'website' &&
    !trimmed.includes('.') &&
    !trimmed.includes('/')
  ) {
    return `${SOCIAL_BASE_URLS[platform]}${trimmed}`;
  }

  return `https://${trimmed}`;
}

export function buildWhatsappUrl(phone: string, message?: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  const text = message?.trim();
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}

export function isValidUrlOrEmpty(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return trimmed.length > 7;
  }
  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
}

export function validateProfileInput(input: {
  handle: string;
  displayName: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const cleanHandle = normalizeHandle(input.handle);
  if (!cleanHandle || cleanHandle.length < 2) {
    errors.handle = 'Inserisci un handle valido di almeno 2 caratteri (es. mario.rossi).';
  }
  if (!input.displayName.trim() || input.displayName.trim().length < 2) {
    errors.displayName = 'Il nome visualizzato deve avere almeno 2 caratteri.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function reorderList<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }
  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

export function moveItem<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  return reorderList(items, index, targetIndex);
}

export function filterBlocks(blocks: BioBlock[], query: string): BioBlock[] {
  const q = query.trim().toLowerCase();
  if (!q) return blocks;
  return blocks.filter((block) => {
    const inTitle = block.title.toLowerCase().includes(q);
    const inSub = block.subtitle?.toLowerCase().includes(q) ?? false;
    const inUrl = block.url?.toLowerCase().includes(q) ?? false;
    const inVideo = block.videoUrl?.toLowerCase().includes(q) ?? false;
    const inWa = block.whatsappMessage?.toLowerCase().includes(q) ?? false;
    const inPrice = block.productPrice?.toLowerCase().includes(q) ?? false;
    const inGrid =
      block.gridItems?.some(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.url.toLowerCase().includes(q)
      ) ?? false;
    const inPhotoGrid =
      block.photoGridItems?.some(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.url.toLowerCase().includes(q)
      ) ?? false;
    const inSocialGrid =
      block.socialGridItems?.some(
        (item) =>
          item.caption.toLowerCase().includes(q) ||
          item.url.toLowerCase().includes(q)
      ) ?? false;
    return (
      inTitle ||
      inSub ||
      inUrl ||
      inVideo ||
      inWa ||
      inPrice ||
      inGrid ||
      inPhotoGrid ||
      inSocialGrid
    );
  });
}

export function calculateTotalFollowers(socials: SocialLinkItem[]): number {
  return socials.reduce((sum, item) => {
    if (!item.visible || item.kind === 'divider') return sum;
    return sum + (typeof item.followers === 'number' && item.followers > 0 ? item.followers : 0);
  }, 0);
}

export function formatFollowerCount(count: number): string {
  if (count <= 0) return '0';
  if (count >= 1_000_000) {
    const m = Math.round((count / 1_000_000) * 10) / 10;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (count >= 1_000) {
    const k = count / 1_000;
    if (k >= 100) return `${Math.round(k)}K`;
    const rounded = Math.round(k * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}K`;
  }
  return String(Math.round(count));
}

export interface ProfileStats {
  totalClicks: number;
  activeLinks: number;
  activeSocials: number;
  topBlockTitle: string | null;
  ctrEstimate: string;
}

export function calculateProfileStats(profile: BioProfile): ProfileStats {
  let totalClicks = 0;
  let activeLinks = 0;
  let topBlockTitle: string | null = null;
  let topBlockClicks = -1;

  for (const block of profile.blocks) {
    let blockClickSum = block.clicks;
    if (block.type === 'grid' && block.gridItems) {
      blockClickSum += block.gridItems.reduce((acc, g) => acc + g.clicks, 0);
    }
    if (block.type === 'photo_grid' && block.photoGridItems) {
      blockClickSum += block.photoGridItems.reduce((acc, g) => acc + g.clicks, 0);
    }
    if (block.type === 'social_grid' && block.socialGridItems) {
      blockClickSum += block.socialGridItems.reduce((acc, g) => acc + g.clicks, 0);
    }
    totalClicks += blockClickSum;

    if (block.visible && block.type !== 'header' && block.type !== 'divider') {
      activeLinks += 1;
    }

    if (block.type !== 'header' && block.type !== 'divider' && blockClickSum > topBlockClicks) {
      topBlockClicks = blockClickSum;
      topBlockTitle = block.title;
    }
  }

  const activeSocials = profile.socials.filter(
    (s) => s.visible && s.kind !== 'divider'
  ).length;
  const ctr =
    profile.views > 0 ? Math.min(99.9, (totalClicks / profile.views) * 100) : 0;

  return {
    totalClicks,
    activeLinks,
    activeSocials,
    topBlockTitle: topBlockClicks > 0 ? topBlockTitle : null,
    ctrEstimate: `${ctr.toFixed(1)}%`,
  };
}

export function cloneProfileForRemix(
  source: BioProfile,
  rawHandle: string,
  displayName: string
): BioProfile {
  const cleanHandle = normalizeHandle(rawHandle) || `profilo-${Date.now().toString(36)}`;
  const nowIso = new Date().toISOString();
  return {
    ...source,
    id: `prof_${Date.now().toString(36)}`,
    handle: cleanHandle,
    displayName: displayName.trim() || source.displayName,
    views: 0,
    updatedAt: nowIso,
    socials: source.socials.map((s, idx) => ({
      ...s,
      id: `soc_${Date.now().toString(36)}_${idx}`,
    })),
    blocks: source.blocks.map((b, idx) => ({
      ...b,
      id: `blk_${Date.now().toString(36)}_${idx}`,
      clicks: 0,
      gridItems: b.gridItems?.map((g, gIdx) => ({
        ...g,
        id: `grd_${Date.now().toString(36)}_${idx}_${gIdx}`,
        clicks: 0,
      })),
      photoGridItems: b.photoGridItems?.map((p, pIdx) => ({
        ...p,
        id: `pgr_${Date.now().toString(36)}_${idx}_${pIdx}`,
        clicks: 0,
      })),
      socialGridItems: b.socialGridItems?.map((sg, sgIdx) => ({
        ...sg,
        id: `sgr_${Date.now().toString(36)}_${idx}_${sgIdx}`,
        clicks: 0,
      })),
    })),
    theme: { ...source.theme },
    messages: [],
  };
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return [r, g, b];
  }
  return null;
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isDarkColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  return relativeLuminance(rgb) < 0.35;
}

export function computeContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function getThemeContrastSummary(theme: ProfileTheme): {
  ratio: number;
  passesAA: boolean;
  label: string;
} {
  const bg =
    theme.cardVariant === 'filled' || theme.cardVariant === 'elevated'
      ? theme.surfaceColor
      : theme.backgroundColor;
  const ratio = computeContrastRatio(theme.textColor, bg);
  const passesAA = ratio >= 4.5;
  return {
    ratio,
    passesAA,
    label: passesAA ? `WCAG AA (${ratio}:1)` : `Contrasto Basso (${ratio}:1)`,
  };
}

export function getSocialIconShapeRadiusClass(
  iconShape: SocialIconShape | undefined,
  themeStyle: SocialStyle = 'brand'
): string {
  if (iconShape === 'circle') return 'rounded-full';
  if (iconShape === 'square') return 'rounded-none';
  if (iconShape === 'rounded') return 'rounded-xl';

  if (themeStyle === 'brand' || themeStyle === 'circle') return 'rounded-full';
  if (themeStyle === 'square') return 'rounded-xl';
  return 'rounded-md';
}

export function getSocialIconShapeClass(
  iconShape: SocialIconShape | undefined,
  themeStyle: SocialStyle = 'brand'
): string {
  const radiusClass = getSocialIconShapeRadiusClass(iconShape, themeStyle);
  if (!iconShape && themeStyle === 'minimal') {
    return `w-9 h-9 ${radiusClass}`;
  }
  return `w-10 h-10 ${radiusClass}`;
}

export interface ParsedVideoInfo {
  provider:
    | 'youtube'
    | 'vimeo'
    | 'gdrive'
    | 'loom'
    | 'streamable'
    | 'direct'
    | 'external';
  embedUrl: string | null;
  thumbnailUrl: string | null;
  directUrl: string | null;
  isVertical: boolean;
}

export function parseVideoUrl(rawUrl: string, loop = false): ParsedVideoInfo {
  const trimmed = sanitizePastedUrl(rawUrl);
  if (!trimmed) {
    return {
      provider: 'external',
      embedUrl: null,
      thumbnailUrl: null,
      directUrl: null,
      isVertical: false,
    };
  }

  const normalized = normalizeUrl(trimmed);

  // YouTube (watch, youtu.be, shorts, embed, live)
  const ytMatch = normalized.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const id = ytMatch[1];
    const embedUrl = loop
      ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&rel=0`
      : `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    return {
      provider: 'youtube',
      embedUrl,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      directUrl: null,
      isVertical: /youtube\.com\/shorts\//i.test(normalized),
    };
  }

  // Vimeo
  const vimeoMatch = normalized.match(/(?:vimeo\.com\/(?:video\/)?)(\d{6,12})/);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    const embedUrl = loop
      ? `https://player.vimeo.com/video/${id}?autoplay=1&loop=1&muted=1&background=1`
      : `https://player.vimeo.com/video/${id}?autoplay=1`;
    return {
      provider: 'vimeo',
      embedUrl,
      thumbnailUrl: null,
      directUrl: null,
      isVertical: false,
    };
  }

  // Google Drive file sharing links (/file/d/<ID>/view, /open?id=<ID>, /uc?id=<ID>)
  const gdriveMatch = normalized.match(
    /drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([a-zA-Z0-9_-]{15,})/
  );
  if (gdriveMatch) {
    const id = gdriveMatch[1];
    return {
      provider: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${id}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w800`,
      directUrl: null,
      isVertical: false,
    };
  }

  // Dropbox shared video links -> raw=1 direct HTML5 stream
  try {
    const parsedUrl = new URL(normalized);
    if (
      /(?:^|\.)dropbox\.com$/i.test(parsedUrl.hostname) &&
      /^\/(?:s|scl\/fi)\//i.test(parsedUrl.pathname)
    ) {
      parsedUrl.searchParams.delete('dl');
      parsedUrl.searchParams.set('raw', '1');
      return {
        provider: 'direct',
        embedUrl: null,
        thumbnailUrl: null,
        directUrl: parsedUrl.toString(),
        isVertical: false,
      };
    }
  } catch {
    // Ignore malformed URL parse and continue fallback checks
  }

  // Loom share/embed links
  const loomMatch = normalized.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    const id = loomMatch[1];
    return {
      provider: 'loom',
      embedUrl: `https://www.loom.com/embed/${id}?autoplay=1&hide_owner=true&hide_share=true&hide_title=true`,
      thumbnailUrl: null,
      directUrl: null,
      isVertical: false,
    };
  }

  // Streamable links
  const streamableMatch = normalized.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (streamableMatch) {
    const id = streamableMatch[1];
    return {
      provider: 'streamable',
      embedUrl: loop
        ? `https://streamable.com/e/${id}?autoplay=1&loop=1&muted=1`
        : `https://streamable.com/e/${id}?autoplay=1`,
      thumbnailUrl: null,
      directUrl: null,
      isVertical: false,
    };
  }

  // Direct HTML5 video files
  if (/\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i.test(normalized)) {
    return {
      provider: 'direct',
      embedUrl: null,
      thumbnailUrl: null,
      directUrl: normalized,
      isVertical: false,
    };
  }

  return {
    provider: 'external',
    embedUrl: null,
    thumbnailUrl: null,
    directUrl: null,
    isVertical: /(tiktok\.com|instagram\.com\/reel)/i.test(normalized),
  };
}


