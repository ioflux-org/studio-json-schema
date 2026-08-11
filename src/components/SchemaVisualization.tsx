import GraphView from "./GraphView";
import { type CompiledSchema } from "@hyperjump/json-schema/experimental";
import { ReactFlowProvider } from "@xyflow/react";
import { Tooltip } from "react-tooltip";
import type { DiffStatus } from "../utils/schemaDiff";

type SchemaVisualizationProps = {
  compiledSchema: CompiledSchema | null;
  /** When set, graph shows both schemas with diff coloring */
  diffCompiledSchema?: CompiledSchema | null;
  isDiffMode?: boolean;
  /** Scroll the DiffEditor to the node path when a highlighted node is clicked */
  onDiffNodeSelect?: (identity: string, status: DiffStatus) => void;
};

const SchemaVisualization = ({
  compiledSchema,
  diffCompiledSchema = null,
  isDiffMode = false,
  onDiffNodeSelect,
}: SchemaVisualizationProps) => {
  return (
    <>
      <ReactFlowProvider>
        <GraphView
          compiledSchema={compiledSchema}
          diffCompiledSchema={diffCompiledSchema}
          isDiffMode={isDiffMode}
          onDiffNodeSelect={onDiffNodeSelect}
        />
      </ReactFlowProvider>
      <div className="absolute bottom-[10px] right-[10px] z-10">
        <img
          src="trust-badge.svg"
          alt="Local-only processing"
          className="w-9 h-9"
          draggable="false"
          data-tooltip-id="local-only-tooltip"
        />
      </div>
      <Tooltip
        id="local-only-tooltip"
        content="Your data never leaves your device. All processing happens locally."
        style={{ fontSize: "10px" }}
      />
    </>
  );
};

export default SchemaVisualization;
