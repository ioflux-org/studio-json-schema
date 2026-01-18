import { BsGithub, BsMoonStars, BsBook, BsSun } from "react-icons/bs";
import { useContext } from "react";
import { Tooltip } from "react-tooltip";
import { AppContext, type SchemaFormat } from "../contexts/AppContext";
import FullscreenToggleButton from "./FullscreenToggleButton";

const NavigationBar = () => {
  const { theme, toggleTheme, schemaFormat, changeSchemaFormat } =
    useContext(AppContext);

  return (
    <nav className="h-[8vh] flex justify-between items-center shadow-lg relative z-10">
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

      <ul className="flex gap-5 mr-10">
        <li>
          <select
            onChange={(e) => changeSchemaFormat(e.target.value as SchemaFormat)}
            className="text-sm border rounded-sm bg-[var(--bg-color)] text-[var(--dropdown-text-color)] border-[var(--navigation-text-color)] cursor-pointer"
            value={schemaFormat}
          >
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
          </select>
        </li>
        <li>
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
        <li>
          <a
            href="https://github.com/jagpreetrahi/visualize-json-schema"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl"
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
        <li>
          <a
            href="https://github.com/jagpreetrahi/visualize-json-schema?tab=readme-ov-file#json-schema-visualizer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl"
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
        <li>
          <FullscreenToggleButton />
        </li>
      </ul>
    </nav>
  );
};

export default NavigationBar;
