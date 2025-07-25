import React, { ReactNode, useState, useEffect } from 'react';
import {
  FaGithub,
  FaLinkedin,
  FaCode,
  FaLightbulb,
  FaChartLine,
} from 'react-icons/fa6';
import { Link, NavLink, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const RootLayout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine background color based on route - using more balanced colors
  const getBackgroundColor = () => {
    if (location.pathname.startsWith('/algo')) {
      return 'from-blue-50 to-blue-100';
    } else if (location.pathname.startsWith('/ds-')) {
      return 'from-purple-50 to-purple-100';
    } else if (location.pathname === '/algorithms') {
      return 'from-blue-50 to-blue-100';
    } else if (location.pathname === '/datastructure') {
      return 'from-purple-50 to-purple-100';
    } else {
      return 'from-gray-50 to-white';
    }
  };

  // Determine text color based on route
  const getTextColor = () => {
    return 'text-gray-800';
  };

  return (
    <div
      className={`w-full min-h-screen flex flex-col bg-gradient-to-b ${getBackgroundColor()} ${getTextColor()}`}
    >
      <header
        className={`w-full py-3 px-4 sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className='max-w-7xl mx-auto flex justify-between items-center'>
          <Link to={'/'} className='group'>
            <div className='flex items-center gap-2'>
              <div className='bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg transform transition-transform group-hover:rotate-12 shadow-md'>
                <FaCode className='text-white text-xl' />
              </div>
              <h1 className='text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500 transition-all'>
                Big O Circus
              </h1>
            </div>
          </Link>
          <nav>
            <ul className='flex gap-4 items-center'>
              <li>
                <NavLink
                  to={'/datastructure'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-md transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                        : 'hover:bg-purple-100 text-gray-700 hover:text-purple-700 border border-transparent hover:border-purple-200'
                    }`
                  }
                >
                  Data Structures
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={'/algorithms'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-md transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                        : 'hover:bg-blue-100 text-gray-700 hover:text-blue-700 border border-transparent hover:border-blue-200'
                    }`
                  }
                >
                  Algorithms
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className='flex-1'>{children}</main>

      <footer className='w-full py-6 px-4 bg-white shadow-inner border-t border-gray-200'>
        <div className='max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6'>
          <div className='flex flex-col items-center md:items-start'>
            <div className='flex items-center gap-2 mb-2'>
              <FaChartLine className='text-blue-500' />
              <span className='text-gray-700 text-sm'>
                Learn algorithms and data structures visually
              </span>
            </div>
            <span className='text-sm text-gray-500'>
              © 2024 Big O Circus Made with ❤️ by Kuldeep Ahlawat
            </span>
          </div>
          <div className='flex items-center gap-6'>
            <a
              target='_blank'
              href='https://github.com/imkuldeepahlawat/Big-O-Circus'
              className='text-gray-500 hover:text-gray-800 transition-colors text-xl hover:scale-110 transform duration-200'
              aria-label='GitHub Repository'
            >
              <FaGithub />
            </a>
            <a
              target='_blank'
              href='https://www.linkedin.com/in/imkuldeepahlawat/'
              className='text-gray-500 hover:text-blue-600 transition-colors text-xl hover:scale-110 transform duration-200'
              aria-label='LinkedIn Profile'
            >
              <FaLinkedin />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;
