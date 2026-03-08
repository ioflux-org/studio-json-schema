import { useContext } from "react";
import { BsArrowsFullscreen } from "react-icons/bs";
import { AppContext } from "../contexts/AppContext";

const FullscreenToggleButton = () => {
  const { toggleFullScreen } = useContext(AppContext);

  return (
    <button
      aria-label="Toggle fullscreen"
      onClick={toggleFullScreen}
      className="cursor-pointer"
      style={{ color: "var(--navigation-text-color)" }}
    >
      <BsArrowsFullscreen />
    </button>
  );
};

export default FullscreenToggleButton;
