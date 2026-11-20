import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Check,
  ExternalLink,
  Eye,
  Layers,
  Lock,
  Monitor,
  MousePointerClick,
  Palette,
  PenLine,
  Plus,
  QrCode,
  Save,
  Share2,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import type {
  AppWorkspace,
  BioProfile,
  PreviewDevice,
  StudioTab,
} from './types/profile';
import { SEED_PROFILES, THEME_PRESETS } from './data/presets';
import {
  calculateProfileStats,
  formatFirestoreSaveError,
  getChangedEditableFieldKeys,
  getEditableProfileFingerprint,
  normalizeHandle,
} from './utils/profileLogic';
import { auth, signInWithGoogle, signOutGoogle } from './firebase';
import {
  claimProfileOwnershipInFirestore,
  createProfileInFirestore,
  deleteProfileInFirestore,
  fetchProfileMessages,
  incrementClickInFirestore,
  incrementViewInFirestore,
  saveProfileToFirestore,
  seedInitialProfilesIfEmpty,
  submitMessageToFirestore,
  subscribeToProfileByHandle,
  subscribeToPublicProfiles,
} from './services/profileRepository';
import { ProfileRenderer } from './components/ProfileRenderer';
import { EditorProfileTab } from './components/EditorProfileTab';
import { EditorSocialsTab } from './components/EditorSocialsTab';
import { EditorBlocksTab } from './components/EditorBlocksTab';
import { EditorThemeTab } from './components/EditorThemeTab';
import { DirectoryView } from './components/DirectoryView';
import { ShareQrModal } from './components/ShareQrModal';
import { CreateProfileModal } from './components/CreateProfileModal';
import { LinkmeLandingView } from './components/LinkmeLandingView';
import { LuancerLogo } from './components/LuancerLogo';

const STORAGE_KEY = 'linkme_profiles_cache_v3';
const PUBLIC_PROFILE_CACHE_PREFIX = 'linkme_public_profile_v1_';
const LAST_STUDIO_HANDLE_KEY = 'linkme_last_studio_handle_v1';
const DIRTY_STORAGE_KEY = 'linkme_dirty_profile_ids_v1';

