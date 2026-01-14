export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function workflowSlug(id: number, name: string): string {
  const nameSlug = slugify(name || "workflow");
  return `${id}-${nameSlug}`;
}

export function parseWorkflowIdFromSlug(slug?: string | null): number | null {
  if (!slug) return null;
  const match = slug.match(/^(\d+)/);
  if (!match) return null;
  const id = Number.parseInt(match[1], 10);
  return Number.isFinite(id) ? id : null;
}
