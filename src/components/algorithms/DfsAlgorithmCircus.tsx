import React, { useEffect, useRef } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';

type Props = {};

const DfsAlgorithmCircus = (props: Props) => {
  const dfsAlgorithmCircusDomElementRef = useRef<HTMLCanvasElement | null>(
    null
  );
  const dfsAlgorithmCircusViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  // const algorithmVisualizer3dViewerRef = useRef<Algorithm3DPreviewer | null>(null);

  useEffect(() => {
    if (dfsAlgorithmCircusDomElementRef.current) {
      dfsAlgorithmCircusViewerRef.current = new Algorithm3DPreviewer(
        dfsAlgorithmCircusDomElementRef.current
      );
    }
  }, []);

  return (
    <>
      <canvas ref={dfsAlgorithmCircusDomElementRef}></canvas>
      {/* <ThreeScene /> */}
    </>
  );
};

export default DfsAlgorithmCircus;
