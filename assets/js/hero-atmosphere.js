(()=>{var F=document.querySelector("[data-atmosphere]"),P=document.querySelector("[data-intro]");P&&_(P);F&&z(F);function _(i){let c=document.documentElement;if(!c.classList.contains("intro-pending")){i.remove();return}let n=new AbortController,s={signal:n.signal},e,l=()=>{clearTimeout(e),c.classList.remove("intro-pending"),i.remove(),n.abort()};i.addEventListener("animationend",f=>{f.target===i&&l()},s);for(let f of["keydown","wheel","scroll"])window.addEventListener(f,l,{...s,passive:!0});matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change",l,s),window.addEventListener("pageshow",f=>{f.persisted&&l()},s),e=setTimeout(l,2600)}function z(i){let c=i.querySelector(".hero-atmosphere"),n=c.querySelector("canvas"),s=matchMedia("(prefers-reduced-motion: reduce)"),e;try{e=n.getContext("webgl",{alpha:!1,antialias:!1,powerPreference:"low-power"})}catch{return}if(!e)return;let l="attribute vec2 position; varying vec2 uv; void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }",f=`
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
    }`,a,E,p,d=0,v=0,S=0,b=!0,m=!1,g=0,w=0,x=0,y=0;function q(t,r){let o=e.createShader(t);if(e.shaderSource(o,r),e.compileShader(o),!e.getShaderParameter(o,e.COMPILE_STATUS))throw e.deleteShader(o),new Error("Atmosphere shader unavailable");return o}function M(){let t=q(e.VERTEX_SHADER,l),r=q(e.FRAGMENT_SHADER,f);if(a=e.createProgram(),e.attachShader(a,t),e.attachShader(a,r),e.linkProgram(a),e.deleteShader(t),e.deleteShader(r),!e.getProgramParameter(a,e.LINK_STATUS))throw new Error("Atmosphere program unavailable");e.useProgram(a),E=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,E),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);let o=e.getAttribLocation(a,"position");e.enableVertexAttribArray(o),e.vertexAttribPointer(o,2,e.FLOAT,!1,0,0),p={resolution:e.getUniformLocation(a,"resolution"),pointer:e.getUniformLocation(a,"pointer"),time:e.getUniformLocation(a,"time")},R(),c.classList.add("is-ready")}function L(){m||!p||(e.uniform2f(p.resolution,n.width,n.height),e.uniform2f(p.pointer,g,w),e.uniform1f(p.time,S),e.drawArrays(e.TRIANGLES,0,3))}function R(){if(m)return;let t=i.clientWidth,r=i.clientHeight,o=Math.min(devicePixelRatio,1.25,Math.sqrt(7e5/(t*r)));n.width=Math.max(1,Math.round(t*o)),n.height=Math.max(1,Math.round(r*o)),e.viewport(0,0,n.width,n.height),L()}function A(){return!s.matches&&b&&!document.hidden&&!m}function T(t){if(d=0,!A()){v=0;return}let r=v?(t-v)/1e3:0;v=t,S+=Math.min(r,.05);let o=1-Math.exp(-r*10);g+=(x-g)*o,w+=(y-w)*o,L(),d=requestAnimationFrame(T)}function u(){d&&cancelAnimationFrame(d),d=0,v=0,A()&&(d=requestAnimationFrame(T))}function h(){x=y=0}try{M()}catch{c.classList.remove("is-ready");return}window.addEventListener("pointermove",t=>{if(t.pointerType!=="mouse"||!A())return;let r=i.getBoundingClientRect();if(t.clientX<r.left||t.clientX>r.right||t.clientY<r.top||t.clientY>r.bottom){h();return}x=Math.max(-.5,Math.min(.5,(t.clientX-r.left)/r.width-.5)),y=Math.max(-.5,Math.min(.5,.5-(t.clientY-r.top)/r.height))}),window.addEventListener("pointerout",t=>{t.relatedTarget||h()}),window.addEventListener("pointercancel",h),window.addEventListener("blur",h),s.addEventListener("change",()=>{x=y=g=w=0,L(),u()}),document.addEventListener("visibilitychange",()=>{document.hidden&&h(),u()}),new ResizeObserver(R).observe(i),new IntersectionObserver(t=>{b=t[0].isIntersecting,b||h(),u()}).observe(i),n.addEventListener("webglcontextlost",t=>{t.preventDefault(),m=!0,c.classList.remove("is-ready"),u()}),n.addEventListener("webglcontextrestored",()=>{m=!1;try{M(),u()}catch{m=!0,c.classList.remove("is-ready")}}),u()}})();
