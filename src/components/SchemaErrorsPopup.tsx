import { BsBoxArrowUpRight } from "react-icons/bs";
import type { ValidationStatus } from "./MonacoEditor";

type SchemaErrorsPopupProps = {
  schemaValidation: ValidationStatus;
  activeErrorIndex: number | null;
  setActiveErrorIndex: (index: number) => void;
  highlightPathInEditor: (path: (string | number)[]) => void;
};

const SchemaErrorsPopup = ({
  schemaValidation,
  activeErrorIndex,
  setActiveErrorIndex,
  highlightPathInEditor,
}: SchemaErrorsPopupProps) => {
  if (
    schemaValidation.status !== "error" ||
    (!schemaValidation.syntaxError &&
      !(
        schemaValidation.schemaErrors &&
        schemaValidation.schemaErrors.length > 0
      ))
  ) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-[var(--popup-backdrop-color)] backdrop-blur-sm" />
      {/* Error card */}
      <div
        className="relative z-50 w-[90%] sm:w-[60%] min-w-[280px] max-h-[80%] p-4 rounded-lg shadow-xl bg-[var(--popup-bg-color)] overflow-hidden flex flex-col gap-2"
        role="status"
        aria-live="polite"
        aria-label="Schema validation errors"
      >
        <div className="flex justify-between items-end mb-2 px-2 border-b border-[var(--popup-header-bg-color)] pb-2">
          <div className="text-red-500 font-semibold">
            {schemaValidation.syntaxError
              ? "Syntax Error"
              : `Schema Errors (${
                  schemaValidation.schemaErrors?.length || 0
                })`}
          </div>
          {!schemaValidation.syntaxError &&
            schemaValidation.schemaErrors &&
            schemaValidation.schemaErrors.length > 0 && (
              <div className="text-[10px] text-[var(--popup-text-color)] opacity-60 uppercase font-semibold pr-1">
                Documentation
              </div>
            )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {schemaValidation.syntaxError ? (
            <div className="flex flex-col gap-2">
              <div className="bg-[var(--popup-header-bg-color)] p-3 rounded text-xs text-[var(--popup-text-color)] font-mono whitespace-pre-wrap border border-red-500/20">
                {schemaValidation.syntaxError}
              </div>
            </div>
          ) : schemaValidation.schemaErrors &&
            schemaValidation.schemaErrors.length > 0 ? (
            <div className="flex flex-col gap-2 min-h-0">
              <ul className="overflow-y-auto flex flex-col gap-0.5 max-h-[200px]">
                {schemaValidation.schemaErrors.map((err, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2 pr-2 rounded transition-colors group ${
                      activeErrorIndex === i
                        ? "bg-[var(--popup-header-bg-color)]"
                        : "hover:bg-[var(--popup-header-bg-color)]"
                    }`}
                  >
                    <button
                      id={`validation-error-${i}`}
                      onClick={() => {
                        setActiveErrorIndex(i);
                        highlightPathInEditor(err.path);
                      }}
                      className="flex-1 text-left text-xs px-2 py-1 cursor-pointer text-[var(--popup-text-color)] hover:text-blue-500 transition-colors"
                      title={`Click to locate: ${err.message}`}
                      aria-label={`Locate error: ${err.message}`}
                    >
                      {err.linePrefix && (
                        <span className="underline underline-offset-2 mr-1">
                          {err.linePrefix}
                        </span>
                      )}
                      <span>{err.message}</span>
                    </button>
                    {err.docLink && (
                      <a
                        href={err.docLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--popup-text-color)] opacity-50 hover:opacity-100 hover:text-blue-400 transition-opacity flex justify-center w-24"
                        title="View JSON Schema documentation for this rule"
                        aria-label="View documentation"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <BsBoxArrowUpRight size={12} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SchemaErrorsPopup;
