import { LuCircleAlert } from "react-icons/lu";
import { MdClose } from "react-icons/md";

const ErrorPopup = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--popup-bg-color)] border border-[var(--popup-border-color)] shadow-lg max-w-[300px]">
      <LuCircleAlert className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-semibold text-[var(--popup-text-color)]">
          Error
        </span>
        <span className="text-xs text-[var(--popup-text-color)] opacity-80 break-words">
          {message}
        </span>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-[var(--popup-text-color)] opacity-60 hover:opacity-100 cursor-pointer"
        aria-label="Dismiss error"
      >
        <MdClose size={16} />
      </button>
    </div>
  );
};

export default ErrorPopup;
