import { useState, useEffect, useCallback } from "react";
import { CgClose } from "react-icons/cg";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";

interface SearchBarProps {
  onSearch: (searchString: string) => boolean;
  onNavigate: (direction: 'next' | 'prev') => void;
  matchCount: number;
  currentIndex: number;
}

const SearchBar = ({ onSearch, onNavigate, matchCount, currentIndex }: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState("");

  // Debounce the search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Perform search when debounced value changes
  useEffect(() => {
    if (!debouncedValue.trim()) {
      setErrorMessage("");
      return;
    }

    const found = onSearch(debouncedValue.trim());
    if (!found) {
      setErrorMessage(`${debouncedValue.trim()} is not in schema`);
    } else {
      setErrorMessage("");
    }
  }, [debouncedValue, onSearch]);

  useEffect(() => {
    if (errorMessage) {
      setShowErrorPopup(true);
      const timer = setTimeout(() => {
        setShowErrorPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowErrorPopup(false);
    }
  }, [errorMessage]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  }, []);

  return (
    <>
      {errorMessage && showErrorPopup && (
        <div className="absolute bottom-[50px] left-[100px] flex gap-2 px-2 py-1 bg-red-500 text-white rounded-md shadow-lg">
          <div className="text-sm font-medium tracking-wide font-roboto">
            {errorMessage}
          </div>
          <button
            className="cursor-pointer"
            onClick={() => setShowErrorPopup(false)}
          >
            <CgClose size={18} />
          </button>
        </div>
      )}

      <div className="absolute bottom-[10px] left-[50px] flex items-center gap-2">
        <input
          type="text"
          maxLength={30}
          placeholder="search node"
          className="outline-none text-[var(--bottom-bg-color)] border-b-2 text-center w-[150px]"
          value={searchValue}
          onChange={handleChange}
        />
        
        {matchCount > 1 && (
          <div className="flex items-center gap-1 bg-[var(--node-bg-color)] px-2 py-1 rounded border border-[var(--text-color)] opacity-80">
            <button
              onClick={() => onNavigate('prev')}
              className="hover:bg-[var(--text-color)] hover:bg-opacity-20 rounded p-1 transition-colors"
              title="Previous match"
            >
              <MdNavigateBefore size={20} className="text-[var(--text-color)]" />
            </button>
            
            <span className="text-xs text-[var(--text-color)] min-w-[40px] text-center">
              {currentIndex + 1}/{matchCount}
            </span>
            
            <button
              onClick={() => onNavigate('next')}
              className="hover:bg-[var(--text-color)] hover:bg-opacity-20 rounded p-1 transition-colors"
              title="Next match"
            >
              <MdNavigateNext size={20} className="text-[var(--text-color)]" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SearchBar;
