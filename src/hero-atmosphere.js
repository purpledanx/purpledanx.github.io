const host = document.querySelector('[data-atmosphere]');
const intro = document.querySelector('[data-intro]');
if (intro) mountIntro(intro);
if (host) mountAtmosphere(host);

function mountIntro(intro) {
  const root = document.documentElement;
  if (!root.classList.contains('intro-pending')) { intro.remove(); return; }
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let timer;
  const finish = () => {
    clearTimeout(timer);
    root.classList.remove('intro-pending');
    intro.remove();
    controller.abort();
  };
  intro.addEventListener('animationend', event => { if (event.target === intro) finish(); }, options);
  for (const type of ['keydown', 'wheel', 'scroll']) window.addEventListener(type, finish, { ...options, passive: true });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', finish, options);
  window.addEventListener('pageshow', event => { if (event.persisted) finish(); }, options);
  timer = setTimeout(finish, 2600);
}

function mountAtmosphere(host) {
  const surface = host.querySelector('.hero-atmosphere');
  const canvas = surface.querySelector('canvas');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let gl;
  try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' }); } catch { return; }
  if (!gl) return;
  const vertex = `attribute vec2 position; varying vec2 uv; void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }`;
  const fragment = `
    precision highp float;
    varying vec2 uv;
    uniform vec2 resolution;
    uniform vec2 pointer;
    uniform float time;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
    }
    vec3 environment(vec2 p, float t) {
      vec2 warp = vec2(
        sin(p.y * 1.8 + t * .7) + .55 * sin(p.x * 1.7 - p.y * .6 - t * .45),
        cos(p.x * 1.45 - t * .65) + .45 * sin(p.y * 2.1 + t * .5)
      );
      vec2 flow = p + .62 * warp + vec2(t * .23, -t * .18);
      float phase = flow.x * 1.9 + 1.8 * sin(flow.y * 1.6)
        + .42 * sin(flow.x * 2.7 - flow.y * 1.1 + t * .3)
        + .65 * noise(flow * 1.2 + t * .1);
      float band = sin(phase);
      vec3 dark = vec3(.006, .012, .008);
      vec3 green = vec3(.25, .36, .27), amber = vec3(.64, .47, .25);
      float warmth = smoothstep(-.45, .7, cos(phase + .85 + t * .45));
      vec3 light = mix(green, amber, warmth);
      vec3 color = mix(dark, light, smoothstep(-.72, .56, band));
      color += vec3(.09, .085, .045) * exp(-pow((band - .35) * 3., 2.));
      return color;
    }
    void main() {
      float aspect = resolution.x / resolution.y;
      vec2 cursor = pointer * vec2(aspect, 1.);
      vec2 p = (uv - .5) * vec2(aspect, 1.) - cursor * .025;
      float t = time * .95;
      vec3 color = environment(p * 3.25 + vec2(-.3, .1), t);
      float radius = mix(.68, .9, smoothstep(.5, 1.35, aspect));
      float leftEdge = mix(.08, .26, smoothstep(.6, 1.3, aspect));
      vec2 center = vec2(radius + (leftEdge - .5) * aspect, .52);
      center += vec2(.065 * sin(t * .8), .045 * sin(t * .7)) + cursor * .04;
      vec2 q = (p - center) / radius;
      q.x += .025 * sin(q.y * 3. + t * .7);
      q.y += .018 * sin(q.x * 3.5 - t * .6);
      float r = length(q);
      if (r < 1.006) {
        float z = sqrt(max(0., 1. - dot(q, q)));
        vec3 normal = normalize(vec3(q, z));
        vec2 refracted = p * 1.35 + normal.xy * (.3 + z * .7) + vec2(.9, -.5);
        vec2 reflected = vec2(atan(normal.x, z) * 1.4, asin(clamp(normal.y, -.999, .999)) * 1.2);
        vec3 through = environment(refracted * 2., t + .4);
        vec3 reflection = environment(reflected * 1.3 + vec2(1.8, .4), t);
        float fresnel = pow(1. - z, 2.);
        vec3 glass = mix(through * .86, reflection, .26 + fresnel * .48);
        float caustic = exp(-pow((r - .89 - .025 * sin(atan(q.y, q.x) * 3. + t * .4)) * 32., 2.));
        glass += reflection * caustic * .32;
        glass *= 1. - .93 * smoothstep(.91, .986, r);
        float lip = exp(-pow((r - .994) * 125., 2.));
        float innerLip = exp(-pow((r - .967) * 155., 2.));
        glass += vec3(.49, .39, .21) * lip * .8;
        glass += reflection * innerLip * .45;
        color = mix(color, glass, 1. - smoothstep(.998, 1.005, r));
      }
      color *= 1. - .23 * smoothstep(.32, .9, length((uv - .5) * vec2(1., .7)));
      color += (hash(gl_FragCoord.xy) - .5) * .012;
      color = max(color, 0.);
      color *= min(1., .49 / max(.001, max(color.r, max(color.g, color.b))));
      gl_FragColor = vec4(color, 1.);
    }`;
  let program, buffer, uniforms;
  let frame = 0, previous = 0, elapsed = 0;
  let visible = true, lost = false;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) { gl.deleteShader(result); throw new Error('Atmosphere shader unavailable'); }
    return result;
  }
  function initialize() {
    const vs = shader(gl.VERTEX_SHADER, vertex), fs = shader(gl.FRAGMENT_SHADER, fragment);
    program = gl.createProgram();
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Atmosphere program unavailable');
    gl.useProgram(program);
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    uniforms = { resolution: gl.getUniformLocation(program, 'resolution'), pointer: gl.getUniformLocation(program, 'pointer'), time: gl.getUniformLocation(program, 'time') };
    resize();
    surface.classList.add('is-ready');
  }
  function draw() {
    if (lost || !uniforms) return;
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.pointer, pointerX, pointerY);
    gl.uniform1f(uniforms.time, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function resize() {
    if (lost) return;
    const width = host.clientWidth, height = host.clientHeight;
    const scale = Math.min(devicePixelRatio, 1.25, Math.sqrt(700000 / (width * height)));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw();
  }
  function running() { return !reduced.matches && visible && !document.hidden && !lost; }
  function tick(now) {
    frame = 0;
    if (!running()) { previous = 0; return; }
    const delta = previous ? (now - previous) / 1000 : 0;
    previous = now; elapsed += Math.min(delta, .05);
    const follow = 1 - Math.exp(-delta * 10);
    pointerX += (targetX - pointerX) * follow; pointerY += (targetY - pointerY) * follow;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; previous = 0;
    if (running()) frame = requestAnimationFrame(tick);
  }
  function resetPointer() { targetX = targetY = 0; }
  try { initialize(); } catch { surface.classList.remove('is-ready'); return; }
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !running()) return;
    const bounds = host.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) { resetPointer(); return; }
    targetX = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / bounds.width - .5));
    targetY = Math.max(-.5, Math.min(.5, .5 - (event.clientY - bounds.top) / bounds.height));
  });
  window.addEventListener('pointerout', event => { if (!event.relatedTarget) resetPointer(); });
  window.addEventListener('pointercancel', resetPointer);
  window.addEventListener('blur', resetPointer);
  reduced.addEventListener('change', () => {
    targetX = targetY = pointerX = pointerY = 0;
    draw(); sync();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetPointer(); sync(); });
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (!visible) resetPointer(); sync(); }).observe(host);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; surface.classList.remove('is-ready'); sync();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    try { initialize(); sync(); } catch { lost = true; surface.classList.remove('is-ready'); }
  });
  sync();
}
