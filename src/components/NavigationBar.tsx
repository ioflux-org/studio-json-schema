import { BsGithub, BsMoonStars, BsBook, BsSun, BsSearch } from "react-icons/bs";
import { useContext, useState, useRef, useEffect } from "react";
import { CgClose } from "react-icons/cg";
import { Tooltip } from "react-tooltip";
import { AppContext, type SchemaFormat } from "../contexts/AppContext";
import FullscreenToggleButton from "./FullscreenToggleButton";

const NavigationBar = () => {
  const { theme, toggleTheme, schemaFormat, changeSchemaFormat, isFullScreen, searchString, setSearchString, navigateGraphMatch } =
    useContext(AppContext);

  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchString("");
  };

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
          {searchOpen ? (
            <div className="flex items-center gap-1 border-b border-[var(--navigation-text-color)]">
              <input
                ref={inputRef}
                type="text"
                maxLength={30}
                placeholder="Search node..."
                className="outline-none bg-transparent text-[var(--navigation-text-color)] text-sm placeholder:text-[var(--navigation-text-color)] w-[130px]"
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  navigateGraphMatch("next");
                }}
              />
              <button
                onClick={closeSearch}
                className="text-[var(--navigation-text-color)] hover:opacity-70 cursor-pointer"
                title="Close search"
              >
                <CgClose size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="text-xl cursor-pointer"
              data-tooltip-id="search-nodes"
            >
              <BsSearch className="text-[var(--navigation-text-color)]" />
              <Tooltip id="search-nodes" content="Search nodes" style={{ fontSize: "10px" }} />
            </button>
          )}
        </li>
        <li className="flex items-center">
          <select
            onChange={(e) => changeSchemaFormat(e.target.value as SchemaFormat)}
            className="text-sm border rounded-sm bg-[var(--bg-color)] text-[var(--dropdown-text-color)] border-[var(--navigation-text-color)] cursor-pointer"
            value={schemaFormat}
          >
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
          </select>
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
