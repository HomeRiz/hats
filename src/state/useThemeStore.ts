import { useState, useEffect, useCallback } from 'react';
import { ThemeConfig, CommunityThemeSubmission } from '../types/theme';
import { defaultThemes, defaultGlassTheme } from '../presets/defaultThemes';
import { fetchInstalledHaThemes, deleteHaTheme } from '../services/haService';
import { processBackgroundImage } from '../services/imageProcessor';
import { mergeSyncedThemes } from '../services/themeSync';
import alpineLightningLake from '../assets/backgrounds/alpine-lightning-lake.jpg';
import { IS_HOSTED } from '../runtime';

const STORAGE_KEY_CUSTOM = 'hats_custom_themes_v2';
const STORAGE_KEY_ACTIVE = 'hats_active_theme_id_v2';
const STORAGE_KEY_COMMUNITY = 'hats_community_submissions_v2';

try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.includes('ha_theme_studio') || k.includes('ultimate') || k === 'hats_themes_v1')) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
} catch (e) {
  console.warn('Could not purge legacy localStorage keys:', e);
}

function loadSavedCustomThemes(): ThemeConfig[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM);
    if (!saved) return [];
    const parsed: ThemeConfig[] = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.filter(t => t && t.id && !t.name.toLowerCase().startsWith('ultimate') && !t.id.toLowerCase().startsWith('ultimate'));
    }
    return [];
  } catch {
    return [];
  }
}

const initialCommunitySubmissions: CommunityThemeSubmission[] = [];

