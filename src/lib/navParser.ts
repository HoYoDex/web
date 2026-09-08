import type { NavItem } from './games';

export async function fetchLiveNavigation(gameSlug: string): Promise<NavItem[]> {
  try {
    const res = await fetch(`https://${gameSlug}.fandom.com/api.php?action=query&prop=revisions&titles=MediaWiki:Wiki-navigation&rvprop=content&format=json`);
    const json = await res.json();
    const pages = json.query?.pages;
    if (!pages) return [];
    
    const pageId = Object.keys(pages)[0];
    const content = pages[pageId]?.revisions?.[0]?.['*'];
    if (!content) return [];
    
    return parseMediaWikiNav(content);
  } catch (e) {
    console.error('Failed to fetch live nav for', gameSlug, e);
    return [];
  }
}

export function parseMediaWikiNav(text: string): NavItem[] {
  const lines = text.split('\n');
  const root: NavItem[] = [];
  const stack: { level: number, item: NavItem }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('*')) continue;
    
    // Count stars
    let level = 0;
    while (trimmed[level] === '*') {
      level++;
    }
    
    const rest = trimmed.substring(level).trim();
    let target = rest;
    let label = rest;
    
    if (rest.includes('|')) {
      const parts = rest.split('|');
      target = parts[0].trim();
      label = parts[1].trim();
    }
    
    // Some Fandom wikis leave top level completely blank for spacing, or just *|Section
    if (!label && !target) {
        label = "Explore";
    }
    
    // Clean up html entities and category prefixes
    label = label.replace(/&nbsp;/g, ' ').replace(/<!--[\s\S]*?-->/g, '').trim();
    target = target.replace(/&nbsp;/g, ' ').replace(/<!--[\s\S]*?-->/g, '').trim();
    
    if (target.startsWith('Category:')) {
      target = target.substring('Category:'.length);
    }
    
    const item: NavItem = { label: label || target, query: target, items: [] };
    
    // If it's the top level
    if (level === 1) {
      if (!item.label) item.label = 'Menu';
      root.push(item);
      stack.length = 0;
      stack.push({ level, item });
    } else {
      // Find parent in stack
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      if (stack.length > 0) {
        stack[stack.length - 1].item.items!.push(item);
        stack.push({ level, item });
      } else {
        // Fallback if formatting is weird
        root.push(item);
        stack.push({ level, item });
      }
    }
  }
  
  // Cleanup empty items arrays
  const cleanup = (items: NavItem[]) => {
    for (const item of items) {
      if (item.items?.length === 0) {
        delete item.items;
      } else if (item.items) {
        cleanup(item.items);
      }
    }
  };
  cleanup(root);
  
  // Filter out completely empty top-level items
  return root.filter(i => i.label || i.items);
}
