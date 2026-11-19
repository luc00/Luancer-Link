import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { BioBlock, BioProfile, ContactSubmission, SocialLinkItem } from '../types/profile';
import { SEED_PROFILES } from '../data/presets';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { normalizeHandle } from '../utils/profileLogic';

const PROFILES_COLLECTION = 'profiles';

function clampString(val: unknown, max: number, fallback = ''): string {
  const str = typeof val === 'string' ? val : fallback;
  return str.length > max ? str.slice(0, max) : str;
}

function stripUndefined<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return input;
}

function sanitizeSocials(socials: SocialLinkItem[]): SocialLinkItem[] {
  return (Array.isArray(socials) ? socials : []).slice(0, 20).map((s, idx) =>
    stripUndefined({
      id: clampString(s.id, 64, `soc_${idx}`),
      kind: s.kind === 'divider' ? ('divider' as const) : ('link' as const),
      platform: s.platform,
      url: clampString(s.url, 500, ''),
      label: clampString(s.label, 80, ''),
      visible: Boolean(s.visible),
      ...(typeof s.followers === 'number' && Number.isFinite(s.followers)
        ? { followers: Math.max(0, Math.round(s.followers)) }
        : {}),
      ...(typeof s.iconImageUrl === 'string' && s.iconImageUrl.trim().length > 0
        ? { iconImageUrl: clampString(s.iconImageUrl.trim(), 30000) }
        : {}),
      ...(s.iconShape === 'circle' || s.iconShape === 'square' || s.iconShape === 'rounded'
        ? { iconShape: s.iconShape }
        : {}),
      ...(s.dividerStyle === 'line' ||
      s.dividerStyle === 'dashed' ||
      s.dividerStyle === 'dotted' ||
      s.dividerStyle === 'gradient'
        ? { dividerStyle: s.dividerStyle }
        : {}),
      ...(typeof s.dividerColor === 'string' && s.dividerColor.trim().length > 0
        ? { dividerColor: clampString(s.dividerColor.trim(), 32) }
        : {}),
    })
  );
}

function sanitizeBlocks(blocks: BioBlock[]): BioBlock[] {
  return (Array.isArray(blocks) ? blocks : []).slice(0, 50).map((b, idx) => {
    const cleanIconImg =
      typeof b.iconImageUrl === 'string' && b.iconImageUrl.trim().length > 0
        ? clampString(b.iconImageUrl.trim(), 30000)
        : undefined;
    const cleanGridItems = Array.isArray(b.gridItems)
      ? b.gridItems.slice(0, 12).map((g, gIdx) => ({
          id: clampString(g.id, 64, `g_${idx}_${gIdx}`),
          title: clampString(g.title, 100, 'Link'),
          ...(g.subtitle !== undefined ? { subtitle: clampString(g.subtitle, 160) } : {}),
          url: clampString(g.url, 500, ''),
          iconName: g.iconName || 'link',
          ...(typeof g.iconImageUrl === 'string' && g.iconImageUrl.trim().length > 0
            ? { iconImageUrl: clampString(g.iconImageUrl.trim(), 30000) }
            : {}),
          ...(g.iconShape === 'circle' || g.iconShape === 'square' || g.iconShape === 'rounded'
            ? { iconShape: g.iconShape }
            : {}),
          clicks: typeof g.clicks === 'number' && Number.isFinite(g.clicks) ? Math.max(0, Math.round(g.clicks)) : 0,
        }))
      : undefined;

    const { iconImageUrl: _ignoredIconImg, iconShape: _ignoredIconShape, ...rest } = b;

    return stripUndefined({
      ...rest,
      id: clampString(b.id, 64, `blk_${idx}`),
      visible: Boolean(b.visible),
      title: clampString(b.title, 200, b.type === 'divider' ? '' : 'Link'),
      ...(b.subtitle !== undefined ? { subtitle: clampString(b.subtitle, 300) } : {}),
      ...(b.url !== undefined ? { url: clampString(b.url, 500) } : {}),
      ...(cleanIconImg ? { iconImageUrl: cleanIconImg } : {}),
      ...(cleanIconImg &&
      (b.iconShape === 'circle' || b.iconShape === 'square' || b.iconShape === 'rounded')
        ? { iconShape: b.iconShape }
        : {}),
      ...(b.badgeText !== undefined ? { badgeText: clampString(b.badgeText, 40) } : {}),
      ...(b.imageUrl !== undefined ? { imageUrl: clampString(b.imageUrl, 30000) } : {}),
      ...(b.videoUrl !== undefined ? { videoUrl: clampString(b.videoUrl, 500) } : {}),
      ...(b.videoAspect === '16:9' || b.videoAspect === '9:16'
        ? { videoAspect: b.videoAspect }
        : {}),
      ...(b.videoLoop !== undefined ? { videoLoop: Boolean(b.videoLoop) } : {}),
      ...(b.dividerStyle === 'line' ||
      b.dividerStyle === 'dashed' ||
      b.dividerStyle === 'dotted' ||
      b.dividerStyle === 'gradient' ||
      b.dividerStyle === 'space'
        ? { dividerStyle: b.dividerStyle }
        : {}),
      ...(b.dividerThickness === 1 ||
      b.dividerThickness === 2 ||
      b.dividerThickness === 3 ||
      b.dividerThickness === 4
        ? { dividerThickness: b.dividerThickness }
        : {}),
      ...(b.dividerWidth === 'full' ||
      b.dividerWidth === 'medium' ||
      b.dividerWidth === 'short'
        ? { dividerWidth: b.dividerWidth }
        : {}),
      ...(typeof b.dividerColor === 'string' && b.dividerColor.trim().length > 0
        ? { dividerColor: clampString(b.dividerColor.trim(), 32) }
        : {}),
      ...(b.whatsappPhone !== undefined ? { whatsappPhone: clampString(b.whatsappPhone, 32) } : {}),
      ...(b.whatsappMessage !== undefined ? { whatsappMessage: clampString(b.whatsappMessage, 300) } : {}),
      ...(b.productPrice !== undefined ? { productPrice: clampString(b.productPrice, 32) } : {}),
      ...(b.productBadge !== undefined ? { productBadge: clampString(b.productBadge, 40) } : {}),
      ...(cleanGridItems !== undefined ? { gridItems: cleanGridItems } : {}),
      clicks: typeof b.clicks === 'number' && Number.isFinite(b.clicks) ? Math.max(0, Math.round(b.clicks)) : 0,
    });
  });
}

