import React, { useEffect, useRef } from 'react';
import { createRoot, extend, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei/core/MeshTransmissionMaterial.js';
import * as THREE from 'three';

extend(THREE);
const host = document.querySelector('[data-glass-scene]');

class FoldCurve extends THREE.Curve {
  getPoint(t, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2;
    return target.set(1.18 * Math.cos(a) + .14 * Math.sin(2 * a),
      2.12 * Math.sin(a), .34 * Math.sin(2 * a + .3));
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
    const width = .34 + .09 * Math.cos(2 * a + .4);
    curve.getPointAt(i / segments, point);
    for (let j = 0; j <= sides; j++) {
      const b = j / sides * Math.PI * 2;
      const twist = a + .3 * Math.sin(2 * a);
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
  scene.background = new THREE.Color('#777777');
  const geometry = new THREE.PlaneGeometry(1, 1);
  const panels = [
    [-4, 2, 4, 3, 8, 4], [4, 1, 2, 2, 7, 3],
    [0, 5, -1, 7, 3, 3], [-3, 0, -4, 1.4, 8, 0],
    [1.6, 0, -5, 2, 8, 3],
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
  const environment = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const camera = new THREE.CubeCamera(.1, 30, environment);
  camera.update(renderer, scene);
  geometry.dispose();
  scene.traverse(object => object.material?.dispose());
  return environment;
}

function Sculpture({ host, environment, controls, lifecycle }) {
  const mesh = useRef();
  const { invalidate, setFrameloop } = useThree();
  useFrame((_, delta) => {
    const dt = Math.min(delta, .05);
    if (!controls.dragging) {
      const coast = (1 - Math.exp(-7 * dt)) / 7;
      controls.targetYaw += controls.velocityYaw * coast;
      controls.targetPitch += controls.velocityPitch * coast;
      controls.velocityYaw *= Math.exp(-7 * dt);
      controls.velocityPitch *= Math.exp(-7 * dt);
    }
    const blend = 1 - Math.exp(-20 * dt);
    const targetYaw = controls.targetYaw + controls.hoverYaw;
    const targetPitch = controls.targetPitch + controls.hoverPitch;
    controls.yaw += (targetYaw - controls.yaw) * blend;
    controls.pitch += (targetPitch - controls.pitch) * blend;
    const moving = Math.abs(targetYaw - controls.yaw) + Math.abs(targetPitch - controls.pitch)
      + (controls.dragging ? 0 : Math.abs(controls.velocityYaw) + Math.abs(controls.velocityPitch)) > .0005;
    if (!moving) {
      controls.yaw = targetYaw;
      controls.pitch = targetPitch;
      controls.velocityYaw = controls.velocityPitch = 0;
    }
    mesh.current.rotation.set(.13 + controls.pitch, -.25 + controls.yaw, -.4);
    if (moving && lifecycle.visible && !lifecycle.lost) invalidate();
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
      <MeshTransmissionMaterial samples={6} resolution={512}
        thickness={.65} ior={1.5}
        transmission={1} roughness={0} metalness={0} color="#ffffff"
        clearcoat={1} clearcoatRoughness={.04} envMapIntensity={1.8}
        chromaticAberration={.006} background={environment.texture}
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
  const controls = { pitch: 0, yaw: 0, targetPitch: 0, targetYaw: 0,
    hoverPitch: 0, hoverYaw: 0, velocityPitch: 0, velocityYaw: 0,
    dragging: false, geometry: foldedGlass() };
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
  const endDrag = event => {
    const ended = drag;
    drag = null;
    controls.dragging = false;
    if (ended && (!event || event.type !== 'pointerup' || performance.now() - ended.time > 90)) {
      controls.velocityYaw = controls.velocityPitch = 0;
    }
    if (ended && host.hasPointerCapture(ended.id)) host.releasePointerCapture(ended.id);
    host.classList.remove('is-dragging');
    lifecycle.render?.();
  };
  const reset = () => {
    endDrag();
    controls.pitch = controls.yaw = controls.targetPitch = controls.targetYaw = 0;
    controls.hoverPitch = controls.hoverYaw = controls.velocityPitch = controls.velocityYaw = 0;
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
    controls.velocityYaw = controls.velocityPitch = 0;
    controls.hoverYaw = controls.hoverPitch = 0;
    controls.dragging = true;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, width: rect.width, time: performance.now() };
    host.setPointerCapture(event.pointerId);
    host.classList.add('is-dragging');
  });
  host.addEventListener('pointermove', event => {
    if (reduced || lifecycle.lost) return;
    if (!drag) {
      if (event.pointerType !== 'mouse') return;
      const rect = host.getBoundingClientRect();
      controls.hoverYaw = ((event.clientX - rect.left) / rect.width - .5) * .2;
      controls.hoverPitch = ((event.clientY - rect.top) / rect.height - .5) * .16;
      lifecycle.render?.();
      return;
    }
    if (event.pointerId !== drag.id) return;
    const now = performance.now();
    const seconds = Math.max((now - drag.time) / 1000, .008);
    const yaw = (event.clientX - drag.x) / drag.width * Math.PI * 2;
    const pitch = (event.clientY - drag.y) / drag.width * Math.PI * 2;
    controls.targetYaw += yaw;
    controls.targetPitch += pitch;
    controls.velocityYaw = THREE.MathUtils.clamp(yaw / seconds, -5, 5);
    controls.velocityPitch = THREE.MathUtils.clamp(pitch / seconds, -5, 5);
    Object.assign(drag, { x: event.clientX, y: event.clientY, time: now });
    lifecycle.render?.();
  });
  host.addEventListener('pointerleave', () => {
    controls.hoverYaw = controls.hoverPitch = 0;
    lifecycle.render?.();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) host.addEventListener(type, endDrag);
  host.addEventListener('keydown', event => {
    if (reduced || lifecycle.lost) return;
    const directions = { ArrowLeft: [-.25, 0], ArrowRight: [.25, 0], ArrowUp: [0, -.25], ArrowDown: [0, .25] };
    if (event.key === 'Home' || event.key === 'Escape') { event.preventDefault(); reset(); return; }
    if (!directions[event.key]) return;
    event.preventDefault();
    controls.velocityYaw = controls.velocityPitch = 0;
    controls.targetYaw += directions[event.key][0];
    controls.targetPitch += directions[event.key][1];
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
