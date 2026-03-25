import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { AppContext, type SchemaFormat, type SelectedNode } from "./AppContext";

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
    (window.sessionStorage.getItem(
      "ioflux.schema.editor.format"
    ) as SchemaFormat) ?? "json"
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

  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [searchString, setSearchString] = useState("");
  const [graphFocusRequest, setGraphFocusRequest] = useState<{ nodeId: string; seq: number } | null>(null);
  const graphFocusSeqRef = useRef(0);
  const requestGraphFocus = useCallback((nodeId: string) => {
    setGraphFocusRequest({ nodeId, seq: ++graphFocusSeqRef.current });
  }, []);

  const activateEditorMatchRef = useRef<(matchIndex: number) => void>(() => {});
  const activateEditorMatch = useCallback((matchIndex: number) => {
    activateEditorMatchRef.current(matchIndex);
  }, []);
  const registerActivateEditorMatch = useCallback((fn: (matchIndex: number) => void) => {
    activateEditorMatchRef.current = fn;
  }, []);

  const navigateGraphMatchRef = useRef<(direction: "next" | "prev") => void>(() => {});
  const navigateGraphMatch = useCallback((direction: "next" | "prev") => {
    navigateGraphMatchRef.current(direction);
  }, []);
  const registerNavigateGraphMatch = useCallback((fn: (direction: "next" | "prev") => void) => {
    navigateGraphMatchRef.current = fn;
  }, []);

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
    selectedNode,
    setSelectedNode,
    searchString,
    setSearchString,
    graphFocusRequest,
    requestGraphFocus,
    activateEditorMatch,
    registerActivateEditorMatch,
    navigateGraphMatch,
    registerNavigateGraphMatch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
