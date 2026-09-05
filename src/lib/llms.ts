/**
 * Markdown renderers for the `llms.txt` endpoints.
 *
 * `llms.txt` is a curated index (https://llmstxt.org/): a short summary plus
 * links, small enough to fit in a context window. `llms-full.txt` is the same
 * content expanded to the full prose, for crawlers that want everything.
 *
 * Both are generated from the data modules, so they cannot drift from the
 * pages they describe.
 */
import {
	ACHIEVEMENTS,
	CATEGORY_LABELS,
	UNIVERSITY_ACHIEVEMENTS,
	hasDetailPage,
	type Achievement,
} from '../data/achievements';
import { PROJECTS } from '../data/projects';
import { PROFILE } from '../data/profile';
import { SITE_URL, absoluteUrl } from './site';

/** Strip the HTML that overview paragraphs are allowed to contain. */
function stripHtml(value: string): string {
	return value
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** The canonical URL for an achievement, honouring `href` overrides. */
function achievementUrl(achievement: Achievement): string {
	if (achievement.href) return absoluteUrl(achievement.href);
	const base = achievement.category === 'leadership' ? '/university' : '/achievements';
	return absoluteUrl(`${base}/${achievement.slug}`);
}

/** One line per achievement: title, result, date, and where to read more. */
function achievementLine(achievement: Achievement): string {
	const parts = [`**${achievement.title}**`, `— ${achievement.result}`, `(${achievement.date})`];
	const line = parts.join(' ');
	const detail = hasDetailPage(achievement) ? ` [details](${achievementUrl(achievement)})` : '';
	return `- ${line}: ${achievement.summary}${detail}`;
}

/** Group achievements by their category label, preserving catalogue order. */
function groupedAchievements(): Array<[string, Achievement[]]> {
	const groups = new Map<string, Achievement[]>();
	for (const achievement of ACHIEVEMENTS) {
		const label = CATEGORY_LABELS[achievement.category];
		const bucket = groups.get(label) ?? [];
		bucket.push(achievement);
		groups.set(label, bucket);
	}
	return [...groups.entries()];
}

/** The curated index. */
export function renderLlmsIndex(): string {
	const lines: string[] = [];

	lines.push(`# ${PROFILE.name}`);
	lines.push('');
	lines.push(`> ${PROFILE.description}`);
	lines.push('');
	lines.push(
		`Canonical site: ${SITE_URL}. Contact: ${PROFILE.email}. Based in ${PROFILE.address.addressLocality}, ${PROFILE.address.addressRegion}, India.`,
	);
	lines.push('');

	lines.push('## Pages');
	lines.push('');
	lines.push(`- [Home](${SITE_URL}/): who he is, what he is studying, and how to get in touch.`);
	lines.push(`- [Projects](${SITE_URL}/projects): software he has built and shipped.`);
	lines.push(`- [University](${SITE_URL}/university): clubs, teaching, internships, and talks.`);
	lines.push(`- [Achievements](${SITE_URL}/achievements): hackathons, contests, research, and open source.`);
	lines.push(`- [Philosophy](${SITE_URL}/philosophy): how he thinks about building software.`);
	lines.push('');

	lines.push('## Projects');
	lines.push('');
	for (const project of PROJECTS) {
		const links = [project.live, project.repo].filter(Boolean).join(', ');
		const detail = project.detail ? ` [write-up](${absoluteUrl(project.detail)})` : '';
		lines.push(
			`- **${project.name}** (${project.year}, ${project.status}): ${project.summary} Stack: ${project.stack.join(', ')}.${detail}${links ? ` Links: ${links}.` : ''}`,
		);
	}
	lines.push('');

	for (const [label, items] of groupedAchievements()) {
		lines.push(`## ${label}`);
		lines.push('');
		for (const achievement of items) lines.push(achievementLine(achievement));
		lines.push('');
	}

	lines.push('## Profiles');
	lines.push('');
	for (const url of PROFILE.sameAs) lines.push(`- ${url}`);
	lines.push('');

	lines.push('## Optional');
	lines.push('');
	lines.push(`- [Full content](${SITE_URL}/llms-full.txt): every page as plain markdown.`);
	lines.push('');

	return lines.join('\n');
}

/** The expanded document: full prose for every entry. */
export function renderLlmsFull(): string {
	const lines: string[] = [];

	lines.push(`# ${PROFILE.name} — full content`);
	lines.push('');
	lines.push(`> ${PROFILE.description}`);
	lines.push('');
	lines.push(`Source: ${SITE_URL}`);
	lines.push('');

	lines.push('## About');
	lines.push('');
	lines.push(
		`${PROFILE.name} is a ${PROFILE.jobTitle.toLowerCase()} studying Computer Science & Engineering at ${PROFILE.alumniOf.name} (${PROFILE.studyPeriod.start}–${PROFILE.studyPeriod.end}). He is based in ${PROFILE.address.addressLocality}, ${PROFILE.address.addressRegion}, India.`,
	);
	lines.push('');
	lines.push(`Email: ${PROFILE.email}`);
	lines.push('');
	lines.push(`Profiles: ${PROFILE.sameAs.join(', ')}`);
	lines.push('');

	lines.push('## Projects');
	lines.push('');
	for (const project of PROJECTS) {
		lines.push(`### ${project.name}`);
		lines.push('');
		lines.push(`${project.year} · ${project.status} · ${project.stack.join(', ')}`);
		lines.push('');
		lines.push(project.description);
		lines.push('');
		const links = [
			project.live && `live: ${project.live}`,
			project.repo && `repo: ${project.repo}`,
			project.docs && `docs: ${project.docs}`,
			project.post && `post: ${project.post}`,
			project.detail && `write-up: ${absoluteUrl(project.detail)}`,
		].filter(Boolean);
		if (links.length > 0) {
			lines.push(links.join(' · '));
			lines.push('');
		}
	}

	for (const [label, items] of groupedAchievements()) {
		lines.push(`## ${label}`);
		lines.push('');
		for (const achievement of items) {
			lines.push(`### ${achievement.title}`);
			lines.push('');
			lines.push(
				`${achievement.result} · ${achievement.date}${achievement.organization ? ` · ${achievement.organization}` : ''}`,
			);
			lines.push('');
			lines.push(achievement.description);
			lines.push('');
			for (const paragraph of achievement.detail.overview) {
				lines.push(stripHtml(paragraph));
				lines.push('');
			}
			if (achievement.detail.highlights?.length) {
				for (const highlight of achievement.detail.highlights) {
					lines.push(`- ${highlight}`);
				}
				lines.push('');
			}
			if (achievement.detail.stack?.length) {
				lines.push(`Stack: ${achievement.detail.stack.join(', ')}`);
				lines.push('');
			}
			if (achievement.links?.length) {
				lines.push(achievement.links.map((link) => `${link.label}: ${link.href}`).join(' · '));
				lines.push('');
			}
			if (hasDetailPage(achievement)) {
				lines.push(`Read more: ${achievementUrl(achievement)}`);
				lines.push('');
			}
		}
	}

	// University entries are already covered above when their category is
	// `leadership`; this only adds the ones surfaced via `alsoUniversity`.
	const extraUniversity = UNIVERSITY_ACHIEVEMENTS.filter(
		(achievement) => achievement.category !== 'leadership',
	);
	if (extraUniversity.length > 0) {
		lines.push('## Also on the university page');
		lines.push('');
		for (const achievement of extraUniversity) {
			lines.push(`- ${achievement.title} — ${achievement.summary} (${achievementUrl(achievement)})`);
		}
		lines.push('');
	}

	return lines.join('\n');
}
