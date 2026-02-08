import { useContext } from "react";
import { MdCode, MdCodeOff } from "react-icons/md";
import { AppContext } from "../contexts/AppContext";
import { Tooltip } from "react-tooltip";

const EditorToggleButton = () => {
    const { isEditorVisible, toggleEditorVisibility } = useContext(AppContext);

    return (
        <>
            <button
                onClick={toggleEditorVisibility}
                className="
                        p-2 
                        rounded-md 
                        bg-[var(--view-bg-color)] 
                        text-[var(--view-text-color)]
                        cursor-pointer
                        transition-all duration-200
                        shadow-md
                        border border-gray-300/40
                        hover:scale-105
                        hover:shadow-lg
                        hover:ring-2 hover:ring-blue-500
                        active:scale-95
                    "
                data-tooltip-id="editor-toggle-tooltip"
                aria-label={isEditorVisible ? "Hide Code Editor" : "Show Code Editor"}
            >
                {isEditorVisible ? (
  <MdCodeOff size={22} className="transition-colors hover:text-red-400" />
) : (
  <MdCode size={22} className="transition-colors hover:text-green-400" />
)}

            </button>
            <Tooltip
                id="editor-toggle-tooltip"
                content={isEditorVisible ? "Hide Code Editor" : "Show Code Editor"}
                style={{ fontSize: "12px" }}
            />
        </>
    );
};

export default EditorToggleButton;