function readCachedPublicProfile(handle: string | null): BioProfile | null {
  if (!handle) return null;
  try {
    const raw = localStorage.getItem(`${PUBLIC_PROFILE_CACHE_PREFIX}${handle}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BioProfile;
    if (parsed && typeof parsed.handle === 'string') {
      return migrateProfileSchema(parsed);
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function writeCachedPublicProfile(profile: BioProfile) {
  try {
    localStorage.setItem(
      `${PUBLIC_PROFILE_CACHE_PREFIX}${profile.handle}`,
      JSON.stringify(profile)
    );
  } catch {
    // ignore storage quota
  }
}

function readLastStudioHandle(): string | null {
  try {
    const raw = localStorage.getItem(LAST_STUDIO_HANDLE_KEY);
    return raw ? normalizeHandle(raw) || null : null;
  } catch {
    return null;
  }
}

function writeLastStudioHandle(handle: string) {
  try {
    if (handle) {
      localStorage.setItem(LAST_STUDIO_HANDLE_KEY, handle);
    }
  } catch {
    // ignore storage errors
  }
}

function readStoredDirtyIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DIRTY_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function writeStoredDirtyIds(ids: Set<string>) {
  try {
    if (ids.size === 0) {
      localStorage.removeItem(DIRTY_STORAGE_KEY);
    } else {
      localStorage.setItem(DIRTY_STORAGE_KEY, JSON.stringify([...ids]));
    }
  } catch {
    // ignore storage quota
  }
}

function migrateProfileSchema(p: BioProfile): BioProfile {
  return {
    ...p,
    showFollowersCount: p.showFollowersCount ?? true,
    ownerUid: p.ownerUid ?? null,
    theme: {
      ...p.theme,
      heroStyle: p.theme?.heroStyle || 'fullbleed',
      socialStyle: p.theme?.socialStyle || 'brand',
    },
  };
}

function readInitialQueryParams(): {
  publicHandle: string | null;
  viewMode: AppWorkspace;
} {
  if (typeof window === 'undefined') {
    return { publicHandle: null, viewMode: 'landing' };
  }
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('u');
  const handle = raw ? normalizeHandle(raw) : null;
  const view = params.get('view');
  if (view === 'studio') return { publicHandle: handle, viewMode: 'studio' };
  if (view === 'directory') return { publicHandle: handle, viewMode: 'directory' };
  if (handle) {
    return { publicHandle: handle, viewMode: 'public' };
  }
  return { publicHandle: null, viewMode: 'landing' };
}

function readInitialProfiles(initialHandle: string | null): BioProfile[] {
  let list: BioProfile[] = SEED_PROFILES;
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as BioProfile[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed.map(migrateProfileSchema);
      }
    }
  } catch {
    // ignore cache errors
  }

  const cachedTarget = readCachedPublicProfile(initialHandle);
  if (cachedTarget) {
    const exists = list.some((p) => p.handle === cachedTarget.handle);
    list = exists
      ? list.map((p) => (p.handle === cachedTarget.handle ? cachedTarget : p))
      : [cachedTarget, ...list];
  }
  return list;
}

export default function App() {
  const [{ publicHandle: initialPublicHandle, viewMode: initialViewMode }] =
    useState(readInitialQueryParams);

  const [profiles, setProfiles] = useState<BioProfile[]>(() =>
    readInitialProfiles(initialPublicHandle || (initialViewMode === 'studio' ? readLastStudioHandle() : null))
  );

  const [activeHandle, setActiveHandle] = useState<string>(() => {
    if (initialPublicHandle) return initialPublicHandle;
    if (initialViewMode === 'studio') {
      return readLastStudioHandle() || SEED_PROFILES[0].handle;
    }
    return SEED_PROFILES[0].handle;
  });
  const [workspace, setWorkspace] = useState<AppWorkspace>(initialViewMode);
  const [studioTab, setStudioTab] = useState<StudioTab>('profile');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('mobile');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty' | 'local' | 'error'>('saved');
  const [saveError, setSaveError] = useState('');
  const [isLoadingServer, setIsLoadingServer] = useState(true);
  const [publicNotFound, setPublicNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const saveTimerRef = useRef<number | null>(null);
  const lastSavedHandleRef = useRef<string>(activeHandle);
  const isEditingRef = useRef<boolean>(false);
  const dirtyProfileIdsRef = useRef<Set<string>>(readStoredDirtyIds());
  const lastSavedFingerprintRef = useRef<Map<string, string>>(new Map());
  const lastSyncedProfileRef = useRef<Map<string, BioProfile>>(new Map());
  const savingInFlightRef = useRef<boolean>(false);
  const queuedSaveRef = useRef<{ profile: BioProfile; handleOverride?: string } | null>(null);
  const cloudQuotaPausedRef = useRef<boolean>(false);
  const lastIncrementedViewHandleRef = useRef<string>('');

  const matchedActiveProfile =
    profiles.find((p) => p.handle === activeHandle) ?? null;
  const activeProfile =
    workspace === 'public'
      ? matchedActiveProfile
      : matchedActiveProfile || profiles[0];

  // Track Firebase Auth user state cleanly
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  // Cleanup pending autosave timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Live Firestore hydration: direct 1-doc fetch for public view, full collection for Studio/Directory/Landing
  useEffect(() => {
    let active = true;

    if (workspace === 'public') {
      setPublicNotFound(false);
      setIsLoadingServer(true);

      const unsubSingle = subscribeToProfileByHandle(
        activeHandle,
        (cloudProfile) => {
          if (!active) return;
          const normalized = migrateProfileSchema(cloudProfile);
          if (!dirtyProfileIdsRef.current.has(normalized.id)) {
            lastSavedFingerprintRef.current.set(
              normalized.id,
              getEditableProfileFingerprint(normalized)
            );
            lastSyncedProfileRef.current.set(normalized.id, normalized);
            writeCachedPublicProfile(normalized);
          }
          setProfiles((prev) => {
            if (dirtyProfileIdsRef.current.has(normalized.id)) {
              const existingLocal = prev.find((p) => p.id === normalized.id);
              if (existingLocal) {
                writeCachedPublicProfile(existingLocal);
                return prev;
              }
            }
            const exists = prev.some(
              (p) => p.id === normalized.id || p.handle === normalized.handle
            );
            return exists
              ? prev.map((p) =>
                  p.id === normalized.id || p.handle === normalized.handle
                    ? normalized
                    : p
                )
              : [normalized, ...prev];
          });
          setPublicNotFound(false);
          setIsLoadingServer(false);
        },
        () => {
          if (!active) return;
          setPublicNotFound(true);
          setIsLoadingServer(false);
        },
        () => {
          if (active) setIsLoadingServer(false);
        }
      );

      return () => {
        active = false;
        unsubSingle();
      };
    }

    setIsLoadingServer(true);
    seedInitialProfilesIfEmpty().catch((err) => {
      console.error('Seed check error:', err);
    });

    const unsubSnapshots = subscribeToPublicProfiles(
      (cloudProfiles) => {
        if (!active) return;
        if (cloudProfiles.length > 0) {
          setProfiles((prev) => {
            const normalized = cloudProfiles.map(migrateProfileSchema);
            for (const cp of normalized) {
              if (!dirtyProfileIdsRef.current.has(cp.id)) {
                lastSavedFingerprintRef.current.set(
                  cp.id,
                  getEditableProfileFingerprint(cp)
                );
                lastSyncedProfileRef.current.set(cp.id, cp);
              }
            }
            const dirtyIds = dirtyProfileIdsRef.current;
            if (isEditingRef.current || dirtyIds.size > 0) {
              const merged = normalized.map((cloudItem) => {
                if (
                  dirtyIds.has(cloudItem.id) ||
                  (isEditingRef.current && cloudItem.handle === lastSavedHandleRef.current)
                ) {
                  const localMatch = prev.find((p) => p.id === cloudItem.id);
                  return localMatch || cloudItem;
                }
                return cloudItem;
              });
              for (const localItem of prev) {
                if (
                  (dirtyIds.has(localItem.id) ||
                    (isEditingRef.current && localItem.handle === lastSavedHandleRef.current)) &&
                  !merged.some((m) => m.id === localItem.id)
                ) {
                  merged.unshift(localItem);
                }
              }
              return merged;
            }
            return normalized;
          });
        }
        setIsLoadingServer(false);
      },
      () => {
        if (active) setIsLoadingServer(false);
      }
    );

    return () => {
      active = false;
      unsubSnapshots();
    };
  }, [workspace, activeHandle]);

  // Load owner-only messages subcollection when signed-in owner views Studio
  useEffect(() => {
    if (
      workspace !== 'studio' ||
      !activeProfile ||
      !currentUser ||
      !currentUser.emailVerified
    ) {
      return;
    }
    const isOwnerOrAdmin =
      activeProfile.ownerUid === currentUser.uid ||
      currentUser.email === 'lucquixada@gmail.com';
    if (!isOwnerOrAdmin) return;

    let cancelled = false;
    fetchProfileMessages(activeProfile.handle)
      .then((msgs) => {
        if (cancelled) return;
        setProfiles((prev) =>
          prev.map((p) => (p.id === activeProfile.id ? { ...p, messages: msgs } : p))
        );
      })
      .catch(() => {
        // ignored if unauthorized
      });
    return () => {
      cancelled = true;
    };
  }, [workspace, activeProfile?.handle, activeProfile?.ownerUid, currentUser]);

  // Keep localStorage synced (and single-handle public cache synced)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // ignore storage quota
    }
    if (activeHandle) {
      const current = profiles.find((p) => p.handle === activeHandle);
      if (current) {
        writeCachedPublicProfile(current);
      }
    }
  }, [profiles, activeHandle]);

  // Listen to browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      const { publicHandle, viewMode } = readInitialQueryParams();
      setPublicNotFound(false);
      if (publicHandle) {
        setActiveHandle(publicHandle);
        lastSavedHandleRef.current = publicHandle;
      }
      setWorkspace(viewMode);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Increment public view counter in Firestore when entering standalone public page
  useEffect(() => {
    if (workspace !== 'public' || !activeProfile || isLoadingServer) return;
    if (activeProfile.handle !== activeHandle) {
      return;
    }
    if (lastIncrementedViewHandleRef.current === activeProfile.handle) return;
    lastIncrementedViewHandleRef.current = activeProfile.handle;

    incrementViewInFirestore(activeProfile.handle).catch(() => {});
  }, [workspace, activeProfile?.handle, activeHandle, isLoadingServer]);

  const persistProfileToServer = useCallback(
    async (
      profileToSave: BioProfile,
      targetHandleOverride?: string,
      isManualTrigger = false
    ) => {
      if (isManualTrigger) {
        cloudQuotaPausedRef.current = false;
      }

      const previousHandle =
        targetHandleOverride || lastSavedHandleRef.current || profileToSave.handle;
      const fingerprint = getEditableProfileFingerprint(profileToSave);

      if (
        !isManualTrigger &&
        previousHandle === profileToSave.handle &&
        lastSavedFingerprintRef.current.get(profileToSave.id) === fingerprint &&
        !dirtyProfileIdsRef.current.has(profileToSave.id)
      ) {
        isEditingRef.current = false;
        setSaveState('saved');
        return true;
      }

      if (savingInFlightRef.current) {
        queuedSaveRef.current = {
          profile: profileToSave,
          handleOverride: previousHandle,
        };
        return false;
      }

      const changedKeys =
        previousHandle === profileToSave.handle
          ? getChangedEditableFieldKeys(
              lastSyncedProfileRef.current.get(profileToSave.id),
              profileToSave
            )
          : undefined;

      savingInFlightRef.current = true;
      setSaveState('saving');
      setSaveError('');
      try {
        const saved = await saveProfileToFirestore(
          profileToSave,
          previousHandle,
          currentUser?.emailVerified ? currentUser.uid : null,
          changedKeys
        );
        lastSavedFingerprintRef.current.set(
          profileToSave.id,
          getEditableProfileFingerprint(profileToSave)
        );
        lastSyncedProfileRef.current.set(profileToSave.id, profileToSave);
        dirtyProfileIdsRef.current.delete(profileToSave.id);
        writeStoredDirtyIds(dirtyProfileIdsRef.current);
        cloudQuotaPausedRef.current = false;
        isEditingRef.current = false;
        lastSavedHandleRef.current = saved.handle;
        setActiveHandle(saved.handle);
        setSaveState('saved');
        return true;
      } catch (err) {
        isEditingRef.current = false;
        const parsed = formatFirestoreSaveError(err);
        if (parsed.isQuotaExceeded || (err instanceof Error && err.message === 'CLOUD_SAVE_TIMEOUT')) {
          cloudQuotaPausedRef.current = true;
          setSaveState('local');
        } else {
          setSaveState('error');
        }
        setSaveError(parsed.message);
        return false;
      } finally {
        savingInFlightRef.current = false;
        const queued = queuedSaveRef.current;
        if (queued && !cloudQuotaPausedRef.current) {
          queuedSaveRef.current = null;
          void persistProfileToServer(queued.profile, queued.handleOverride, false);
        } else {
          queuedSaveRef.current = null;
        }
      }
    },
    [currentUser]
  );

  const updateActiveProfile = useCallback(
    (updater: (prev: BioProfile) => BioProfile) => {
      if (!activeProfile) return;
      isEditingRef.current = true;
      const updated = updater(activeProfile);
      dirtyProfileIdsRef.current.add(updated.id);
      writeStoredDirtyIds(dirtyProfileIdsRef.current);

      setProfiles((prev) =>
        prev.map((p) => (p.id === activeProfile.id ? updated : p))
      );
      setActiveHandle(updated.handle);

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      if (cloudQuotaPausedRef.current) {
        setSaveState('local');
        return;
      }

      setSaveState('dirty');
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        if (updated.handle.length >= 2 && updated.displayName.trim().length >= 2) {
          void persistProfileToServer(updated, undefined, false);
        }
      }, 450);
    },
    [activeProfile, persistProfileToServer]
  );

  const navigateToLanding = () => {
    setWorkspace('landing');
    const url = new URL(window.location.href);
    url.searchParams.delete('u');
    url.searchParams.delete('view');
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPublic = (handle: string) => {
    if (saveTimerRef.current && activeProfile && !cloudQuotaPausedRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      if (activeProfile.handle.length >= 2 && activeProfile.displayName.trim().length >= 2) {
        void persistProfileToServer(activeProfile, undefined, false);
      }
    }
    const clean = normalizeHandle(handle);
    const matched = profiles.find((p) => p.handle === clean);
    if (matched) {
      writeCachedPublicProfile(matched);
    }
    setPublicNotFound(false);
    setActiveHandle(clean);
    lastSavedHandleRef.current = clean;
    setWorkspace('public');
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.set('u', clean);
    window.history.pushState({}, '', url.toString());
  };

  const navigateToStudio = (handle?: string, tab?: StudioTab) => {
    const targetHandle = handle ? normalizeHandle(handle) : activeHandle;
    if (handle) {
      setActiveHandle(targetHandle);
      lastSavedHandleRef.current = targetHandle;
    }
    if (targetHandle) {
      writeLastStudioHandle(targetHandle);
    }
    if (tab) setStudioTab(tab);
    setWorkspace('studio');
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'studio');
    if (targetHandle) {
      url.searchParams.set('u', targetHandle);
    } else {
      url.searchParams.delete('u');
    }
    window.history.pushState({}, '', url.toString());
  };

  const navigateToDirectory = () => {
    setWorkspace('directory');
    const url = new URL(window.location.href);
    url.searchParams.delete('u');
    url.searchParams.set('view', 'directory');
    window.history.pushState({}, '', url.toString());
  };

  const handleCreateProfile = async (newProfile: BioProfile) => {
    const ownerUid = currentUser?.emailVerified ? currentUser.uid : null;
    const withOwner: BioProfile = { ...newProfile, ownerUid };
    setProfiles((prev) => [withOwner, ...prev]);
    setActiveHandle(withOwner.handle);
    lastSavedHandleRef.current = withOwner.handle;
    navigateToStudio(withOwner.handle, 'profile');
    setSaveState('saving');
    setSaveError('');
    try {
      await createProfileInFirestore(withOwner, ownerUid);
      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
      setSaveError(
        err instanceof Error ? err.message : 'Errore durante la creazione su cloud.'
      );
    }
  };

  const handleClaimHandle = async (rawHandle: string) => {
    const clean = normalizeHandle(rawHandle);
    if (!clean || clean.length < 2) return;
    const existing = profiles.find((p) => p.handle === clean);
    if (existing) {
      navigateToStudio(existing.handle, 'profile');
      return;
    }
    const displayGuess = clean
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
    const freshProfile: BioProfile = {
      id: `prof_${Date.now().toString(36)}`,
      handle: clean,
      displayName: displayGuess || clean,
      role: 'Creator & Brand Page',
      bio: 'Benvenuto nella mia pagina luancer link. Scopri link, prodotti e contatti diretti.',
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
          url: `https://instagram.com/${clean}`,
          label: 'Instagram',
          visible: true,
          followers: 1200,
        },
        {
          id: `soc_${Date.now().toString(36)}_2`,
          platform: 'whatsapp',
          url: 'https://wa.me/393401234567',
          label: 'WhatsApp',
          visible: true,
        },
      ],
      blocks: [
        {
          id: `blk_${Date.now().toString(36)}_wa`,
          type: 'whatsapp',
          visible: true,
          title: 'Scrivimi su WhatsApp',
          subtitle: 'Chat diretta con messaggio precompilato',
          whatsappPhone: '393401234567',
          whatsappMessage: `Ciao ${displayGuess || clean}! Ti scrivo dalla tua pagina luancer link.`,
          clicks: 0,
        },
        {
          id: `blk_${Date.now().toString(36)}_link`,
          type: 'link',
          visible: true,
          title: 'Il mio sito e Portfolio',
          subtitle: 'Scopri tutti i miei progetti e servizi',
          url: 'https://example.com',
          iconName: 'globe',
          highlight: true,
          clicks: 0,
        },
      ],
      theme: { ...THEME_PRESETS[0].theme },
      messages: [],
    };
    await handleCreateProfile(freshProfile);
  };

  const handleDeleteProfile = async (handle: string) => {
    if (profiles.length <= 1) return;
    try {
      await deleteProfileInFirestore(handle);
      const nextList = profiles.filter((p) => p.handle !== handle);
      setProfiles(nextList);
      if (activeHandle === handle && nextList[0]) {
        setActiveHandle(nextList[0].handle);
        lastSavedHandleRef.current = nextList[0].handle;
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Impossibile eliminare il profilo.'
      );
    }
  };

  const handleBlockClick = (blockId: string, gridItemId?: string) => {
    if (!activeProfile) return;
    const nextBlocks = activeProfile.blocks.map((b) => {
      if (b.id !== blockId) return b;
      if (gridItemId) {
        if (b.gridItems?.some((g) => g.id === gridItemId)) {
          return {
            ...b,
            gridItems: b.gridItems.map((g) =>
              g.id === gridItemId ? { ...g, clicks: g.clicks + 1 } : g
            ),
          };
        }
        if (b.photoGridItems?.some((g) => g.id === gridItemId)) {
          return {
            ...b,
            photoGridItems: b.photoGridItems.map((g) =>
              g.id === gridItemId ? { ...g, clicks: g.clicks + 1 } : g
            ),
          };
        }
        if (b.socialGridItems?.some((g) => g.id === gridItemId)) {
          return {
            ...b,
            socialGridItems: b.socialGridItems.map((g) =>
              g.id === gridItemId ? { ...g, clicks: g.clicks + 1 } : g
            ),
          };
        }
      }
      return { ...b, clicks: b.clicks + 1 };
    });

    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfile.id ? { ...p, blocks: nextBlocks } : p))
    );

    incrementClickInFirestore(activeProfile.handle, nextBlocks).catch(() => {});
  };

  const handleSubmitContact = async (payload: {
    senderName: string;
    senderEmail: string;
    message: string;
  }): Promise<boolean> => {
    if (!activeProfile) return false;
    try {
      await submitMessageToFirestore(
        activeProfile.handle,
        activeProfile.ownerUid ?? null,
        payload
      );
      return true;
    } catch {
      return false;
    }
  };

  const formatAuthErrorMessage = (err: unknown): string => {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: unknown }).code || '')
        : '';
    const msg = err instanceof Error ? err.message : String(err || '');
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      msg.includes('popup-closed-by-user')
    ) {
      return '';
    }
    if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      return `Dominio (${host || 'corrente'}) non autorizzato per il login Google. Ricarica la pagina o verifica i domini autorizzati in Firebase.`;
    }
    if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
      return 'Popup di accesso bloccato dal browser: consenti i popup per questo sito e riprova.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Errore di rete durante l’accesso con Google. Riprova.';
    }
    return msg || 'Accesso Google non completato.';
  };

  const handleClaimOwnership = async () => {
    if (!activeProfile) return;
    setSaveError('');
    try {
      let user = currentUser;
      if (!user) {
        const cred = await signInWithGoogle();
        user = cred.user;
      }
      if (!user) return;
      if (!user.emailVerified) {
        setSaveError('Verifica l’email del tuo account Google per bloccare le modifiche.');
        return;
      }
      if (!activeProfile.ownerUid) {
        await claimProfileOwnershipInFirestore(activeProfile.handle, user.uid);
        setProfiles((prev) =>
          prev.map((p) =>
            p.handle === activeProfile.handle ? { ...p, ownerUid: user.uid } : p
          )
        );
        setSaveState('saved');
      }
    } catch (err) {
      const friendly = formatAuthErrorMessage(err);
      if (friendly) setSaveError(friendly);
    }
  };

  const handleToggleAccountForLockedProfile = async () => {
    setSaveError('');
    try {
      if (currentUser) {
        await signOutGoogle();
      } else {
        await signInWithGoogle();
      }
    } catch (err) {
      const friendly = formatAuthErrorMessage(err);
      if (friendly) setSaveError(friendly);
    }
  };

  const handleImportProfileJson = async (imported: BioProfile) => {
    const cleanHandle = normalizeHandle(imported.handle) || `import.${Date.now().toString(36)}`;
    const ownerUid = currentUser?.emailVerified ? currentUser.uid : null;
    const normalized: BioProfile = {
      ...imported,
      id: `prof_${Date.now().toString(36)}`,
      handle: cleanHandle,
      ownerUid,
      updatedAt: new Date().toISOString(),
    };
    setProfiles((prev) => {
      const exists = prev.some((p) => p.handle === cleanHandle);
      return exists
        ? prev.map((p) => (p.handle === cleanHandle ? normalized : p))
        : [normalized, ...prev];
    });
    setActiveHandle(cleanHandle);
    lastSavedHandleRef.current = cleanHandle;
    await persistProfileToServer(normalized, cleanHandle);
  };

  // Standalone Public Profile Page View (never falls back to profiles[0] / other profiles)
  if (workspace === 'public') {
    const waitingForSharedHandle = !activeProfile && isLoadingServer && !publicNotFound;

    return (
      <div className="min-h-screen flex flex-col bg-zinc-950">
        {/* Minimal compact public top strip with Luancer & Co. logo */}
        <div className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-white/10 px-4 py-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={navigateToLanding}
              aria-label="Luancer & Co. — Home"
              className="inline-flex items-center whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LuancerLogo variant="dark" compact />
            </button>
            <button
              type="button"
              onClick={navigateToDirectory}
              className="hidden sm:inline-flex text-xs font-medium text-zinc-300 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              Profili Pubblici
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeProfile && (
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                aria-label="QR e Condividi"
                className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-zinc-100 bg-white/10 hover:bg-white/20 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="sm:hidden">QR</span>
                <span className="hidden sm:inline">QR &amp; Condividi</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigateToStudio(activeProfile?.handle || activeHandle, 'profile')}
              className="px-3 sm:px-3.5 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <PenLine className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Personalizza</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {waitingForSharedHandle ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-md space-y-4 animate-pulse">
                <div className="w-24 h-24 rounded-full bg-white/10 mx-auto" />
                <div className="h-5 bg-white/10 rounded w-1/2 mx-auto" />
                <div className="h-14 bg-white/10 rounded-xl" />
                <div className="h-14 bg-white/10 rounded-xl" />
              </div>
            </div>
          ) : activeProfile ? (
            <ProfileRenderer
              key={activeProfile.handle}
              profile={activeProfile}
              isPublicStandalone
              onBlockClick={handleBlockClick}
              onSubmitContact={handleSubmitContact}
              onOpenShare={() => setIsShareOpen(true)}
              onOpenLanding={navigateToLanding}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="max-w-sm space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6 text-zinc-100">
                <p className="text-base font-semibold">
                  {publicNotFound
                    ? `Profilo @${activeHandle} non trovato`
                    : `Impossibile caricare @${activeHandle}`}
                </p>
                <p className="text-xs text-zinc-400">
                  {publicNotFound
                    ? 'Verifica il link o crea questo profilo direttamente in Studio.'
                    : 'Connessione temporaneamente non disponibile. Riprova tra qualche istante.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 text-xs font-medium bg-white text-zinc-950 rounded-lg hover:bg-zinc-200 cursor-pointer"
                  >
                    Riprova
                  </button>
                  <button
                    type="button"
                    onClick={navigateToLanding}
                    className="px-4 py-2 text-xs font-medium bg-white/10 text-zinc-100 rounded-lg hover:bg-white/20 cursor-pointer"
                  >
                    Vai alla Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {activeProfile && (
          <ShareQrModal
            profile={activeProfile}
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            onOpenPublicPage={() => {}}
            onImportProfileJson={handleImportProfileJson}
          />
        )}
      </div>
    );
  }

  if (!activeProfile) return null;

  // Homepage Clone of linkme.bio
  if (workspace === 'landing') {
    return (
      <>
        <LinkmeLandingView
          profiles={profiles}
          onClaimHandle={handleClaimHandle}
          onOpenStudio={(tab) => navigateToStudio(activeProfile.handle, tab || 'profile')}
          onOpenDirectory={navigateToDirectory}
          onViewPublic={navigateToPublic}
        />
        <CreateProfileModal
          isOpen={isCreateOpen}
          existingHandles={profiles.map((p) => p.handle)}
          templates={profiles}
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateProfile}
        />
      </>
    );
  }

  const activeStats = calculateProfileStats(activeProfile);
  const isLockedByOther =
    Boolean(activeProfile.ownerUid) &&
    activeProfile.ownerUid !== currentUser?.uid &&
    currentUser?.email !== 'lucquixada@gmail.com';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F7] text-zinc-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 px-6 py-1.5 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Logo */}
        <a
          href="/"
          aria-label="Luancer & Co. — Home"
          onClick={(e) => {
            e.preventDefault();
            navigateToLanding();
          }}
          className="inline-flex items-center whitespace-nowrap shrink-0"
        >
          <LuancerLogo variant="light" />
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="Navigazione principale"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600"
        >
          <button
            type="button"
            onClick={() => navigateToStudio(undefined, 'profile')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspace === 'studio' && studioTab !== 'theme'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent hover:text-zinc-900'
            }`}
          >
            Editor Studio
          </button>
          <button
            type="button"
            onClick={() => navigateToStudio(undefined, 'theme')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspace === 'studio' && studioTab === 'theme'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent hover:text-zinc-900'
            }`}
          >
            Aspetto e Temi
          </button>
          <button
            type="button"
            onClick={navigateToDirectory}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspace === 'directory'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent hover:text-zinc-900'
            }`}
          >
            Profili Pubblici
          </button>
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="py-1 border-b-2 border-transparent hover:text-zinc-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Condividi &amp; QR
          </button>
        </nav>

        {/* Zone 3: 1 primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => navigateToPublic(activeProfile.handle)}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Vedi Pagina Pubblica</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Strip */}
      <div className="md:hidden bg-white border-b border-zinc-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => navigateToStudio(undefined, 'profile')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
            workspace === 'studio' && studioTab !== 'theme'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600'
          }`}
        >
          Editor Studio
        </button>
        <button
          type="button"
          onClick={() => navigateToStudio(undefined, 'theme')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
            workspace === 'studio' && studioTab === 'theme'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600'
          }`}
        >
          Aspetto e Temi
        </button>
        <button
          type="button"
          onClick={navigateToDirectory}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
            workspace === 'directory'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600'
          }`}
        >
          Profili Pubblici
        </button>
        <button
          type="button"
          onClick={() => setIsShareOpen(true)}
          className="px-3 py-1.5 text-xs font-medium text-zinc-700 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
        >
          Condividi &amp; QR
        </button>
      </div>

      {/* Main Content */}
      {workspace === 'directory' ? (
        <main className="flex-1">
          <DirectoryView
            profiles={profiles}
            activeHandle={activeProfile.handle}
            onEditProfile={(handle) => navigateToStudio(handle, 'profile')}
            onViewPublic={navigateToPublic}
            onOpenCreate={() => setIsCreateOpen(true)}
            onDeleteProfile={handleDeleteProfile}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Workspace Toolbar (Profile Switcher + Real Analytics + Save + Create) */}
          <div className="bg-white border border-zinc-200 rounded-2xl px-4 sm:px-5 py-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="active-profile-select"
                  className="text-xs font-medium text-zinc-500 whitespace-nowrap"
                >
                  Profilo attivo:
                </label>
                <select
                  id="active-profile-select"
                  value={activeProfile.handle}
                  onChange={(e) => {
                    const nextHandle = e.target.value;
                    const nextProf = profiles.find((p) => p.handle === nextHandle);
                    setActiveHandle(nextHandle);
                    lastSavedHandleRef.current = nextHandle;
                    writeLastStudioHandle(nextHandle);
                    setSaveError('');
                    if (nextProf && dirtyProfileIdsRef.current.has(nextProf.id)) {
                      setSaveState(cloudQuotaPausedRef.current ? 'local' : 'dirty');
                    } else {
                      setSaveState('saved');
                    }
                  }}
                  className="px-3 py-1.5 text-sm font-medium bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.handle}>
                      @{p.handle} — {p.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Nuovo Profilo</span>
              </button>

              {/* Real Analytics Metrics Strip */}
              <div
                data-testid="studio-analytics-strip"
                className="flex items-center gap-4 px-3 py-1.5 bg-[#FAF9F7] border border-zinc-200/80 rounded-lg text-xs text-zinc-600"
              >
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Eye className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <strong className="font-semibold text-zinc-900 tabular-nums">
                    {activeProfile.views.toLocaleString('it-IT')}
                  </strong>
                  <span>visite</span>
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <MousePointerClick
                    className="w-3.5 h-3.5 text-zinc-500"
                    aria-hidden="true"
                  />
                  <strong className="font-semibold text-zinc-900 tabular-nums">
                    {activeStats.totalClicks.toLocaleString('it-IT')}
                  </strong>
                  <span>clic</span>
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <BarChart3
                    className="w-3.5 h-3.5 text-[#635BFF]"
                    aria-hidden="true"
                  />
                  <strong className="font-semibold text-zinc-900 tabular-nums">
                    {activeStats.ctrEstimate}
                  </strong>
                  <span>CTR</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {saveError && (
                <span
                  role="status"
                  className={`text-xs font-medium max-w-md ${
                    saveState === 'local'
                      ? 'text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg'
                      : 'text-red-600'
                  }`}
                >
                  {saveError}
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-800 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>QR &amp; Link</span>
              </button>

              {!activeProfile.ownerUid ? (
                <button
                  type="button"
                  onClick={handleClaimOwnership}
                  title="Proteggi questo profilo con il tuo account Google"
                  className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span>{currentUser ? 'Proteggi' : 'Blocca modifiche'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleAccountForLockedProfile}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isLockedByOther ? 'Profilo protetto' : 'Tuo profilo'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => persistProfileToServer(activeProfile, undefined, true)}
                disabled={saveState === 'saving' || isLockedByOther}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50 ${
                  saveState === 'saved'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : saveState === 'local'
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                      : 'bg-[#635BFF] text-white hover:bg-[#5249F5]'
                }`}
              >
                {saveState === 'saved' ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pubblicato</span>
                  </>
                ) : saveState === 'local' ? (
                  <>
                    <Save className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Salvato in locale · Riprova Cloud</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {saveState === 'saving'
                        ? 'Salvataggio...'
                        : 'Salva e Pubblica'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2-Column Split Studio + Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Editor Column */}
            <section
              aria-label="Pannello di personalizzazione"
              className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl overflow-hidden"
            >
              {/* Editor Tabs */}
              <div
                role="tablist"
                aria-label="Sezioni editor"
                className="px-4 pt-3 pb-2 border-b border-zinc-200 bg-zinc-50/60 flex items-center gap-1.5 overflow-x-auto"
              >
                {(
                  [
                    { id: 'profile', label: 'Profilo', icon: User },
                    { id: 'socials', label: 'Icone Social', icon: Share2 },
                    { id: 'blocks', label: 'Link e Blocchi', icon: Layers },
                    { id: 'theme', label: 'Aspetto e Tema', icon: Palette },
                  ] as {
                    id: StudioTab;
                    label: string;
                    icon: React.ComponentType<{ className?: string }>;
                  }[]
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = studioTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      type="button"
                      aria-selected={active}
                      onClick={() => setStudioTab(tab.id)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-zinc-900 text-white'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-5 sm:p-6">
                {isLoadingServer && !matchedActiveProfile ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-6 bg-zinc-200 rounded w-1/3" />
                    <div className="h-24 bg-zinc-100 rounded-xl" />
                    <div className="h-24 bg-zinc-100 rounded-xl" />
                  </div>
                ) : (
                  <>
                    {studioTab === 'profile' && (
                      <EditorProfileTab
                        profile={activeProfile}
                        onChange={updateActiveProfile}
                      />
                    )}
                    {studioTab === 'socials' && (
                      <EditorSocialsTab
                        profile={activeProfile}
                        onChange={updateActiveProfile}
                      />
                    )}
                    {studioTab === 'blocks' && (
                      <EditorBlocksTab
                        profile={activeProfile}
                        onChange={updateActiveProfile}
                      />
                    )}
                    {studioTab === 'theme' && (
                      <EditorThemeTab
                        profile={activeProfile}
                        onChange={updateActiveProfile}
                      />
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Right Sticky Live Preview Column */}
            <aside
              aria-label="Anteprima dal vivo"
              className="lg:col-span-5 lg:sticky lg:top-20 space-y-3"
            >
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-900">
                      Anteprima Live
                    </h2>
                    <p className="text-xs text-zinc-500 font-mono">
                      /?u={activeProfile.handle}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      aria-label="Anteprima Mobile"
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        previewDevice === 'mobile'
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Mobile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      aria-label="Anteprima Desktop"
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        previewDevice === 'desktop'
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Desktop</span>
                    </button>
                  </div>
                </div>

                {/* Preview Container */}
                {previewDevice === 'mobile' ? (
                  <div
                    data-testid="live-preview-frame"
                    className="mx-auto w-full max-w-[380px] h-[680px] rounded-[2.25rem] border-[6px] border-zinc-900 bg-white overflow-hidden shadow-md flex flex-col"
                  >
                    <div className="h-6 bg-zinc-900 flex items-center justify-center shrink-0">
                      <div className="w-16 h-3 rounded-full bg-zinc-800" />
                    </div>
                    <div className="flex-1 overflow-y-auto clean-scroll">
                      <ProfileRenderer
                        profile={activeProfile}
                        onBlockClick={handleBlockClick}
                        onSubmitContact={handleSubmitContact}
                        onOpenShare={() => setIsShareOpen(true)}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    data-testid="live-preview-frame"
                    className="w-full h-[680px] rounded-xl border border-zinc-200 overflow-y-auto clean-scroll"
                  >
                    <ProfileRenderer
                      profile={activeProfile}
                      isDesktopFrame
                      onBlockClick={handleBlockClick}
                      onSubmitContact={handleSubmitContact}
                      onOpenShare={() => setIsShareOpen(true)}
                    />
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      )}

      {/* Modals */}
      <ShareQrModal
        profile={activeProfile}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onOpenPublicPage={() => navigateToPublic(activeProfile.handle)}
        onImportProfileJson={handleImportProfileJson}
      />

      <CreateProfileModal
        isOpen={isCreateOpen}
        existingHandles={profiles.map((p) => p.handle)}
        templates={profiles}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateProfile}
      />
    </div>
  );
}
