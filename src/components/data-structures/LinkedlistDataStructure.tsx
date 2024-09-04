import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import RootLayout from '../RootLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Props {}

const LinkedListDataStructure: React.FC<Props> = () => {
  const linkedListDomElementRef = useRef<HTMLCanvasElement | null>(null);
  const linkedListViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [linkedList, setLinkedList] = useState<number[]>([]);

  useEffect(() => {
    if (linkedListDomElementRef.current) {
      linkedListViewerRef.current = new Algorithm3DPreviewer(
        linkedListDomElementRef.current
      );
      updateLinkedListVisualization();
    }
  }, []);

  useEffect(() => {
    updateLinkedListVisualization();
  }, [linkedList]);
  // need to optimise the code here because no need to create again group and delete
  // delete only one child and add one child
  const updateLinkedListVisualization = () => {
    if (linkedListViewerRef.current) {
      // Clear existing scene
      while (linkedListViewerRef.current.scene.children.length > 0) {
        linkedListViewerRef.current.scene.remove(
          linkedListViewerRef.current.scene.children[0]
        );
      }

      const linkedListGroup = new THREE.Group();
      linkedListViewerRef.current.scene.add(linkedListGroup);

      for (let i = 0; i < linkedList.length; i++) {
        const nodeGeometry = new THREE.BoxGeometry(1, 0.5, 1);
        const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);

        nodeMesh.position.x = i * 2 - 0.1;
        // adding userData
        nodeMesh.userData['nodevalue'] = linkedList[i];
        linkedListGroup.add(nodeMesh);

        // Add text label
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = 'white';
          context.font = 'bold 64px Arial';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(linkedList[i].toString(), 64, 64);
        }
        const texture = new THREE.CanvasTexture(canvas);
        const labelGeometry = new THREE.PlaneGeometry(0.8, 0.4);
        const labelMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
        });
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.z = 0.51;
        label.position.x = i * 2;
        linkedListGroup.add(label);

        // Add arrow to next node
        if (i < linkedList.length - 1) {
          const arrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 32);
          const arrowMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
          });
          const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
          arrow.position.x = i * 2 + 1.2;
          arrow.rotation.z = -Math.PI / 2;
          linkedListGroup.add(arrow);

          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i * 2 + 0.5, 0, 0),
            new THREE.Vector3(i * 2 + 1.5, 0, 0),
          ]);
          const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          linkedListGroup.add(line);
          linkedListGroup.position.x = -((linkedList.length - 1) * 1);
        }
      }
      linkedListViewerRef.current.enableRender();

      // linkedListViewerRef.current.scene.add(linkedListGroup);
    }
  };

  const addToLinkedList = () => {
    let newValue;
    while (true) {
      let val = Math.floor(Math.random() * 1000);
      if (linkedList.includes(val)) {
        continue;
      } else {
        newValue = val;
        break;
      }
    }
    setLinkedList([...linkedList, newValue]);
  };

  const removeFromLinkedList = () => {
    if (linkedList.length > 0) {
      console.log('Removing', linkedList[linkedList.length - 1]);
      hightlightNode(linkedList[linkedList.length - 1]);
      setTimeout(() => {
        setLinkedList(linkedList.slice(0, -1));
      }, 1000);
      if (linkedListViewerRef.current)
        linkedListViewerRef.current.enableRender();
    }
  };
  const removeCustomNodeFromLinkedList = () => {
    if (linkedList.length > 0) {
      setLinkedList(linkedList.slice(0, -1));
    }
  };
  const reverseLinkList = () => {
    const newList = linkedList.reverse();
    setLinkedList([...newList]);
  };
  const hightlightNode = (nodeValue: number) => {
    // object.material.color.set( Math.random() * 0xffffff );
    if (linkedListViewerRef.current) {
      linkedListViewerRef.current.scene.children[0].children.forEach(
        (obj3D: THREE.Object3D) => {
          if (obj3D.userData.nodevalue === nodeValue) {
            if (obj3D instanceof THREE.Mesh)
              if (obj3D.material instanceof THREE.MeshBasicMaterial) {
                obj3D.material.color = new THREE.Color('red');
              }

            linkedListViewerRef.current &&
              linkedListViewerRef.current.enableRender();
          }
        }
      );
    }
  };

  return (
    <RootLayout>
      <div className='relative w-full h-[400px]'>
        <canvas ref={linkedListDomElementRef} className='w-full h-full' />
        <div className='absolute top-4 left-4 text-white   p-4 rounded shadow '>
          <h3 className='text-lg font-bold mb-2'>Linked List Information</h3>
          <p>Size: {linkedList.length}</p>
          <p>Head: {linkedList.length > 0 ? linkedList[0] : 'N/A'}</p>
          <p>
            Tail:{' '}
            {linkedList.length > 0 ? linkedList[linkedList.length - 1] : 'N/A'}
          </p>
          <div className='flex flex-col gap-2'>
            <div className='mt-2'></div>
          </div>
          <Accordion type='single' collapsible className='w-full'>
            <AccordionItem value='item-1'>
              <AccordionTrigger>CRUD</AccordionTrigger>
              <AccordionContent>
                <Button
                  onClick={addToLinkedList}
                  className='bg-blue-500 text-white px-4 py-2 rounded mr-2 capitalize'
                >
                  {linkedList.length ? 'Add Node on tail' : 'Add head node'}
                </Button>
                <Button
                  onClick={removeFromLinkedList}
                  className='bg-red-500 text-white px-4 py-2 rounded'
                >
                  Remove Node from tail
                </Button>
              </AccordionContent>
            </AccordionItem>
            {/* <AccordionItem value='item-2'>
              <AccordionTrigger>Custom CRUD</AccordionTrigger>
              <AccordionContent>
                <div className='mt-2 flex  items-center gap-2'>
                  <Input type='number' placeholder='Node Value' />

                  <Button
                    onClick={removeCustomNodeFromLinkedList}
                    className=' border px-4 py-2 rounded'
                  >
                    Remove Node
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem> */}
            <AccordionItem value='item-3'>
              <AccordionTrigger>Manipulation</AccordionTrigger>
              <AccordionContent>
                <div className='mt-2 flex  items-center gap-2'>
                  <Button
                    onClick={reverseLinkList}
                    className=' border px-4 py-2 rounded'
                  >
                    Reverse Linklist
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div className='absolute top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
          <h3 className='text-lg font-bold mb-2'>
            About Linked List Data Structure
          </h3>
          <p>
            A linked list is a linear data structure where elements are stored
            in nodes. Each node points to the next node in the sequence. (i Know
            a person who know a person)
          </p>
        </div>
      </div>
    </RootLayout>
  );
};

export default LinkedListDataStructure;
