import { createContext, type Ref } from "react";

export type SchemaFormat = "json" | "yaml";

export type SelectedNode = {
  id: string;
  data?: Record<string, unknown>;
};

export type NavigationDirection = "next" | "prev";

type AppContextType = {
  containerRef: Ref<HTMLDivElement>;
  isFullScreen: boolean;
  toggleFullScreen: () => void;

  theme: "light" | "dark";
  toggleTheme: () => void;

  schemaFormat: SchemaFormat;
  changeSchemaFormat: (format: SchemaFormat) => void;

  selectedNode: SelectedNode | null;
  setSelectedNode: (selectedNode: SelectedNode | null) => void;

  searchString: string;
  setSearchString: (search: string) => void;

  registerNavigateMatch: (fn: (dir: NavigationDirection) => void) => void;
  triggerNavigateMatch: (dir: NavigationDirection) => void;
};

export const AppContext = createContext<AppContextType>({} as AppContextType);
