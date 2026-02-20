import { createContext, type Ref } from "react";

export type SchemaFormat = "json" | "yaml";

export type SelectedNode = {
  id: string;
  data: Record<string, unknown>;
};

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
};

export const AppContext = createContext<AppContextType>({} as AppContextType);
