export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function workflowSlug(id: number | string, name: string): string {
  const nameSlug = slugify(name || "workflow");
  return `${id}-${nameSlug}`;
}

export function parseWorkflowIdFromSlug(slug?: string | null): string | null {
  if (!slug) return null;
  const match = slug.match(/^(\d+)/);
  if (!match) return null;
  return match[1];
}
