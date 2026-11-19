import React from 'react';
import {
  Link2,
  Globe,
  Briefcase,
  BookOpen,
  Camera,
  Music,
  ShoppingBag,
  Calendar,
  FileText,
  Code2,
  Coffee,
  Mic,
  Compass,
  Layers,
  Heart,
  Send,
  Zap,
  Star,
  Mail,
} from 'lucide-react';
import type { BlockIconName, SocialPlatformId } from '../types/profile';

export function BlockIcon({
  name = 'link',
  className = 'w-4 h-4',
}: {
  name?: BlockIconName;
  className?: string;
}) {
  switch (name) {
    case 'globe':
      return <Globe className={className} aria-hidden="true" />;
    case 'briefcase':
      return <Briefcase className={className} aria-hidden="true" />;
    case 'book':
      return <BookOpen className={className} aria-hidden="true" />;
    case 'camera':
      return <Camera className={className} aria-hidden="true" />;
    case 'music':
      return <Music className={className} aria-hidden="true" />;
    case 'bag':
      return <ShoppingBag className={className} aria-hidden="true" />;
    case 'calendar':
      return <Calendar className={className} aria-hidden="true" />;
    case 'file':
      return <FileText className={className} aria-hidden="true" />;
    case 'code':
      return <Code2 className={className} aria-hidden="true" />;
    case 'coffee':
      return <Coffee className={className} aria-hidden="true" />;
    case 'mic':
      return <Mic className={className} aria-hidden="true" />;
    case 'compass':
      return <Compass className={className} aria-hidden="true" />;
    case 'layers':
      return <Layers className={className} aria-hidden="true" />;
    case 'heart':
      return <Heart className={className} aria-hidden="true" />;
    case 'send':
      return <Send className={className} aria-hidden="true" />;
    case 'zap':
      return <Zap className={className} aria-hidden="true" />;
    case 'star':
      return <Star className={className} aria-hidden="true" />;
    case 'link':
    default:
      return <Link2 className={className} aria-hidden="true" />;
  }
}

export function getSocialBrandColor(platform: SocialPlatformId): string {
  switch (platform) {
    case 'instagram':
      return '#E1306C';
    case 'tiktok':
      return '#000000';
    case 'youtube':
      return '#FF0000';
    case 'x':
      return '#000000';
    case 'linkedin':
      return '#0A66C2';
    case 'github':
      return '#181717';
    case 'spotify':
      return '#1DB954';
    case 'twitch':
      return '#9146FF';
    case 'discord':
      return '#5865F2';
    case 'telegram':
      return '#26A5E4';
    case 'whatsapp':
      return '#25D366';
    case 'behance':
      return '#1769FF';
    case 'dribbble':
      return '#EA4C89';
    case 'pinterest':
      return '#E60023';
    case 'threads':
      return '#000000';
    case 'substack':
      return '#FF6719';
    case 'applemusic':
      return '#FA243C';
    case 'soundcloud':
      return '#FF5500';
    case 'email':
      return '#3F3F46';
    case 'website':
    default:
      return '#2563EB';
  }
}

export function SocialIcon({
  platform,
  className = 'w-4 h-4',
  fullColor = false,
}: {
  platform: SocialPlatformId;
  className?: string;
  fullColor?: boolean;
}) {
  const colorStyle = fullColor ? { color: getSocialBrandColor(platform) } : undefined;

  if (platform === 'instagram' && fullColor) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FD5949" />
            <stop offset="50%" stopColor="#D6249F" />
            <stop offset="100%" stopColor="#285AEB" />
          </linearGradient>
        </defs>
        <rect width="20" height="20" x="2" y="2" rx="5.5" stroke="url(#igGrad)" strokeWidth="2.2" />
        <circle cx="12" cy="12" r="4.2" stroke="url(#igGrad)" strokeWidth="2.2" />
        <circle cx="17.5" cy="6.5" r="1.3" fill="url(#igGrad)" />
      </svg>
    );
  }

  switch (platform) {
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={colorStyle} className={className} aria-hidden="true">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={colorStyle} className={className} aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={colorStyle} className={className} aria-hidden="true">
          <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2C0 8.09 0 12 0 12s0 3.91.5 5.8a3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14C24 15.91 24 12 24 12s0-3.91-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={colorStyle} className={className} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={colorStyle} className={className} aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={colorStyle} className={className} aria-hidden="true">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      );
    case 'spotify':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={colorStyle} className={className} aria-hidden="true">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      );
    case 'twitch':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={colorStyle} className={className} aria-hidden="true">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
        </svg>
      );
    case 'discord':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={colorStyle} className={className} aria-hidden="true">
          <path d="M18 6a14 14 0 0 0-3.5-1l-.5 1a12 12 0 0 0-4 0l-.5-1A14 14 0 0 0 6 6c-1.5 2.5-2 5.5-2 8.5 1.5 1.5 3.5 2.5 5 3l1-1.5m4 1.5 1 1.5c1.5-.5 3.5-1.5 5-3 0-3-.5-6-2-8.5z" />
          <circle cx="9.5" cy="12" r="1" fill="currentColor" />
          <circle cx="14.5" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={colorStyle} className={className} aria-hidden="true">
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={colorStyle} className={className} aria-hidden="true">
          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
        </svg>
      );
    case 'behance':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={colorStyle} className={className} aria-hidden="true">
          <path d="M3 7h5a3 3 0 0 1 0 6H3V7z" />
          <path d="M3 13h5.5a3 3 0 0 1 0 6H3v-6z" />
          <path d="M14 13h7a3.5 3.5 0 1 0-1 2.5" />
          <path d="M15 8h5" />
        </svg>
      );
    case 'dribbble':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={colorStyle} className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />
          <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />
          <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72" />
        </svg>
      );
    case 'pinterest':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={colorStyle} className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 20l4-9" />
          <path d="M10.7 14c.437 1.263 1.43 2 2.55 2 2.071 0 3.75-1.554 3.75-4a5 5 0 1 0-9.7 1.7" />
        </svg>
      );
    case 'threads':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={colorStyle} className={className} aria-hidden="true">
          <path d="M19 12a7 7 0 1 0-3.2 5.9" />
          <path d="M16 12a4 4 0 1 1-4-4c2.2 0 3.5 1.3 3.5 3.2 0 2.3-1.4 3.8-3.5 3.8" />
        </svg>
      );
    case 'substack':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={colorStyle} className={className} aria-hidden="true">
          <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
        </svg>
      );
    case 'applemusic':
    case 'soundcloud':
      return <Music style={colorStyle} className={className} aria-hidden="true" />;
    case 'email':
      return <Mail style={colorStyle} className={className} aria-hidden="true" />;
    case 'website':
    default:
      return <Globe style={colorStyle} className={className} aria-hidden="true" />;
  }
}
