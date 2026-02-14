import GraphView from "./GraphView";
import { type CompiledSchema } from "@hyperjump/json-schema/experimental";
import { ReactFlowProvider } from "@xyflow/react";
import { Tooltip } from "react-tooltip";

const SchemaVisualization = ({
  compiledSchema,
}: {
  compiledSchema: CompiledSchema | null;
}) => {
  return (
    <>
      <ReactFlowProvider>
        <GraphView compiledSchema={compiledSchema} />
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