function buildEditableFields(profile: BioProfile, cleanHandle: string) {
  return stripUndefined({
    displayName: clampString(profile.displayName.trim(), 100, cleanHandle) || cleanHandle,
    role: clampString(profile.role, 120, ''),
    bio: clampString(profile.bio, 500, ''),
    location: clampString(profile.location, 80, ''),
    category: clampString(profile.category, 80, 'Creator & Media'),
    verified: Boolean(profile.verified),
    showFollowersCount: profile.showFollowersCount ?? true,
    availabilityText: clampString(profile.availabilityText, 120, ''),
    avatarUrl: clampString(profile.avatarUrl, 135000, ''),
    bannerUrl: clampString(profile.bannerUrl, 175000, ''),
    socials: sanitizeSocials(profile.socials),
    blocks: sanitizeBlocks(profile.blocks),
    theme: {
      ...profile.theme,
      presetId: clampString(profile.theme?.presetId, 64, 'linkme-bio-violet'),
      backgroundType: profile.theme?.backgroundType || 'solid',
      backgroundColor: clampString(profile.theme?.backgroundColor, 64, '#FAF9F7'),
      cardVariant: profile.theme?.cardVariant || 'filled',
      font: profile.theme?.font || 'jakarta',
      ...(profile.theme?.socialSectionTitle !== undefined
        ? { socialSectionTitle: clampString(profile.theme.socialSectionTitle, 80) }
        : {}),
      ...(profile.theme?.showSocialLabels !== undefined
        ? { showSocialLabels: Boolean(profile.theme.showSocialLabels) }
        : {}),
    },
  });
}

function toIsoTimestamp(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return new Date().toISOString();
}

