import { createContext, type Ref } from "react";

export type SchemaFormat = "json" | "yaml";

type AppContextType = {
  containerRef: Ref<HTMLDivElement>;
  isFullScreen: boolean;
  toggleFullScreen: () => void;

  theme: "light" | "dark";
  toggleTheme: () => void;

  schemaFormat: SchemaFormat;
  changeSchemaFormat: (format: SchemaFormat) => void;

  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
};

export const AppContext = createContext<AppContextType>({} as AppContextType);
