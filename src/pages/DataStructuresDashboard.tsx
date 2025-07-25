import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { dataStructuresComponentLinkList } from '../helpers/contsant';
import { FaCircle } from 'react-icons/fa6';
import { componentLinkTT } from '@/types/contantTypes';

// Data structure-specific icons
import {
  FaLayerGroup,
  FaNetworkWired,
  FaTree,
  FaDatabase,
  FaChartBar,
  FaRandom,
} from 'react-icons/fa';

// Helper function to group data structures by category
const groupByCategory = (items: componentLinkTT[]) => {
  const categories: Record<string, componentLinkTT[]> = {
    Basic: [],
    Trees: [],
    Graphs: [],
    Heaps: [],
    Advanced: [],
    Other: [],
  };

  items.forEach((item) => {
    // Basic data structures
    if (
      ['Array', 'Linked List', 'Stack', 'Queue', 'Hash Table'].includes(
        item.name
      )
    ) {
      categories['Basic'].push(item);
    }
    // Tree data structures
    else if (item.name.includes('Tree') || item.name === 'Trie') {
      categories['Trees'].push(item);
    }
    // Graph data structures
    else if (item.name.includes('Graph')) {
      categories['Graphs'].push(item);
    }
    // Heap data structures
    else if (item.name.includes('Heap')) {
      categories['Heaps'].push(item);
    }
    // Advanced data structures
    else if (
      item.name.includes('Skip') ||
      item.name.includes('Bloom') ||
      item.name.includes('Disjoint') ||
      item.name.includes('Cache')
    ) {
      categories['Advanced'].push(item);
    }
    // Other data structures
    else {
      categories['Other'].push(item);
    }
  });

  // Remove empty categories
  Object.keys(categories).forEach((key) => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
};

// Get appropriate icon for data structure category
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Basic':
      return <FaLayerGroup className='text-purple-600' />;
    case 'Trees':
      return <FaTree className='text-green-600' />;
    case 'Graphs':
      return <FaNetworkWired className='text-indigo-600' />;
    case 'Heaps':
      return <FaChartBar className='text-amber-600' />;
    case 'Advanced':
      return <FaDatabase className='text-rose-600' />;
    default:
      return <FaRandom className='text-gray-600' />;
  }
};

