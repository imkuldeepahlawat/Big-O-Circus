import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { problemsLinkList } from '../helpers/contsant';
import { FaCircle } from 'react-icons/fa6';
import { problemLinkTT } from '@/types/contantTypes';

import { FaCode, FaLightbulb } from 'react-icons/fa';

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-100 text-green-700';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'Hard':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const groupByTopic = (items: problemLinkTT[]) => {
  const grouped: Record<string, problemLinkTT[]> = {};

  items.forEach((item) => {
    const topic = item.topics[0] || 'Miscellaneous';
    if (!grouped[topic]) {
      grouped[topic] = [];
    }
    grouped[topic].push(item);
  });

  return grouped;
};

const ProblemsDashboard = () => {
  const groupedProblems = groupByTopic(problemsLinkList);

  return (
    <div className='w-full px-4 py-6 text-gray-800'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-10'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600'>
            Problems
          </h1>
          <p className='text-gray-600 text-lg'>
            Visualize classic coding problems and their solutions step-by-step
            with 3D animations.
          </p>

          <Card className='mt-6 border border-emerald-100 bg-white shadow-sm'>
            <CardContent className='p-4'>
              <div className='flex gap-6 items-center flex-wrap'>
                <div className='flex gap-2 items-center'>
                  <FaCircle className='text-green-500 text-sm' />
                  <span className='font-medium text-gray-700'>Available</span>
                </div>
                <div className='flex gap-2 items-center'>
                  <FaCircle className='text-red-500 text-sm' />
                  <span className='font-medium text-gray-700'>Coming Soon</span>
                </div>
                <div className='text-sm text-gray-500'>
                  Difficulty:{' '}
                  <span className='bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs'>
                    Easy
                  </span>{' '}
                  <span className='bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs'>
                    Medium
                  </span>{' '}
                  <span className='bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs'>
                    Hard
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {Object.entries(groupedProblems).map(([topic, problems]) => (
          <section key={topic} className='mb-16'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-3 rounded-full bg-white shadow-sm border border-emerald-100'>
                <FaCode className='text-emerald-600' />
              </div>
              <h2 className='text-2xl md:text-3xl font-bold text-gray-800'>
                {topic}
              </h2>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
              {problems.map((problem, index) => (
                <Link
                  key={`${problem.name}-${index}`}
                  to={`/${problem.link}`}
                  className={`block transform transition-all duration-300 hover:scale-105 ${
                    problem.color === 'red'
                      ? 'pointer-events-none opacity-70'
                      : ''
                  }`}
                >
                  <Card
                    className={`h-full border transition-all duration-300 hover:shadow-md overflow-hidden
                    ${
                      problem.color === 'green'
                        ? 'bg-white border-emerald-200 hover:border-emerald-300'
                        : 'bg-white border-gray-200'
                    } relative group`}
                  >
                    <CardContent className='p-6 relative z-10'>
                      <div className='flex items-center gap-3 mb-3'>
                        <span className='relative flex h-3 w-3'>
                          <span
                            className='animate-ping absolute inline-flex h-full w-full rounded-full opacity-75'
                            style={{
                              backgroundColor:
                                problem.color === 'green'
                                  ? '#10b981'
                                  : '#ef4444',
                            }}
                          ></span>
                          <span
                            className='relative inline-flex rounded-full h-3 w-3'
                            style={{
                              backgroundColor:
                                problem.color === 'green'
                                  ? '#10b981'
                                  : '#ef4444',
                            }}
                          ></span>
                        </span>
                        <span className='font-bold text-lg text-gray-800'>
                          {problem.number}. {problem.name}
                        </span>
                      </div>

                      {/* Difficulty + Level */}
                      <div className='flex gap-2 mb-2 flex-wrap'>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${getDifficultyColor(problem.difficulty)}`}
                        >
                          {problem.difficulty}
                        </span>
                        {problem.level && (
                          <span className='text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700'>
                            {problem.level}
                          </span>
                        )}
                      </div>

                      {/* Topics */}
                      <div className='flex gap-1 flex-wrap mb-3'>
                        {problem.topics.map((topic) => (
                          <span
                            key={topic}
                            className='text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600'
                          >
                            {topic}
                          </span>
                        ))}
                      </div>

                      {problem.tooltip && (
                        <p className='text-sm text-gray-500 line-clamp-2'>
                          {problem.tooltip}
                        </p>
                      )}

                      <div className='mt-4 pt-3 border-t border-gray-200 flex justify-between items-center'>
                        <span className='text-xs text-gray-500'>
                          {problem.color === 'green'
                            ? 'Interactive Visualization'
                            : 'Coming Soon'}
                        </span>
                        <FaLightbulb className='text-amber-400 text-sm' />
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

export default ProblemsDashboard;
