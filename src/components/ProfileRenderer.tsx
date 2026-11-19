import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Film,
  Layers,
  Link2,
  MapPin,
  MessageCircle,
  Pause,
  Play,
  Repeat,
  Share2,
  ShoppingBag,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {
  BioBlock,
  BioProfile,
  ButtonShape,
  ProfileTheme,
  SocialLinkItem,
} from '../types/profile';
import { BlockIcon, SocialIcon } from './SocialIcons';
import {
  buildWhatsappUrl,
  calculateTotalFollowers,
  formatFollowerCount,
  getSocialIconShapeClass,
  getSocialIconShapeRadiusClass,
  normalizeUrl,
  parseVideoUrl,
} from '../utils/profileLogic';

interface ProfileRendererProps {
  profile: BioProfile;
  isPublicStandalone?: boolean;
  isDesktopFrame?: boolean;
  onBlockClick?: (blockId: string, gridItemId?: string) => void;
  onSubmitContact?: (payload: {
    senderName: string;
    senderEmail: string;
    message: string;
  }) => Promise<boolean>;
  onOpenShare?: () => void;
  onOpenLanding?: () => void;
}

function getShapeClass(shape: ButtonShape, isCard = false): string {
  if (shape === 'sharp') return 'rounded-none';
  if (shape === 'pill') return isCard ? 'rounded-2xl' : 'rounded-full';
  return 'rounded-2xl';
}

function getFontClass(font: ProfileTheme['font']): string {
  switch (font) {
    case 'playfair':
      return 'font-profile-playfair';
    case 'outfit':
      return 'font-profile-outfit';
    case 'jetbrains':
      return 'font-profile-jetbrains';
    case 'jakarta':
    default:
      return 'font-profile-jakarta';
  }
}

function getBackgroundStyle(theme: ProfileTheme): React.CSSProperties {
  const base: React.CSSProperties = {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
  };

  if (theme.backgroundType === 'gradient') {
    base.backgroundImage = `linear-gradient(${theme.gradientAngle}deg, ${theme.gradientStart}, ${theme.gradientEnd})`;
  } else if (theme.backgroundType === 'image' && theme.backgroundImageUrl) {
    base.backgroundImage = `linear-gradient(to bottom, rgba(10,10,14,0.45), rgba(10,10,14,0.72)), url("${theme.backgroundImageUrl}")`;
    base.backgroundSize = 'cover';
    base.backgroundPosition = 'center';
  }

  if (
    theme.backgroundType === 'pattern' ||
    (theme.backgroundType === 'gradient' && theme.pattern !== 'none')
  ) {
    const patternStroke = `${theme.textColor}14`;
    if (theme.pattern === 'dots') {
      const dots = `radial-gradient(${patternStroke} 1.25px, transparent 1.25px)`;
      base.backgroundImage =
        theme.backgroundType === 'gradient'
          ? `${dots}, linear-gradient(${theme.gradientAngle}deg, ${theme.gradientStart}, ${theme.gradientEnd})`
          : dots;
      base.backgroundSize =
        theme.backgroundType === 'gradient' ? '18px 18px, 100% 100%' : '18px 18px';
    } else if (theme.pattern === 'grid') {
      base.backgroundImage = `linear-gradient(to right, ${patternStroke} 1px, transparent 1px), linear-gradient(to bottom, ${patternStroke} 1px, transparent 1px)`;
      base.backgroundSize = '24px 24px';
    } else if (theme.pattern === 'diagonal') {
      base.backgroundImage = `repeating-linear-gradient(45deg, ${patternStroke}, ${patternStroke} 1px, transparent 1px, transparent 12px)`;
    }
  }

  return base;
}

function getCardStyle(theme: ProfileTheme, highlight = false): React.CSSProperties {
  if (highlight) {
    return {
      backgroundColor: theme.accentColor,
      color: theme.accentTextColor,
      border: `1px solid ${theme.accentColor}`,
    };
  }

  switch (theme.cardVariant) {
    case 'outline':
      return {
        backgroundColor: 'transparent',
        color: theme.textColor,
        border: `1.5px solid ${theme.borderColor}`,
      };
    case 'glass':
      return {
        backgroundColor: `${theme.surfaceColor}B8`,
        color: theme.textColor,
        border: `1px solid ${theme.borderColor}`,
        backdropFilter: 'blur(14px)',
      };
    case 'elevated':
      return {
        backgroundColor: theme.surfaceColor,
        color: theme.textColor,
        border: `1px solid ${theme.borderColor}`,
        boxShadow: '0 6px 20px -4px rgba(0, 0, 0, 0.14)',
      };
    case 'filled':
    default:
      return {
        backgroundColor: theme.surfaceColor,
        color: theme.textColor,
        border: `1px solid ${theme.borderColor}`,
      };
  }
}

