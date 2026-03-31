import { BsGithub, BsMoonStars, BsBook, BsSun } from "react-icons/bs";
import { RiSearchLine, RiCloseLine } from "react-icons/ri";
import { useContext, useEffect, useRef } from "react";
import { Tooltip } from "react-tooltip";
import { AppContext } from "../contexts/AppContext";
import FullscreenToggleButton from "./FullscreenToggleButton";

const NavigationBar = () => {
  const { theme, toggleTheme, isFullScreen, searchString, setSearchString, navigateGraphMatch } =
    useContext(AppContext);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav className={`flex items-center relative z-10 bg-[var(--bg-color)] ${
      isFullScreen
        ? `w-full px-2 py-1 justify-end ${theme === "light" ? "shadow-md border-b-[1px] border-gray-200" : ""}`
        : "h-[8vh] justify-between shadow-lg"
    }`}>
      {!isFullScreen && (
        <div className="flex items-center text-center select-none">
          <img
            src={theme === "dark" ? "logo-dark.svg" : "logo-light.svg"}
            alt="Studio JSON Schema"
            className="w-15 h-15 md:w-15 md:h-15"
            draggable="false"
          />

          <div className="flex font-mono flex-col">
            <span className="text-2xl font-bold  text-[var(--tool-name-color)]">
              Studio
            </span>
            <span className="text-xs opacity-70 text-[var(--tool-name-color)]">
              JSON Schema
            </span>
          </div>
        </div>
      )}

      <ul className={`flex items-center gap-5 ${isFullScreen ? 'mr-0' : 'mr-4'}`}>
        <li className="flex items-center gap-1">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-[var(--navigation-text-color)] w-[200px]">
            <RiSearchLine className="text-[var(--navigation-text-color)] flex-shrink-0 opacity-60" size={14} aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              maxLength={30}
              placeholder="Search"
              aria-label="Search nodes"
              className="outline-none bg-transparent text-[var(--navigation-text-color)] text-sm placeholder:text-[var(--navigation-text-color)] flex-1 min-w-0"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                navigateGraphMatch("next");
              }}
            />
            <div className="flex-shrink-0 w-[40px] flex justify-end">
              {searchString ? (
                <button
                  onClick={() => setSearchString("")}
                  className="text-[var(--navigation-text-color)] opacity-50 hover:opacity-100 cursor-pointer"
                >
                  <RiCloseLine size={16} />
                </button>
              ) : (
                <kbd className="text-[var(--navigation-text-color)] text-xs border border-[var(--navigation-text-color)] rounded opacity-50 px-1 py-0.5 font-sans leading-none">⌘K</kbd>
              )}
            </div>
          </div>
        </li>
        <li className="flex items-center">
          <button
            className="text-xl cursor-pointer"
            onClick={toggleTheme}
            data-tooltip-id="toggle-theme"
          >
            {theme === "light" ? (
              <BsSun className="text-[var(--navigation-text-color)]" />
            ) : (
              <BsMoonStars className="text-[var(--navigation-text-color)]" />
            )}
          </button>
          <Tooltip
            id="toggle-theme"
            content="Better visuals in dark mode"
            style={{ fontSize: "10px" }}
          />
        </li>
        <li className="flex items-center">
          <a
            href="https://github.com/ioflux-org/studio-json-schema"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl flex items-center"
            data-tooltip-id="github"
          >
            <BsGithub className="text-[var(--navigation-text-color)]" />
            <Tooltip
              id="github"
              content="Star on Github"
              style={{ fontSize: "10px" }}
            />
          </a>
        </li>
        <li className="flex items-center">
          <a
            href="https://github.com/ioflux-org/studio-json-schema?tab=readme-ov-file#json-schema-visualizer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl flex items-center"
            data-tooltip-id="learn-keywords"
          >
            <BsBook className="text-[var(--navigation-text-color)]" />
            <Tooltip
              id="learn-keywords"
              content="Docs"
              style={{ fontSize: "10px" }}
            />
          </a>
        </li>
        <li className="flex items-center">
          <FullscreenToggleButton />
        </li>
      </ul>
    </nav>
  );
};

export default NavigationBar;
