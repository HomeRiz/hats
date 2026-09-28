import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useThemeStore } from './state/useThemeStore';
import { Navbar } from './components/navbar/Navbar';
import { ThemeEditor } from './components/editor/ThemeEditor';
import { DashboardPreview } from './components/preview/DashboardPreview';
import { generateHomeAssistantThemeYaml } from './services/yamlGenerator';
import { getHaDiagnostics } from './services/haService';
import { useLiveDashboardData } from './services/useLiveDashboardData';

const ThemeGallery = lazy(() => import('./components/library/ThemeGallery').then((m) => ({ default: m.ThemeGallery })));
const CommunityHub = lazy(() => import('./components/github/CommunityHub').then((m) => ({ default: m.CommunityHub })));
const SubmitPrModal = lazy(() => import('./components/github/SubmitPrModal').then((m) => ({ default: m.SubmitPrModal })));
const ExportModal = lazy(() => import('./components/export/ExportModal').then((m) => ({ default: m.ExportModal })));
const PrerequisitesDoctorModal = lazy(() => import('./components/common/PrerequisitesDoctorModal').then((m) => ({ default: m.PrerequisitesDoctorModal })));

const TabLoading: React.FC = () => (
  <div className="flex-1 h-full flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
  </div>
);

export const App: React.FC = () => {
  const {
    themes,
    setThemes,
    activeTheme,
    activeThemeId,
    setActiveThemeId,
    updateActiveTheme,
    createNewTheme,
    duplicateTheme,
    deleteTheme,
    previewMode,
    setPreviewMode,
    activeView,
    setActiveView,
    activeTab,
    setActiveTab,
    communitySubmissions,
    voteOnCommunityTheme,
    addCommunitySubmission,
    syncInstalledThemesFromHa,
  } = useThemeStore();

  const liveDashboardData = useLiveDashboardData();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSubmitPrOpen, setIsSubmitPrOpen] = useState(false);
  const [isDoctorOpen, setIsDoctorOpen] = useState(false);
  const [isDoctorReady, setIsDoctorReady] = useState(true);
  const [hasPendingDoctorAction, setHasPendingDoctorAction] = useState(false);

  const checkDiagnostics = async () => {
    const diag = await getHaDiagnostics();
    if (diag) {
      setIsDoctorReady(diag.readyForGlassmorphism);
      setHasPendingDoctorAction(Boolean(diag.cardModNeedsConfig || !diag.readyForThemes));
    }
  };

  useEffect(() => {
    checkDiagnostics();
  }, []);

  const { background, customSvgOverlay } = activeTheme;
  let appBgStyle: React.CSSProperties = {};
  if (background.type === 'image' && background.imageUrl) {
    appBgStyle = {
      backgroundImage: `url(${background.imageUrl})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
    };
  } else if (background.type === 'gradient' && background.gradientString) {
    appBgStyle = {
      backgroundImage: background.gradientString,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    };
  } else if (background.type === 'solid' && background.solidColor) {
    appBgStyle = {
      backgroundColor: background.solidColor,
    };
  }

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div 
        className="absolute inset-0 z-0 transition-all duration-700 pointer-events-none"
        style={appBgStyle}
      />
      {customSvgOverlay && customSvgOverlay.trim().startsWith('<svg') && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-30 transition-all duration-700"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(customSvgOverlay)}")`,
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center',
          }}
        />
      )}
      <div className="absolute inset-0 z-0 bg-slate-950/75 backdrop-blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        <Navbar
          activeTheme={activeTheme}
          allThemes={themes}
          onSelectTheme={setActiveThemeId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenSubmitPr={() => setIsSubmitPrOpen(true)}
          onNewTheme={() => createNewTheme()}
          onOpenDoctor={() => setIsDoctorOpen(true)}
          isDoctorReady={isDoctorReady}
          hasPendingDoctorAction={hasPendingDoctorAction}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {activeTab === 'editor' && (
            <>
              <div className="w-full md:w-[420px] lg:w-[460px] h-full shrink-0 z-20 shadow-2xl">
                <ThemeEditor
                  theme={activeTheme}
                  onChange={updateActiveTheme}
                  onOpenExport={() => setIsExportOpen(true)}
                />
              </div>

              <div className="flex-1 h-full relative overflow-hidden bg-slate-950/60">
                <DashboardPreview
                  theme={activeTheme}
                  previewMode={previewMode}
                  activeView={activeView}
                  setActiveView={setActiveView}
                />
              </div>
            </>
          )}

          {activeTab === 'library' && (
            <div className="flex-1 h-full overflow-y-auto bg-slate-950/40 backdrop-blur-md">
              <Suspense fallback={<TabLoading />}>
              <ThemeGallery
                themes={themes}
                activeThemeId={activeThemeId}
                liveDashboardData={liveDashboardData}
                onSelectTheme={(id) => {
                  setActiveThemeId(id);
                  setActiveTab('editor');
                }}
                onNewTheme={() => createNewTheme()}
                onDuplicateTheme={duplicateTheme}
                onDeleteTheme={deleteTheme}
                onSyncHaThemes={syncInstalledThemesFromHa}
                onImportThemes={(imported) => {
                  setThemes((prev) => [...imported, ...prev]);
                  if (imported[0]) setActiveThemeId(imported[0].id);
                }}
                onSwitchToEditor={() => setActiveTab('editor')}
                onOpenDoctor={() => setIsDoctorOpen(true)}
                isDoctorReady={isDoctorReady}
              />
              </Suspense>
            </div>
          )}

          {activeTab === 'community' && (
            <div className="flex-1 h-full overflow-y-auto bg-slate-950/40 backdrop-blur-md">
              <Suspense fallback={<TabLoading />}>
              <CommunityHub
                submissions={communitySubmissions}
                onVote={voteOnCommunityTheme}
                onApplyTheme={(theme) => {
                  const existing = themes.find((t) => t.id === theme.id);
                  if (!existing) {
                    setThemes((prev) => [theme, ...prev]);
                  }
                  setActiveThemeId(theme.id);
                  setActiveTab('editor');
                }}
                onOpenSubmitPr={() => setIsSubmitPrOpen(true)}
              />
              </Suspense>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="flex-1 h-full p-6 overflow-y-auto bg-slate-950/40 backdrop-blur-md max-w-5xl mx-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">Generated Home Assistant Theme YAML</h2>
                <p className="text-xs text-slate-400">Live generated for: {activeTheme.name}</p>
              </div>
              <button
                onClick={() => setIsExportOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Export / Download
              </button>
            </div>
            <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto select-all">
              {generateHomeAssistantThemeYaml(activeTheme, 'local')}
            </pre>
          </div>
        )}
      </div>

      {isExportOpen && (
        <Suspense fallback={null}>
          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            theme={activeTheme}
            onThemeSaved={() => {
              updateActiveTheme({ isInstalled: true });
            }}
          />
        </Suspense>
      )}

      {isSubmitPrOpen && (
        <Suspense fallback={null}>
          <SubmitPrModal
            isOpen={isSubmitPrOpen}
            onClose={() => setIsSubmitPrOpen(false)}
            theme={activeTheme}
            onSubmitSuccess={(theme, prUrl) => {
              addCommunitySubmission(theme, prUrl);
            }}
          />
        </Suspense>
      )}

      {isDoctorOpen && (
        <Suspense fallback={null}>
          <PrerequisitesDoctorModal
            isOpen={isDoctorOpen}
            onClose={() => setIsDoctorOpen(false)}
            onConfigFixed={() => {
              checkDiagnostics();
            }}
            themes={themes}
          />
        </Suspense>
      )}
      </div>
    </div>
  );
};
