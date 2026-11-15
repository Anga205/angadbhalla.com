/**
 * /robots.txt
 *
 * Generated rather than static so the sitemap URL always matches `site` in
 * astro.config.mjs. AI crawlers are allowed explicitly: the point of the
 * `llms.txt` endpoints is to be read.
 */
import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/site';

export const GET: APIRoute = () => {
	const body = `# ${SITE_URL}
User-agent: *
Allow: /

# AI crawlers are welcome; /llms.txt is the curated index.
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${SITE_URL}/sitemap-index.xml
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
