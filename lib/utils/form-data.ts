export function parseFormId(formData: FormData): string | null {
  const id = formData.get("id");
  return typeof id === "string" && id ? id : null;
}
