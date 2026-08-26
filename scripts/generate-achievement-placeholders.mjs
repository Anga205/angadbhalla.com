/**
 * Generates placeholder gallery images for every achievement.
 *
 *   node scripts/generate-achievement-placeholders.mjs
 *
 * Writes public/achievements/<slug>/01.svg … 03.svg. These are real files
 * on disk, so the gallery layout is exercised before any screenshots exist.
 * Replace them with .png/.jpg of the same stem and the caption mapping in
 * src/data/achievements.ts keeps working.
 *
 * Safe to re-run: existing files are left alone unless --force is passed.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/achievements');

const SLUGS = [
	'algomania-3',
	'tensor-2026',
	'kalpana-2025',
	'hack-o-ween-2025',
	'leetcode-1337',
	'alcoding-club-head',
	'pesu-io-course',
	'vosd-drive',
	'docker-pr-51670',
	'ieee-cs-iampro-2025',
];

const COUNT = 3;
const WIDTH = 1200;
const HEIGHT = 750;
const FORCE = process.argv.includes('--force');

function placeholder(slug, index) {
	const stem = String(index).padStart(2, '0');
	const label = `[ screenshot ${stem} ]`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${slug} placeholder ${stem}">
	<rect width="${WIDTH}" height="${HEIGHT}" fill="#1c1c1c"/>
	<rect x="24" y="24" width="${WIDTH - 48}" height="${HEIGHT - 48}" fill="none" stroke="#3d3846" stroke-width="2" stroke-dasharray="10 8"/>
	<g stroke="#262626" stroke-width="1">
		<line x1="${WIDTH / 2}" y1="${HEIGHT / 2 - 96}" x2="${WIDTH / 2}" y2="${HEIGHT / 2 - 40}"/>
		<line x1="${WIDTH / 2}" y1="${HEIGHT / 2 + 40}" x2="${WIDTH / 2}" y2="${HEIGHT / 2 + 96}"/>
		<line x1="${WIDTH / 2 - 96}" y1="${HEIGHT / 2}" x2="${WIDTH / 2 - 40}" y2="${HEIGHT / 2}"/>
		<line x1="${WIDTH / 2 + 40}" y1="${HEIGHT / 2}" x2="${WIDTH / 2 + 96}" y2="${HEIGHT / 2}"/>
	</g>
	<text x="${WIDTH / 2}" y="${HEIGHT / 2 + 6}" text-anchor="middle" fill="#737373" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="30" letter-spacing="2">${label}</text>
	<text x="${WIDTH / 2}" y="${HEIGHT / 2 + 52}" text-anchor="middle" fill="#4a4a4a" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="20" letter-spacing="1">${slug}</text>
</svg>
`;
}

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

let written = 0;
let skipped = 0;

for (const slug of SLUGS) {
	const dir = join(OUT, slug);
	await mkdir(dir, { recursive: true });

	for (let index = 1; index <= COUNT; index += 1) {
		const stem = String(index).padStart(2, '0');
		const file = join(dir, `${stem}.svg`);

		if (!FORCE && (await exists(file))) {
			skipped += 1;
			continue;
		}

		await writeFile(file, placeholder(slug, index), 'utf8');
		written += 1;
	}
}

console.log(`placeholders: ${written} written, ${skipped} skipped (${SLUGS.length} achievements)`);
