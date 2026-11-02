import React, { useEffect, useRef } from 'react';
import { createRoot, extend, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei/core/MeshTransmissionMaterial.js';
import * as THREE from 'three';

extend(THREE);
const host = document.querySelector('[data-glass-scene]');
const refractionBackground = new THREE.Color('#6b6b6b');

class FoldCurve extends THREE.Curve {
  getPoint(t, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2;
    return target.set(.62 * (1.7 + .48 * Math.cos(3 * a)) * Math.cos(2 * a),
      1.04 * (2.1 + .45 * Math.cos(3 * a)) * Math.sin(2 * a), .55 * Math.sin(3 * a));
  }
}

function foldedGlass() {
  const curve = new FoldCurve();
  const segments = 300, sides = 40;
  const frames = curve.computeFrenetFrames(segments, true);
  const geometry = new THREE.TubeGeometry(curve, segments, .4, sides, true);
  const point = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const a = i / segments * Math.PI * 2;
    const width = .36 + .12 * Math.cos(3 * a + .4);
    curve.getPointAt(i / segments, point);
    for (let j = 0; j <= sides; j++) {
      const b = j / sides * Math.PI * 2;
      const twist = a * 2 + .35 * Math.sin(3 * a);
      const u = -Math.cos(b) * width * 1.4;
      const v = Math.sin(b) * width * .72;
      vertex.copy(point)
        .addScaledVector(frames.normals[i], u * Math.cos(twist) - v * Math.sin(twist))
        .addScaledVector(frames.binormals[i], u * Math.sin(twist) + v * Math.cos(twist));
      geometry.attributes.position.setXYZ(i * (sides + 1) + j, vertex.x, vertex.y, vertex.z);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

function studioEnvironment(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#151515');
  const geometry = new THREE.PlaneGeometry(1, 1);
  const panels = [
    [-4, 1, 3, 1.7, 8, 7], [4, 2, 1, 1.2, 7, 5],
    [0, 5, 0, 8, 2, 6], [-1, -3, 4, 6, .6, 5],
    [2, 0, -5, 1.2, 7, 6], [-3, 0, -4, 1.5, 5, 4],
    [-1, 1, 5, 2, 6, 3], [1, 0, 4, .7, 8, 0],
  ];
  for (const [x, y, z, width, height, intensity] of panels) {
    const panel = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide,
    }));
    panel.position.set(x, y, z);
    panel.scale.set(width, height, 1);
    panel.lookAt(0, 0, 0);
    scene.add(panel);
  }
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(scene, .01, .1, 30);
  generator.dispose();
  geometry.dispose();
  scene.traverse(object => object.material?.dispose());
  return environment;
}

function Sculpture({ host, environment, controls, lifecycle }) {
  const mesh = useRef();
  const { invalidate, setFrameloop } = useThree();
  useFrame(() => {
    mesh.current.rotation.set(.13 + controls.pitch, -.25 + controls.yaw, -.4);
    if (!lifecycle.lost) host.dataset.ready = 'true';
  }, -1);
  useEffect(() => {
    lifecycle.render = () => { if (lifecycle.visible && !lifecycle.lost) invalidate(); };
    lifecycle.loop = value => setFrameloop(value);
    lifecycle.render();
    return () => { lifecycle.render = null; lifecycle.loop = null; };
  }, [invalidate, setFrameloop, lifecycle]);
  return <>
    <primitive object={environment.texture} attach="environment" />
    <mesh ref={mesh} geometry={controls.geometry}>
      <MeshTransmissionMaterial samples={8} resolution={768} backsideResolution={384}
        backside backsideThickness={.6} thickness={1.3} ior={1.85}
        transmission={1} roughness={0} metalness={0} color="#ffffff"
        clearcoat={1} clearcoatRoughness={.025} envMapIntensity={2.2}
        backsideEnvMapIntensity={1.6} chromaticAberration={.018} background={refractionBackground}
        anisotropicBlur={0} distortion={0} temporalDistortion={0} />
    </mesh>
  </>;
}

