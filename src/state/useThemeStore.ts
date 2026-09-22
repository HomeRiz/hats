import { useState, useEffect, useCallback } from 'react';
import { ThemeConfig, CommunityThemeSubmission } from '../types/theme';
import { defaultThemes, defaultGlassTheme, defaultKidsTheme } from '../presets/defaultThemes';
import { fetchInstalledHaThemes, deleteHaTheme } from '../services/haService';

const STORAGE_KEY_THEMES = 'ha_theme_studio_themes_v1';
const STORAGE_KEY_ACTIVE = 'ha_theme_studio_active_v1';
const STORAGE_KEY_COMMUNITY = 'ha_theme_studio_community_v1';

const initialCommunitySubmissions: CommunityThemeSubmission[] = [];

export function useThemeStore() {
  const [themes, setThemes] = useState<ThemeConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEMES);
      return saved ? JSON.parse(saved) : defaultThemes;
    } catch {
      return defaultThemes;
    }
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
    try {
      localStorage.setItem(STORAGE_KEY_THEMES, JSON.stringify(themes));
    } catch (e) {
      console.warn('Storage quota exceeded:', e);
    }
  }, [themes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE, activeThemeId);
  }, [activeThemeId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMMUNITY, JSON.stringify(communitySubmissions));
  }, [communitySubmissions]);

  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0] || defaultGlassTheme;

  const syncInstalledThemesFromHa = useCallback(async () => {
    try {
      const installed = await fetchInstalledHaThemes();
      if (installed && installed.length > 0) {
        setThemes(prev => {
          const merged = [...prev];
          for (const inst of installed) {
            const idx = merged.findIndex(t => t.id === inst.id || t.name.toLowerCase() === inst.name.toLowerCase());
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...inst, isInstalled: Boolean(inst.isInstalled) };
            } else {
              merged.push({ ...inst, isInstalled: Boolean(inst.isInstalled) });
            }
          }
          return merged;
        });
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
      name: template.name || 'New Liquid Glass Theme',
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
    };

    setThemes(prev => [copy, ...prev]);
    setActiveThemeId(newId);
  };

  const deleteTheme = async (themeId: string) => {
    await deleteHaTheme(themeId);
    setThemes(prev => {
      const filtered = prev.filter(t => t.id !== themeId);
      if (filtered.length === 0) return [defaultGlassTheme];
      return filtered;
    });

    if (activeThemeId === themeId) {
      const fallback = themes.find(t => t.id !== themeId) || defaultGlassTheme;
      setActiveThemeId(fallback.id);
    }
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
