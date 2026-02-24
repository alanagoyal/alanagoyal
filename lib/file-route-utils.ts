export const HOME_DIR = "/Users/alanagoyal";
export const PROJECTS_DIR = `${HOME_DIR}/Projects`;

export function isSupportedTextEditPath(filePath: string): boolean {
  if (!filePath) return false;
  if (filePath.startsWith(`${PROJECTS_DIR}/`)) return true;
  return filePath === `${HOME_DIR}/Desktop/hello.md`;
}
