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

        if (mobileSearchOpen) {
          setMobileSearchOpen(false);
        }

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
      aria-label="Main navigation"
      className={`flex items-center relative z-10 backdrop-blur-md bg-[var(--nav-bg-color)] border-b border-[var(--toolbar-border-color)] ${
        isFullScreen
          ? "w-full px-3 py-1.5 justify-end"
          : "h-[56px] justify-between px-1"
      }`}
    >
      {!isFullScreen && (
        <div className="flex items-center text-center select-none gap-">
          <img
            src={theme === "dark" ? "logo-dark.svg" : "logo-light.svg"}
            alt="Studio JSON Schema"
            className="w-15 h-15"
            draggable="false"
          />

          <div className="flex font-mono flex-col">
            <span className="text-xl font-bold text-[var(--tool-name-color)]">
              Studio
            </span>
            <span className="text-xs opacity-70 text-[var(--tool-name-color)]">
              JSON Schema
            </span>
          </div>
        </div>
      )}

      <ul
        className={`flex items-center gap-1 ${isFullScreen ? "mr-0" : "mr-3"}`}
      >
        {/* Desktop Search */}
        <li className="hidden sm:flex">
          <div
            className="flex items-center gap-1.5 px-2 h-[28px] rounded-md w-[180px] max-w-[40vw] bg-[var(--bg-color)] border border-[var(--toolbar-border-color)] hover:border-[var(--accent-color)] focus-within:border-[var(--accent-color)] transition-all duration-200 overflow-hidden"
          >
            <RiSearchLine className="text-[var(--text-secondary-color)] flex-shrink-0" size={13} />
            <input
              ref={searchInputRef}
              type="text"
              maxLength={30}
              placeholder="Search nodes..."
              aria-label="Search nodes"
              className="outline-none bg-transparent text-[var(--text-color)] text-xs placeholder:text-[var(--text-secondary-color)] w-full"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <div className="flex-shrink-0">
              {searchString ? (
                <button
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchString("");
                    setSelectedNode(null);
                  }}
                  className="text-[var(--text-secondary-color)] hover:text-[var(--text-color)] cursor-pointer transition-colors"
                >
                  <RiCloseLine size={14} />
                </button>
              ) : (
                <kbd className="text-[var(--text-secondary-color)] text-[10px] border border-[var(--toolbar-border-color)] rounded w-4 h-4 flex items-center justify-center font-mono flex-shrink-0">
                  /
                </kbd>
              )}
            </div>
          </div>
        </li>

        {/* Mobile Search Toggle */}
        <li className="flex sm:hidden">
          <button
            aria-label="Toggle search"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            className="p-2 rounded-md border border-transparent text-[var(--navigation-text-color)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] cursor-pointer transition-all duration-200"
          >
            <RiSearchLine size={18} />
          </button>
        </li>

        {/* Theme Toggle */}
        <li className="flex items-center">
          <button
            aria-label="Toggle theme"
            className="p-2 rounded-md border border-transparent text-[var(--navigation-text-color)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] cursor-pointer transition-all duration-200"
            onClick={toggleTheme}
            data-tooltip-id="toggle-theme"
          >
            {theme === "light" ? (
              <BsSun size={16} />
            ) : (
              <BsMoonStars size={15} />
            )}
          </button>

          {theme === "light" && (
            <Tooltip
              id="toggle-theme"
              content="Better visuals in dark mode"
              delayShow={150}
              delayHide={0}
            />
          )}
        </li>

        {/* GitHub */}
        <li className="flex items-center">
          <a
            aria-label="GitHub repository"
            href="https://github.com/ioflux-org/studio-json-schema"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md border border-transparent text-[var(--navigation-text-color)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] flex items-center transition-all duration-200"
            data-tooltip-id="github"
          >
            <BsGithub size={16} />

            <Tooltip
              id="github"
              content="Star on Github"
              delayShow={150}
              delayHide={0}
            />
          </a>
        </li>

        {/* Documentation */}
        <li className="flex items-center">
          <a
            aria-label="Documentation"
            href="https://github.com/ioflux-org/studio-json-schema?tab=readme-ov-file#json-schema-visualizer"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md border border-transparent text-[var(--navigation-text-color)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] flex items-center transition-all duration-200"
            data-tooltip-id="learn-keywords"
          >
            <BsBook size={16} />

            <Tooltip
              id="learn-keywords"
              content="Docs"
              delayShow={150}
              delayHide={0}
            />
          </a>
        </li>

        {/* Fullscreen */}
        <li className="flex items-center">
          <FullscreenToggleButton />
        </li>
      </ul>

      {/* Mobile Search */}
      {mobileSearchOpen && (
        <div
          className="absolute top-full left-0 w-full sm:hidden flex items-center gap-2 px-4 py-2.5 border-b border-[var(--toolbar-border-color)] backdrop-blur-md bg-[var(--nav-bg-color)] z-500"
        >
          <RiSearchLine className="text-[var(--text-secondary-color)] flex-shrink-0" size={16} />

          <input
            ref={mobileSearchInputRef}
            type="text"
            maxLength={30}
            placeholder="Search nodes..."
            aria-label="Search nodes"
            className="outline-none bg-transparent text-[var(--text-color)] text-sm flex-1"
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            aria-label="Close search"
            onClick={() => {
              setSearchString("");
              setSelectedNode(null);
              setMobileSearchOpen(false);
            }}
            className="text-[var(--text-secondary-color)] hover:text-[var(--text-color)] cursor-pointer transition-colors"
          >
            <RiCloseLine size={18} />
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavigationBar;
