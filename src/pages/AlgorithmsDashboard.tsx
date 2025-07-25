import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { algorithmsCompoentLinkList } from '../helpers/contsant';
import { FaCircle } from 'react-icons/fa6';
import { componentLinkTT } from '@/types/contantTypes';

// Algorithm-specific icons
import {
  FaSortAmountDown,
  FaSearch,
  FaProjectDiagram,
  FaRandom,
  FaCode,
} from 'react-icons/fa';

// Helper function to group algorithms by category
const groupByCategory = (items: componentLinkTT[]) => {
  const grouped: Record<string, componentLinkTT[]> = {};

  items.forEach((item) => {
    // Extract category from tooltip or use default
    let category = 'Miscellaneous';

    if (item.name.includes('Sort')) {
      category = 'Sorting';
    } else if (item.name.includes('Search')) {
      category = 'Searching';
    } else if (
      item.name === 'BFS' ||
      item.name === 'DFS' ||
      item.tooltip?.includes('Graph')
    ) {
      category = 'Graph';
    }

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(item);
  });

  return grouped;
};

// Get appropriate icon for algorithm category
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Sorting':
      return <FaSortAmountDown className='text-blue-600' />;
    case 'Searching':
      return <FaSearch className='text-indigo-600' />;
    case 'Graph':
      return <FaProjectDiagram className='text-green-600' />;
    case 'Dynamic Programming':
      return <FaCode className='text-purple-600' />;
    default:
      return <FaRandom className='text-gray-600' />;
  }
};

// Get animation pattern for algorithm
const getAlgorithmPattern = (algoName: string) => {
  if (algoName.includes('Sort')) {
    return (
      <div className='absolute inset-0 overflow-hidden opacity-20'>
        <div className='sorting-bars'>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className='sorting-bar'
              style={{
                height: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.1}s`,
                backgroundColor: '#3b82f6',
              }}
            />
          ))}
        </div>
      </div>
    );
  } else if (algoName.includes('Search')) {
    return (
      <div className='absolute inset-0 overflow-hidden opacity-20'>
        <div className='search-pattern'>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className='search-element'
              style={{
                animationDelay: `${i * 0.1}s`,
                backgroundColor: '#4f46e5',
              }}
            />
          ))}
        </div>
      </div>
    );
  } else if (algoName === 'BFS' || algoName === 'DFS') {
    return (
      <div className='absolute inset-0 overflow-hidden opacity-20'>
        <div className='graph-pattern'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className='graph-node'
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.2}s`,
                backgroundColor: '#10b981',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

const AlgorithmsDashboard = () => {
  const groupedAlgorithms = groupByCategory(algorithmsCompoentLinkList);

  return (
    <div className='w-full px-4 py-6 text-gray-800'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-10'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'>
            Algorithms
          </h1>
          <p className='text-gray-600 text-lg'>
            Explore various algorithms and their visualizations to understand
            how they work.
          </p>

          {/* Status Legend */}
          <Card className='mt-6 border border-blue-100 bg-white shadow-sm'>
            <CardContent className='p-4'>
              <div className='flex gap-6 items-center'>
                <div className='flex gap-2 items-center'>
                  <FaCircle className='text-green-500 text-sm' />
                  <span className='font-medium text-gray-700'>Available</span>
                </div>
                <div className='flex gap-2 items-center'>
                  <FaCircle className='text-red-500 text-sm' />
                  <span className='font-medium text-gray-700'>Coming Soon</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Display algorithms by category */}
        {Object.entries(groupedAlgorithms).map(([category, algorithms]) => (
          <section key={category} className='mb-16 algorithm-category'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-3 rounded-full bg-white shadow-sm border border-blue-100'>
                {getCategoryIcon(category)}
              </div>
              <h2 className='text-2xl md:text-3xl font-bold text-gray-800'>
                {category} Algorithms
              </h2>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
              {algorithms.map((algo, index) => (
                <Link
                  key={`${algo.name}-${index}`}
                  to={`/${algo.link}`}
                  className={`block transform transition-all duration-300 hover:scale-105 ${
                    algo.color === 'red' ? 'pointer-events-none opacity-70' : ''
                  }`}
                >
                  <Card
                    className={`h-full border transition-all duration-300 hover:shadow-md overflow-hidden
                    ${
                      algo.color === 'green'
                        ? 'bg-white border-blue-200 hover:border-blue-300'
                        : 'bg-white border-gray-200'
                    } relative group`}
                  >
                    <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500'>
                      {getAlgorithmPattern(algo.name)}
                    </div>

                    <CardContent className='p-6 relative z-10'>
                      <div className='flex items-center gap-3 mb-3'>
                        <span className='relative flex h-3 w-3'>
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
                            style={{
                              backgroundColor:
                                algo.color === 'green' ? '#3b82f6' : '#ef4444',
                            }}
                          ></span>
                          <span
                            className={`relative inline-flex rounded-full h-3 w-3`}
                            style={{
                              backgroundColor:
                                algo.color === 'green' ? '#3b82f6' : '#ef4444',
                            }}
                          ></span>
                        </span>
                        <span className='font-bold text-lg text-gray-800'>
                          {algo.name}
                        </span>
                      </div>

                      {algo.tooltip && (
                        <p className='text-sm text-gray-600 mt-2'>
                          {algo.tooltip}
                        </p>
                      )}

                      <div className='mt-4 pt-4 border-t border-gray-200 flex justify-between items-center'>
                        <span className='text-xs text-gray-500'>
                          {algo.color === 'green'
                            ? 'Interactive Demo'
                            : 'Coming Soon'}
                        </span>
                        <span className='text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700'>
                          {category}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default AlgorithmsDashboard;
