import React, { useEffect, useRef } from 'react';
import { Algorithm3DPreviewer } from '../../libs/algorithm3DPreviewer';
import * as THREE from 'three';

type Props = {};

const ArrayDataStructure = (props: Props) => {
  const arrayDsCircusDomElementRef = useRef<HTMLCanvasElement | null>(null);
  const arrayDsCircusViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  // const algorithmVisualizer3dViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const createArrayDataStructure = () => {
    if (arrayDsCircusViewerRef.current) {
      const arr = [1, 2, 3, 4, 5, 6];
      const arrarygroup = new THREE.Group();
      for (let i = 0; i < arr.length; i++) {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

        // Create a canvas texture for each face
        const materials = [];
        for (let j = 0; j < 6; j++) {
          const canvas: HTMLCanvasElement = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 128;
          const context: CanvasRenderingContext2D | null =
            canvas.getContext('2d');
          if (context) {
            context.fillStyle = 'green';
            context.fillRect(0, 0, 128, 128);
            context.font = 'bold 64px Arial';
            context.fillStyle = 'red';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(arr[i].toString(), 64, 64);
          }

          const texture = new THREE.CanvasTexture(canvas);
          materials.push(new THREE.MeshBasicMaterial({ map: texture }));
        }

        const cube = new THREE.Mesh(geometry, materials);
        cube.position.x = i * 1;
        cube.position.y = 2;
        arrarygroup.add(cube);
      }
      arrarygroup.position.x -= 2;
      arrayDsCircusViewerRef.current?.scene.add(arrarygroup);
      arrayDsCircusViewerRef.current.enableRender();
    }
  };

  useEffect(() => {
    if (arrayDsCircusDomElementRef.current) {
      arrayDsCircusViewerRef.current = new Algorithm3DPreviewer(
        arrayDsCircusDomElementRef.current
      );
    }
  }, []);

  return (
    <div>
      <div className='flex justify-between'>
        <div className=''></div>
        <div className=''>
          <button onClick={createArrayDataStructure}>Create Array</button>
          <button></button>
          <button></button>
        </div>
      </div>
      <canvas ref={arrayDsCircusDomElementRef}></canvas>
      {/* <ThreeScene /> */}
    </div>
  );
};

export default ArrayDataStructure;
