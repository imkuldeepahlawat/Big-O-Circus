import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import RootLayout from '../RootLayout';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Point {
  x: number;
  y: number;
  z: number;
}

interface KDNode {
  point: Point;
  left: KDNode | null;
  right: KDNode | null;
  depth: number;
}

interface SearchState {
  nearestNode: KDNode | null;
  nearestDistance: number;
  searchPoint: Point | null;
}

interface RangeState {
  min: Point;
  max: Point;
  pointsInRange: KDNode[];
}

interface CollisionState {
  collidingPoints: Point[];
  radius: number;
}

interface SpatialQueryState {
  queryRegion: {
    center: Point;
    radius: number;
  };
  pointsInRegion: KDNode[];
}

const KDTreeDataStructure: React.FC = () => {
  const kdTreeDomElementRef = useRef<HTMLCanvasElement | null>(null);
  const kdTreeViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [root, setRoot] = useState<KDNode | null>(null);
  const [searchState, setSearchState] = useState<SearchState>({
    nearestNode: null,
    nearestDistance: Infinity,
    searchPoint: null,
  });
  const [rangeState, setRangeState] = useState<RangeState>({
    min: { x: -2, y: -2, z: -2 },
    max: { x: 2, y: 2, z: 2 },
    pointsInRange: [],
  });
  const [collisionState, setCollisionState] = useState<CollisionState>({
    collidingPoints: [],
    radius: 0.5,
  });
  const [spatialQueryState, setSpatialQueryState] = useState<SpatialQueryState>(
    {
      queryRegion: {
        center: { x: 0, y: 0, z: 0 },
        radius: 1,
      },
      pointsInRegion: [],
    }
  );

  useEffect(() => {
    if (kdTreeDomElementRef.current) {
      kdTreeViewerRef.current = new Algorithm3DPreviewer(
        kdTreeDomElementRef.current
      );
      kdTreeViewerRef.current.camera.position.set(5, 5, 5);
      updateKDTreeVisualization();
    }
  }, []);

  useEffect(() => {
    if (points.length > 0) {
      const newRoot = buildKDTree(points, 0);
      setRoot(newRoot);
    }
  }, [points]);

  useEffect(() => {
    updateKDTreeVisualization();
  }, [root]);

  useEffect(() => {
    if (kdTreeDomElementRef.current) {
      kdTreeDomElementRef.current.addEventListener('click', handlePointClick);
      return () => {
        kdTreeDomElementRef.current?.removeEventListener(
          'click',
          handlePointClick
        );
      };
    }
  }, [root, points]);

  const buildKDTree = (points: Point[], depth: number): KDNode | null => {
    if (points.length === 0) return null;

    const axis = depth % 3; // cycle through x, y, z
    points.sort((a, b) => {
      if (axis === 0) return a.x - b.x;
      if (axis === 1) return a.y - b.y;
      return a.z - b.z;
    });

    const medianIdx = Math.floor(points.length / 2);
    const node: KDNode = {
      point: points[medianIdx],
      left: null,
      right: null,
      depth: depth,
    };

    node.left = buildKDTree(points.slice(0, medianIdx), depth + 1);
    node.right = buildKDTree(points.slice(medianIdx + 1), depth + 1);

    return node;
  };

  const distance = (p1: Point, p2: Point): number => {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2) +
        Math.pow(p1.z - p2.z, 2)
    );
  };

  const findNearestNeighbor = (searchPoint: Point) => {
    if (!root || points.length === 0) {
      setSearchState({
        nearestNode: null,
        nearestDistance: Infinity,
        searchPoint: null,
      });
      return;
    }

    let nearestNode = null;
    let nearestDistance = Infinity;

    const search = (node: KDNode | null, depth: number) => {
      if (!node) return;

      const dist = distance(searchPoint, node.point);

      if (dist < nearestDistance) {
        nearestNode = node;
        nearestDistance = dist;
      }

      const axis = depth % 3;
      let value =
        axis === 0 ? searchPoint.x : axis === 1 ? searchPoint.y : searchPoint.z;
      let nodeValue =
        axis === 0 ? node.point.x : axis === 1 ? node.point.y : node.point.z;

      const firstSide = value < nodeValue ? node.left : node.right;
      const secondSide = value < nodeValue ? node.right : node.left;

      search(firstSide, depth + 1);

      if (Math.abs(value - nodeValue) < nearestDistance) {
        search(secondSide, depth + 1);
      }
    };

    search(root, 0);

    setSearchState({
      nearestNode,
      nearestDistance,
      searchPoint,
    });

    updateKDTreeVisualization();
  };

  const addSearchPoint = () => {
    const searchPoint: Point = {
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 5,
      z: (Math.random() - 0.5) * 5,
    };
    findNearestNeighbor(searchPoint);
  };

  const deletePoint = (targetPoint: Point) => {
    if (!root) return;

    const newPoints = points.filter(
      (p) =>
        !(
          p.x === targetPoint.x &&
          p.y === targetPoint.y &&
          p.z === targetPoint.z
        )
    );
    setPoints(newPoints);
  };

  const rangeSearch = () => {
    if (!root) return;

    const pointsInRange: KDNode[] = [];

    const search = (node: KDNode | null) => {
      if (!node) return;

      const { point } = node;
      if (
        point.x >= rangeState.min.x &&
        point.x <= rangeState.max.x &&
        point.y >= rangeState.min.y &&
        point.y <= rangeState.max.y &&
        point.z >= rangeState.min.z &&
        point.z <= rangeState.max.z
      ) {
        pointsInRange.push(node);
      }

      search(node.left);
      search(node.right);
    };

    search(root);
    setRangeState((prev) => ({ ...prev, pointsInRange }));
    updateKDTreeVisualization();
  };

  const balanceTree = () => {
    if (!root) return;
    // Rebuild the tree with all points to balance it
    const allPoints = [...points];
    setPoints(allPoints);
  };

  const detectCollisions = () => {
    if (!root) return;
    const collidingPoints: Point[] = [];

    // Check each point against every other point
    points.forEach((point1, i) => {
      points.forEach((point2, j) => {
        if (i !== j) {
          const dist = distance(point1, point2);
          if (dist < collisionState.radius * 2) {
            if (!collidingPoints.includes(point1)) {
              collidingPoints.push(point1);
            }
            if (!collidingPoints.includes(point2)) {
              collidingPoints.push(point2);
            }
          }
        }
      });
    });

    setCollisionState((prev) => ({ ...prev, collidingPoints }));
    updateKDTreeVisualization();
  };

  const spatialQuery = (center: Point, radius: number) => {
    if (!root) return;

    const pointsInRegion: KDNode[] = [];

    const searchInSphere = (node: KDNode | null) => {
      if (!node) return;

      const dist = distance(center, node.point);
      if (dist <= radius) {
        pointsInRegion.push(node);
      }

      // Check both subtrees if the splitting plane intersects the sphere
      const axis = node.depth % 3;
      const axisValue =
        axis === 0 ? center.x : axis === 1 ? center.y : center.z;
      const nodeValue =
        axis === 0 ? node.point.x : axis === 1 ? node.point.y : node.point.z;

      const distToPlane = Math.abs(axisValue - nodeValue);

      if (distToPlane <= radius) {
        searchInSphere(node.left);
        searchInSphere(node.right);
      } else if (axisValue < nodeValue) {
        searchInSphere(node.left);
      } else {
        searchInSphere(node.right);
      }
    };

    searchInSphere(root);
    setSpatialQueryState({
      queryRegion: { center, radius },
      pointsInRegion,
    });
    updateKDTreeVisualization();
  };

  const updateKDTreeVisualization = () => {
    if (!kdTreeViewerRef.current) return;

    // Clear existing scene
    while (kdTreeViewerRef.current.scene.children.length > 0) {
      kdTreeViewerRef.current.scene.remove(
        kdTreeViewerRef.current.scene.children[0]
      );
    }

    const treeGroup = new THREE.Group();

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    treeGroup.add(gridHelper);

    if (root && points.length > 0) {
      const visualizeNode = (node: KDNode) => {
        // Create sphere for point
        const nodeGeometry = new THREE.SphereGeometry(0.1);
        const nodeMaterial = new THREE.MeshBasicMaterial({
          color: collisionState.collidingPoints.includes(node.point)
            ? 0xff0000 // Red for colliding points
            : spatialQueryState.pointsInRegion.includes(node)
              ? 0x00ff00 // Green for points in spatial query
              : rangeState.pointsInRange.includes(node)
                ? 0x00ffff // Cyan for points in range
                : node === searchState.nearestNode
                  ? 0xffff00 // Yellow for nearest node
                  : node.depth % 3 === 0
                    ? 0xaaaaaa
                    : node.depth % 3 === 1
                      ? 0x888888
                      : 0x666666,
        });
        const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
        nodeMesh.position.set(node.point.x, node.point.y, node.point.z);
        nodeMesh.userData.point = node.point;
        treeGroup.add(nodeMesh);

        // Create connections to child nodes
        if (node.left) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(node.point.x, node.point.y, node.point.z),
            new THREE.Vector3(
              node.left.point.x,
              node.left.point.y,
              node.left.point.z
            ),
          ]);
          const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          treeGroup.add(line);
          visualizeNode(node.left);
        }

        if (node.right) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(node.point.x, node.point.y, node.point.z),
            new THREE.Vector3(
              node.right.point.x,
              node.right.point.y,
              node.right.point.z
            ),
          ]);
          const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          treeGroup.add(line);
          visualizeNode(node.right);
        }
      };

      visualizeNode(root);

      // Visualize search point and connection to nearest neighbor
      if (searchState.searchPoint) {
        const searchGeometry = new THREE.SphereGeometry(0.15);
        const searchMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Magenta
        const searchMesh = new THREE.Mesh(searchGeometry, searchMaterial);
        searchMesh.position.set(
          searchState.searchPoint.x,
          searchState.searchPoint.y,
          searchState.searchPoint.z
        );
        treeGroup.add(searchMesh);

        // Draw line to nearest neighbor if found
        if (searchState.nearestNode) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(
              searchState.searchPoint.x,
              searchState.searchPoint.y,
              searchState.searchPoint.z
            ),
            new THREE.Vector3(
              searchState.nearestNode.point.x,
              searchState.nearestNode.point.y,
              searchState.nearestNode.point.z
            ),
          ]);
          const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          treeGroup.add(line);
        }
      }

      // Visualize range box
      const rangeBoxGeometry = new THREE.BoxGeometry(
        rangeState.max.x - rangeState.min.x,
        rangeState.max.y - rangeState.min.y,
        rangeState.max.z - rangeState.min.z
      );
      const rangeBoxMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.2,
        wireframe: true,
      });
      const rangeBox = new THREE.Mesh(rangeBoxGeometry, rangeBoxMaterial);
      rangeBox.position.set(
        (rangeState.max.x + rangeState.min.x) / 2,
        (rangeState.max.y + rangeState.min.y) / 2,
        (rangeState.max.z + rangeState.min.z) / 2
      );
      treeGroup.add(rangeBox);

      // Add visualization for collision detection radius
      if (collisionState.collidingPoints.length > 0) {
        collisionState.collidingPoints.forEach((point) => {
          const sphereGeometry = new THREE.SphereGeometry(
            collisionState.radius
          );
          const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.2,
            wireframe: true,
          });
          const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
          sphere.position.set(point.x, point.y, point.z);
          treeGroup.add(sphere);
        });
      }

      // Add visualization for spatial query region
      if (spatialQueryState.pointsInRegion.length > 0) {
        const sphereGeometry = new THREE.SphereGeometry(
          spatialQueryState.queryRegion.radius
        );
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.2,
          wireframe: true,
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        const { center } = spatialQueryState.queryRegion;
        sphere.position.set(center.x, center.y, center.z);
        treeGroup.add(sphere);
      }
    }

    kdTreeViewerRef.current.scene.add(treeGroup);
    kdTreeViewerRef.current.enableRender();
  };

  const addRandomPoint = () => {
    const newPoint: Point = {
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 5,
      z: (Math.random() - 0.5) * 5,
    };
    setPoints([...points, newPoint]);
  };

  const clearTree = () => {
    setPoints([]);
    setRoot(null);
    setSearchState({
      nearestNode: null,
      nearestDistance: Infinity,
      searchPoint: null,
    });
    setRangeState((prev) => ({ ...prev, pointsInRange: [] }));
    setCollisionState((prev) => ({ ...prev, collidingPoints: [] }));
    setSpatialQueryState((prev) => ({ ...prev, pointsInRegion: [] }));

    // Clear the scene
    if (kdTreeViewerRef.current) {
      while (kdTreeViewerRef.current.scene.children.length > 0) {
        kdTreeViewerRef.current.scene.remove(
          kdTreeViewerRef.current.scene.children[0]
        );
      }
      kdTreeViewerRef.current.enableRender();
    }
  };

  const handlePointClick = (event: MouseEvent) => {
    if (!kdTreeViewerRef.current || !root) return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const canvas = kdTreeViewerRef.current.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(x, y);

    raycaster.setFromCamera(mouse, kdTreeViewerRef.current.camera);

    // Get all objects in the scene that can be clicked
    const scene = kdTreeViewerRef.current.scene;
    if (!scene.children[0]) return;

    const objects = scene.children[0].children.filter(
      (child) =>
        child instanceof THREE.Mesh &&
        child.geometry instanceof THREE.SphereGeometry &&
        child.userData.point // Only include points, not visualization elements
    );

    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const clickedPoint = clickedMesh.userData.point as Point;
      findNearestNeighbor(clickedPoint);
    }
  };

  const resetSearch = () => {
    setSearchState({
      nearestNode: null,
      nearestDistance: Infinity,
      searchPoint: null,
    });
    updateKDTreeVisualization();
  };

  const resetRange = () => {
    setRangeState((prev) => ({
      ...prev,
      pointsInRange: [],
    }));
    updateKDTreeVisualization();
  };

  const resetCollisions = () => {
    setCollisionState((prev) => ({
      ...prev,
      collidingPoints: [],
    }));
    updateKDTreeVisualization();
  };

  const resetSpatialQuery = () => {
    setSpatialQueryState((prev) => ({
      ...prev,
      pointsInRegion: [],
    }));
    updateKDTreeVisualization();
  };

  return (
    <RootLayout>
      <div className='relative w-full h-[400px]'>
        <canvas ref={kdTreeDomElementRef} className='w-full h-full' />
        <div className='absolute top-4 left-4 text-white p-4 rounded shadow'>
          <h3 className='text-lg font-bold mb-2'>KD-Tree Information</h3>
          <p>Number of Points: {points.length}</p>

          {searchState.nearestNode && searchState.searchPoint && (
            <div className='mt-2'>
              <div className='flex justify-between items-center'>
                <h4 className='font-bold'>Nearest Neighbor Search</h4>
                <Button
                  onClick={resetSearch}
                  className='bg-gray-500 text-white px-2 py-1 rounded text-sm'
                >
                  Reset
                </Button>
              </div>
              <p>Distance: {searchState.nearestDistance.toFixed(2)}</p>
              <p>
                Search Point: ({searchState.searchPoint.x.toFixed(2)},
                {searchState.searchPoint.y.toFixed(2)},
                {searchState.searchPoint.z.toFixed(2)})
              </p>
              <p>
                Nearest Point: ({searchState.nearestNode.point.x.toFixed(2)},
                {searchState.nearestNode.point.y.toFixed(2)},
                {searchState.nearestNode.point.z.toFixed(2)})
              </p>
            </div>
          )}

          {rangeState.pointsInRange.length > 0 && (
            <div className='mt-2'>
              <div className='flex justify-between items-center'>
                <h4 className='font-bold'>Range Search</h4>
                <Button
                  onClick={resetRange}
                  className='bg-gray-500 text-white px-2 py-1 rounded text-sm'
                >
                  Reset
                </Button>
              </div>
              <p>Points in Range: {rangeState.pointsInRange.length}</p>
            </div>
          )}

          {collisionState.collidingPoints.length > 0 && (
            <div className='mt-2'>
              <div className='flex justify-between items-center'>
                <h4 className='font-bold'>Collision Detection</h4>
                <Button
                  onClick={resetCollisions}
                  className='bg-gray-500 text-white px-2 py-1 rounded text-sm'
                >
                  Reset
                </Button>
              </div>
              <p>Colliding Points: {collisionState.collidingPoints.length}</p>
              <p>Collision Radius: {collisionState.radius}</p>
            </div>
          )}

          {spatialQueryState.pointsInRegion.length > 0 && (
            <div className='mt-2'>
              <div className='flex justify-between items-center'>
                <h4 className='font-bold'>Spatial Query</h4>
                <Button
                  onClick={resetSpatialQuery}
                  className='bg-gray-500 text-white px-2 py-1 rounded text-sm'
                >
                  Reset
                </Button>
              </div>
              <p>Points in Region: {spatialQueryState.pointsInRegion.length}</p>
              <p>Query Radius: {spatialQueryState.queryRegion.radius}</p>
            </div>
          )}

          <div className='flex flex-col gap-2 mt-4'>
            <Accordion type='single' collapsible className='w-full'>
              <AccordionItem value='item-1'>
                <AccordionTrigger>Basic Operations</AccordionTrigger>
                <AccordionContent>
                  <div className='flex flex-col gap-2'>
                    <Button
                      onClick={addRandomPoint}
                      className='bg-blue-500 text-white px-4 py-2 rounded'
                    >
                      Add Random Point
                    </Button>
                    <Button
                      onClick={clearTree}
                      className='bg-red-500 text-white px-4 py-2 rounded'
                    >
                      Clear Tree
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='item-2'>
                <AccordionTrigger>Search Operations</AccordionTrigger>
                <AccordionContent>
                  <div className='flex flex-col gap-2'>
                    <Button
                      onClick={addSearchPoint}
                      className='bg-purple-500 text-white px-4 py-2 rounded'
                    >
                      Find Nearest Neighbor
                    </Button>
                    <Button
                      onClick={rangeSearch}
                      className='bg-cyan-500 text-white px-4 py-2 rounded'
                    >
                      Range Search
                    </Button>
                    <div className='flex gap-2'>
                      <Button
                        onClick={resetSearch}
                        className='bg-gray-500 text-white px-4 py-2 rounded'
                        disabled={!searchState.searchPoint}
                      >
                        Reset Search
                      </Button>
                      <Button
                        onClick={resetRange}
                        className='bg-gray-500 text-white px-4 py-2 rounded'
                        disabled={rangeState.pointsInRange.length === 0}
                      >
                        Reset Range
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='item-3'>
                <AccordionTrigger>Advanced Operations</AccordionTrigger>
                <AccordionContent>
                  <div className='flex flex-col gap-2'>
                    <Button
                      onClick={balanceTree}
                      className='bg-yellow-500 text-white px-4 py-2 rounded'
                    >
                      Balance Tree
                    </Button>
                    <Button
                      onClick={() => deletePoint(points[points.length - 1])}
                      className='bg-red-500 text-white px-4 py-2 rounded'
                      disabled={points.length === 0}
                    >
                      Delete Last Point
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='item-4'>
                <AccordionTrigger>Advanced Queries</AccordionTrigger>
                <AccordionContent>
                  <div className='flex flex-col gap-2'>
                    <Button
                      onClick={detectCollisions}
                      className='bg-red-500 text-white px-4 py-2 rounded'
                    >
                      Detect Collisions
                    </Button>
                    <Button
                      onClick={() => spatialQuery({ x: 0, y: 0, z: 0 }, 2)}
                      className='bg-green-500 text-white px-4 py-2 rounded'
                    >
                      Spatial Query
                    </Button>
                    <div className='flex gap-2'>
                      <Button
                        onClick={resetCollisions}
                        className='bg-gray-500 text-white px-4 py-2 rounded'
                        disabled={collisionState.collidingPoints.length === 0}
                      >
                        Reset Collisions
                      </Button>
                      <Button
                        onClick={resetSpatialQuery}
                        className='bg-gray-500 text-white px-4 py-2 rounded'
                        disabled={spatialQueryState.pointsInRegion.length === 0}
                      >
                        Reset Spatial
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
        <div className='absolute w-[500px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
          <h3 className='text-lg font-bold mb-2'>About KD-Tree</h3>
          <p>
            A KD-tree is a space-partitioning data structure for organizing
            points in a k-dimensional space. Each level of the tree splits
            points along a different dimension, cycling through the dimensions
            as the tree grows deeper.
          </p>
        </div>
      </div>
    </RootLayout>
  );
};

export default KDTreeDataStructure;