async function mountGlass(host) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!context) return;
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  let environment = studioEnvironment(renderer);
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 40);
  camera.position.z = 12;
  const root = createRoot(canvas);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motion.matches;
  const controls = { pitch: 0, yaw: 0, geometry: foldedGlass() };
  const lifecycle = { render: null, loop: null, visible: true, lost: false };
  const toolbar = host.parentElement.querySelector('.glass-controls');
  const hint = host.parentElement.querySelector('.glass-hint');
  const status = host.parentElement.querySelector('.glass-status');
  const resetButton = toolbar.querySelector('[data-reset]');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f5f5f5');
  host.append(canvas);
  const size = () => {
    const { width, height, top, left } = host.getBoundingClientRect();
    return { width, height, top, left };
  };
  const configuration = { gl: renderer, camera, scene, frameloop: 'demand', dpr: Math.min(devicePixelRatio, 1.5) };
  await root.configure({ ...configuration, size: size() });
  root.render(<Sculpture host={host} environment={environment} controls={controls} lifecycle={lifecycle} />);

  let drag = null;
  const endDrag = () => {
    if (drag && host.hasPointerCapture(drag.id)) host.releasePointerCapture(drag.id);
    drag = null;
    host.classList.remove('is-dragging');
  };
  const reset = () => {
    endDrag();
    controls.pitch = controls.yaw = 0;
    lifecycle.render?.();
  };
  const syncMotion = () => {
    reduced = motion.matches;
    reset();
    toolbar.hidden = reduced;
    if (reduced) host.removeAttribute('tabindex');
    else host.tabIndex = 0;
    hint.textContent = reduced ? 'Folded glass study' : 'Drag to turn the glass';
  };
  syncMotion();
  motion.addEventListener('change', syncMotion);
  resetButton.addEventListener('click', () => { reset(); status.textContent = 'Original glass view restored.'; });
  host.addEventListener('pointerdown', event => {
    if (reduced || lifecycle.lost || !event.isPrimary || event.button !== 0) return;
    const rect = host.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, width: rect.width,
      pitch: controls.pitch, yaw: controls.yaw };
    host.setPointerCapture(event.pointerId);
    host.classList.add('is-dragging');
  });
  host.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    controls.yaw = THREE.MathUtils.clamp(drag.yaw + (event.clientX - drag.x) / drag.width * 1.8, -.8, .8);
    controls.pitch = THREE.MathUtils.clamp(drag.pitch + (event.clientY - drag.y) / drag.width * 1.4, -.5, .5);
    lifecycle.render?.();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) host.addEventListener(type, endDrag);
  host.addEventListener('keydown', event => {
    if (reduced || lifecycle.lost) return;
    const directions = { ArrowLeft: [-.12, 0], ArrowRight: [.12, 0], ArrowUp: [0, -.12], ArrowDown: [0, .12] };
    if (event.key === 'Home' || event.key === 'Escape') { event.preventDefault(); reset(); return; }
    if (!directions[event.key]) return;
    event.preventDefault();
    controls.yaw = THREE.MathUtils.clamp(controls.yaw + directions[event.key][0], -.8, .8);
    controls.pitch = THREE.MathUtils.clamp(controls.pitch + directions[event.key][1], -.5, .5);
    lifecycle.render?.();
  });
  const resize = new ResizeObserver(() => {
    root.configure({ ...configuration, size: size() });
    lifecycle.render?.();
  });
  resize.observe(host);
  const visibility = new IntersectionObserver(entries => {
    lifecycle.visible = entries[0].isIntersecting && !document.hidden;
    lifecycle.loop?.(lifecycle.visible ? 'demand' : 'never');
    if (lifecycle.visible) lifecycle.render?.();
  });
  visibility.observe(host);
  document.addEventListener('visibilitychange', () => {
    const rect = host.getBoundingClientRect();
    lifecycle.visible = !document.hidden && rect.bottom > 0 && rect.top < innerHeight;
    lifecycle.loop?.(lifecycle.visible ? 'demand' : 'never');
    if (lifecycle.visible) lifecycle.render?.();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lifecycle.lost = true;
    endDrag();
    host.removeAttribute('data-ready');
    host.removeAttribute('tabindex');
    toolbar.hidden = true;
    hint.textContent = 'Folded glass study';
    lifecycle.loop?.('never');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    environment.dispose();
    environment = studioEnvironment(renderer);
    root.render(<Sculpture host={host} environment={environment} controls={controls} lifecycle={lifecycle} />);
    lifecycle.lost = false;
    lifecycle.loop?.(lifecycle.visible ? 'demand' : 'never');
    syncMotion();
    lifecycle.render?.();
  });
}

if (host) mountGlass(host).catch(error => { host.removeAttribute('data-ready'); console.error(error); });
