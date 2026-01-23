// Change 1: Added useRef to create a reference to the GraphView component
import React, { useEffect, useState, useRef } from "react";
import { CgClose } from "react-icons/cg";
// Change 2: Import GraphViewHandle type to properly type the ref
import GraphView, { type GraphViewHandle } from "./GraphView";
import { type CompiledSchema } from "@hyperjump/json-schema/experimental";
import { Tooltip } from "react-tooltip";

const SchemaVisualization = ({
  compiledSchema,
}: {
  compiledSchema: CompiledSchema | null;
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(true);
  // Change 3: Create a ref to access GraphView's searchNode method
  const graphViewRef = useRef<GraphViewHandle>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchString = event.target.value.trim();
    if (!searchString) {
      setErrorMessage("");
      return;
    }
    // Change 4: Call the actual searchNode function via ref instead of the stub
    const found = graphViewRef.current?.searchNode(searchString);
    if (!found) {
      setErrorMessage(`${searchString} is not in schema`);
    } else {
      setErrorMessage("");
    }
  };

  useEffect(() => {
    if (errorMessage) {
      setShowErrorPopup(true);
      const timer = setTimeout(() => {
        setShowErrorPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowErrorPopup(false);
    }
  }, [errorMessage]);

  return (
    <>
      {/* Change 5: Pass the ref to GraphView to access its searchNode method */}
      <GraphView ref={graphViewRef} compiledSchema={compiledSchema} />

      {/*Error Message */}
      {errorMessage && showErrorPopup && (
        <div className="absolute bottom-[50px] left-[100px] flex gap-2 px-2 py-1 bg-red-500 text-white rounded-md shadow-lg">
          <div className="text-sm font-medium tracking-wide font-roboto">
            {errorMessage}
          </div>
          <button
            className="cursor-pointer"
            onClick={() => setShowErrorPopup(false)}
          >
            <CgClose size={18} />
          </button>
        </div>
      )}

      <div className="absolute bottom-[10px] left-[50px]">
        <input
          type="text"
          maxLength={30}
          placeholder="search node"
          className="outline-none text-[var(--bottom-bg-color)] border-b-2 text-center"
          onChange={handleChange}
        />
      </div>
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
