import { BsGithub, BsMoonStars, BsBook, BsSun } from "react-icons/bs";
import { RiSearchLine, RiCloseLine } from "react-icons/ri";
import {
  type KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Tooltip } from "react-tooltip";
import { AppContext } from "../contexts/AppContext";
import FullscreenToggleButton from "./FullscreenToggleButton";

const NavigationBar = () => {
  const {
    theme,
    toggleTheme,
    isFullScreen,
    searchString,
    setSearchString,
    setSelectedNode,
    triggerNavigateMatch,
  } = useContext(AppContext);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        setSearchString("");
        setSelectedNode(null);
        searchInputRef.current?.blur();
        if (mobileSearchOpen) setMobileSearchOpen(false);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        triggerNavigateMatch(event.shiftKey ? "prev" : "next");
      }
    },
    [mobileSearchOpen, triggerNavigateMatch]
  );

  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  return (
    <nav
      className={`flex items-center relative z-10 bg-[var(--bg-color)] ${
        isFullScreen
          ? `w-full px-2 py-1 justify-end ${
              theme === "light"
                ? "shadow-md border-b-[1px] border-gray-200"
                : ""
            }`
          : "h-[8vh] justify-between shadow-lg"
      }`}
    >
      {!isFullScreen && (
        <div className="flex items-center text-center select-none">
          <img
            src={theme === "dark" ? "logo-dark.svg" : "logo-light.svg"}
            alt="Studio JSON Schema"
            className="w-15 h-15 md:w-15 md:h-15"
            draggable="false"
          />

          <div className="flex font-mono flex-col">
            <span className="text-2xl font-bold text-[var(--tool-name-color)]">
              Studio
            </span>
            <span className="text-xs opacity-70 text-[var(--tool-name-color)]">
              JSON Schema
            </span>
          </div>
        </div>
      )}

      <ul
        className={`flex items-center gap-5 ${isFullScreen ? "mr-0" : "mr-4"}`}
      >
        <li className="hidden sm:flex">
          <div
            className={`flex items-center gap-2 px-2 py-1 rounded-md  w-[200px]
            ${
              theme === "dark"
                ? "bg-white/8 border border-[var(--popup-border-color)] focus-within:border-blue-500"
                : "bg-[var(--popup-header-bg-color)] border border-gray-300 focus-within:border-blue-500"
            }`}
          >
            <input
              ref={searchInputRef}
              type="text"
              maxLength={30}
              placeholder="Search node"
              aria-label="Search nodes"
              className="outline-none bg-transparent text-[var(--navigation-text-color)] text-sm placeholder:text-[var(--navigation-text-color)]"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="w-[40px] flex justify-end pr-5">
              {searchString ? (
                <button
                  onClick={() => {
                    setSearchString("");
                    setSelectedNode(null);
                  }}
                  className="text-[var(--navigation-text-color)] opacity-70 hover:opacity-100 cursor-pointer"
                >
                  <RiCloseLine />
                </button>
              ) : (
                <kbd className="text-[var(--navigation-text-color)] text-xs border border-[var(--navigation-text-color)] rounded opacity-70 p-0.5 font-sans leading-none">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>
        </li>

        <li className="flex sm:hidden">
          <button
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            className="text-xl cursor-pointer"
            aria-label="Toggle search"
          >
            <RiSearchLine className="text-[var(--navigation-text-color)]" />
          </button>
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
          {theme === "light" && (
            <Tooltip
              id="toggle-theme"
              content="Better visuals in dark mode"
              style={{ fontSize: "10px" }}
            />
          )}
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

      {mobileSearchOpen && (
        <div
          className={`absolute top-full left-0 w-full sm:hidden flex items-center gap-2 px-3 py-2 border-t shadow-md z-500
          ${
            theme === "dark"
              ? "bg-[var(--bg-color)] border-[var(--popup-border-color)]"
              : "bg-white border-gray-200"
          }`}
        >
          <RiSearchLine className="text-[var(--navigation-text-color)] opacity-70" />

          <input
            ref={mobileSearchInputRef}
            type="text"
            maxLength={30}
            placeholder="Search node"
            className="outline-none bg-transparent text-[var(--navigation-text-color)] text-sm flex-1"
            value={searchString}
            onChange={(e) => {
              setSearchString(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={() => {
              setSearchString("");
              setSelectedNode(null);
              setMobileSearchOpen(false);
            }}
            className="text-[var(--navigation-text-color)] opacity-70 hover:opacity-100 cursor-pointer"
          >
            <RiCloseLine />
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavigationBar;
