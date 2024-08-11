import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className='w-full h-[100%] '>
      <header className='w-full h-[5%] flex justify-end items-center px-3 bg-black'>
        {/* <ul className='flex gap-3 text-white uppercase'>
          <li className='rounded-md border border-white px-1'>nav</li>
          <li className='rounded-md border border-white px-1'>nav</li>
          <li className='rounded-md border border-white px-1'>nav</li>
          <li className='rounded-md border border-white px-1'>nav</li>
        </ul> */}
      </header>
      <main className='w-full h-[90%]'>{children}</main>
      <footer className='w-full h-[5%] flex justify-center items-center '>
        <span>© 2024 Algo Circus Made with ❤️ by Kuldeep Ahlawat</span>
      </footer>
    </div>
  );
};

export default Layout;
