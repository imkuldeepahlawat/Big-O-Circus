import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const RootLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className='w-full h-[100vh] '>
      <header className='w-full h-[5%] flex justify-between items-center px-3 '>
        <Link to={'/'}>
          <h1 className='text-3xl font-bold cursor-pointer'>Big O Circus</h1>
        </Link>
        <ul className='flex gap-3  uppercase'>
          <Link to={'data-structure'}>
            <li className='rounded-md border  px-4 cursor-pointer'>
              Data Structure
            </li>
          </Link>
          <Link to={'algorithms'}>
            <li className='rounded-md border  px-4 cursor-pointer'>
              Algorithms
            </li>
          </Link>
        </ul>
      </header>
      <main className='w-full h-[90%] overflow-y-scroll overflow-x-hidden relative'>
        {children}
      </main>
      <footer className='w-full h-[5%] flex justify-center items-center gap-3 '>
        <span className=''>
          © 2024 Algo Circus Made with ❤️ by Kuldeep Ahlawat
        </span>
      </footer>
    </div>
  );
};

export default RootLayout;
