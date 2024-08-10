import AlgorithmVisualizer from "./components/AlgorithmVisualizer";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    toast("Welcome to Algorithm Visualizer");
  }, []);

  return (
    <div className="w-full h-[100vh]">
      <AlgorithmVisualizer />
      <ToastContainer />
    </div>
  );
}

export default App;
