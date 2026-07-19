import {
  BsChevronLeft,
  BsChevronRight,
  BsChevronUp,
  BsChevronDown,
} from "react-icons/bs";
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
        className="flex items-center justify-center rounded-md cursor-pointer bg-[var(--popup-bg-color)] border border-[var(--toolbar-border-color)] hover:border-[var(--accent-color)] text-[var(--text-color)] hover:text-[var(--accent-color)] w-7 h-7 transition-all duration-200 shadow-lg"
        data-tooltip-id="editor-toggle-tooltip"
        aria-label={editorVisible ? "Hide Editor" : "Show Editor"}
      >
        <ButtonIcon isMobile={isMobile} editorVisible={editorVisible} />
      </button>
      <Tooltip
        id="editor-toggle-tooltip"
        content={editorVisible ? "Hide Editor" : "Show Editor"}
        style={{ fontSize: "10px" }}
      />
    </div>
  );
};

const ButtonIcon = ({
  isMobile,
  editorVisible,
}: {
  isMobile: boolean;
  editorVisible: boolean;
}) => {
  return isMobile ? (
    editorVisible ? (
      <span className="flex flex-col items-center leading-none">
        <BsChevronDown size={9} className="-mb-0.5" />
        <BsChevronDown size={9} />
      </span>
    ) : (
      <span className="flex flex-col items-center leading-none">
        <BsChevronUp size={9} className="-mb-0.5" />
        <BsChevronUp size={9} />
      </span>
    )
  ) : editorVisible ? (
    <>
      <BsChevronLeft size={9} />
      <BsChevronLeft size={9} />
    </>
  ) : (
    <>
      <BsChevronRight size={9} />
      <BsChevronRight size={9} />
    </>
  );
};

export default EditorToggleButton;
