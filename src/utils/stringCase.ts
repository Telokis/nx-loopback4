function clearAndUpper(text: string): string {
  return text.replace(/-/, "").toUpperCase();
}

export function toCamelCase(text: string): string {
  return text.replace(/-\w/g, clearAndUpper);
}

export function toPascalCase(text: string): string {
  return text.replace(/(^\w|-\w)/g, clearAndUpper);
}

export function toKebabCase(text: string): string {
  return text.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $).toLowerCase();
}