export function useThemeStore() {
  const [themes, setThemes] = useState<ThemeConfig[]>(() => {
    const custom = loadSavedCustomThemes();
    if (IS_HOSTED) {
      try {
        localStorage.removeItem(STORAGE_KEY_CUSTOM);
      } catch {
      }
      return [...defaultThemes];
    }
    return [...defaultThemes, ...custom];
  });

  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE) || defaultThemes[0].id;
    } catch {
      return defaultThemes[0].id;
    }
  });

  const [previewMode, setPreviewMode] = useState<'dark' | 'light'>('dark');
  const [activeView, setActiveView] = useState<'home' | 'climate' | 'media' | 'security'>('home');
  const [activeTab, setActiveTab] = useState<'editor' | 'library' | 'community' | 'code'>('editor');

  const [communitySubmissions, setCommunitySubmissions] = useState<CommunityThemeSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMMUNITY);
      return saved ? JSON.parse(saved) : initialCommunitySubmissions;
    } catch {
      return initialCommunitySubmissions;
    }
  });

  useEffect(() => {
    const customOnly = themes.filter(t => t.isCustom && !t.installedFilePath && !t.name.toLowerCase().startsWith('ultimate'));
    if (IS_HOSTED) return;
    const withoutPixels = (t: ThemeConfig): ThemeConfig =>
      t.background.imageUrl?.startsWith('data:')
        ? { ...t, background: { ...t.background, type: 'gradient', imageUrl: undefined } }
        : t;
    const attempts = [
      customOnly,
      customOnly.map(t => (t.id === activeThemeId ? t : withoutPixels(t))),
      customOnly.map(withoutPixels),
    ];
    for (const attempt of attempts) {
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(attempt));
        return;
      } catch {
      }
    }
    console.warn('Could not save theme drafts: browser storage is full.');
  }, [themes, activeThemeId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE, activeThemeId);
  }, [activeThemeId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMMUNITY, JSON.stringify(communitySubmissions));
  }, [communitySubmissions]);

  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0] || defaultGlassTheme;

  const syncInstalledThemesFromHa = useCallback(async () => {
    if (IS_HOSTED) return;
    const syncStartedAt = Date.now();
    try {
      const installed = await fetchInstalledHaThemes();
      if (installed && installed.length > 0) {
        const cleanInstalled = installed.filter(t => !t.name.toLowerCase().startsWith('ultimate'));
        setThemes(prev => mergeSyncedThemes(prev, cleanInstalled, defaultThemes, syncStartedAt));
      }
    } catch (e) {
      console.warn('Could not auto-sync themes from Home Assistant:', e);
    }
  }, []);

  useEffect(() => {
    syncInstalledThemesFromHa();
  }, [syncInstalledThemesFromHa]);

  const updateActiveTheme = (updates: Partial<ThemeConfig>) => {
    setThemes(prev => prev.map(t => {
      if (t.id === activeThemeId) {
        return {
          ...t,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    }));
  };

  const createNewTheme = (template: Partial<ThemeConfig> = {}) => {
    const newId = `custom-theme-${Date.now().toString(36)}`;
    const newTheme: ThemeConfig = {
      ...defaultGlassTheme,
      id: newId,
      name: template.name || 'New HATS Theme',
      category: template.category || 'Glass',
      author: 'You',
      description: 'A custom designed Home Assistant liquid glass theme.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true,
      isInstalled: false,
      ...template,
    };

    setThemes(prev => [newTheme, ...prev]);
    setActiveThemeId(newId);
    setActiveTab('editor');

    if (!template.background) {
      processBackgroundImage(alpineLightningLake, 1920, 1080, defaultGlassTheme.background.darken)
        .then((result) => {
          setThemes(prev => prev.map(t => t.id === newId ? {
            ...t,
            background: {
              ...t.background,
              type: 'image',
              imageUrl: result.dataUrl,
              imageFileName: 'alpine-lightning-lake.jpg',
              avgColor: result.avgColor,
            },
            palette: { ...t.palette, accent: '#E8A54D' },
            engine: { ...t.engine, glowColor: '#E8A54D' },
          } : t));
        })
        .catch((err) => console.error('Failed to set default theme background:', err));
    }

    return newTheme;
  };

  const duplicateTheme = (themeId: string) => {
    const source = themes.find(t => t.id === themeId);
    if (!source) return;

    const newId = `${source.id}-copy-${Date.now().toString(36).slice(-4)}`;
    const copy: ThemeConfig = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true,
      isInstalled: false,
      installedFilePath: undefined,
    };

    setThemes(prev => [copy, ...prev]);
    setActiveThemeId(newId);
  };

  const deleteTheme = async (themeId: string) => {
    try {
      await deleteHaTheme(themeId);
    } catch (e) {
      console.warn('Error deleting theme from HA:', e);
    }

    setThemes(prev => {
      const target = prev.find(t => t.id === themeId);
      let filtered: ThemeConfig[];
      if (target && !target.isCustom && target.isInstalled) {
        filtered = prev.map(t => t.id === themeId ? { ...t, isInstalled: false, installedFilePath: undefined } : t);
      } else {
        filtered = prev.filter(t => t.id !== themeId);
      }
      if (filtered.length === 0) return [defaultGlassTheme];
      return filtered;
    });

    if (activeThemeId === themeId) {
      const fallback = themes.find(t => t.id !== themeId) || defaultGlassTheme;
      setActiveThemeId(fallback.id);
    }
  };

  const uninstallTheme = async (themeId: string) => {
    try {
      await deleteHaTheme(themeId);
    } catch (e) {
      console.warn('Error uninstalling theme from HA:', e);
    }
    setThemes(prev => prev.map(t => t.id === themeId ? { ...t, isInstalled: false, installedFilePath: undefined } : t));
  };

  const voteOnCommunityTheme = (submissionId: string, type: 'up' | 'down') => {
    setCommunitySubmissions(prev => prev.map(sub => {
      if (sub.id === submissionId) {
        if (sub.userVoted === type) {
          return {
            ...sub,
            upvotes: type === 'up' ? sub.upvotes - 1 : sub.upvotes,
            downvotes: type === 'down' ? sub.downvotes - 1 : sub.downvotes,
            userVoted: undefined,
          };
        }

        const prevUp = sub.userVoted === 'up' ? 1 : 0;
        const prevDown = sub.userVoted === 'down' ? 1 : 0;

        return {
          ...sub,
          upvotes: type === 'up' ? sub.upvotes + 1 - prevUp : sub.upvotes - prevUp,
          downvotes: type === 'down' ? sub.downvotes + 1 - prevDown : sub.downvotes - prevDown,
          userVoted: type,
        };
      }
      return sub;
    }));
  };

  const addCommunitySubmission = (theme: ThemeConfig, prUrl?: string) => {
    const newSubmission: CommunityThemeSubmission = {
      id: `sub-${Date.now().toString(36)}`,
      theme,
      status: 'pending',
      upvotes: 1,
      downvotes: 0,
      userVoted: 'up',
      prUrl: prUrl || `https://github.com/HomeRiz/hats/pull/${Math.floor(100 + Math.random() * 900)}`,
      commentsCount: 0,
    };

    setCommunitySubmissions(prev => [newSubmission, ...prev]);
  };

  return {
    themes,
    setThemes,
    activeTheme,
    activeThemeId,
    setActiveThemeId,
    updateActiveTheme,
    createNewTheme,
    duplicateTheme,
    deleteTheme,
    uninstallTheme,
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
  };
}
