/** True for absolute http(s) URLs. Used before rendering a URL as a link. */
export function isHttpUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}
