import * as THREE from 'three';

interface TextCanvasOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontWeight?: string;
}

interface TextPlaneOptions extends TextCanvasOptions {
  planeWidth?: number;
  planeHeight?: number;
  x?: number;
  y?: number;
  z?: number;
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const createTextCanvas = (
  text: string,
  {
    width = 256,
    height = 128,
    fontSize = 36,
    color = '#ffffff',
    backgroundColor,
    fontFamily = 'Arial',
    fontWeight = 'bold',
  }: TextCanvasOptions = {}
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  ctx.fillStyle = color;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  return canvas;
};

export const createTextPlane = (
  text: string,
  {
    planeWidth,
    planeHeight,
    x = 0,
    y = 0,
    z = 0,
    ...canvasOptions
  }: TextPlaneOptions = {}
): THREE.Mesh => {
  const canvas = createTextCanvas(text, canvasOptions);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  const width = planeWidth ?? Math.max(0.5, canvas.width / 180);
  const height = planeHeight ?? Math.max(0.25, canvas.height / 260);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  plane.position.set(x, y, z);

  return plane;
};
