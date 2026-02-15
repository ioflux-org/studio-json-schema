import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { Tooltip } from "react-tooltip";

const EditorToggleButton = ({
  className,
  editorVisible,
  toggleEditorVisibility,
}: {
  className: string;
  editorVisible: boolean;
  toggleEditorVisibility: () => void;
}) => {
  return (
    <div className={className}>
      <button
        onClick={toggleEditorVisibility}
        className="flex px-1 py-2 rounded-lg cursor-pointer bg-[var(--view-bg-color)] duration-300 border-2 hover:scale-105 text-[var(--navigation-text-color)]"
        data-tooltip-id="editor-toggle-tooltip"
        aria-label={editorVisible ? "Hide Editor" : "Show Editor"}
      >
        {editorVisible ? (
          <>
            <BsChevronLeft size={10} />
            <BsChevronLeft size={10} />
          </>
        ) : (
          <>
            <BsChevronRight size={10} />
            <BsChevronRight size={10} />
          </>
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
