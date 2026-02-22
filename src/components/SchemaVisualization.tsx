import GraphView from "./GraphView";
import { type CompiledSchema } from "@hyperjump/json-schema/experimental";
import { ReactFlowProvider } from "@xyflow/react";

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
    </>
  );
};

export default SchemaVisualization;
