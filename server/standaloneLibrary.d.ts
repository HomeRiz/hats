export const MAX_LIBRARY_YAML_BYTES: number;
export const MAX_LIBRARY_IMAGE_BYTES: number;
export function libraryFolders(libraryDir: string): { libraryDir: string; importedDir: string; exportsDir: string };
export function ensureLibrary(libraryDir: string): { libraryDir: string; importedDir: string; exportsDir: string };
export function safeFileStem(name: unknown, fallback?: string): string;
export function saveImportedTheme(input: { libraryDir: string; yamlText: string; imageDataUrl?: string }): { yamlPath: string; imagePath?: string; importedDir: string };
