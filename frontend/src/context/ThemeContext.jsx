import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const THEME_KEY = "mugate_theme";

/** @typedef {"light" | "dark"} Scheme */

/**
 * @param {Scheme} scheme
 */
function applyDomTheme(scheme) {
  document.documentElement.setAttribute("data-theme", scheme);
  document.documentElement.style.colorScheme = scheme;
}

/**
 * @returns {Scheme}
 */
function readInitialScheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return "light";
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [scheme, setSchemeState] = useState(readInitialScheme);

  useEffect(() => {
    applyDomTheme(scheme);
  }, [scheme]);

  const setScheme = useCallback((/** @type {Scheme} */ next) => {
    setSchemeState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    applyDomTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setSchemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      applyDomTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      scheme,
      isDark: scheme === "dark",
      toggleTheme,
      setScheme,
    }),
    [scheme, toggleTheme, setScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
