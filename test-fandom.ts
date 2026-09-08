import { MediaWikiClient } from './src/lib/mediawiki.ts';

const client = new MediaWikiClient({
  endpoint: 'https://genshin-impact.fandom.com',
  userAgent: 'HoYoDexBot/0.1 (https://hoyodex.com; tech@hoyodex.com)',
  concurrency: 1
});

async function main() {
  try {
    const url = new URL('https://genshin-impact.fandom.com/api.php?action=query&generator=allpages&gaplimit=1&format=json&formatversion=2');
    const res = await fetch(url, { headers: { 'User-Agent': 'HoYoDexBot/0.1 (https://hoyodex.com; tech@hoyodex.com)' } });
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Body length:', text.length);
    console.log('Body snippet:', text.slice(0, 500));
  } catch (err) {
    console.error(err);
  }
}

main();
