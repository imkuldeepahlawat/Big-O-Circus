import React, { ReactNode } from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const RootLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className='w-full h-[100vh] '>
      <header className='w-full h-[5%] flex justify-center md:justify-between items-center px-3 '>
        <Link to={'/'}>
          <h1 className='text-xl text-center md:text-3xl font-bold cursor-pointer'>
            Big O Circus
          </h1>
        </Link>
        <ul className='md:flex gap-3  uppercase hidden md:block'>
          {/* <Link to={'data-structure'}>
            <li className='rounded-md border  px-4 cursor-pointer'>
              Data Structure
            </li>
          </Link>
          <Link to={'algorithms'}>
            <li className='rounded-md border  px-4 cursor-pointer'>
              Algorithms
            </li>
          </Link> */}
        </ul>
      </header>
      <main className='w-full h-[90%] overflow-y-scroll overflow-x-hidden relative'>
        {children}
      </main>
      <footer className='w-full h-[5%] flex justify-center items-center gap-3 '>
        <div className='flex items-center gap-3'>
          <span className=''>
            © 2024 Big O Circus Made with ❤️ by Kuldeep Ahlawat
          </span>
          <a
            target='_blank'
            href='https://github.com/imkuldeepahlawat/Big-O-Circus'
          >
            <FaGithub />
          </a>
          <a
            target='_blank'
            href='https://www.linkedin.com/in/imkuldeepahlawat/'
          >
            <FaLinkedin />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;
