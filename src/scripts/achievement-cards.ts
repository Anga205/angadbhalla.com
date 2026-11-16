/**
 * Live LeetCode solve count.
 *
 * The card ships with the fallback sentence ending in "1337+ solves", so the
 * page is correct before any JavaScript runs. This swaps in the exact number
 * once the API answers, and does nothing at all if the request fails — the
 * static sentence is already the fallback.
 *
 * The number is the raw `totalSolved` value, formatted with locale commas and
 * no rounding, flooring, or "+" suffix: 1414 shows as "1,414".
 *
 * Idempotent per root, so the mobile pager can call it again after injecting a
 * panel.
 */
const LEETCODE_API = 'https://leetcode-api-faisalshohag.anga.codes/Anga205';

const initialized = new WeakSet<object>();

export function initLeetCodeCounts(root: ParentNode = document): void {
	if (initialized.has(root as object)) return;

	const summaries = root.querySelectorAll<HTMLElement>('[data-leetcode-summary]');
	if (summaries.length === 0) return;

	initialized.add(root as object);

	const format = (solved: number) =>
		`Not that quantity and quality are the same thing, but it's an achievement of consistency. This number currently sits at ${solved.toLocaleString('en-US')} solves`;

	fetch(LEETCODE_API)
		.then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
		.then((data: { totalSolved?: unknown }) => {
			const solved = Number(data?.totalSolved);
			if (!Number.isFinite(solved) || solved <= 0) return;

			for (const element of summaries) {
				element.textContent = format(solved);
			}
		})
		// A failed request leaves the static "1337+ solves" in place.
		.catch(() => {});
}
