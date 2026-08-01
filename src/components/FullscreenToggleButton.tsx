import { useContext } from "react";
import { BsArrowsFullscreen} from "react-icons/bs";
import { AiOutlineFullscreenExit } from "react-icons/ai";
import { AppContext } from "../contexts/AppContext";

const FullscreenToggleButton = () => {
  const { toggleFullScreen, isFullScreen } = useContext(AppContext);

  return (
    <button
      onClick={toggleFullScreen}
      className="p-2 rounded-md border border-transparent text-[var(--navigation-text-color)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] cursor-pointer transition-all duration-200"
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
