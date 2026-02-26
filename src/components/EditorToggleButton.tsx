import { Tooltip } from "react-tooltip";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";

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
        className="flex text-neutral-400 dark:text-neutral-500 rounded-sm cursor-pointer duration-300   hover:scale-103"
        data-tooltip-id="editor-toggle-tooltip"
        aria-label={editorVisible ? "Hide Editor" : "Show Editor"}
      >
        {editorVisible ? (
          <>
            <GoSidebarExpand size={24} />
          </>
        ) : (
          <>
            <GoSidebarCollapse size={24} />
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
