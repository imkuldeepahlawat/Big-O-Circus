import React from 'react';
import {
  FaCircle,
  FaCode,
  FaLightbulb,
  FaRocket,
  FaChartLine,
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  algorithmsCompoentLinkList,
  dataStructuresComponentLinkList,
} from '../helpers/contsant';
import { componentLinkTT } from '@/types/contantTypes';

// Helper function to group items by category
const groupByCategory = (items: componentLinkTT[]) => {
  const grouped: Record<string, componentLinkTT[]> = {};

  items.forEach((item) => {
    // Extract category from tooltip or use default
    const category = item.tooltip?.includes(':')
      ? item.tooltip.split(':')[0]
      : 'Miscellaneous';

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(item);
  });

  return grouped;
};

const Home = () => {
  // Group data structures and algorithms by category
  const dsGrouped = groupByCategory(dataStructuresComponentLinkList);
  const algoGrouped = groupByCategory(algorithmsCompoentLinkList);

  return (
    <div className='w-full min-h-full'>
      {/* Hero Section */}
      <section className='relative overflow-hidden py-20 px-4 bg-gradient-to-b from-gray-50 to-white'>
        <div className='absolute inset-0 overflow-hidden'>
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-10"></div>
        </div>

        <div className='max-w-7xl mx-auto relative z-10'>
          <div className='text-center mb-16'>
            <h1 className='text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600'>
              Big O Circus
            </h1>
            <p className='text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8'>
              Visualize and understand algorithms and data structures through
              interactive animations
            </p>
            <div className='flex flex-wrap justify-center gap-4'>
              <Link to='/datastructure'>
                <Button className='bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-6 rounded-lg text-lg shadow-md transition-all hover:shadow-lg'>
                  <FaCode className='mr-2' /> Explore Data Structures
                </Button>
              </Link>
              <Link to='/algorithms'>
                <Button className='bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-6 rounded-lg text-lg shadow-md transition-all hover:shadow-lg'>
                  <FaRocket className='mr-2' /> Discover Algorithms
                </Button>
              </Link>
            </div>
          </div>

          {/* Status Legend */}
          <Card className='mb-12 border border-gray-200 bg-white shadow-sm max-w-md mx-auto'>
            <CardContent className='p-4'>
              <div className='flex justify-center gap-8 items-center'>
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
      </section>

      {/* Featured Data Structures Section */}
      <section className='py-16 px-4 bg-gradient-to-b from-purple-50 to-purple-100'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-between mb-10'>
            <div>
              <h2 className='text-3xl md:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600'>
                Data Structures
              </h2>
              <p className='text-gray-600 mt-2'>
                Building blocks for efficient data organization
              </p>
            </div>
            <Link to={`/datastructure`}>
              <Button className='bg-purple-600 hover:bg-purple-700 text-white border-none shadow-sm hover:shadow-md transition-all'>
                View All
              </Button>
            </Link>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
            {dataStructuresComponentLinkList
              .slice(0, 12)
              .map((dsLinkObj: componentLinkTT, inx) => (
                <TooltipProvider key={dsLinkObj.name + inx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={dsLinkObj.link}
                        className={`block transform transition-all duration-300 hover:scale-105 ${
                          dsLinkObj.color === 'red'
                            ? 'pointer-events-none opacity-70'
                            : ''
                        }`}
                      >
                        <Card
                          className={`h-full border transition-all duration-300 hover:shadow-md overflow-hidden
                        ${
                          dsLinkObj.color === 'green'
                            ? 'bg-white border-purple-200 hover:border-purple-300'
                            : 'bg-white border-gray-200'
                        } relative group`}
                        >
                          <CardContent className='p-4 flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <span className='relative flex h-3 w-3'>
                                <span
                                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
                                  style={{
                                    backgroundColor:
                                      dsLinkObj.color === 'green'
                                        ? '#8b5cf6'
                                        : '#ef4444',
                                  }}
                                ></span>
                                <span
                                  className={`relative inline-flex rounded-full h-3 w-3`}
                                  style={{
                                    backgroundColor:
                                      dsLinkObj.color === 'green'
                                        ? '#8b5cf6'
                                        : '#ef4444',
                                  }}
                                ></span>
                              </span>
                              <span className='font-medium text-gray-800'>
                                {dsLinkObj.name}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </TooltipTrigger>
                    {dsLinkObj.tooltip && (
                      <TooltipContent>
                        <p>{dsLinkObj.tooltip}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
          </div>
        </div>
      </section>

      {/* Featured Algorithms Section */}
      <section className='py-16 px-4 bg-gradient-to-b from-blue-50 to-blue-100'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-between mb-10'>
            <div>
              <h2 className='text-3xl md:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'>
                Algorithms
              </h2>
              <p className='text-gray-600 mt-2'>
                Step-by-step procedures for solving problems
              </p>
            </div>
            <Link to={`/algorithms`}>
              <Button className='bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm hover:shadow-md transition-all'>
                View All
              </Button>
            </Link>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
            {algorithmsCompoentLinkList.slice(0, 12).map((algoLinkObj, inx) => (
              <TooltipProvider key={algoLinkObj.name + inx}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={algoLinkObj.link}
                      className={`block transform transition-all duration-300 hover:scale-105 ${
                        algoLinkObj.color === 'red'
                          ? 'pointer-events-none opacity-70'
                          : ''
                      }`}
                    >
                      <Card
                        className={`h-full border transition-all duration-300 hover:shadow-md overflow-hidden
                        ${
                          algoLinkObj.color === 'green'
                            ? 'bg-white border-blue-200 hover:border-blue-300'
                            : 'bg-white border-gray-200'
                        } relative group`}
                      >
                        <CardContent className='p-4 flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='relative flex h-3 w-3'>
                              <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
                                style={{
                                  backgroundColor:
                                    algoLinkObj.color === 'green'
                                      ? '#3b82f6'
                                      : '#ef4444',
                                }}
                              ></span>
                              <span
                                className={`relative inline-flex rounded-full h-3 w-3`}
                                style={{
                                  backgroundColor:
                                    algoLinkObj.color === 'green'
                                      ? '#3b82f6'
                                      : '#ef4444',
                                }}
                              ></span>
                            </span>
                            <span className='font-medium text-gray-800'>
                              {algoLinkObj.name}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </TooltipTrigger>
                  {algoLinkObj.tooltip && (
                    <TooltipContent>
                      <p>{algoLinkObj.tooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </section>

      {/* Why Learn Section */}
      <section className='py-16 px-4 bg-gradient-to-b from-gray-50 to-white'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-3xl md:text-4xl font-bold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600'>
            Why Learn With Big O Circus?
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <Card className='bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all'>
              <CardContent className='p-6'>
                <div className='bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4'>
                  <FaLightbulb className='text-blue-600 text-xl' />
                </div>
                <h3 className='text-xl font-bold mb-2 text-gray-800'>
                  Visual Learning
                </h3>
                <p className='text-gray-600'>
                  See algorithms and data structures in action through
                  interactive visualizations that make complex concepts easy to
                  understand.
                </p>
              </CardContent>
            </Card>

            <Card className='bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all'>
              <CardContent className='p-6'>
                <div className='bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4'>
                  <FaCode className='text-purple-600 text-xl' />
                </div>
                <h3 className='text-xl font-bold mb-2 text-gray-800'>
                  Practical Implementation
                </h3>
                <p className='text-gray-600'>
                  Learn how to implement various algorithms and data structures
                  with clear, well-documented code examples.
                </p>
              </CardContent>
            </Card>

            <Card className='bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all'>
              <CardContent className='p-6'>
                <div className='bg-indigo-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4'>
                  <FaChartLine className='text-indigo-600 text-xl' />
                </div>
                <h3 className='text-xl font-bold mb-2 text-gray-800'>
                  Performance Analysis
                </h3>
                <p className='text-gray-600'>
                  Understand the time and space complexity of different
                  approaches to solve problems efficiently.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
