// import BottomBar from "./components/BottomBar";
import NavigationBar from "./components/NavigationBar";
import MonacoEditor from "./components/MonacoEditor";
import { AppProvider } from "./contexts/AppProvider";
import "./style/theme.css";
import "./App.css";

function App() {
  return (
    <AppProvider>
      <div className="flex flex-col overflow-hidden antialiased" style={{ height: "100dvh" }}>
        <NavigationBar />
        <MonacoEditor />
        {/* <BottomBar /> */}
      </div>
    </AppProvider>
  );
}
export default App;
