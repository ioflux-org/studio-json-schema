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

import defaultSchema from "../data/defaultJSONSchema.json";
import YAML from "js-yaml";

import { SESSION_SCHEMA_KEY, SESSION_FORMAT_KEY } from "../constants";

const loadSchemaJSON = (key: string): any => {
  const raw = sessionStorage.getItem(key);
  if (!raw) return defaultSchema;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultSchema;
  }
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

  const [schemaFormat, setSchemaFormat] = useState<SchemaFormat>(
    (window.sessionStorage.getItem(SESSION_FORMAT_KEY) as SchemaFormat) ?? "json"
  );

  const initialSchemaJSON = loadSchemaJSON(SESSION_SCHEMA_KEY);

  const [schemaText, setSchemaText] = useState<string>(
    schemaFormat === "yaml"
      ? YAML.dump(initialSchemaJSON)
      : JSON.stringify(initialSchemaJSON, null, 2)
  );

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  const changeSchemaFormat = useCallback(
    (format: SchemaFormat) => {
      sessionStorage.setItem(SESSION_FORMAT_KEY, format);
      setSchemaFormat(format);
      if (format === schemaFormat) return;
      try {
        if (format === "yaml") {
          const parsed = JSON.parse(schemaText);
          setSchemaText(YAML.dump(parsed));
        } else {
          const parsed = YAML.load(schemaText) as object;
          setSchemaText(JSON.stringify(parsed, null, 2));
        }
      } catch {
        // If conversion fails, keep existing text as-is
      }
    },
    [schemaFormat, schemaText]
  );

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

  const exportGraphRef = useRef<(() => void) | null>(null);

  const registerExportGraph = (fn: () => void) => {
    exportGraphRef.current = fn;
  };

  const triggerExportGraph = () => {
    exportGraphRef.current?.();
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
    const handleKeyDown = ({ key, ctrlKey, metaKey, altKey, shiftKey, repeat, target }: KeyboardEvent) => {
      if (repeat || key.toLowerCase() !== "f" || ctrlKey || metaKey || altKey || shiftKey) return;
      const el = target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable) return;
      if (el.closest(".monaco-editor")) return;
      toggleFullScreen();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullScreen]);

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
    schemaText,
    setSchemaText,
    selectedNode,
    setSelectedNode,
    searchString,
    setSearchString,
    registerNavigateMatch,
    triggerNavigateMatch,
    registerExportGraph,
    triggerExportGraph,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
