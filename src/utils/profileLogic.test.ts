import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHandle,
  normalizeUrl,
  validateProfileInput,
  reorderList,
  moveItem,
  filterBlocks,
  calculateProfileStats,
  calculateTotalFollowers,
  formatFollowerCount,
  buildWhatsappUrl,
  cloneProfileForRemix,
  computeContrastRatio,
  getThemeContrastSummary,
  getSocialIconShapeClass,
  parseVideoUrl,
} from './profileLogic';
import { SEED_PROFILES, THEME_PRESETS } from '../data/presets';

test('normalizeHandle cleans spaces, accents, @ prefix, and punctuation', () => {
  assert.equal(normalizeHandle('@Elena Studio!'), 'elena.studio');
  assert.equal(normalizeHandle('  Caffè_Milano 2026  '), 'caffe_milano.2026');
  assert.equal(normalizeHandle('...marco...dev...'), 'marco.dev');
});

test('normalizeUrl converts @username and bare domains safely', () => {
  assert.equal(normalizeUrl('@elena.art', 'instagram'), 'https://instagram.com/elena.art');
  assert.equal(normalizeUrl('ciao@studio.it', 'email'), 'mailto:ciao@studio.it');
  assert.equal(normalizeUrl('elenamoretti.it', 'website'), 'https://elenamoretti.it');
  assert.equal(normalizeUrl('https://github.com/marcob', 'github'), 'https://github.com/marcob');
  assert.equal(
    buildWhatsappUrl('+39 340 123 4567', 'Ciao! Info'),
    'https://wa.me/393401234567?text=Ciao!%20Info'
  );
  assert.equal(buildWhatsappUrl(''), '');
});

test('validateProfileInput rejects short handle or empty displayName', () => {
  const bad = validateProfileInput({ handle: '@', displayName: 'A' });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.handle);
  assert.ok(bad.errors.displayName);

  const ok = validateProfileInput({ handle: '@luca.music', displayName: 'Luca Rossi' });
  assert.equal(ok.valid, true);
  assert.deepEqual(ok.errors, {});
});

