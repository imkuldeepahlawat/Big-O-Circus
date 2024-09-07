import React from 'react';
import { FaCircle } from 'react-icons/fa6';
import { Outlet, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import {
  algorithmsCompoentLinkList,
  dataStructuresComponentLinkList,
} from '../helpers/contsant';

type Props = {};

const Home = (props: Props) => {
  return (
    <div className='w-full  h-full border px-3  bg-white'>
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
      <div className='flex flex-col gap-3 py-3 w-full'>
        <h2 className='text-center text-2xl md:text-left md:text-4xl uppercase'>
          <Link to={`/datastructure`}>Data Structures</Link>
        </h2>
        <div className='px-3 grid grid-cols-2 md:grid-cols-8 w-full gap-2'>
          {dataStructuresComponentLinkList.map(
            (dsLinkObj: componentLinkTT, inx) => (
              <Link to={dsLinkObj.link} key={dsLinkObj.name + inx}>
                <Button className='w-full text-xs md:text-md relative flex   justify-between bg-transparent text-black hover:text-white hover:bg-black duration-500 shadow-xl border-2'>
                  <div className='flex gap-2'>
                    <span className='relative flex h-3 w-3'>
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full  opacity-75`}
                        style={{ backgroundColor: dsLinkObj.color }}
                      ></span>
                      <span
                        className={`relative inline-flex rounded-full h-3 w-3 `}
                        style={{ backgroundColor: dsLinkObj.color }}
                      ></span>
                    </span>
                    <span>{dsLinkObj.name}</span>
                  </div>
                  <div className=''></div>
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
      <div className='flex flex-col gap-3 py-3 w-full'>
        <h2 className='text-center text-2xl md:text-left md:text-4xl uppercase'>
          <Link to={`/algorithms`}>Algorithms</Link>
        </h2>
        <div className='px-3 grid grid-cols-2 md:grid-cols-8 w-full gap-2'>
          {algorithmsCompoentLinkList.map((algoLinkObj, inx) => (
            <Link to={algoLinkObj.link} key={algoLinkObj.name + inx}>
              <Button className='w-full text-xs md:text-md relative flex   justify-between bg-black text-white hover:text-black hover:bg-transparent  shadow-xl border-2'>
                <div className='flex gap-2'>
                  <span className='relative flex h-3 w-3'>
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full   opacity-75`}
                      style={{ backgroundColor: algoLinkObj.color }}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 bg-${algoLinkObj.color}-500`}
                      style={{ backgroundColor: algoLinkObj.color }}
                    ></span>
                  </span>
                  <span>{algoLinkObj.name}</span>
                </div>
                <div className=''></div>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
