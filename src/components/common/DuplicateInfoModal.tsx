import React, { useState } from 'react';
import { Copy, X, Check } from 'lucide-react';

interface DuplicateInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  themeName: string;
}

export const DuplicateInfoModal: React.FC<DuplicateInfoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  themeName,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (dontShowAgain) {
      localStorage.setItem('hats_suppress_duplicate_modal', 'true');
    }
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-white text-sm">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Copy className="w-4 h-4" />
            </div>
            <span>Duplicate Theme</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          You can duplicate <strong className="text-white">"{themeName}"</strong> to safely customize and modify colors, artwork, and glass styles while preserving the original theme intact.
        </p>

        <label className="flex items-center gap-2.5 text-xs text-slate-400 cursor-pointer pt-2 select-none hover:text-slate-200">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 focus:ring-offset-0"
          />
          <span>Don't show this message again</span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-all"
          >
            Proceed & Duplicate
          </button>
        </div>
      </div>
    </div>
  );
};
