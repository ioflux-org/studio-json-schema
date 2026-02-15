import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { AppContext, type SchemaFormat } from "./AppContext";
import YAML from "js-yaml";
import {
  decodeSchemaFromURL,
  hasSchemaInURL,
  updateURLWithSchema,
} from "../utils/urlSchemaCodec";
import defaultSchema from "../data/defaultJSONSchema.json";

const SESSION_SCHEMA_KEY = "ioflux.schema.editor.content";
const SESSION_FORMAT_KEY = "ioflux.schema.editor.format";

const loadSchemaJSON = (key: string): any => {
  const raw = sessionStorage.getItem(key);
  if (!raw) return defaultSchema;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultSchema;
  }
};

const loadInitialSchemaText = (
  schemaFormat: SchemaFormat
): string => {
  const pathname = window.location.pathname;
  
  // If URL is root path (/), load from sessionStorage or default
  if (pathname === '/' || pathname === '') {
    const schemaJSON = loadSchemaJSON(SESSION_SCHEMA_KEY);
    return schemaFormat === "yaml"
      ? YAML.dump(schemaJSON)
      : JSON.stringify(schemaJSON, null, 2);
  }
  
  // Otherwise, check if there's an encoded schema in the URL
  if (hasSchemaInURL()) {
    const urlSchema = decodeSchemaFromURL(pathname);
    if (urlSchema) {
      return urlSchema;
    }
  }

  const schemaJSON = loadSchemaJSON(SESSION_SCHEMA_KEY);
  return schemaFormat === "yaml"
    ? YAML.dump(schemaJSON)
    : JSON.stringify(schemaJSON, null, 2);
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const isInitialLoadRef = useRef(true);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const [schemaFormat, setSchemaFormat] = useState<SchemaFormat>(
    (window.sessionStorage.getItem(
      SESSION_FORMAT_KEY
    ) as SchemaFormat) ?? "json"
  );

  const [schemaContent, setSchemaContent] = useState<string>(() => {
    return loadInitialSchemaText(schemaFormat);
  });

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
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    updateURLWithSchema(schemaContent);
  }, [schemaContent]);

  useEffect(() => {
    const handlePopState = () => {
      if (hasSchemaInURL()) {
        const urlSchema = decodeSchemaFromURL(window.location.pathname);
        if (urlSchema) {
          setSchemaContent(urlSchema);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const value = {
    containerRef,
    isFullScreen,
    theme,
    toggleTheme,
    toggleFullScreen,
    schemaFormat,
    changeSchemaFormat,
    schemaContent,
    setSchemaContent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

