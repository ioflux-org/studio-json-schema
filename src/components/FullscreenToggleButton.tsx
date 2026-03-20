import { useContext } from "react";
import { BsArrowsFullscreen } from "react-icons/bs";
import { AppContext } from "../contexts/AppContext";

const FullscreenToggleButton = () => {
  const { toggleFullScreen } = useContext(AppContext);

  return (
    <button
      onClick={toggleFullScreen}
      className="cursor-pointer text-[var(--navigation-text-color)]"
    >
      <BsArrowsFullscreen />
    </button>
  );
};

export default FullscreenToggleButton;
