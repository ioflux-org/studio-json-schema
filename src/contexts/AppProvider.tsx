import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  AppContext,
  type NavigationDirection,
  type SchemaFormat,
  type SelectedNode,
} from "./AppContext";

const SESSION_FORMAT_KEY = "ioflux.schema.editor.format";

const isValidSchemaFormat = (value: unknown): value is SchemaFormat => {
  return value === "json" || value === "yaml";
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const [persistedFormatWarning, setPersistedFormatWarning] = useState<
    string | null
  >(() => {
    const savedFormat = window.sessionStorage.getItem(SESSION_FORMAT_KEY);
    if (savedFormat !== null && !isValidSchemaFormat(savedFormat)) {
      return `Saved editor format "${savedFormat}" is invalid. Reset to JSON.`;
    }
    return null;
  });

  const [schemaFormat, setSchemaFormat] = useState<SchemaFormat>(
    (() => {
      const savedFormat = window.sessionStorage.getItem(SESSION_FORMAT_KEY);
      if (savedFormat === null) {
        return "json";
      }

      if (isValidSchemaFormat(savedFormat)) {
        return savedFormat;
      }

      window.sessionStorage.setItem(SESSION_FORMAT_KEY, "json");
      return "json";
    })()
  );

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  const changeSchemaFormat = (format: SchemaFormat) => {
    setSchemaFormat(format);
  };

  const clearPersistedFormatWarning = useCallback(() => {
    setPersistedFormatWarning(null);
  }, []);

  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [searchString, setSearchString] = useState("");

  const navigateMatchRef = useRef<((dir: NavigationDirection) => void) | null>(
    null
  );

  const registerNavigateMatch = (fn: (dir: NavigationDirection) => void) => {
    navigateMatchRef.current = fn;
  };

  const triggerNavigateMatch = (dir: NavigationDirection) => {
    navigateMatchRef.current?.(dir);
  };

  const toggleFullScreen = useCallback(() => {
    const el = containerRef.current;

    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen()
        .then(() => setIsFullScreen(true))
        .catch(console.error);
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullScreen(false))
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const value = {
    containerRef,
    isFullScreen,
    theme,
    toggleTheme,
    toggleFullScreen,
    schemaFormat,
    changeSchemaFormat,
    persistedFormatWarning,
    clearPersistedFormatWarning,
    selectedNode,
    setSelectedNode,
    searchString,
    setSearchString,
    registerNavigateMatch,
    triggerNavigateMatch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
