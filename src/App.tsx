import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Outlet } from 'react-router-dom';
import RootLayout from './components/RootLayout';

const App = () => {
  return (
    <RootLayout>
      <Outlet />
      <ToastContainer position='bottom-right' />
    </RootLayout>
  );
};

export default App;
