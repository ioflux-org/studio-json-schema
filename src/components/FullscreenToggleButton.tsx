import { useContext } from "react";
import { BsArrowsFullscreen} from "react-icons/bs";
import { AiOutlineFullscreenExit } from "react-icons/ai";
import { AppContext } from "../contexts/AppContext";

const FullscreenToggleButton = () => {
  const { toggleFullScreen, isFullScreen } = useContext(AppContext);

  return (
    <button
      onClick={toggleFullScreen}
      className="cursor-pointer"
      style={{ color: "var(--navigation-text-color)" }}
      title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isFullScreen ? (
        <AiOutlineFullscreenExit size={20} />
      ) : (
        <BsArrowsFullscreen/>
      )}
    </button>
  );
};

export default FullscreenToggleButton;
