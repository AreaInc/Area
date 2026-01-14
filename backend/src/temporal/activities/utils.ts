export function replaceTemplateVariables(
  template: string,
  data?: Record<string, any>,
): string {
  if (!data) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key]?.toString() || match;
  });
}
