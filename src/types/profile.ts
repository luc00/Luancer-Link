export type SocialPlatformId =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'x'
  | 'linkedin'
  | 'github'
  | 'spotify'
  | 'twitch'
  | 'discord'
  | 'telegram'
  | 'whatsapp'
  | 'behance'
  | 'dribbble'
  | 'pinterest'
  | 'threads'
  | 'substack'
  | 'applemusic'
  | 'soundcloud'
  | 'email'
  | 'website';

export interface SocialPlatformMeta {
  id: SocialPlatformId;
  name: string;
  placeholder: string;
  baseUrl: string;
  brandColor: string;
}

export type SocialIconShape = 'circle' | 'square' | 'rounded';

export type SocialDividerStyle = 'line' | 'dashed' | 'dotted' | 'gradient';

export interface SocialLinkItem {
  id: string;
  kind?: 'link' | 'divider';
  platform: SocialPlatformId;
  url: string;
  label: string;
  visible: boolean;
  followers?: number;
  iconImageUrl?: string;
  iconShape?: SocialIconShape;
  dividerStyle?: SocialDividerStyle;
  dividerColor?: string;
}

export type BlockType =
  | 'link'
  | 'whatsapp'
  | 'product'
  | 'featured'
  | 'video'
  | 'photo_grid'
  | 'social_grid'
  | 'grid'
  | 'media'
  | 'header'
  | 'divider'
  | 'contact';

export type BlockIconName =
  | 'link'
  | 'globe'
  | 'briefcase'
  | 'book'
  | 'camera'
  | 'music'
  | 'bag'
  | 'calendar'
  | 'file'
  | 'code'
  | 'coffee'
  | 'mic'
  | 'compass'
  | 'layers'
  | 'heart'
  | 'send'
  | 'zap'
  | 'star';

export interface QuickGridItem {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  iconName: BlockIconName;
  clicks: number;
}

export interface PhotoGridItem {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  imageUrl: string;
  clicks: number;
}

export interface SocialGridTile {
  id: string;
  caption: string;
  url: string;
  imageUrl: string;
  mediaKind: 'image' | 'video' | 'carousel';
  clicks: number;
}

export interface BioBlock {
  id: string;
  type: BlockType;
  visible: boolean;
  title: string;
  subtitle?: string;
  url?: string;
  iconName?: BlockIconName;
  badgeText?: string;
  imageUrl?: string;
  highlight?: boolean;
  clicks: number;
  gridItems?: QuickGridItem[];
  photoGridItems?: PhotoGridItem[];
  socialGridItems?: SocialGridTile[];
  mediaType?: 'audio' | 'video';
  mediaDuration?: string;
  videoUrl?: string;
  videoAspect?: '16:9' | '9:16';
  videoLoop?: boolean;
  dividerStyle?: 'line' | 'dashed' | 'dotted' | 'gradient' | 'space';
  dividerThickness?: 1 | 2 | 3 | 4;
  dividerWidth?: 'full' | 'medium' | 'short';
  dividerColor?: string;
  contactPlaceholder?: string;
  contactButtonText?: string;
  whatsappPhone?: string;
  whatsappMessage?: string;
  productPrice?: string;
  productBadge?: string;
}

export type ThemeBackgroundType = 'solid' | 'gradient' | 'pattern' | 'image';
export type ThemePatternType = 'none' | 'dots' | 'grid' | 'diagonal';
export type ButtonShape = 'sharp' | 'rounded' | 'pill';
export type CardVariant = 'filled' | 'outline' | 'elevated' | 'glass';
export type ProfileFont = 'jakarta' | 'playfair' | 'outfit' | 'jetbrains';
export type SpacingDensity = 'compact' | 'balanced' | 'airy';
export type SocialPosition = 'top' | 'bottom';
export type SocialStyle = 'brand' | 'minimal' | 'circle' | 'square';
export type HeroLayoutStyle = 'fullbleed' | 'avatar';

export interface ProfileTheme {
  presetId: string;
  heroStyle: HeroLayoutStyle;
  backgroundType: ThemeBackgroundType;
  backgroundColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  pattern: ThemePatternType;
  backgroundImageUrl: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  accentTextColor: string;
  borderColor: string;
  buttonShape: ButtonShape;
  cardVariant: CardVariant;
  font: ProfileFont;
  spacing: SpacingDensity;
  socialPosition: SocialPosition;
  socialStyle: SocialStyle;
  socialSectionTitle?: string;
  showSocialLabels?: boolean;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: ProfileTheme;
}

export interface ContactSubmission {
  id: string;
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: string;
}

export interface BioProfile {
  id: string;
  handle: string;
  displayName: string;
  role: string;
  bio: string;
  location: string;
  category: string;
  verified: boolean;
  showFollowersCount: boolean;
  availabilityText: string;
  avatarUrl: string;
  bannerUrl: string;
  views: number;
  createdAt?: string;
  updatedAt: string;
  ownerUid?: string | null;
  socials: SocialLinkItem[];
  blocks: BioBlock[];
  theme: ProfileTheme;
  messages: ContactSubmission[];
}

export type StudioTab = 'profile' | 'socials' | 'blocks' | 'theme';
export type AppWorkspace = 'landing' | 'studio' | 'directory' | 'public';
export type PreviewDevice = 'mobile' | 'desktop';
