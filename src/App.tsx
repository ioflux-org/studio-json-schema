// import BottomBar from "./components/BottomBar";
import NavigationBar from "./components/NavigationBar";
import MonacoEditor from "./components/MonacoEditor";
import CustomDebuggerGate from "./components/CustomDebugger/CustomDebuggerGate";
import { AppProvider } from "./contexts/AppProvider";

function App() {
  return (
    <AppProvider>
      <div className="flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
        <NavigationBar />
        <MonacoEditor />
        {/* <BottomBar /> */}
      </div>
      <CustomDebuggerGate />
    </AppProvider>
  );
}
export default App;
