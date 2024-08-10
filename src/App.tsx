import AlgorithmVisualizer from './components/AlgorithmVisualizer';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';
import { useEffect } from 'react';

const App = () => {
  useEffect(() => {
    toast('Welcome to Big O Circus');
  }, []);

  return (
    <div className='w-full h-[100vh] overflow-x-hidden '>
      <AlgorithmVisualizer />
      <ToastContainer />
    </div>
  );
};

export default App;
