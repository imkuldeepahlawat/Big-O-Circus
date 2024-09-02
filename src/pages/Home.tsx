import React from 'react';
import { FaCircle } from 'react-icons/fa6';
import { Outlet, Link } from 'react-router-dom';
import {
  algorithmsCompoentLinkList,
  dataStructuresComponentLinkList,
} from '../helpers/contsant';

type Props = {};

const Home = (props: Props) => {
  return (
    <div className='w-full  h-full border px-3 overflow-y-scroll bg-white'>
      <ul className='flex gap-3 p-3'>
        <li className='flex gap-3 items-center'>
          <FaCircle className='text-green-500 text-sm ' />
          <span>Avalaible</span>
        </li>
        <li className='flex gap-3 items-center'>
          <FaCircle className='text-red-500 text-sm ' />
          <span>Coming Soon</span>
        </li>
      </ul>
      <div className='flex flex-col gap-3 py-3'>
        <h2 className='text-4xl uppercase'>
          <Link to={`/datastructure`}>Data Structures</Link>
        </h2>
        <div className='flex  gap-3 items-center px-3 flex-wrap'>
          {dataStructuresComponentLinkList.map(
            (dataStructure: componentLinkTT, index) => (
              <div
                key={index}
                className={`py-2 w-[250px]  border rounded-md flex justify-center items-center hover:scale-105 bg-slate-200 duration-500 ${dataStructure.tooltip === '' ? '' : 'tooltip tooltip-top'}`}
                data-tip={dataStructure.tooltip}
              >
                <a
                  href={dataStructure.link}
                  className='flex items-center gap-1'
                >
                  <span>{dataStructure.name}</span>
                  <FaCircle className='text-red-500 text-sm' />
                </a>
              </div>
            )
          )}
        </div>
      </div>
      <div className='flex flex-col gap-3 py-3'>
        <h2 className='text-4xl uppercase'>Algorithms</h2>
        <div className='flex  gap-3 items-center px-3 flex-wrap'>
          {algorithmsCompoentLinkList.map(
            (algorithm: componentLinkTT, index) => (
              <div
                key={index}
                className={`py-2 w-[250px]  border rounded-md flex justify-center items-center hover:scale-105 bg-slate-200 duration-500${algorithm.tooltip === '' ? '' : 'tooltip tooltip-top'}`}
                data-tip={algorithm.tooltip}
              >
                <a href={algorithm.link} className='flex items-center gap-1'>
                  <span>{algorithm.name}</span>
                  <FaCircle className='text-red-500 text-sm' />
                </a>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