function docToProfile(raw: Record<string, unknown>, docId: string): BioProfile {
  const handle = normalizeHandle(String(raw.handle || docId)) || docId;
  return {
    id: String(raw.id || `prof_${handle}`),
    handle,
    displayName: String(raw.displayName || handle),
    role: String(raw.role || ''),
    bio: String(raw.bio || ''),
    location: String(raw.location || ''),
    category: String(raw.category || 'Creator & Media'),
    verified: Boolean(raw.verified),
    showFollowersCount: raw.showFollowersCount === undefined ? true : Boolean(raw.showFollowersCount),
    availabilityText: String(raw.availabilityText || ''),
    avatarUrl: String(raw.avatarUrl || ''),
    bannerUrl: String(raw.bannerUrl || ''),
    views: typeof raw.views === 'number' ? raw.views : 0,
    createdAt: toIsoTimestamp(raw.createdAt),
    updatedAt: toIsoTimestamp(raw.updatedAt),
    ownerUid: typeof raw.ownerUid === 'string' ? raw.ownerUid : null,
    socials: Array.isArray(raw.socials) ? (raw.socials as SocialLinkItem[]) : [],
    blocks: Array.isArray(raw.blocks) ? (raw.blocks as BioBlock[]) : [],
    theme: raw.theme as BioProfile['theme'],
    messages: [],
  };
}

