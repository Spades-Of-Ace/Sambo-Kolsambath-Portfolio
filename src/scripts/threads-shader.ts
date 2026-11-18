// Adapted from React Bits / Threads by David Haz (2026).
// Shader source: https://github.com/DavidHDev/react-bits/tree/main/src/ts-default/Backgrounds/Threads
// License: /assets/shaders/react-bits-LICENSE.txt
import { shaderProfile, type ShaderUniforms } from './shader-presets';

// SECTION: GLSL line geometry and color
const LINE_VERTEX = `#version 300 es
precision highp float;
in vec2 aPoint;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uFrame;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;
uniform float uCount;
uniform float uThickness;
uniform float uSoftness;
uniform float uWaves;
uniform float uSplit;
uniform float uFray;
uniform float uSeed;
uniform vec2 uTurn;
uniform vec4 uPart;
uniform float uTaper;
uniform float uOrbit;
uniform vec2 uOffset;
out float vEdge;
out float vBand;
out float vDraw;
out float vAlpha;
out float vIndex;
float Perlin2D(vec2 P) {
  vec2 Pi = floor(P);
  vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
  vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
  Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
  Pt += vec2(26.0, 161.0).xyxy;
  Pt *= Pt;
  Pt = Pt.xzxz * Pt.yyww;
  vec4 hash_x = fract(Pt * (1.0 / 951.135664));
  vec4 hash_y = fract(Pt * (1.0 / 642.949883));
  vec4 grad_x = hash_x - 0.49999;
  vec4 grad_y = hash_y - 0.49999;
  vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y) * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
  grad_results *= 1.4142135623730950;
  vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
  vec4 blend2 = vec4(blend, vec2(1.0 - blend));
  return dot(grad_results, blend2.zxzx * blend2.wwyy);
}
void main() {
  float perc = float(gl_InstanceID) / uCount;
  float x = aPoint.x;
  float pixel = 1.0 / max(uResolution.x, uResolution.y);
  float splitPoint = uSplit + perc * uFray;
  float amplitudeNormal = smoothstep(splitPoint, max(0.7, splitPoint + 0.2), x);
  float finalAmplitude = amplitudeNormal * 0.5 * uAmplitude * (1.0 + (uMouse.y - 0.5) * 0.2);
  float timeScaled = uTime / 10.0 + (uMouse.x - 0.5);
  float blur = smoothstep(splitPoint, splitPoint + 0.05, x) * perc;
  float xnoise = mix(
    Perlin2D(vec2(timeScaled * 2.5 + uSeed, (x * uWaves + perc) * 2.5)),
    Perlin2D(vec2(timeScaled * 3.5 + uSeed, (x * uWaves + timeScaled) * 3.5)) / 1.5,
    x * 0.3
  );
  float y = 0.5 + (perc - 0.5) * uDistance + xnoise / 2.0 * finalAmplitude;
  vec2 local = vec2((x - 0.5) * uFrame.x, (y - 0.5) * uFrame.y);
  float arcAngle = (x - 0.5) * 5.65 - 1.57;
  float radius = (0.08 + perc * 0.62) * min(uResolution.x, uResolution.y);
  vec2 arc = vec2(cos(arcAngle), sin(arcAngle) * 0.72) * radius;
  arc.y += xnoise * finalAmplitude * radius * 0.2;
  local = mix(local, arc, uOrbit);
  if (uPart.z > 0.0) {
    vec2 delta = local - uPart.xy;
    float reach = uPart.w;
    float pull = exp(-dot(delta, delta) / (reach * reach));
    local.y += delta.y * pull * uPart.z;
  }
  float width = 7.0 * uThickness * pixel * (1.0 - perc);
  float band = (width / 2.0 + 10.0 * uSoftness * pixel * blur) * uFrame.y;
  float draw = max(band, 1.0);
  local.y += aPoint.y * draw;
  vec2 turned = vec2(local.x * uTurn.x - local.y * uTurn.y, local.x * uTurn.y + local.y * uTurn.x);
  gl_Position = vec4((turned + uOffset * uResolution) / (uResolution * 0.5), 0.0, 1.0);
  vEdge = aPoint.y * draw;
  vBand = band;
  vDraw = draw;
  vAlpha = 1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3)) * uTaper;
  vIndex = perc;
}`;
const LINE_FRAGMENT = `#version 300 es
precision highp float;
in float vEdge;
in float vBand;
in float vDraw;
in float vAlpha;
in float vIndex;
uniform vec3 uColor;
uniform vec3 uAccent;
out vec4 outColor;
void main() {
  float coverage = (1.0 - smoothstep(0.0, vDraw, abs(vEdge))) * (vBand / vDraw) * vAlpha;
  outColor = vec4(mix(uColor, uAccent, vIndex) * coverage, coverage);
}`;
// SECTION: GLSL screen composite and grid
const SCREEN_VERTEX = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;
const SCREEN_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uLines;
uniform vec2 uResolution;
uniform float uFade;
uniform float uOpacity;
uniform float uCurve;
uniform float uGrid;
uniform vec3 uGridColor;
out vec4 outColor;
float smootherstep(float edge, float x) {
  float t = clamp(x / edge, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}
void main() {
  vec4 lines = texture(uLines, vUv);
  float alpha = lines.a;
  vec3 color = alpha > 0.0001 ? lines.rgb / alpha : vec3(0.0);
  float mask = uOpacity;
  if (uFade > 0.0) {
    vec2 px = vUv * uResolution;
    float edge = uFade * min(uResolution.x, uResolution.y) * 0.5;
    mask *= smootherstep(edge, px.x) * smootherstep(edge, uResolution.x - px.x);
    mask *= smootherstep(edge, px.y) * smootherstep(edge, uResolution.y - px.y);
  }
  vec4 result = vec4(color * pow(alpha, uCurve), alpha) * mask;
  vec2 gridCell = abs(mod(vUv * uResolution + 36.0, 72.0) - 36.0);
  float gridLine = 1.0 - smoothstep(0.5, 1.25, min(gridCell.x, gridCell.y));
  float gridAlpha = gridLine * uGrid * 0.11 * mask;
  result.rgb += uGridColor * gridAlpha * (1.0 - result.a);
  result.a += gridAlpha * (1.0 - result.a);
  outColor = result;
}`;

// SECTION: WebGL setup and GPU resources
export function createThreadsShader(host: HTMLElement) {
  const canvas = host.querySelector('canvas')!;
  const stage =
    host.closest<HTMLElement>('[data-shader-surface]') ??
    host.closest<HTMLElement>('.hero-stage') ??
    host;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl) throw new Error('WebGL2 unavailable');

  const programs: WebGLProgram[] = [];
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    throw new Error('Threads shader compilation failed');
  };
  const link = (vertexSource: string, fragmentSource: string) => {
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    let fragment: WebGLShader;
    try {
      fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    } catch (error) {
      gl.deleteShader(vertex);
      throw error;
    }
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      throw new Error('Threads shader linking failed');
    }
    programs.push(program);
    return program;
  };
  let lineProgram: WebGLProgram;
  let screenProgram: WebGLProgram;
  try {
    lineProgram = link(LINE_VERTEX, LINE_FRAGMENT);
    screenProgram = link(SCREEN_VERTEX, SCREEN_FRAGMENT);
  } catch (error) {
    programs.forEach((program) => gl.deleteProgram(program));
    throw error;
  }
  const locate = (program: WebGLProgram, names: string[]) =>
    Object.fromEntries(
      names.map((name) => [name, gl.getUniformLocation(program, name)]),
    );
  const line = locate(lineProgram, [
    'uTime',
    'uResolution',
    'uFrame',
    'uAmplitude',
    'uDistance',
    'uMouse',
    'uCount',
    'uThickness',
    'uSoftness',
    'uWaves',
    'uSplit',
    'uFray',
    'uSeed',
    'uTurn',
    'uPart',
    'uTaper',
    'uColor',
    'uAccent',
    'uOrbit',
    'uOffset',
  ]);
  const screen = locate(screenProgram, [
    'uLines',
    'uResolution',
    'uFade',
    'uOpacity',
    'uCurve',
    'uGrid',
    'uGridColor',
  ]);
  const lineVao = gl.createVertexArray();
  const lineBuffer = gl.createBuffer();
  gl.bindVertexArray(lineVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  const point = gl.getAttribLocation(lineProgram, 'aPoint');
  gl.enableVertexAttribArray(point);
  gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
  const screenVao = gl.createVertexArray();
  const screenBuffer = gl.createBuffer();
  gl.bindVertexArray(screenVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, screenBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(screenProgram, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const { name: initialName, ...initialProfile } = shaderProfile(
    host.dataset.section ?? 'home',
  );
  const current: ShaderUniforms = { ...initialProfile };
  const profileKeys = Object.keys(current) as (keyof ShaderUniforms)[];
  let target: ShaderUniforms = { ...initialProfile };
  host.dataset.profile = initialName;
  let alive = true;
  let visible = false;
  let frame = 0;
  let last = 0;
  let time = 12;
  let width = 1;
  let segments = 0;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let targetX = 0.5;
  let targetY = 0.5;
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    host.dataset.running = 'false';
  };
  // SECTION: Draw the shader and control animation timing
  const render = () => {
    const w = canvas.width;
    const h = canvas.height;
    const angle = (current.angle * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const count = width < 700 ? 48 : 72;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(lineProgram);
    gl.uniform1f(line.uTime, time);
    gl.uniform2f(line.uResolution, w, h);
    gl.uniform2f(
      line.uFrame,
      Math.abs(w * cos) + Math.abs(h * sin),
      Math.abs(w * sin) + Math.abs(h * cos),
    );
    gl.uniform1f(line.uAmplitude, current.amplitude);
    gl.uniform1f(line.uDistance, current.distance);
    gl.uniform2f(line.uMouse, mouseX, mouseY);
    gl.uniform1f(line.uCount, count);
    gl.uniform1f(line.uThickness, 0.75);
    gl.uniform1f(line.uSoftness, 0.65);
    gl.uniform1f(line.uWaves, current.waves);
    gl.uniform1f(line.uSplit, current.split);
    gl.uniform1f(line.uFray, 0.45);
    gl.uniform1f(line.uSeed, 0);
    gl.uniform2f(line.uTurn, cos, sin);
    gl.uniform4f(line.uPart, 0, 0, 0, 1);
    gl.uniform1f(line.uTaper, 0.7);
    gl.uniform3f(line.uColor, current.r, current.g, current.b);
    gl.uniform3f(line.uAccent, current.ar, current.ag, current.ab);
    gl.uniform1f(line.uOrbit, current.orbit);
    gl.uniform2f(line.uOffset, current.offsetX, current.offsetY);
    gl.bindVertexArray(lineVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (segments + 1) * 2, count);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(screenProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(screen.uLines, 0);
    gl.uniform2f(screen.uResolution, w, h);
    gl.uniform1f(screen.uFade, 0.15);
    gl.uniform1f(screen.uOpacity, 1);
    gl.uniform1f(screen.uCurve, 2 / 1.4);
    gl.uniform1f(screen.uGrid, current.grid);
    gl.uniform3f(screen.uGridColor, current.ar, current.ag, current.ab);
    gl.bindVertexArray(screenVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };
  const tick = (now: number) => {
    frame = 0;
    if (
      !alive ||
      !visible ||
      document.hidden ||
      reducedMotion.matches ||
      host.dataset.paused === 'true'
    )
      return;
    // Keep the shader at 30 fps even on high-refresh displays.
    if (!last || now - last >= 1000 / 30 - 1) {
      const dt = last ? Math.min(0.08, (now - last) / 1000) : 1 / 30;
      last = now;
      time += dt * current.speed;
      const follow = 1 - Math.exp(-dt * 3);
      for (const key of profileKeys)
        current[key] += (target[key] - current[key]) * follow;
      mouseX += (targetX - mouseX) * follow;
      mouseY += (targetY - mouseY) * follow;
      render();
    }
    frame = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (
      alive &&
      visible &&
      !document.hidden &&
      !reducedMotion.matches &&
      host.dataset.paused !== 'true' &&
      !frame
    ) {
      host.dataset.running = 'true';
      frame = requestAnimationFrame(tick);
    }
  };
  // SECTION: Canvas size and resolution limits
  const resize = () => {
    if (!alive || gl.isContextLost()) return;
    width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const dpr = Math.min(
      devicePixelRatio || 1,
      1.25,
      1600 / Math.max(width, height),
    );
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    segments = Math.min(480, Math.max(96, Math.round(width / 3)));
    const points = new Float32Array((segments + 1) * 4);
    for (let i = 0; i <= segments; i++)
      points.set([i / segments, -1, i / segments, 1], i * 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      canvas.width,
      canvas.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Threads render target unavailable');
    }
    render();
  };
  // SECTION: Pointer, visibility, and section profile updates
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !visible || reducedMotion.matches)
      return;
    const rect = stage.getBoundingClientRect();
    targetX = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    targetY =
      1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  };
  const onLeave = () => {
    targetX = 0.5;
    targetY = 0.5;
  };
  const onVisibility = () => {
    if (document.hidden || host.dataset.paused === 'true') stop();
    else wake();
  };
  const onMotion = () => {
    if (reducedMotion.matches) stop();
    else wake();
  };
  const onSection = (event: Event) => {
    const { section, instant } = (
      event as CustomEvent<{ section: string; instant: boolean }>
    ).detail;
    const { name, ...profile } = shaderProfile(section);
    target = profile;
    host.dataset.profile = name;
    if (instant || reducedMotion.matches) {
      Object.assign(current, profile);
      if (alive && !gl.isContextLost()) render();
    }
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    dispose();
    host.dataset.state = 'fallback';
  };
  const resizeObserver = new ResizeObserver(() => {
    try {
      resize();
    } catch {
      dispose();
      host.dataset.state = 'fallback';
    }
  });
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake();
    else stop();
  });
  function dispose() {
    if (!alive) return;
    alive = false;
    stop();
    resizeObserver.disconnect();
    intersection.disconnect();
    window.removeEventListener('pointermove', onPointer);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    host.removeEventListener('shader:visibility', onVisibility);
    host.removeEventListener('shader:section', onSection);
    document.removeEventListener('visibilitychange', onVisibility);
    reducedMotion.removeEventListener('change', onMotion);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    gl!.deleteFramebuffer(framebuffer);
    gl!.deleteTexture(texture);
    gl!.deleteBuffer(lineBuffer);
    gl!.deleteBuffer(screenBuffer);
    gl!.deleteVertexArray(lineVao);
    gl!.deleteVertexArray(screenVao);
    programs.forEach((program) => gl!.deleteProgram(program));
  }
  try {
    resize();
  } catch (error) {
    dispose();
    throw error;
  }
  resizeObserver.observe(host);
  intersection.observe(stage);
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  host.addEventListener('shader:visibility', onVisibility);
  host.addEventListener('shader:section', onSection);
  document.addEventListener('visibilitychange', onVisibility);
  reducedMotion.addEventListener('change', onMotion);
  canvas.addEventListener('webglcontextlost', onContextLost);
  host.dataset.state = 'ready';
  return dispose;
}
