/* ============================================================
   Reference only — not run anywhere in this project yet.
   Drop this into your Express app once Phase 2/3 exist, matching
   the exact scoring logic used client-side in design.html so the
   two never drift apart.
   ============================================================ */

const mongoose = require('mongoose');

// ---------- 1. Schema ----------
const designSchema = new mongoose.Schema({
  file:     { type: String, required: true },   // e.g. "nail-01.jpg", served from /public/images/nails/
  occasion: { type: String, required: true },    // Party | Wedding | Casual | Office | Vacation
  style:    { type: String, required: true },    // Simple | Elegant | Luxury | Cute | Bold
  length:   { type: String, required: true },    // Short | Medium | Long
  shape:    { type: String, required: true },    // Almond | Square | Coffin | Stiletto
  color:    { type: String, required: true },    // Nude | Pink | Red | White | Black | Any
});

const Design = mongoose.model('Design', designSchema);

// ---------- 2. One-time seed script ----------
// Run this once (e.g. `node seed.js`) after pointing MONGO_URI at your DB,
// using the same 20 rows as data/nail-designs.json in the frontend project.
async function seed() {
  const nailDesigns = require('./nail-designs.json'); // same file the frontend ships with
  await mongoose.connect(process.env.MONGO_URI);
  await Design.deleteMany({});
  await Design.insertMany(nailDesigns);
  console.log(`Seeded ${nailDesigns.length} designs`);
  await mongoose.disconnect();
}
// seed(); // uncomment to run once

// ---------- 3. Search route ----------
// GET /api/designs/search?occasion=Party&style=Luxury&length=Medium&shape=Almond&color=Pink
const express = require('express');
const router = express.Router();

const WEIGHTS = { occasion: 3, style: 3, color: 2, shape: 1, length: 1 };

function scoreDesign(design, prefs) {
  let score = 0;
  if (design.occasion === prefs.occasion) score += WEIGHTS.occasion;
  if (design.style === prefs.style) score += WEIGHTS.style;
  if (design.color === prefs.color || prefs.color === 'Any' || design.color === 'Any') score += WEIGHTS.color;
  if (design.shape === prefs.shape) score += WEIGHTS.shape;
  if (design.length === prefs.length) score += WEIGHTS.length;
  return score;
}

router.get('/api/designs/search', async (req, res) => {
  const { occasion, style, length, shape, color } = req.query;
  if (!occasion || !style || !length || !shape || !color) {
    return res.status(400).json({ error: 'occasion, style, length, shape and color are all required' });
  }

  // The catalog is tiny (20-ish rows), so fetch everything and score in
  // JS rather than building a complex Mongo aggregation — this is the
  // same scoreDesign() logic the frontend uses, just running server-side.
  const all = await Design.find({}).lean();
  const ranked = all
    .map(d => ({ ...d, score: scoreDesign(d, { occasion, style, length, shape, color }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  res.json({ results: ranked, maxScore: WEIGHTS.occasion + WEIGHTS.style + WEIGHTS.color + WEIGHTS.shape + WEIGHTS.length });
});

module.exports = router;

// ---------- 4. Frontend swap ----------
// In design.html, replace:
//   const matches = findMatches(prefs);
// with:
//   const res = await fetch(`/api/designs/search?${new URLSearchParams(prefs)}`);
//   const { results, maxScore } = await res.json();
// Everything else (rendering the grid, download links, heart button) stays the same.
