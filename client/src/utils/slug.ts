export function createSlug(title?: string): string {
  if (!title) return 'event';
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

export function getEventDetailHash(event: { _id?: string; id?: string; title?: string } | string | any): string {
  if (!event) return '#home';
  if (typeof event === 'string') {
    return `#event-detail-${event}`;
  }
  const id = event._id || event.id || '';
  const slug = createSlug(event.title || '');
  
  // Keep original format for Dandiya Raas event to avoid breaking live links
  if (id === '6abf5c3927319d794ee7bac4') {
    return `#event-detail-${slug}--${id}`;
  }

  if (slug) {
    return `#event-detail-${slug}`;
  } else if (id) {
    return `#event-detail-${id}`;
  }
  return `#home`;
}
