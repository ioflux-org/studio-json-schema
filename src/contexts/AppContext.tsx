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

  searchString: string;
  setSearchString: (search: string) => void;

  graphFocusRequest: { nodeId: string; seq: number } | null;
  requestGraphFocus: (nodeId: string) => void;

  activateEditorMatch: (matchIndex: number) => void;
  registerActivateEditorMatch: (fn: (matchIndex: number) => void) => void;

  navigateGraphMatch: (direction: "next" | "prev") => void;
  registerNavigateGraphMatch: (fn: (direction: "next" | "prev") => void) => void;

  matchedNodeIds: string[];
  setMatchedNodeIds: (ids: string[]) => void;
};

export const AppContext = createContext<AppContextType>({} as AppContextType);
