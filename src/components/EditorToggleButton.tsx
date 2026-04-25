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
        className="flex items-center justify-center rounded-lg cursor-pointer bg-[var(--view-bg-color)] duration-300 border-2 hover:scale-105 text-[var(--navigation-text-color)] w-8 h-8 py-1"
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
        <BsChevronDown size={10} className="-mb-1" />
        <BsChevronDown size={10} />
      </span>
    ) : (
      <span className="flex flex-col items-center leading-none">
        <BsChevronUp size={10} className="-mb-1" />
        <BsChevronUp size={10} />
      </span>
    )
  ) : editorVisible ? (
    <>
      <BsChevronLeft size={10} />
      <BsChevronLeft size={10} />
    </>
  ) : (
    <>
      <BsChevronRight size={10} />
      <BsChevronRight size={10} />
    </>
  );
};

export default EditorToggleButton;
