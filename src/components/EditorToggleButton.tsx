import { BsChevronLeft, BsChevronRight, BsChevronUp, BsChevronDown } from "react-icons/bs";
import { Tooltip } from "react-tooltip";

const EditorToggleButton = ({
  className,
  editorVisible,
  toggleEditorVisibility,
  isMobile = false,
}: {
  className: string;
  editorVisible: boolean;
  toggleEditorVisibility: () => void;
  isMobile?: boolean;
}) => {
  return (
    <div className={className}>
      <button
        onClick={toggleEditorVisibility}
        className={`flex items-center justify-center rounded-lg cursor-pointer bg-[var(--view-bg-color)] duration-300 border-2 hover:scale-105 text-[var(--navigation-text-color)] ${isMobile ? "w-12 h-12" : "px-1 py-2"}`}
        data-tooltip-id="editor-toggle-tooltip"
        aria-label={editorVisible ? "Hide Editor" : "Show Editor"}
      >
        {isMobile ? (
          editorVisible ? (
            <span className="flex flex-col items-center gap-0.5">
              <BsChevronDown size={12} />
              <BsChevronDown size={12} />
            </span>
          ) : (
            <span className="flex flex-col items-center gap-0.5">
              <BsChevronUp size={12} />
              <BsChevronUp size={12} />
            </span>
          )
        ) : (
          editorVisible ? (
            <>
              <BsChevronLeft size={10} />
              <BsChevronLeft size={10} />
            </>
          ) : (
            <>
              <BsChevronRight size={10} />
              <BsChevronRight size={10} />
            </>
          )
        )}
      </button>
      <Tooltip
        id="editor-toggle-tooltip"
        content={editorVisible ? "Hide Editor" : "Show Editor"}
        style={{ fontSize: "10px" }}
      />
    </div>
  );
};

export default EditorToggleButton;
