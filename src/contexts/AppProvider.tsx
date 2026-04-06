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

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const persistedSchemaFormat = window.sessionStorage.getItem(
    "ioflux.schema.editor.format"
  );
  const hasInvalidPersistedSchemaFormat =
    !!persistedSchemaFormat &&
    persistedSchemaFormat !== "json" &&
    persistedSchemaFormat !== "yaml";

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const [schemaFormat, setSchemaFormat] = useState<SchemaFormat>(() => {
    if (persistedSchemaFormat === "json" || persistedSchemaFormat === "yaml") {
      return persistedSchemaFormat;
    }

    if (persistedSchemaFormat) {
      window.sessionStorage.setItem("ioflux.schema.editor.format", "json");
    }

    return "json";
  });

  const [showFormatWarning, setShowFormatWarning] = useState(
    hasInvalidPersistedSchemaFormat
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
    window.sessionStorage.setItem("ioflux.schema.editor.format", format);
  };

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

  useEffect(() => {
    if (!showFormatWarning) return;

    const timer = window.setTimeout(() => {
      setShowFormatWarning(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [showFormatWarning]);

  const value = {
    containerRef,
    isFullScreen,
    theme,
    toggleTheme,
    toggleFullScreen,
    schemaFormat,
    changeSchemaFormat,
    showFormatWarning,
    selectedNode,
    setSelectedNode,
    searchString,
    setSearchString,
    registerNavigateMatch,
    triggerNavigateMatch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
