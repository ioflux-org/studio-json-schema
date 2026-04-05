// import BottomBar from "./components/BottomBar";
import NavigationBar from "./components/NavigationBar";
import MonacoEditor from "./components/MonacoEditor";
import { AppProvider } from "./contexts/AppProvider";
import "./style/theme.css";
import "./App.css";

function App() {
  return (
    <AppProvider>
      <NavigationBar />
      <MonacoEditor />
      {/* <BottomBar /> */}
    </AppProvider>
  );
}
export default App;
