/**
 * Build script: reads instagram_posts dir, sorts files by date in filename (M_D_YY),
 * injects gallery HTML into index.html. Run: node build-gallery.js
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, 'instagram_posts');
const INDEX_PATH = path.join(__dirname, 'index.html');

// Match date at end of filename: _M_D_YY or _MM_DD_YY before extension
const DATE_RE = /_(\d{1,2})_(\d{1,2})_(\d{2})\.?[^.]+$/i;

function parseDateFromFilename(name) {
  const m = name.match(DATE_RE);
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const day = parseInt(m[2], 10);
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000; // 26 -> 2026
  return { year, month, day, name };
}

function listAndSortPosts() {
  const names = fs.readdirSync(POSTS_DIR);
  const entries = [];
  for (const name of names) {
    const fullPath = path.join(POSTS_DIR, name);
    if (!fs.statSync(fullPath).isFile()) continue;
    const parsed = parseDateFromFilename(name);
    if (!parsed) continue;
    entries.push(parsed);
  }
  entries.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.month !== b.month) return b.month - a.month;
    return b.day - a.day;
  });
  return entries.map((e) => e.name);
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildGalleryHtml(files) {
  const srcPrefix = 'instagram_posts/';
  return files
    .map(
      (file) =>
        `<li><figure tabindex="0" role="button"><img src="${escapeHtml(srcPrefix + file)}" alt="" loading="lazy"></figure></li>`
    )
    .join('\n    ');
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('Directory not found:', POSTS_DIR);
    process.exit(1);
  }

  const sorted = listAndSortPosts();
  const galleryHtml = buildGalleryHtml(sorted);

  let html = fs.readFileSync(INDEX_PATH, 'utf8');
  const ulOpen = '<ul class="gallery" id="gallery" aria-label="Image gallery in date order">';
  const ulClose = '</ul>';
  const start = html.indexOf(ulOpen);
  const end = html.indexOf(ulClose, start);
  if (start === -1 || end === -1) {
    console.error('Could not find gallery <ul> in index.html');
    process.exit(1);
  }
  html =
    html.slice(0, start + ulOpen.length) +
    '\n    ' +
    galleryHtml +
    '\n  ' +
    html.slice(end);
  fs.writeFileSync(INDEX_PATH, html, 'utf8');
  console.log('Gallery built with', sorted.length, 'images in date order.');
}

main();
