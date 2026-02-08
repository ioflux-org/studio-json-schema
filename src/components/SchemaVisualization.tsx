import React, { useEffect, useState } from "react";
import { CgClose } from "react-icons/cg";
import GraphView from "./GraphView";
import { type CompiledSchema } from "@hyperjump/json-schema/experimental";
import { Tooltip } from "react-tooltip";
import EditorToggleButton from "./EditorToggleButton";

const SchemaVisualization = ({
  compiledSchema,
}: {
  compiledSchema: CompiledSchema | null;
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(true);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchString = event.target.value.trim();
    if (!searchString) {
      setErrorMessage("");
      return;
    }
    const searchResult = handleSearch(searchString);
    if (!searchResult) {
      setErrorMessage(`${searchString} is not in schema`);
    } else {
      setErrorMessage("");
    }
  };

  const handleSearch = (searchString: string) => {
    return searchString;
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
      <div className="absolute top-[10px] left-[10px] z-10">
        <EditorToggleButton />
      </div>
      <GraphView compiledSchema={compiledSchema} />

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