export async function seedInitialProfilesIfEmpty(): Promise<void> {
  try {
    const existingSnap = await getDocs(
      query(collection(db, PROFILES_COLLECTION), where('isPublic', '==', true), limit(1))
    );
    if (!existingSnap.empty) return;

    await Promise.all(
      SEED_PROFILES.map(async (seed) => {
        const cleanHandle = normalizeHandle(seed.handle);
        const ref = doc(db, PROFILES_COLLECTION, cleanHandle);
        const fields = buildEditableFields(seed, cleanHandle);
        await setDoc(ref, {
          id: clampString(seed.id, 64, `prof_${cleanHandle}`),
          handle: cleanHandle,
          ...fields,
          views: Math.max(0, Math.min(50000, Math.round(seed.views || 0))),
          ownerUid: null,
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PROFILES_COLLECTION);
  }
}

export function subscribeToPublicProfiles(
  onUpdate: (profiles: BioProfile[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(
    collection(db, PROFILES_COLLECTION),
    where('isPublic', '==', true)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs
        .map((d) => docToProfile(d.data() as Record<string, unknown>, d.id))
        .sort((a, b) => {
          const ta = Date.parse(a.updatedAt || '') || 0;
          const tb = Date.parse(b.updatedAt || '') || 0;
          return tb - ta;
        });
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, PROFILES_COLLECTION);
    }
  );
}

export async function createProfileInFirestore(
  profile: BioProfile,
  ownerUid: string | null = null
): Promise<BioProfile> {
  const cleanHandle = normalizeHandle(profile.handle);
  if (!cleanHandle || cleanHandle.length < 2) {
    throw new Error('Handle non valido.');
  }
  const path = `${PROFILES_COLLECTION}/${cleanHandle}`;
  try {
    const ref = doc(db, PROFILES_COLLECTION, cleanHandle);
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      throw new Error(`L'handle @${cleanHandle} è già occupato da un altro profilo.`);
    }

    const fields = buildEditableFields(profile, cleanHandle);
    await setDoc(ref, {
      id: clampString(profile.id, 64, `prof_${Date.now().toString(36)}`),
      handle: cleanHandle,
      ...fields,
      views: 0,
      ownerUid: ownerUid ?? null,
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      ...profile,
      handle: cleanHandle,
      views: 0,
      ownerUid: ownerUid ?? null,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('già occupato')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveProfileToFirestore(
  profile: BioProfile,
  previousHandle?: string,
  currentUserUid?: string | null
): Promise<BioProfile> {
  const cleanHandle = normalizeHandle(profile.handle);
  if (!cleanHandle || cleanHandle.length < 2) {
    throw new Error('Inserisci un handle di almeno 2 caratteri.');
  }

  const prevClean = previousHandle ? normalizeHandle(previousHandle) : cleanHandle;
  const targetPath = `${PROFILES_COLLECTION}/${cleanHandle}`;

  try {
    // Handle rename flow: create under new handle doc and delete previous doc
    if (prevClean && prevClean !== cleanHandle) {
      const nextRef = doc(db, PROFILES_COLLECTION, cleanHandle);
      const conflictSnap = await getDoc(nextRef);
      if (conflictSnap.exists()) {
        throw new Error(`L'handle @${cleanHandle} è già utilizzato da un altro profilo.`);
      }
      const prevRef = doc(db, PROFILES_COLLECTION, prevClean);
      const prevSnap = await getDoc(prevRef);
      const preservedViews = prevSnap.exists()
        ? Number((prevSnap.data() as Record<string, unknown>).views || profile.views || 0)
        : profile.views || 0;
      const preservedOwner = prevSnap.exists()
        ? ((prevSnap.data() as Record<string, unknown>).ownerUid as string | null) ?? null
        : profile.ownerUid ?? null;

      const fields = buildEditableFields(profile, cleanHandle);
      await setDoc(nextRef, {
        id: clampString(profile.id, 64, `prof_${cleanHandle}`),
        handle: cleanHandle,
        ...fields,
        views: Math.max(0, Math.min(50000, Math.round(preservedViews))),
        ownerUid: preservedOwner ?? currentUserUid ?? null,
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (prevSnap.exists()) {
        await deleteDoc(prevRef);
      }
      return { ...profile, handle: cleanHandle, updatedAt: new Date().toISOString() };
    }

    const ref = doc(db, PROFILES_COLLECTION, cleanHandle);
    const snap = await getDoc(ref);
    const fields = buildEditableFields(profile, cleanHandle);

    if (!snap.exists()) {
      await setDoc(ref, {
        id: clampString(profile.id, 64, `prof_${cleanHandle}`),
        handle: cleanHandle,
        ...fields,
        views: 0,
        ownerUid: profile.ownerUid ?? currentUserUid ?? null,
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...fields,
        updatedAt: serverTimestamp(),
      });
    }

    return { ...profile, handle: cleanHandle, updatedAt: new Date().toISOString() };
  } catch (error) {
    if (error instanceof Error && error.message.includes('già utilizzato')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, targetPath);
  }
}

export async function deleteProfileInFirestore(handle: string): Promise<void> {
  const cleanHandle = normalizeHandle(handle);
  const path = `${PROFILES_COLLECTION}/${cleanHandle}`;
  try {
    await deleteDoc(doc(db, PROFILES_COLLECTION, cleanHandle));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function incrementViewInFirestore(handle: string): Promise<void> {
  const cleanHandle = normalizeHandle(handle);
  const path = `${PROFILES_COLLECTION}/${cleanHandle}`;
  try {
    await updateDoc(doc(db, PROFILES_COLLECTION, cleanHandle), {
      views: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function incrementClickInFirestore(
  handle: string,
  updatedBlocks: BioBlock[]
): Promise<void> {
  const cleanHandle = normalizeHandle(handle);
  const path = `${PROFILES_COLLECTION}/${cleanHandle}`;
  try {
    await updateDoc(doc(db, PROFILES_COLLECTION, cleanHandle), {
      blocks: sanitizeBlocks(updatedBlocks),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function claimProfileOwnershipInFirestore(
  handle: string,
  uid: string
): Promise<void> {
  const cleanHandle = normalizeHandle(handle);
  const path = `${PROFILES_COLLECTION}/${cleanHandle}`;
  try {
    await updateDoc(doc(db, PROFILES_COLLECTION, cleanHandle), {
      ownerUid: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitMessageToFirestore(
  handle: string,
  profileOwnerUid: string | null | undefined,
  payload: { senderName: string; senderEmail: string; message: string }
): Promise<void> {
  const cleanHandle = normalizeHandle(handle);
  const msgId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `${PROFILES_COLLECTION}/${cleanHandle}/messages/${msgId}`;
  try {
    await setDoc(doc(db, PROFILES_COLLECTION, cleanHandle, 'messages', msgId), {
      id: msgId,
      senderName: clampString(payload.senderName.trim(), 100, 'Visitatore') || 'Visitatore',
      senderEmail: clampString(payload.senderEmail.trim(), 160, ''),
      message:
        clampString(payload.message.trim(), 1000, 'Iscrizione / Richiesta rapida') ||
        'Iscrizione / Richiesta rapida',
      profileOwnerUid: profileOwnerUid ?? null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchProfileMessages(
  handle: string
): Promise<ContactSubmission[]> {
  const cleanHandle = normalizeHandle(handle);
  const path = `${PROFILES_COLLECTION}/${cleanHandle}/messages`;
  try {
    const q = query(
      collection(db, PROFILES_COLLECTION, cleanHandle, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id || d.id),
        senderName: String(data.senderName || 'Visitatore'),
        senderEmail: String(data.senderEmail || ''),
        message: String(data.message || ''),
        createdAt: toIsoTimestamp(data.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
