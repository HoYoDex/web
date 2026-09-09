/**
 * Minimal, polite MediaWiki Action API client.
 *
 * Deliberately conservative: a single in-flight budget, `maxlag` so we back off
 * when the wiki is under load, and a real User-Agent. We are a guest on someone
 * else's infrastructure, so the defaults here favour the server over our build time.
 */

export interface MwConfig {
  /** Origin of the wiki, no trailing slash. */
  endpoint: string;
  /** Contact string sent in User-Agent, per the Wikimedia UA policy. */
  userAgent: string;
  /** Max concurrent requests. */
  concurrency?: number;
}

export interface MwPageStub {
  pageid: number;
  title: string;
  /** Latest revision id — our change digest. */
  revid: number;
  touched: string;
  categories?: string[];
}

export interface MwParsedPage {
  pageid: number;
  title: string;
  displaytitle: string;
  html: string;
  categories: string[];
  sections: { level: number; line: string; anchor: string }[];
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export class MediaWikiClient {
  #endpoint: string;
  #ua: string;
  #limit: number;
  #active = 0;
  #queue: (() => void)[] = [];

  constructor(cfg: MwConfig) {
    this.#endpoint = cfg.endpoint.replace(/\/$/, '');
    this.#ua = cfg.userAgent;
    this.#limit = cfg.concurrency ?? 6;
  }

  async #slot<T>(fn: () => Promise<T>): Promise<T> {
    if (this.#active >= this.#limit) {
      await new Promise<void>((r) => this.#queue.push(r));
    }
    this.#active++;
    try {
      return await fn();
    } finally {
      this.#active--;
      this.#queue.shift()?.();
    }
  }

  async #get(params: Record<string, string | number>): Promise<any> {
    const url = new URL(`${this.#endpoint}/api.php`);
    for (const [k, v] of Object.entries({
      format: 'json',
      formatversion: '2',
      maxlag: '5',
      ...params,
    })) {
      url.searchParams.set(k, String(v));
    }

    return this.#slot(async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const res = await fetch(url, { headers: { 'User-Agent': this.#ua } });

        if (RETRYABLE.has(res.status)) {
          const retryAfter = Number(res.headers.get('retry-after')) || 0;
          await sleep(retryAfter * 1000 || 2 ** attempt * 500);
          continue;
        }
        if (!res.ok) {
          throw new Error(`MediaWiki ${res.status} ${res.statusText} for ${url.searchParams.get('action')}`);
        }

        const json = (await res.json()) as any;
        // maxlag rejections come back 200-with-error; treat them as retryable.
        if (json.error?.code === 'maxlag') {
          await sleep(2 ** attempt * 1000);
          continue;
        }
        if (json.error) {
          throw new Error(`MediaWiki API error: ${json.error.code} — ${json.error.info}`);
        }
        return json;
      }
      throw new Error(`MediaWiki request failed after 5 attempts: ${url}`);
    });
  }

  /** Every page in the given namespaces, with its current revision id. */
  async listPages(namespaces: number[] = [0]): Promise<MwPageStub[]> {
    const out: MwPageStub[] = [];

    for (const ns of namespaces) {
      let cont: Record<string, string> = {};
      let first = true;
      do {
        // A large wiki paginates into dozens of these (500/page), fired
        // back-to-back with no gap. A small pause between pages keeps our
        // own burst rate down without meaningfully slowing a build.
        if (!first) await sleep(150);
        first = false;

        const json = await this.#get({
          action: 'query',
          generator: 'allpages',
          gapnamespace: ns,
          gaplimit: 500,
          gapfilterredir: 'nonredirects',
          prop: 'revisions',
          rvprop: 'ids|timestamp',
          ...cont,
        });

        for (const p of Object.values(json.query?.pages ?? {}) as any[]) {
          const rev = p.revisions?.[0];
          if (!rev) continue;
          out.push({
            pageid: p.pageid,
            title: p.title,
            revid: rev.revid,
            touched: rev.timestamp,
            categories: [],
          });
        }
        cont = json.continue ?? {};
      } while (Object.keys(cont).length);
    }
    return out;
  }

  async fetchCategoryMembers(categoryTitle: string): Promise<number[]> {
    const out: number[] = [];
    let cont: Record<string, string> = {};
    do {
      const json = await this.#get({
        action: 'query',
        list: 'categorymembers',
        cmtitle: `Category:${categoryTitle}`,
        cmnamespace: 0,
        cmlimit: 'max',
        ...cont,
      });

      for (const p of json.query?.categorymembers ?? []) {
        out.push(p.pageid);
      }
      cont = json.continue ?? {};
    } while (Object.keys(cont).length);
    return out;
  }

  /**
   * Best-effort title resolution for a page we don't have a stored slug for
   * (e.g. one created upstream since the last build). Cheap, Fandom-cached
   * full-text search — not exact-match, so callers should treat a hit as a
   * "close enough" title rather than a guaranteed one.
   */
  async searchTitle(query: string): Promise<string | null> {
    const json = await this.#get({
      action: 'query',
      list: 'search',
      srsearch: query,
      srnamespace: 0,
      srlimit: 1,
    });
    return json.query?.search?.[0]?.title ?? null;
  }

  /** Fully rendered HTML for one page. */
  async parsePage(title: string): Promise<MwParsedPage> {
    const json = await this.#get({
      action: 'parse',
      page: title,
      prop: 'text|categories|displaytitle|sections',
      disableeditsection: 1,
      disabletoc: 1,
    });
    const p = json.parse;

    return {
      pageid: p.pageid,
      title: p.title,
      displaytitle: stripTags(p.displaytitle ?? p.title),
      html: p.text,
      categories: (p.categories ?? [])
        .filter((c: any) => !c.hidden)
        .map((c: any) => String(c.category).replace(/_/g, ' ')),
      sections: (p.sections ?? []).map((s: any) => ({
        level: Number(s.level),
        line: stripTags(s.line),
        anchor: s.anchor,
      })),
    };
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stripTags = (s: string) => s.replace(/<[^>]*>/g, '').trim();

/** Wiki title → URL slug. Reversible enough for our routing needs. */
export function toSlug(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Rewrite parser HTML so it works on our origin:
 * internal wiki links point at our routes, everything else is made absolute.
 */
export function rewriteHtml(html: string, endpoint: string, prefix: string): string {
  return (
    html
      // 1. Protocol-relative asset URLs (static.wikitide.net, etc.) -> https.
      .replace(/(src|srcset|href)="\/\//g, '$1="https://')
      // 2. Absolutise every root-relative URL to the upstream wiki. This must run
      //    BEFORE we slugify article links, otherwise it clobbers our own routes.
      //    Redlinks (?action=edit) and File:/Category: pages are intentionally
      //    left pointing upstream — they only exist there.
      .replace(/(src|srcset|href)="\/(?!\/)/g, `$1="${endpoint}/`)
      // 3. Now pull genuine article links back onto our own routes.
      .replace(
        new RegExp(`href="${endpoint}/wiki/([^"#?:]+)(#[^"]*)?"`, 'g'),
        (_m, page: string, hash = '') => {
          const title = decodeURIComponent(page).replace(/_/g, ' ');
          return `href="/wiki/${prefix}/${toSlug(title)}${hash}"`;
        }
      )
      // 4. Wiki content is untrusted-ish and must not break our page.
      .replace(/<a /g, '<a rel="noopener" ')
      .replace(/<img /g, '<img loading="lazy" decoding="async" ')
  );
}
