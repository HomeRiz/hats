import React, { useRef, useState } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Code2 } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { defaultGlassTheme } from '../../presets/defaultThemes';
import { processBackgroundImage } from '../../services/imageProcessor';
import { importThemeFiles, validateImageFile, ImportedImage } from '../../services/themeImport';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (themes: ThemeConfig[]) => void;
}

const pickerClass =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors';
const textareaClass =
  'w-full mt-2 rounded-lg bg-slate-950 border border-slate-800 p-2 font-mono text-[11px] text-slate-300 leading-relaxed focus:outline-none focus:border-blue-500';

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [yamlText, setYamlText] = useState('');
  const [yamlName, setYamlName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [snippetText, setSnippetText] = useState('');
  const [snippetName, setSnippetName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const yamlInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const snippetInput = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const loadYaml = async (file: File) => {
    setYamlText(await file.text());
    setYamlName(file.name);
    setError(null);
  };

  const loadSnippet = async (file: File) => {
    setSnippetText(await file.text());
    setSnippetName(file.name);
    setError(null);
  };

  const chooseImage = (file: File) => {
    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setImageFile(file);
    setError(null);
  };

  const handleImport = async () => {
    setBusy(true);
    setError(null);
    try {
      let image: ImportedImage | undefined;
      if (imageFile) {
        const processed = await processBackgroundImage(imageFile, 1920, 1080, defaultGlassTheme.background.darken);
        image = { dataUrl: processed.dataUrl, avgColor: processed.avgColor, fileName: imageFile.name };
      }
      const result = importThemeFiles({ yamlText, image, snippetText });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onImport(result.themes);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not import these files.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Import theme"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Import theme</span>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Bring a theme into HATS to preview and edit it. You can load up to three things. Only the theme YAML is required.
          </p>

          <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Theme YAML</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">Required</span>
              </div>
              <button type="button" onClick={() => yamlInput.current?.click()} className={pickerClass}>
                Choose file
              </button>
              <input
                ref={yamlInput}
                type="file"
                accept=".yaml,.yml"
                aria-label="Theme YAML file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && loadYaml(e.target.files[0])}
              />
            </div>
            <p className="mt-1.5 text-slate-400">
              The theme file that goes in <code className="text-blue-300">/config/themes</code>. One file can hold several themes, and all of them are imported.
              Choose a file or paste the YAML.
            </p>
            {yamlName && <p className="mt-1 text-emerald-400">Loaded {yamlName}</p>}
            <textarea
              aria-label="Theme YAML"
              rows={5}
              value={yamlText}
              onChange={(e) => {
                setYamlText(e.target.value);
                setYamlName('');
              }}
              placeholder={'My Theme:\n  primary-color: "#336699"'}
              className={textareaClass}
            />
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>Background image</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Optional</span>
              </div>
              <button type="button" onClick={() => imageInput.current?.click()} className={pickerClass}>
                Choose image
              </button>
              <input
                ref={imageInput}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                aria-label="Background image file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && chooseImage(e.target.files[0])}
              />
            </div>
            <p className="mt-1.5 text-slate-400">
              The picture the theme uses as its background, if it has one. PNG, JPEG, WebP or GIF up to 15 MB. It is resized to 1920x1080 and used for every theme in the file.
            </p>
            {imageFile && (
              <p className="mt-1 text-emerald-400">
                {imageFile.name}{' '}
                <button type="button" onClick={() => setImageFile(null)} className="text-slate-400 hover:text-white underline">
                  Remove
                </button>
              </p>
            )}
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Code2 className="w-4 h-4 text-blue-400" />
                <span>Per-view snippet</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Optional</span>
              </div>
              <button type="button" onClick={() => snippetInput.current?.click()} className={pickerClass}>
                Choose file
              </button>
              <input
                ref={snippetInput}
                type="file"
                accept=".yaml,.yml,.txt"
                aria-label="Per-view snippet file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && loadSnippet(e.target.files[0])}
              />
            </div>
            <p className="mt-1.5 text-slate-400">
              The <code className="text-blue-300">card_mod</code> block some themes ask you to paste into a dashboard view in the Raw configuration editor. HATS keeps it with the theme and includes it in the Export zip.
              Choose a file or paste the code.
            </p>
            {snippetName && <p className="mt-1 text-emerald-400">Loaded {snippetName}</p>}
            <textarea
              aria-label="Per-view snippet"
              rows={4}
              value={snippetText}
              onChange={(e) => {
                setSnippetText(e.target.value);
                setSnippetName('');
              }}
              placeholder={'- title: Home\n  path: home\n  card_mod:\n    style: |\n      ...'}
              className={textareaClass}
            />
          </section>

          {error && <div role="alert" className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-red-400 font-medium">{error}</div>}
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-900">
          <button type="button" onClick={onClose} className={pickerClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={busy || !yamlText.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{busy ? 'Importing...' : 'Import'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
