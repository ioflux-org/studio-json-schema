import { BsGithub, BsMoonStars, BsBook, BsSun } from "react-icons/bs";
import { RiSearchLine, RiCloseLine } from "react-icons/ri";
import { useContext, useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import { AppContext } from "../contexts/AppContext";
import FullscreenToggleButton from "./FullscreenToggleButton";

const NavigationBar = () => {
  const { theme, toggleTheme, isFullScreen, searchString, setSearchString, navigateGraphMatch } =
    useContext(AppContext);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        const active = document.activeElement;
        const inEditor = active?.closest(".monaco-editor") !== null;
        const inInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || (active as HTMLElement)?.isContentEditable;
        if (inEditor || inInput) return;
        if (!mobileSearchOpen && searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current.focus();
        }
      }
      if (e.key === "Escape" && mobileSearchOpen) {
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  return (
    <nav className={`flex flex-col relative z-10 bg-[var(--bg-color)] ${
      isFullScreen
        ? `w-full px-2 py-1 ${theme === "light" ? "shadow-md border-b-[1px] border-gray-200" : ""}`
        : "shadow-lg"
    }`}>
      <div className={`flex items-center ${isFullScreen ? "justify-end" : "h-[8vh] justify-between"}`}>
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

        <ul className={`flex items-center gap-5 ${isFullScreen ? 'mr-0' : 'mr-4'}`}>
          {/* Full search bar — visible on sm and above */}
          <li className="hidden sm:flex items-center gap-1">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-md w-[200px] ${theme === 'dark' ? 'bg-white/5 border border-[var(--popup-border-color)]' : 'bg-gray-100 border border-gray-300'}`}>
              <RiSearchLine className="text-[var(--navigation-text-color)] flex-shrink-0 opacity-90" size={15} aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                maxLength={30}
                placeholder="Search Node"
                aria-label="Search nodes"
                className="outline-none bg-transparent text-[var(--navigation-text-color)] text-sm placeholder:text-[var(--navigation-text-color)] flex-1 min-w-0"
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  navigateGraphMatch(e.shiftKey ? "prev" : "next");
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

          {/* Search icon — visible on smaller than sm */}
          <li className="flex sm:hidden items-center">
            <button
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className="text-xl cursor-pointer"
              aria-label="Toggle search"
            >
              <RiSearchLine
                size={mobileSearchOpen ? 22 : 20}
                className="text-[var(--navigation-text-color)]"
              />
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
      </div>

      {/* Mobile search dropdown */}
      {mobileSearchOpen && (
        <div className={`flex sm:hidden items-center gap-2 px-3 py-2 border-t ${theme === 'dark' ? 'border-[var(--popup-border-color)]' : 'border-gray-200'}`}>
          <RiSearchLine className="text-[var(--navigation-text-color)] flex-shrink-0 opacity-60" size={14} />
          <input
            ref={mobileSearchInputRef}
            type="text"
            maxLength={30}
            placeholder="Search Node"
            aria-label="Search nodes"
            className="outline-none bg-transparent text-[var(--navigation-text-color)] text-sm placeholder:text-[var(--navigation-text-color)] flex-1"
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              navigateGraphMatch(e.shiftKey ? "prev" : "next");
            }}
          />
          <button
            onClick={() => {
              setSearchString("");
              setMobileSearchOpen(false);
            }}
            className="text-[var(--navigation-text-color)] opacity-50 hover:opacity-100 cursor-pointer ml-auto flex-shrink-0"
          >
            <RiCloseLine size={16} />
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavigationBar;