export function ProfileRenderer({
  profile,
  isPublicStandalone = false,
  isDesktopFrame = false,
  onBlockClick,
  onSubmitContact,
  onOpenShare,
  onOpenLanding,
}: ProfileRendererProps) {
  const { theme } = profile;
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [followersExpanded, setFollowersExpanded] = useState(false);
  const [playingBlockId, setPlayingBlockId] = useState<string | null>(null);
  const [activeVideoIds, setActiveVideoIds] = useState<Record<string, boolean>>({});
  const [mutedLoopVideos, setMutedLoopVideos] = useState<Record<string, boolean>>({});
  const [mediaProgress, setMediaProgress] = useState<Record<string, number>>({});
  const [contactForms, setContactForms] = useState<
    Record<string, { name: string; email: string; note: string; sent: boolean; error: string }>
  >({});

  useEffect(() => {
    setAvatarFailed(false);
  }, [profile.avatarUrl]);

  useEffect(() => {
    setBannerFailed(false);
  }, [profile.bannerUrl]);

  useEffect(() => {
    if (!playingBlockId) return;
    const timer = window.setInterval(() => {
      setMediaProgress((prev) => {
        const cur = prev[playingBlockId] ?? 18;
        return {
          ...prev,
          [playingBlockId]: cur >= 100 ? 0 : cur + 2,
        };
      });
    }, 350);
    return () => window.clearInterval(timer);
  }, [playingBlockId]);

  const gapClass =
    theme.spacing === 'compact'
      ? 'space-y-2.5'
      : theme.spacing === 'airy'
        ? 'space-y-5'
        : 'space-y-3.5';

  const visibleSocials = profile.socials.filter((s) => s.visible);
  const visibleBlocks = profile.blocks.filter((b) => b.visible);
  const totalFollowers = calculateTotalFollowers(profile.socials);
  const socialsWithFollowers = visibleSocials.filter(
    (s) => s.kind !== 'divider' && typeof s.followers === 'number' && s.followers > 0
  );

  const initials =
    profile.displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'LM';

  const heroPhotoUrl =
    (!avatarFailed && profile.avatarUrl) ||
    (!bannerFailed && profile.bannerUrl) ||
    '';

  const isFullBleedHero = theme.heroStyle !== 'avatar';
  const fadeTargetColor =
    theme.backgroundType === 'gradient'
      ? theme.gradientStart
      : theme.backgroundColor;

  const textColorEffective =
    theme.backgroundType === 'image' && theme.backgroundImageUrl
      ? '#FFFFFF'
      : theme.textColor;

  const mutedEffective =
    theme.backgroundType === 'image' && theme.backgroundImageUrl
      ? 'rgba(255,255,255,0.78)'
      : theme.mutedTextColor;

  const renderSocialDivider = (divItem: SocialLinkItem) => {
    const lineColor = divItem.dividerColor || theme.borderColor;
    const style = divItem.dividerStyle || 'line';
    const hasTitle = Boolean(divItem.label?.trim());

    const buildLine = (keySuffix: string) => {
      if (style === 'gradient') {
        return (
          <span
            key={keySuffix}
            aria-hidden="true"
            style={{
              background: `linear-gradient(90deg, transparent, ${lineColor}, transparent)`,
            }}
            className="flex-1 h-[1.5px] opacity-85"
          />
        );
      }
      const borderStyle =
        style === 'dashed' ? 'dashed' : style === 'dotted' ? 'dotted' : 'solid';
      return (
        <span
          key={keySuffix}
          aria-hidden="true"
          style={{
            borderTopWidth: '1.5px',
            borderTopStyle: borderStyle,
            borderTopColor: lineColor,
          }}
          className="flex-1 h-0 opacity-85"
        />
      );
    };

    return (
      <div
        key={divItem.id}
        role="separator"
        aria-label={hasTitle ? divItem.label : 'Divisore social'}
        className="w-full max-w-[300px] mx-auto flex items-center gap-2.5 py-0.5"
      >
        {buildLine('left')}
        {hasTitle && (
          <span
            style={{ color: mutedEffective }}
            className="text-[10px] font-bold uppercase tracking-[0.14em] shrink-0"
          >
            {divItem.label}
          </span>
        )}
        {hasTitle && buildLine('right')}
      </div>
    );
  };

  const renderSocialRow = () => {
    if (visibleSocials.length === 0) return null;

    const sectionTitle = theme.socialSectionTitle?.trim();
    const showLabels = Boolean(theme.showSocialLabels);

    const segments: Array<
      | { type: 'group'; items: SocialLinkItem[] }
      | { type: 'divider'; item: SocialLinkItem }
    > = [];

    for (const item of visibleSocials) {
      if (item.kind === 'divider') {
        segments.push({ type: 'divider', item });
      } else {
        const last = segments[segments.length - 1];
        if (last && last.type === 'group') {
          last.items.push(item);
        } else {
          segments.push({ type: 'group', items: [item] });
        }
      }
    }

    return (
      <nav aria-label="Collegamenti social" className="w-full flex flex-col items-center gap-2.5">
        {sectionTitle && (
          <div
            style={{ color: mutedEffective }}
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-center"
          >
            {sectionTitle}
          </div>
        )}

        {segments.map((seg, sIdx) => {
          if (seg.type === 'divider') {
            return renderSocialDivider(seg.item);
          }
          return (
            <div
              key={`soc-grp-${sIdx}`}
              className="flex flex-wrap items-start justify-center gap-2.5"
            >
              {seg.items.map((soc) => {
                const href = normalizeUrl(soc.url, soc.platform);
                const isBrandStyle = theme.socialStyle === 'brand';
                const hasPhotoIcon = Boolean(soc.iconImageUrl);
                const styleClasses = getSocialIconShapeClass(
                  soc.iconShape,
                  theme.socialStyle
                );

                const inlineStyle: React.CSSProperties = hasPhotoIcon
                  ? {
                      backgroundColor: theme.surfaceColor,
                      border: `1px solid ${theme.borderColor}`,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.16)',
                    }
                  : isBrandStyle
                    ? {
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.22)',
                      }
                    : theme.socialStyle === 'minimal'
                      ? { color: textColorEffective }
                      : {
                          backgroundColor: theme.surfaceColor,
                          color: theme.textColor,
                          border: `1px solid ${theme.borderColor}`,
                        };

                const linkEl = (
                  <a
                    key={showLabels ? undefined : soc.id}
                    href={href || '#'}
                    target={href.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    aria-label={`${soc.label || soc.platform} di ${profile.displayName}`}
                    title={soc.label || soc.platform}
                    style={inlineStyle}
                    className={`${styleClasses} overflow-hidden inline-flex items-center justify-center transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2`}
                  >
                    {hasPhotoIcon ? (
                      <img
                        src={soc.iconImageUrl}
                        alt={soc.label || soc.platform}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <SocialIcon
                        platform={soc.platform}
                        fullColor={isBrandStyle}
                        className="w-[18px] h-[18px]"
                      />
                    )}
                  </a>
                );

                if (showLabels) {
                  return (
                    <div
                      key={soc.id}
                      className="flex flex-col items-center gap-1 max-w-[68px]"
                    >
                      {linkEl}
                      <span
                        style={{ color: mutedEffective }}
                        className="text-[10px] font-medium text-center leading-tight line-clamp-1 w-full"
                      >
                        {soc.label || soc.platform}
                      </span>
                    </div>
                  );
                }

                return linkEl;
              })}
            </div>
          );
        })}
      </nav>
    );
  };

  const handleLinkPress = (block: BioBlock, gridItemId?: string) => {
    onBlockClick?.(block.id, gridItemId);
  };

  const handleContactSubmit = async (e: React.FormEvent, blockId: string) => {
    e.preventDefault();
    const state = contactForms[blockId] || {
      name: '',
      email: '',
      note: '',
      sent: false,
      error: '',
    };
    if (!state.email.trim() || !state.email.includes('@')) {
      setContactForms((prev) => ({
        ...prev,
        [blockId]: { ...state, error: 'Inserisci una email valida.' },
      }));
      return;
    }

    const ok = onSubmitContact
      ? await onSubmitContact({
          senderName: state.name.trim() || 'Visitatore',
          senderEmail: state.email.trim(),
          message: state.note.trim() || 'Iscrizione / Contatto rapido',
        })
      : true;

    if (ok) {
      onBlockClick?.(blockId);
      setContactForms((prev) => ({
        ...prev,
        [blockId]: { name: '', email: '', note: '', sent: true, error: '' },
      }));
    }
  };

  const cardInner = (
    <div
      style={getBackgroundStyle(theme)}
      className={`${getFontClass(theme.font)} relative w-full min-h-full transition-colors duration-200`}
    >
      {/* HERO SECTION: Link.me Full-Bleed Portrait Fade vs Classic Avatar */}
      {isFullBleedHero ? (
        <div className="relative">
          {/* Full-bleed Hero Image Backdrop */}
          <div className="relative w-full h-[310px] sm:h-[340px] overflow-hidden">
            {heroPhotoUrl ? (
              <img
                src={heroPhotoUrl}
                alt={`Immagine profilo di ${profile.displayName}`}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div
                style={{
                  background: `radial-gradient(circle at 50% 35%, ${theme.accentColor}44, ${fadeTargetColor})`,
                }}
                className="w-full h-full flex items-center justify-center"
              >
                <div
                  style={{
                    backgroundColor: theme.surfaceColor,
                    color: theme.textColor,
                    borderColor: theme.borderColor,
                  }}
                  className="w-24 h-24 rounded-full border-2 flex items-center justify-center text-2xl font-bold shadow-lg"
                >
                  {initials}
                </div>
              </div>
            )}

            {/* Top subtle scrim + Link.me top-right Share action */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent"
            />
            {onOpenShare && (
              <button
                type="button"
                onClick={onOpenShare}
                aria-label={`Condividi profilo ${profile.displayName}`}
                className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white inline-flex items-center justify-center transition-transform duration-150 hover:scale-105 cursor-pointer"
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            {/* Signature Link.me smooth bottom fade into card background */}
            <div
              aria-hidden="true"
              style={{
                background: `linear-gradient(to bottom, transparent 15%, ${fadeTargetColor}B3 68%, ${fadeTargetColor} 100%)`,
              }}
              className="absolute inset-0 pointer-events-none"
            />
          </div>

          {/* Identity Overlapping the Hero Fade */}
          <header className="relative z-10 -mt-20 px-5 pb-5 flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-1.5">
              <h1
                style={{ color: textColorEffective }}
                className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight text-balance"
              >
                {profile.displayName}
              </h1>
            </div>

            <div
              style={{ color: mutedEffective }}
              className="mt-0.5 inline-flex items-center justify-center gap-1.5 text-sm font-medium"
            >
              <span>@{profile.handle}</span>
              {profile.verified && (
                <BadgeCheck
                  style={{ color: theme.accentColor }}
                  className="w-4 h-4 shrink-0"
                  aria-label="Profilo verificato"
                />
              )}
            </div>

            {theme.socialPosition === 'top' && visibleSocials.length > 0 && (
              <div className="mt-4 w-full">{renderSocialRow()}</div>
            )}

            {/* Expandable Total Followers Pill (Link.me Signature) */}
            {profile.showFollowersCount && totalFollowers > 0 && (
              <div className="mt-3.5 w-full flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setFollowersExpanded((v) => !v)}
                  aria-expanded={followersExpanded}
                  style={{
                    backgroundColor: `${theme.textColor}18`,
                    color: textColorEffective,
                    border: `1px solid ${theme.textColor}22`,
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 backdrop-blur-md hover:opacity-90 cursor-pointer transition-opacity tabular-nums"
                >
                  <strong className="font-bold">
                    {formatFollowerCount(totalFollowers)}
                  </strong>
                  <span>Follower Totali</span>
                  {followersExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 opacity-75" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 opacity-75" aria-hidden="true" />
                  )}
                </button>

                {followersExpanded && socialsWithFollowers.length > 0 && (
                  <div
                    style={{
                      backgroundColor: theme.surfaceColor,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    }}
                    className="mt-2.5 w-full max-w-[340px] rounded-xl border p-3 grid grid-cols-2 gap-2 text-left shadow-lg"
                  >
                    {socialsWithFollowers.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-black/5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 bg-white overflow-hidden inline-flex items-center justify-center shrink-0 shadow-xs ${getSocialIconShapeRadiusClass(
                              s.iconShape,
                              theme.socialStyle
                            )}`}
                          >
                            {s.iconImageUrl ? (
                              <img
                                src={s.iconImageUrl}
                                alt={s.label || s.platform}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <SocialIcon
                                platform={s.platform}
                                fullColor
                                className="w-3 h-3"
                              />
                            )}
                          </span>
                          <span className="text-[11px] font-medium truncate">
                            {s.label}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold tabular-nums shrink-0">
                          {formatFollowerCount(s.followers || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(profile.role || profile.location) && (
              <p
                style={{ color: mutedEffective }}
                className="mt-3 text-xs font-medium flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
              >
                {profile.role && <span>{profile.role}</span>}
                {profile.role && profile.location && <span aria-hidden="true">·</span>}
                {profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    <span>{profile.location}</span>
                  </span>
                )}
              </p>
            )}

            {profile.bio && (
              <p
                style={{ color: textColorEffective }}
                className="mt-2.5 text-sm leading-relaxed max-w-[42ch] opacity-90"
              >
                {profile.bio}
              </p>
            )}
          </header>
        </div>
      ) : (
        /* Classic Avatar Header Option */
        <>
          {profile.bannerUrl && !bannerFailed && (
            <div className="relative w-full h-36 sm:h-44 overflow-hidden">
              <img
                src={profile.bannerUrl}
                alt={`Copertina di ${profile.displayName}`}
                referrerPolicy="no-referrer"
                onError={() => setBannerFailed(true)}
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"
              />
            </div>
          )}

          <div
            className={`mx-auto w-full px-5 ${
              profile.bannerUrl && !bannerFailed ? '-mt-12 relative z-10' : 'pt-8'
            }`}
          >
            {onOpenShare && (
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={onOpenShare}
                  aria-label={`Condividi profilo ${profile.displayName}`}
                  style={{
                    backgroundColor: theme.surfaceColor,
                    color: theme.textColor,
                    border: `1px solid ${theme.borderColor}`,
                  }}
                  className="w-9 h-9 rounded-full inline-flex items-center justify-center transition-transform duration-150 hover:scale-105 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            <header className="flex flex-col items-center text-center mb-6">
              <div
                style={{
                  borderColor: theme.surfaceColor,
                  backgroundColor: theme.surfaceColor,
                }}
                className="w-24 h-24 rounded-full border-4 overflow-hidden shadow-sm flex items-center justify-center mb-3.5 shrink-0"
              >
                {profile.avatarUrl && !avatarFailed ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`Foto profilo di ${profile.displayName}`}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    style={{ color: theme.textColor }}
                    className="text-xl font-semibold tracking-tight"
                  >
                    {initials}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5">
                <h1
                  style={{ color: textColorEffective }}
                  className="text-2xl font-bold tracking-tight text-balance"
                >
                  {profile.displayName}
                </h1>
                {profile.verified && (
                  <BadgeCheck
                    style={{ color: theme.accentColor }}
                    className="w-5 h-5 shrink-0"
                    aria-label="Profilo verificato"
                  />
                )}
              </div>

              <p
                style={{ color: mutedEffective }}
                className="text-xs font-medium mt-0.5 tabular-nums"
              >
                @{profile.handle}
                {profile.role ? ` · ${profile.role}` : ''}
              </p>

              {profile.bio && (
                <p
                  style={{ color: textColorEffective }}
                  className="mt-3 text-sm leading-relaxed max-w-[46ch] opacity-90"
                >
                  {profile.bio}
                </p>
              )}

              {theme.socialPosition === 'top' && visibleSocials.length > 0 && (
                <div className="mt-4 w-full">{renderSocialRow()}</div>
              )}
            </header>
          </div>
        </>
      )}

      {/* MAIN MODULAR LINK.ME BLOCKS */}
      <div className="px-4 sm:px-5 pb-10">
        <main className={gapClass}>
          {visibleBlocks.length === 0 ? (
            <div
              style={{
                borderColor: theme.borderColor,
                color: mutedEffective,
              }}
              className="border border-dashed rounded-xl py-8 px-4 text-center text-sm"
            >
              Nessun blocco attivo al momento. Aggiungi un link o un banner dall&apos;editor.
            </div>
          ) : (
            visibleBlocks.map((block) => {
              if (block.type === 'header') {
                return (
                  <div key={block.id} className="pt-3 pb-0.5">
                    <h2
                      style={{ color: textColorEffective }}
                      className="text-xs font-bold tracking-[0.14em] uppercase text-center opacity-85"
                    >
                      {block.title}
                    </h2>
                  </div>
                );
              }

              // Customizable Bio Divider Block
              if (block.type === 'divider') {
                const divStyle = block.dividerStyle || 'line';
                const thickness = block.dividerThickness || 1;
                const widthClass =
                  block.dividerWidth === 'short'
                    ? 'w-24 mx-auto'
                    : block.dividerWidth === 'medium'
                      ? 'w-2/3 mx-auto'
                      : 'w-full';
                const lineColor = block.dividerColor || theme.borderColor;
                const hasTitle = Boolean(block.title?.trim());

                if (divStyle === 'space') {
                  return (
                    <div
                      key={block.id}
                      role="separator"
                      aria-label={hasTitle ? block.title : 'Spaziatore'}
                      className={`${widthClass} py-3 flex items-center justify-center`}
                    >
                      {hasTitle && (
                        <span
                          style={{ color: mutedEffective }}
                          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                        >
                          {block.title}
                        </span>
                      )}
                    </div>
                  );
                }

                const renderDividerSegment = (segKey: string) => {
                  if (divStyle === 'gradient') {
                    return (
                      <span
                        key={segKey}
                        aria-hidden="true"
                        style={{
                          height: `${thickness}px`,
                          background: `linear-gradient(90deg, transparent, ${lineColor}, transparent)`,
                        }}
                        className="flex-1 rounded-full"
                      />
                    );
                  }
                  const borderStyle =
                    divStyle === 'dashed'
                      ? 'dashed'
                      : divStyle === 'dotted'
                        ? 'dotted'
                        : 'solid';
                  return (
                    <span
                      key={segKey}
                      aria-hidden="true"
                      style={{
                        borderTopWidth: `${thickness}px`,
                        borderTopStyle: borderStyle,
                        borderTopColor: lineColor,
                      }}
                      className="flex-1 h-0"
                    />
                  );
                };

                return (
                  <div
                    key={block.id}
                    role="separator"
                    aria-label={hasTitle ? block.title : 'Divisore'}
                    className={`${widthClass} py-2 flex items-center gap-3`}
                  >
                    {renderDividerSegment('l')}
                    {hasTitle && (
                      <span
                        style={{ color: mutedEffective }}
                        className="text-[11px] font-bold uppercase tracking-[0.14em] shrink-0"
                      >
                        {block.title}
                      </span>
                    )}
                    {hasTitle && renderDividerSegment('r')}
                  </div>
                );
              }

              // Preview & Looping Video Block
              if (block.type === 'video') {
                const isLoop = Boolean(block.videoLoop);
                const parsed = parseVideoUrl(block.videoUrl || '', isLoop);
                const aspect =
                  block.videoAspect === '9:16' ||
                  (!block.videoAspect && parsed.isVertical)
                    ? '9:16'
                    : '16:9';
                const aspectClass =
                  aspect === '9:16'
                    ? 'aspect-[9/16] max-w-[260px] mx-auto w-full'
                    : 'aspect-video w-full';
                const poster = block.imageUrl || parsed.thumbnailUrl || '';
                const isPlayingInline = Boolean(activeVideoIds[block.id]);
                const isMutedLoop = mutedLoopVideos[block.id] ?? true;
                const externalHref = normalizeUrl(
                  block.url || block.videoUrl || ''
                );

                return (
                  <div
                    key={block.id}
                    style={getCardStyle(theme, false)}
                    className={`overflow-hidden ${getShapeClass(theme.buttonShape, true)}`}
                  >
                    <div
                      className={`relative bg-black overflow-hidden ${aspectClass}`}
                    >
                      {isLoop ? (
                        parsed.provider === 'direct' && parsed.directUrl ? (
                          <>
                            <video
                              src={parsed.directUrl}
                              poster={poster || undefined}
                              autoPlay
                              loop
                              muted={isMutedLoop}
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 text-[10px] font-semibold text-white inline-flex items-center gap-1">
                              <Repeat className="w-3 h-3" aria-hidden="true" />
                              <span>Loop</span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setMutedLoopVideos((prev) => ({
                                  ...prev,
                                  [block.id]: !isMutedLoop,
                                }))
                              }
                              aria-label={
                                isMutedLoop
                                  ? `Attiva audio per ${block.title}`
                                  : `Disattiva audio per ${block.title}`
                              }
                              className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-sm border border-white/20 text-white inline-flex items-center justify-center cursor-pointer"
                            >
                              {isMutedLoop ? (
                                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </button>
                          </>
                        ) : parsed.embedUrl ? (
                          <iframe
                            src={parsed.embedUrl}
                            title={block.title || 'Video in loop'}
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        ) : (
                          <div className="w-full h-full relative flex items-center justify-center bg-zinc-900">
                            {poster && (
                              <img
                                src={poster}
                                alt={block.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover opacity-80"
                              />
                            )}
                            <span className="absolute px-3 py-1.5 rounded-full bg-black/65 text-white text-xs font-medium inline-flex items-center gap-1.5">
                              <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Inserisci URL video .mp4, YouTube o Vimeo</span>
                            </span>
                          </div>
                        )
                      ) : isPlayingInline &&
                        (parsed.directUrl || parsed.embedUrl) ? (
                        <>
                          {parsed.provider === 'direct' && parsed.directUrl ? (
                            <video
                              src={parsed.directUrl}
                              poster={poster || undefined}
                              controls
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <iframe
                              src={parsed.embedUrl || undefined}
                              title={block.title || 'Anteprima video'}
                              allow="autoplay; encrypted-media; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full border-0"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveVideoIds((prev) => ({
                                ...prev,
                                [block.id]: false,
                              }))
                            }
                            aria-label={`Chiudi anteprima ${block.title}`}
                            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/65 hover:bg-black/85 text-white border border-white/20 inline-flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <>
                          {poster ? (
                            <img
                              src={poster}
                              alt={block.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              style={{
                                background: `linear-gradient(135deg, ${theme.accentColor}38, #18181B)`,
                              }}
                              className="w-full h-full flex items-center justify-center"
                            >
                              <Film
                                className="w-10 h-10 text-white/45"
                                aria-hidden="true"
                              />
                            </div>
                          )}
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/20"
                          />
                          {block.mediaDuration && (
                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-mono font-medium text-white tabular-nums">
                              {block.mediaDuration}
                            </span>
                          )}
                          {parsed.directUrl || parsed.embedUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveVideoIds((prev) => ({
                                  ...prev,
                                  [block.id]: true,
                                }));
                                handleLinkPress(block);
                              }}
                              aria-label={`Riproduci anteprima ${block.title}`}
                              style={{
                                backgroundColor: theme.accentColor,
                                color: theme.accentTextColor,
                              }}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full shadow-lg inline-flex items-center justify-center transition-transform duration-150 hover:scale-110 cursor-pointer"
                            >
                              <Play className="w-5 h-5 ml-0.5" aria-hidden="true" />
                            </button>
                          ) : externalHref ? (
                            <a
                              href={externalHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleLinkPress(block)}
                              aria-label={`Apri video ${block.title}`}
                              style={{
                                backgroundColor: theme.accentColor,
                                color: theme.accentTextColor,
                              }}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full shadow-lg inline-flex items-center justify-center transition-transform duration-150 hover:scale-110"
                            >
                              <Play className="w-5 h-5 ml-0.5" aria-hidden="true" />
                            </a>
                          ) : null}
                        </>
                      )}
                    </div>

                    {(block.title || block.subtitle || externalHref) && (
                      <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0 text-left">
                          {block.title && (
                            <div className="text-sm font-semibold truncate">
                              {block.title}
                            </div>
                          )}
                          {block.subtitle && (
                            <div className="text-xs opacity-75 truncate mt-0.5">
                              {block.subtitle}
                            </div>
                          )}
                        </div>
                        {externalHref && (
                          <a
                            href={externalHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleLinkPress(block)}
                            aria-label={`Apri collegamento ${block.title}`}
                            className="p-1.5 opacity-65 hover:opacity-100 shrink-0"
                          >
                            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // Link.me Full-Width Visual Banner Card
              if (block.type === 'featured') {
                const href = normalizeUrl(block.url || '');
                return (
                  <a
                    key={block.id}
                    href={href || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkPress(block)}
                    style={{ borderColor: theme.borderColor }}
                    className={`group relative block h-44 sm:h-48 overflow-hidden border ${getShapeClass(theme.buttonShape, true)}`}
                  >
                    {block.imageUrl ? (
                      <img
                        src={block.imageUrl}
                        alt={block.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div
                        style={{ backgroundColor: theme.surfaceColor }}
                        className="w-full h-full"
                      />
                    )}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/45 backdrop-blur-sm border border-white/20 text-white inline-flex items-center justify-center"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                      <div className="text-sm sm:text-[15px] font-bold text-white leading-snug">
                        {block.title}
                      </div>
                      {block.subtitle && (
                        <p className="text-xs text-white/80 mt-0.5 line-clamp-1">
                          {block.subtitle}
                        </p>
                      )}
                    </div>
                  </a>
                );
              }

              // Link.me 2-Column Visual Photo Grid Cards
              if (block.type === 'photo_grid' && block.photoGridItems) {
                return (
                  <div key={block.id} className="grid grid-cols-2 gap-2.5">
                    {block.photoGridItems.map((tile) => {
                      const href = normalizeUrl(tile.url);
                      return (
                        <a
                          key={tile.id}
                          href={href || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleLinkPress(block, tile.id)}
                          style={{ borderColor: theme.borderColor }}
                          className={`group relative block aspect-[4/3] overflow-hidden border ${getShapeClass(theme.buttonShape, true)}`}
                        >
                          {tile.imageUrl ? (
                            <img
                              src={tile.imageUrl}
                              alt={tile.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div
                              style={{ backgroundColor: theme.surfaceColor }}
                              className="w-full h-full"
                            />
                          )}
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/45 backdrop-blur-sm border border-white/20 text-white inline-flex items-center justify-center"
                          >
                            <Link2 className="w-3 h-3" />
                          </span>
                          <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                            <div className="text-xs sm:text-[13px] font-bold text-white leading-snug line-clamp-2">
                              {tile.title}
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                );
              }

              // Link.me 3-Column Social / Explore Grid
              if (block.type === 'social_grid' && block.socialGridItems) {
                return (
                  <div key={block.id} className="grid grid-cols-3 gap-1.5">
                    {block.socialGridItems.map((tile) => {
                      const href = normalizeUrl(tile.url);
                      return (
                        <a
                          key={tile.id}
                          href={href || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleLinkPress(block, tile.id)}
                          aria-label={tile.caption}
                          className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-black/20"
                        >
                          {tile.imageUrl && (
                            <img
                              src={tile.imageUrl}
                              alt={tile.caption}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          )}
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          {tile.mediaKind !== 'image' && (
                            <span
                              aria-hidden="true"
                              className="absolute top-2 right-2 text-white/95 drop-shadow"
                            >
                              {tile.mediaKind === 'video' ? (
                                <Film className="w-3.5 h-3.5" />
                              ) : (
                                <Layers className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                          <div className="absolute inset-x-1.5 bottom-1.5 text-[10px] font-medium text-white/95 line-clamp-2 leading-tight">
                            {tile.caption}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                );
              }

              // Quick Icon Grid (2x2)
              if (block.type === 'grid' && block.gridItems) {
                return (
                  <div key={block.id} className="space-y-2">
                    {block.title && (
                      <div
                        style={{ color: mutedEffective }}
                        className="text-xs font-medium px-1"
                      >
                        {block.title}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2.5">
                      {block.gridItems.map((tile) => {
                        const href = normalizeUrl(tile.url);
                        return (
                          <a
                            key={tile.id}
                            href={href || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleLinkPress(block, tile.id)}
                            style={getCardStyle(theme, false)}
                            className={`p-3.5 flex flex-col justify-between gap-2.5 transition-transform duration-150 hover:-translate-y-0.5 ${getShapeClass(theme.buttonShape, true)}`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                style={{
                                  backgroundColor: `${theme.accentColor}20`,
                                  color: theme.accentColor,
                                }}
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center"
                              >
                                <BlockIcon name={tile.iconName} className="w-4 h-4" />
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate">
                                {tile.title}
                              </div>
                              {tile.subtitle && (
                                <div className="text-[11px] opacity-70 truncate mt-0.5">
                                  {tile.subtitle}
                                </div>
                              )}
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Media Player Block
              if (block.type === 'media') {
                const isPlaying = playingBlockId === block.id;
                const progress = mediaProgress[block.id] ?? 24;
                const href = normalizeUrl(block.url || '');
                return (
                  <div
                    key={block.id}
                    style={getCardStyle(theme, false)}
                    className={`p-3.5 ${getShapeClass(theme.buttonShape, true)}`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPlayingBlockId(isPlaying ? null : block.id);
                          if (!isPlaying) handleLinkPress(block);
                        }}
                        aria-label={
                          isPlaying
                            ? `Metti in pausa ${block.title}`
                            : `Riproduci ${block.title}`
                        }
                        style={{
                          backgroundColor: theme.accentColor,
                          color: theme.accentTextColor,
                        }}
                        className="w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0 cursor-pointer transition-transform duration-150 hover:scale-105"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" aria-hidden="true" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold truncate">
                            {block.title}
                          </span>
                          <span className="text-[11px] opacity-65 font-mono tabular-nums shrink-0">
                            {block.mediaDuration || '03:45'}
                          </span>
                        </div>
                        {block.subtitle && (
                          <p className="text-xs opacity-75 truncate mt-0.5">
                            {block.subtitle}
                          </p>
                        )}
                        <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden bg-black/15">
                          <div
                            style={{
                              width: `${progress}%`,
                              backgroundColor: theme.accentColor,
                            }}
                            className="h-full transition-all duration-300"
                          />
                        </div>
                      </div>
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Apri ${block.title} su piattaforma esterna`}
                          className="p-1.5 opacity-60 hover:opacity-100 shrink-0"
                        >
                          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              }

              // Link.me Inline Email Subscribe / Contact Block
              if (block.type === 'contact') {
                const fState = contactForms[block.id] || {
                  name: '',
                  email: '',
                  note: '',
                  sent: false,
                  error: '',
                };

                return (
                  <div
                    key={block.id}
                    style={getCardStyle(theme, false)}
                    className={`p-4 ${getShapeClass(theme.buttonShape, true)}`}
                  >
                    <div className="font-semibold text-sm text-center">
                      {block.title}
                    </div>
                    {block.subtitle && (
                      <p className="text-xs opacity-75 mt-1 text-center">
                        {block.subtitle}
                      </p>
                    )}
                    {fState.sent ? (
                      <div
                        style={{
                          backgroundColor: `${theme.accentColor}22`,
                          color: theme.textColor,
                        }}
                        className="mt-3 p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-medium"
                      >
                        <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Iscrizione inviata a {profile.displayName}.</span>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => handleContactSubmit(e, block.id)}
                        className="mt-3 space-y-2"
                      >
                        <div className="flex gap-2">
                          <input
                            type="email"
                            aria-label="La tua email"
                            placeholder={block.contactPlaceholder || 'tua@email.it'}
                            value={fState.email}
                            onChange={(e) =>
                              setContactForms((prev) => ({
                                ...prev,
                                [block.id]: {
                                  ...fState,
                                  email: e.target.value,
                                  error: '',
                                },
                              }))
                            }
                            style={{
                              borderColor: theme.borderColor,
                              color: theme.textColor,
                            }}
                            className="flex-1 min-w-0 px-3 py-2 text-xs rounded-xl border bg-transparent focus:outline-none"
                          />
                          <button
                            type="submit"
                            style={{
                              backgroundColor: theme.accentColor,
                              color: theme.accentTextColor,
                            }}
                            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${getShapeClass(theme.buttonShape)}`}
                          >
                            {block.contactButtonText || 'Iscriviti'}
                          </button>
                        </div>
                        <input
                          type="text"
                          aria-label="Il tuo nome o nota"
                          placeholder="Nome o messaggio breve (opzionale)"
                          value={fState.note}
                          onChange={(e) =>
                            setContactForms((prev) => ({
                              ...prev,
                              [block.id]: { ...fState, note: e.target.value },
                            }))
                          }
                          style={{
                            borderColor: theme.borderColor,
                            color: theme.textColor,
                          }}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border bg-transparent focus:outline-none opacity-85"
                        />
                        {fState.error && (
                          <p className="text-xs text-red-500 font-medium">
                            {fState.error}
                          </p>
                        )}
                      </form>
                    )}
                  </div>
                );
              }

              // Linkme.bio WhatsApp Direct Chat Block (prefilled message)
              if (block.type === 'whatsapp') {
                const waUrl =
                  buildWhatsappUrl(
                    block.whatsappPhone || '',
                    block.whatsappMessage
                  ) || normalizeUrl(block.url || '');
                return (
                  <a
                    key={block.id}
                    href={waUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkPress(block)}
                    style={getCardStyle(theme, false)}
                    className={`group flex items-center justify-between gap-3 px-3.5 py-3 transition-transform duration-150 hover:-translate-y-0.5 ${getShapeClass(theme.buttonShape)}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-[#25D366] text-white inline-flex items-center justify-center shrink-0 shadow-xs">
                        <MessageCircle className="w-[18px] h-[18px]" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">
                            {block.title}
                          </span>
                          <span className="text-[11px] font-medium text-[#25D366] whitespace-nowrap shrink-0">
                            WhatsApp
                          </span>
                        </div>
                        <div className="text-xs opacity-75 truncate mt-0.5">
                          {block.whatsappMessage
                            ? `“${block.whatsappMessage}”`
                            : block.subtitle || 'Chat diretta immediata'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 shrink-0 opacity-60 transition-transform duration-150 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </a>
                );
              }

              // Linkme.bio Store Product Card
              if (block.type === 'product') {
                const href = normalizeUrl(block.url || '');
                return (
                  <a
                    key={block.id}
                    href={href || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkPress(block)}
                    style={getCardStyle(theme, false)}
                    className={`group flex items-center gap-3.5 p-3 transition-transform duration-150 hover:-translate-y-0.5 ${getShapeClass(theme.buttonShape, true)}`}
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/10 shrink-0 flex items-center justify-center">
                      {block.imageUrl ? (
                        <img
                          src={block.imageUrl}
                          alt={block.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 opacity-60" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-sm font-semibold truncate">
                        {block.title}
                      </div>
                      {block.subtitle && (
                        <div className="text-xs opacity-75 truncate mt-0.5">
                          {block.subtitle}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-sm font-bold tabular-nums">
                          {block.productPrice || 'Scopri'}
                        </span>
                        <span
                          style={{
                            backgroundColor: theme.accentColor,
                            color: theme.accentTextColor,
                          }}
                          className="px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0"
                        >
                          Acquista
                        </span>
                      </div>
                    </div>
                  </a>
                );
              }

              // Default: Linkme.bio Action Link Row
              const href = normalizeUrl(block.url || '');
              const isHighlighted = Boolean(block.highlight);
              return (
                <a
                  key={block.id}
                  href={href || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLinkPress(block)}
                  style={getCardStyle(theme, isHighlighted)}
                  className={`group flex items-center justify-between gap-3 px-3.5 py-3 transition-transform duration-150 hover:-translate-y-0.5 ${getShapeClass(theme.buttonShape)}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      style={{
                        backgroundColor: isHighlighted
                          ? 'rgba(255,255,255,0.2)'
                          : `${theme.textColor}14`,
                        color: isHighlighted ? theme.accentTextColor : theme.textColor,
                      }}
                      className="w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0"
                    >
                      <BlockIcon name={block.iconName} className="w-[18px] h-[18px]" />
                    </span>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">
                          {block.title}
                        </span>
                        {block.badgeText && (
                          <span className="text-[11px] opacity-75 whitespace-nowrap shrink-0">
                            · {block.badgeText}
                          </span>
                        )}
                      </div>
                      {block.subtitle && (
                        <div className="text-xs opacity-75 truncate mt-0.5">
                          {block.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 shrink-0 opacity-60 transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </a>
              );
            })
          )}
        </main>

        {theme.socialPosition === 'bottom' && visibleSocials.length > 0 && (
          <div className="mt-7 w-full">{renderSocialRow()}</div>
        )}

        <footer
          style={{ color: mutedEffective }}
          className="mt-8 pt-4 border-t border-white/10 text-center text-[11px] flex flex-col items-center gap-3"
        >
          {isPublicStandalone && onOpenLanding && (
            <button
              type="button"
              onClick={onOpenLanding}
              className="px-4 py-1.5 rounded-full bg-white text-zinc-950 font-semibold text-xs shadow-sm hover:bg-zinc-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              Crea la tua bio gratis su luancer link
            </button>
          )}
          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold">luancer link</span>
            <span aria-hidden="true">·</span>
            <span>@{profile.handle}</span>
          </div>
        </footer>
      </div>
    </div>
  );

  // On Standalone Public Page or Desktop Frame: render Link.me's signature blurred ambient backdrop + centered card!
  if (isPublicStandalone || isDesktopFrame) {
    return (
      <div className="relative flex-1 w-full min-h-full flex justify-center sm:py-8 sm:px-4 overflow-hidden bg-zinc-950">
        {heroPhotoUrl ? (
          <div
            aria-hidden="true"
            style={{
              backgroundImage: `url("${heroPhotoUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(48px) saturate(1.2)',
              transform: 'scale(1.18)',
            }}
            className="absolute inset-0 opacity-65 pointer-events-none"
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              background: `radial-gradient(circle at 50% 20%, ${theme.accentColor}38, #09090B 75%)`,
            }}
            className="absolute inset-0 pointer-events-none"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/55 pointer-events-none"
        />

        <div className="relative z-10 w-full max-w-[500px] sm:rounded-[28px] overflow-hidden shadow-2xl sm:border sm:border-white/10">
          {cardInner}
        </div>
      </div>
    );
  }

  return cardInner;
}
