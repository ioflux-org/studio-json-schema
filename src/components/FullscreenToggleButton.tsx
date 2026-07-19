import { useContext } from "react";
import { BsArrowsFullscreen} from "react-icons/bs";
import { AiOutlineFullscreenExit } from "react-icons/ai";
import { AppContext } from "../contexts/AppContext";

const FullscreenToggleButton = () => {
  const { toggleFullScreen, isFullScreen } = useContext(AppContext);

  return (
    <button
      onClick={toggleFullScreen}
      className="p-2 rounded-lg text-[var(--navigation-text-color)] hover:bg-[var(--view-bg-color)] cursor-pointer transition-colors"
      title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isFullScreen ? (
        <AiOutlineFullscreenExit size={16} />
      ) : (
        <BsArrowsFullscreen size={14} />
      )}
    </button>
  );
};

export default FullscreenToggleButton;
