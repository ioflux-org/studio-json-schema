import { BsBoxArrowUpRight } from "react-icons/bs";
import { RiCloseLine } from "react-icons/ri";
import type { ValidationStatus } from "./MonacoEditor";
import { useEffect } from "react";

type SchemaErrorsPopupProps = {
  schemaValidation: ValidationStatus;
  activeErrorIndex: number | null;
  setActiveErrorIndex: (index: number) => void;
  highlightPathInEditor: (path: (string | number)[]) => void;
  warningPopupOpen: boolean;
  onCloseWarningPopup: () => void;
};

const SchemaErrorsPopup = ({
  schemaValidation,
  activeErrorIndex,
  setActiveErrorIndex,
  highlightPathInEditor,
  warningPopupOpen,
  onCloseWarningPopup,
}: SchemaErrorsPopupProps) => {
  const isErrorPopup =
    schemaValidation.status === "error" &&
    (!!schemaValidation.syntaxError ||
      (schemaValidation.schemaErrors && schemaValidation.schemaErrors.length > 0));

  const isWarningPopup = schemaValidation.status === "warning" && warningPopupOpen;

  useEffect(() => {
    if (!isWarningPopup) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseWarningPopup();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isWarningPopup, onCloseWarningPopup]);

  if (!isErrorPopup && !isWarningPopup) {
    return null;
  }

  const closable = isWarningPopup;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-[var(--popup-backdrop-color)] backdrop-blur-sm"
        onClick={closable ? onCloseWarningPopup : undefined}
      />
      {/* Error card */}
      <div
        className={`relative z-50 w-[90%] sm:w-[50%] min-w-[280px] max-h-[80%] p-6 rounded-2xl border ${
          isWarningPopup
            ? "border-[var(--color-warning-soft)]"
            : "border-[var(--color-danger-soft)]"
        } bg-[var(--popup-bg-color)] overflow-hidden flex flex-col gap-3`}
        style={{
          boxShadow: isWarningPopup
            ? "0 0 10px var(--color-warning-glow), 0 0 25px var(--color-warning-glow), var(--shadow-lg)"
            : "0 0 10px var(--color-danger-glow), 0 0 25px var(--color-danger-glow), var(--shadow-lg)",
        }}
        role="status"
        aria-live="polite"
        aria-label={isWarningPopup ? "Schema validation warning" : "Schema validation errors"}
      >
        <div className="flex justify-between items-end pb-3 border-b border-[var(--popup-border-color)]">
          <div
            className={`font-semibold text-sm ${
              isWarningPopup
                ? "text-[var(--color-warning)]"
                : "text-[var(--color-danger)]"
            }`}
          >
            {isWarningPopup
              ? "Warning"
              : schemaValidation.syntaxError
              ? "Syntax Error"
              : `Schema Errors (${schemaValidation.schemaErrors?.length || 0})`}
          </div>

          <div className="flex items-center gap-2">
            {!isWarningPopup &&
              !schemaValidation.syntaxError &&
              schemaValidation.schemaErrors &&
              schemaValidation.schemaErrors.length > 0 && (
                <div className="text-[11px] text-[var(--accent-color)] uppercase font-semibold tracking-wider">
                  Documentation
                </div>
              )}
            {closable && (
              <button
                onClick={onCloseWarningPopup}
                aria-label="Close warning"
                className="text-[var(--popup-text-color)] opacity-70 hover:opacity-100 cursor-pointer"
              >
                <RiCloseLine size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isWarningPopup ? (
            <div className="bg-[var(--popup-header-bg-color)] p-3 rounded-xl text-xs text-[var(--popup-text-color)] font-mono whitespace-pre-wrap border border-[var(--color-warning-soft)]">
              {schemaValidation.message}
            </div>
          ) : schemaValidation.syntaxError ? (
            <div className="flex flex-col gap-2">
              <div className="bg-[var(--popup-header-bg-color)] p-3 rounded-xl text-xs text-[var(--popup-text-color)] font-mono whitespace-pre-wrap border border-[var(--color-danger-soft)]">
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