test('reorderList and moveItem shift items deterministically', () => {
  const items = ['a', 'b', 'c', 'd'];
  assert.deepEqual(reorderList(items, 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(moveItem(items, 1, 'up'), ['b', 'a', 'c', 'd']);
  assert.deepEqual(moveItem(items, 0, 'up'), ['a', 'b', 'c', 'd']);
  assert.deepEqual(moveItem(items, 2, 'down'), ['a', 'b', 'd', 'c']);
});

test('filterBlocks matches titles, subtitles, urls, and nested grids', () => {
  const blocks = SEED_PROFILES[0].blocks;
  const filtered = filterBlocks(blocks, 'portfolio');
  assert.ok(filtered.length >= 1);
  assert.equal(filterBlocks(blocks, 'nonexistent_xyz_999').length, 0);
});

test('calculateTotalFollowers and formatFollowerCount summarize visible social networks', () => {
  assert.equal(formatFollowerCount(0), '0');
  assert.equal(formatFollowerCount(1450), '1.5K');
  assert.equal(formatFollowerCount(248500), '249K');
  assert.equal(formatFollowerCount(5700000), '5.7M');

  const total = calculateTotalFollowers(SEED_PROFILES[0].socials);
  assert.ok(total > 100000);
});

test('calculateProfileStats aggregates clicks across links, photo_grid, social_grid, and grid items', () => {
  const profile = SEED_PROFILES[0];
  const stats = calculateProfileStats(profile);
  assert.ok(stats.totalClicks > 0);
  assert.ok(stats.activeLinks > 0);
  assert.ok(stats.activeSocials > 0);
  assert.ok(stats.topBlockTitle !== null);
  assert.ok(stats.ctrEstimate.endsWith('%'));
});

test('cloneProfileForRemix resets analytics and creates fresh unique IDs', () => {
  const source = SEED_PROFILES[0];
  const cloned = cloneProfileForRemix(source, 'Nuovo Studio!', 'Nuovo Studio');
  assert.equal(cloned.handle, 'nuovo.studio');
  assert.equal(cloned.displayName, 'Nuovo Studio');
  assert.equal(cloned.views, 0);
  assert.equal(cloned.messages.length, 0);
  assert.ok(cloned.blocks.every((b) => b.clicks === 0));
  assert.notEqual(cloned.id, source.id);
});

test('computeContrastRatio and getThemeContrastSummary verify all presets meet WCAG AA', () => {
  assert.equal(computeContrastRatio('#000000', '#FFFFFF'), 21);
  for (const preset of THEME_PRESETS) {
    const summary = getThemeContrastSummary(preset.theme);
    assert.equal(
      summary.passesAA,
      true,
      `Theme preset ${preset.id} failed WCAG AA contrast: ${summary.ratio}:1`
    );
  }
});

test('getSocialIconShapeClass maps circle, square, rounded, and falls back to theme style', () => {
  assert.equal(getSocialIconShapeClass('circle', 'minimal'), 'w-10 h-10 rounded-full');
  assert.equal(getSocialIconShapeClass('square', 'brand'), 'w-10 h-10 rounded-none');
  assert.equal(getSocialIconShapeClass('rounded', 'circle'), 'w-10 h-10 rounded-xl');
  assert.equal(getSocialIconShapeClass(undefined, 'brand'), 'w-10 h-10 rounded-full');
  assert.equal(getSocialIconShapeClass(undefined, 'minimal'), 'w-9 h-9 rounded-md');
});

test('parseVideoUrl detects YouTube, Shorts, Vimeo, direct MP4, loop embeds, and vertical Reels', () => {
  const yt = parseVideoUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  assert.equal(yt.provider, 'youtube');
  assert.equal(yt.embedUrl, 'https://www.youtube.com/embed/aqz-KE-bpKQ?autoplay=1&rel=0');
  assert.equal(yt.thumbnailUrl, 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg');
  assert.equal(yt.isVertical, false);

  const ytLoop = parseVideoUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ', true);
  assert.equal(
    ytLoop.embedUrl,
    'https://www.youtube.com/embed/aqz-KE-bpKQ?autoplay=1&mute=1&loop=1&playlist=aqz-KE-bpKQ&controls=0&playsinline=1&rel=0'
  );

  const shorts = parseVideoUrl('https://youtube.com/shorts/dQw4w9WgXcQ');
  assert.equal(shorts.provider, 'youtube');
  assert.equal(shorts.isVertical, true);

  const vimeo = parseVideoUrl('https://vimeo.com/76979871');
  assert.equal(vimeo.provider, 'vimeo');
  assert.equal(vimeo.embedUrl, 'https://player.vimeo.com/video/76979871?autoplay=1');

  const vimeoLoop = parseVideoUrl('https://vimeo.com/76979871', true);
  assert.equal(
    vimeoLoop.embedUrl,
    'https://player.vimeo.com/video/76979871?autoplay=1&loop=1&muted=1&background=1'
  );

  const mp4 = parseVideoUrl('https://cdn.example.com/clip.mp4?v=1');
  assert.equal(mp4.provider, 'direct');
  assert.equal(mp4.directUrl, 'https://cdn.example.com/clip.mp4?v=1');

  const gdrive = parseVideoUrl(
    'Vhttps://drive.google.com/file/d/1QwPnihPaTl3IBJjopJvqHU_7eabadfO1/view?usp=sharing'
  );
  assert.equal(gdrive.provider, 'gdrive');
  assert.equal(
    gdrive.embedUrl,
    'https://drive.google.com/file/d/1QwPnihPaTl3IBJjopJvqHU_7eabadfO1/preview'
  );
  assert.equal(
    gdrive.thumbnailUrl,
    'https://drive.google.com/thumbnail?id=1QwPnihPaTl3IBJjopJvqHU_7eabadfO1&sz=w800'
  );

  const dropbox = parseVideoUrl(
    'https://www.dropbox.com/scl/fi/abc123/demo.mp4?rlkey=xyz&dl=0'
  );
  assert.equal(dropbox.provider, 'direct');
  assert.match(dropbox.directUrl || '', /raw=1/);

  const loom = parseVideoUrl('https://www.loom.com/share/1234567890abcdef');
  assert.equal(loom.provider, 'loom');
  assert.match(loom.embedUrl || '', /loom\.com\/embed\/1234567890abcdef/);

  const reel = parseVideoUrl('https://instagram.com/reel/abc123/');
  assert.equal(reel.provider, 'external');
  assert.equal(reel.isVertical, true);
});

test('dividers do not inflate activeLinks or activeSocials counts', () => {
  const base = SEED_PROFILES[0];
  const baseStats = calculateProfileStats(base);
  const withDividers = {
    ...base,
    socials: [
      ...base.socials,
      {
        id: 'soc_div',
        kind: 'divider' as const,
        platform: 'website' as const,
        url: '',
        label: 'Altro',
        visible: true,
        followers: 99999,
      },
    ],
    blocks: [
      ...base.blocks,
      {
        id: 'blk_div',
        type: 'divider' as const,
        visible: true,
        title: 'Sezione',
        clicks: 0,
      },
    ],
  };
  const nextStats = calculateProfileStats(withDividers);
  assert.equal(nextStats.activeLinks, baseStats.activeLinks);
  assert.equal(nextStats.activeSocials, baseStats.activeSocials);
  assert.equal(
    calculateTotalFollowers(withDividers.socials),
    calculateTotalFollowers(base.socials)
  );
});



