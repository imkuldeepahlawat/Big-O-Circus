import React, { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { Algorithm3DPreviewer } from "../libs/algorithm3DPreviewer";

const AlgorithmVisualizer = () => {
  const algorithmVisualizer3dViewerRef = useRef();
  // const algorithmVisualizer3dViewerRef = useRef(new Algorithm3DPreviewer());

  useEffect(() => {}, []);
  return (
    <div className="w-full h-full ">
      <canvas
        id="algorithmVisualizer3dViewerCanvasElement"
        ref={algorithmVisualizer3dViewerRef}
      ></canvas>
    </div>
  );
};

export default AlgorithmVisualizer;