// Get animation pattern for data structure
const getDataStructurePattern = (dsName: string) => {
  if (dsName === 'Array') {
    return (
      <div className='absolute inset-0 overflow-hidden opacity-20'>
        <div className='array-pattern'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className='array-element'
              style={{
                animationDelay: `${i * 0.1}s`,
                backgroundColor: '#8b5cf6',
              }}
            />
          ))}
        </div>
      </div>
    );
  } else if (dsName === 'Linked List') {
    return (
      <div className='absolute inset-0 overflow-hidden opacity-20'>
        <div className='linked-list-pattern'>
          {Array.from({ length: 5 }).map((_, i) => (
            <React.Fragment key={i}>
              <div
                className='linked-list-node'
                style={{
                  left: `${15 + i * 20}%`,
                  animationDelay: `${i * 0.2}s`,
                  backgroundColor: '#8b5cf6',
                }}
              />
              {i < 4 && (
                <div
                  className='linked-list-arrow'
                  style={{
                    left: `${25 + i * 20}%`,
                    animationDelay: `${i * 0.2 + 0.1}s`,
                    backgroundColor: '#8b5cf6',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  } else if (dsName === 'Stack') {
    return (
      <div className='absolute inset-0 overflow-hidden opacity-20'>
        <div className='stack-pattern'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='stack-element'
              style={{
                bottom: `${10 + i * 20}%`,
                animationDelay: `${i * 0.15}s`,
                backgroundColor: '#8b5cf6',
              }}
            />
          ))}
        </div>
      </div>
    );
  } else if (dsName === 'Queue') {
    return (
      <div className='absolute inset-0 overflow-hidden opacity-20'>
        <div className='queue-pattern'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='queue-element'
              style={{
                left: `${10 + i * 20}%`,
                animationDelay: `${i * 0.15}s`,
                backgroundColor: '#8b5cf6',
              }}
            />
          ))}
        </div>
      </div>
    );
  } else if (dsName.includes('Tree')) {
    return (
      <div className='absolute inset-0 overflow-hidden opacity-20'>
        <div className='tree-pattern'>
          <div
            className='tree-node root'
            style={{ top: '10%', left: '50%', backgroundColor: '#10b981' }}
          />
          <div
            className='tree-node level-1'
            style={{ top: '30%', left: '30%', backgroundColor: '#10b981' }}
          />
          <div
            className='tree-node level-1'
            style={{ top: '30%', left: '70%', backgroundColor: '#10b981' }}
          />
          <div
            className='tree-node level-2'
            style={{ top: '50%', left: '20%', backgroundColor: '#10b981' }}
          />
          <div
            className='tree-node level-2'
            style={{ top: '50%', left: '40%', backgroundColor: '#10b981' }}
          />
          <div
            className='tree-node level-2'
            style={{ top: '50%', left: '60%', backgroundColor: '#10b981' }}
          />
          <div
            className='tree-node level-2'
            style={{ top: '50%', left: '80%', backgroundColor: '#10b981' }}
          />

          <div
            className='tree-edge'
            style={{
              top: '15%',
              left: '40%',
              width: '20%',
              transform: 'rotate(45deg)',
              backgroundColor: '#10b981',
            }}
          />
          <div
            className='tree-edge'
            style={{
              top: '15%',
              left: '50%',
              width: '20%',
              transform: 'rotate(-45deg)',
              backgroundColor: '#10b981',
            }}
          />

          <div
            className='tree-edge'
            style={{
              top: '35%',
              left: '25%',
              width: '10%',
              transform: 'rotate(45deg)',
              backgroundColor: '#10b981',
            }}
          />
          <div
            className='tree-edge'
            style={{
              top: '35%',
              left: '35%',
              width: '10%',
              transform: 'rotate(-45deg)',
              backgroundColor: '#10b981',
            }}
          />
          <div
            className='tree-edge'
            style={{
              top: '35%',
              left: '65%',
              width: '10%',
              transform: 'rotate(45deg)',
              backgroundColor: '#10b981',
            }}
          />
          <div
            className='tree-edge'
            style={{
              top: '35%',
              left: '75%',
              width: '10%',
              transform: 'rotate(-45deg)',
              backgroundColor: '#10b981',
            }}
          />
        </div>
      </div>
    );
  } else if (dsName.includes('Graph')) {
    return (
      <div className='absolute inset-0 overflow-hidden opacity-20'>
        <div className='graph-pattern'>
          <div
            className='graph-node'
            style={{ top: '20%', left: '30%', backgroundColor: '#4f46e5' }}
          />
          <div
            className='graph-node'
            style={{ top: '20%', left: '70%', backgroundColor: '#4f46e5' }}
          />
          <div
            className='graph-node'
            style={{ top: '60%', left: '20%', backgroundColor: '#4f46e5' }}
          />
          <div
            className='graph-node'
            style={{ top: '60%', left: '50%', backgroundColor: '#4f46e5' }}
          />
          <div
            className='graph-node'
            style={{ top: '60%', left: '80%', backgroundColor: '#4f46e5' }}
          />

          <div
            className='graph-edge'
            style={{
              top: '20%',
              left: '30%',
              width: '40%',
              backgroundColor: '#4f46e5',
            }}
          />
          <div
            className='graph-edge'
            style={{
              top: '20%',
              left: '30%',
              height: '40%',
              transform: 'rotate(90deg)',
              backgroundColor: '#4f46e5',
            }}
          />
          <div
            className='graph-edge'
            style={{
              top: '20%',
              left: '70%',
              height: '40%',
              transform: 'rotate(90deg)',
              backgroundColor: '#4f46e5',
            }}
          />
          <div
            className='graph-edge'
            style={{
              top: '60%',
              left: '20%',
              width: '30%',
              backgroundColor: '#4f46e5',
            }}
          />
          <div
            className='graph-edge'
            style={{
              top: '60%',
              left: '50%',
              width: '30%',
              backgroundColor: '#4f46e5',
            }}
          />
        </div>
      </div>
    );
  }

  return null;
};

const DataStructuresDashboard = () => {
  const groupedDataStructures = groupByCategory(
    dataStructuresComponentLinkList
  );

  return (
    <div className='w-full px-4 py-6 text-gray-800'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-10'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600'>
            Data Structures
          </h1>
          <p className='text-gray-600 text-lg'>
            Explore various data structures and their implementations to
            understand how they work.
          </p>

          {/* Status Legend */}
          <Card className='mt-6 border border-purple-100 bg-white shadow-sm'>
            <CardContent className='p-4'>
              <div className='flex gap-6 items-center'>
                <div className='flex gap-2 items-center'>
                  <FaCircle className='text-indigo-600 text-sm' />
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

        {/* Display data structures by category */}
        {Object.entries(groupedDataStructures).map(
          ([category, dataStructures]) => (
            <section key={category} className='mb-16 data-structure-category'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-3 rounded-full bg-white shadow-sm border border-purple-100'>
                  {getCategoryIcon(category)}
                </div>
                <h2 className='text-2xl md:text-3xl font-bold text-gray-800'>
                  {category} Data Structures
                </h2>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                {dataStructures.map((ds, index) => (
                  <Link
                    key={`${ds.name}-${index}`}
                    to={`/${ds.link}`}
                    className={`block transform transition-all duration-300 hover:scale-105 ${
                      ds.color === 'red' ? 'pointer-events-none opacity-70' : ''
                    }`}
                  >
                    <Card
                      className={`h-full border transition-all duration-300 hover:shadow-md overflow-hidden
                    ${
                      ds.color === 'green'
                        ? 'bg-white border-purple-200 hover:border-purple-300'
                        : 'bg-white border-gray-200'
                    } relative group`}
                    >
                      <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500'>
                        {getDataStructurePattern(ds.name)}
                      </div>

                      <CardContent className='p-6 relative z-10'>
                        <div className='flex items-center gap-3 mb-3'>
                          <span className='relative flex h-3 w-3'>
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
                              style={{
                                backgroundColor:
                                  ds.color === 'green' ? '#8b5cf6' : '#ef4444',
                              }}
                            ></span>
                            <span
                              className={`relative inline-flex rounded-full h-3 w-3`}
                              style={{
                                backgroundColor:
                                  ds.color === 'green' ? '#8b5cf6' : '#ef4444',
                              }}
                            ></span>
                          </span>
                          <span className='font-bold text-lg text-gray-800'>
                            {ds.name}
                          </span>
                        </div>

                        {ds.tooltip && (
                          <p className='text-sm text-gray-600 mt-2'>
                            {ds.tooltip}
                          </p>
                        )}

                        <div className='mt-4 pt-4 border-t border-gray-200 flex justify-between items-center'>
                          <span className='text-xs text-gray-500'>
                            {ds.color === 'green'
                              ? 'Interactive Demo'
                              : 'Coming Soon'}
                          </span>
                          <span className='text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700'>
                            {category}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )
        )}
      </div>
    </div>
  );
};

export default DataStructuresDashboard;
