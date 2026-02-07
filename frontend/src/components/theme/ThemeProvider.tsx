import { useEffect } from 'react';
import { useThemeStore, getEffectiveTheme, applyThemeToDocument } from '@/store/themeStore';

/**
 * Persist edilmiş tema ve sistem tercihini document.documentElement'e uygular.
 * App kökünde bir kez kullanın.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, effective } = useThemeStore();

  useEffect(() => {
    const resolved = theme === 'system' ? getEffectiveTheme('system') : theme;
    applyThemeToDocument(resolved);
    if (resolved !== effective) useThemeStore.setState({ effective: resolved });
  }, [theme, effective]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        const next = getEffectiveTheme('system');
        applyThemeToDocument(next);
        useThemeStore.setState({ effective: next });
      }
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  return <>{children}</>;
}
