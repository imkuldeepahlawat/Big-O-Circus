import AlgorithmVisualizer from './components/AlgorithmVisualizer';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';
import { useEffect } from 'react';
import RootLayout from './components/RootLayout';
import { Outlet, RouterProvider, Routes, Route } from 'react-router-dom';
import dsRoutesList from './routes/ds-routes';
// import ArrayDataStructure from './components/data-structures/ArrayDataStructure';
import Home from './pages/Home';
import DataStructuresDashboard from './pages/DataStructuresDashboard';
import BfsAlgorithmCircus from './components/algorithms/BfsAlgorithmCircus';
import DfsAlgorithmCircus from './components/algorithms/DfsAlgorithmCircus';

const App = () => {
  useEffect(() => {
    //     toast('Welcome to Big O Circus');
  }, []);
  // <Suspense fallback={<div>Loading...</div>}>

  return (
    // <RootLayout>
    //   <Routes>
    //     <Route path='/' element={<Home />}></Route>
    //   </Routes>
    // </RootLayout>
    <>
      <DfsAlgorithmCircus />
    </>
  );
};

export default App;
