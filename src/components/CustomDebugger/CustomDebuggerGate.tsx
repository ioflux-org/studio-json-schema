import { useContext } from "react";
import { AppContext } from "../../contexts/AppContext";
import CustomDebugger from "./CustomDebugger";

// Mounts CustomDebugger only while open, so the WASM module (~1.5MB) is
// fetched lazily on first use rather than on every page load.
const CustomDebuggerGate = () => {
  const { isCustomDebuggerOpen, closeCustomDebugger } = useContext(AppContext);
  if (!isCustomDebuggerOpen) return null;
  return <CustomDebugger onClose={closeCustomDebugger} />;
};

export default CustomDebuggerGate;
