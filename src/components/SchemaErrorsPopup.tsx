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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-lg" />
      {/* Error card */}
      <div
        className="relative z-50 w-[90%] sm:w-[50%] min-w-[280px] max-h-[80%] p-6 rounded-2xl border border-red-500/20 bg-[var(--popup-bg-color)] overflow-hidden flex flex-col gap-3 ring-1 ring-red-500/10"
        style={{ boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.4), 0 0 40px -8px rgba(239, 68, 68, 0.15)" }}
        role="status"
        aria-live="polite"
        aria-label="Schema validation errors"
      >
        <div className="flex justify-between items-end pb-3 border-b border-[var(--popup-border-color)]">
          <div className="text-red-400 font-semibold text-sm">
            {schemaValidation.syntaxError
              ? "Syntax Error"
              : `Schema Errors (${
                  schemaValidation.schemaErrors?.length || 0
                })`}
          </div>
          {!schemaValidation.syntaxError &&
            schemaValidation.schemaErrors &&
            schemaValidation.schemaErrors.length > 0 && (
              <div className="text-[11px] text-[var(--accent-color)] uppercase font-semibold tracking-widest">
                Documentation
              </div>
            )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {schemaValidation.syntaxError ? (
            <div className="flex flex-col gap-2">
              <div className="bg-[var(--popup-header-bg-color)] p-3 rounded-xl text-xs text-[var(--popup-text-color)] font-mono whitespace-pre-wrap border border-red-500/20">
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
                    className={`flex items-center gap-2 pr-2 rounded-lg transition-colors group ${
                      activeErrorIndex === i
                        ? "bg-[var(--popup-header-bg-color)] border border-[var(--popup-border-color)]"
                        : "hover:bg-[var(--popup-header-bg-color)] border border-transparent"
                    }`}
                  >
                    <button
                      id={`validation-error-${i}`}
                      onClick={() => {
                        setActiveErrorIndex(i);
                        highlightPathInEditor(err.path);
                      }}
                      className="flex-1 text-left text-xs px-3 py-2 cursor-pointer text-[var(--popup-text-color)] hover:text-[var(--accent-color)] transition-colors"
                      title={`Click to locate: ${err.message}`}
                      aria-label={`Locate error: ${err.message}`}
                    >
                      {err.linePrefix && (
                        <span className="underline underline-offset-2 mr-1 text-[var(--text-secondary-color)]">
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
                        className="text-[var(--text-secondary-color)] opacity-50 hover:opacity-100 hover:text-[var(--accent-color)] transition-all flex justify-center w-24"
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
