import AlgorithmVisualizer from './components/AlgorithmVisualizer';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';
import { useEffect } from 'react';
import Layout from './components/Layout';
import DfsAlgorithmCircus from './components/algorithms/DfsAlgorithmCircus';

const App = () => {
  useEffect(() => {
    toast('Welcome to Big O Circus');
  }, []);

  return (
    <Layout>
      <DfsAlgorithmCircus />
      <ToastContainer />
    </Layout>
  );
};

export default App;
