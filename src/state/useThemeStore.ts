import { useState, useEffect } from 'react';
import { ThemeConfig, CommunityThemeSubmission } from '../types/theme';
import { defaultThemes, defaultGlassTheme, defaultKidsTheme } from '../presets/defaultThemes';

const STORAGE_KEY_THEMES = 'ha_theme_studio_themes_v1';
const STORAGE_KEY_ACTIVE = 'ha_theme_studio_active_v1';
const STORAGE_KEY_COMMUNITY = 'ha_theme_studio_community_v1';

const initialCommunitySubmissions: CommunityThemeSubmission[] = [
  {
    id: 'comm-1',
    theme: defaultKidsTheme,
    status: 'approved',
    upvotes: 42,
    downvotes: 1,
    prUrl: 'https://github.com/HomeRiz/hats/pull/124',
    commentsCount: 9,
  },
  {
    id: 'comm-2',
    theme: {
      ...defaultGlassTheme,
      id: 'ultimate-aurora-borealis',
      name: 'Ultimate Aurora Borealis',
      category: 'Nature',
      author: 'NordicSmartHome',
      description: 'Dynamic emerald and cyan auroral ribbons on deep polar night.',
      palette: {
        ...defaultGlassTheme.palette,
        primary: '#00FFB2',
        accent: '#00E5FF',
      },
      engine: {
        ...defaultGlassTheme.engine,
        glowColor: '#00FFB2',
        cardRadius: 26,
      }
    },
    status: 'pending',
    upvotes: 28,
    downvotes: 2,
    prUrl: 'https://github.com/HomeRiz/hats/pull/128',
    commentsCount: 4,
  }
];

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
      return localStorage.getItem(STORAGE_KEY_ACTIVE) || defaultThemes[1].id;
    } catch {
      return defaultThemes[1].id;
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
      ...defaultKidsTheme,
      id: newId,
      name: template.name || 'New Custom Theme',
      category: template.category || 'Kids',
      author: 'You',
      description: 'A custom designed Home Assistant theme.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true,
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
    };

    setThemes(prev => [copy, ...prev]);
    setActiveThemeId(newId);
  };

  const deleteTheme = (themeId: string) => {
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
  };
}
