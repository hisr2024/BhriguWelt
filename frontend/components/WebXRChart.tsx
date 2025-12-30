'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChartHouse } from "@/types/astro";

type Props = {
  rashiChart?: ChartHouse[];
};

type GLResources = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  positionLocation: number;
  projectionLocation: WebGLUniformLocation;
  viewLocation: WebGLUniformLocation;
  colorLocation: WebGLUniformLocation;
};

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertex: string, fragment: string) {
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create program");
  gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
  }
  return program;
}

function perspective(out: Float32Array, fovy: number, aspect: number, near: number, far: number) {
  const f = 1.0 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = (2 * far * near) / (near - far);
  out[15] = 0;
  return out;
}

function lookAt(out: Float32Array, eye: number[], center: number[], up: number[]) {
  const [ex, ey, ez] = eye;
  const [cx, cy, cz] = center;
  const [ux, uy, uz] = up;
  let zx = ex - cx;
  let zy = ey - cy;
  let zz = ez - cz;
  const zLen = Math.hypot(zx, zy, zz) || 1;
  zx /= zLen;
  zy /= zLen;
  zz /= zLen;

  let xx = uy * zz - uz * zy;
  let xy = uz * zx - ux * zz;
  let xz = ux * zy - uy * zx;
  const xLen = Math.hypot(xx, xy, xz) || 1;
  xx /= xLen;
  xy /= xLen;
  xz /= xLen;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  out[0] = xx;
  out[1] = yx;
  out[2] = zx;
  out[3] = 0;
  out[4] = xy;
  out[5] = yy;
  out[6] = zy;
  out[7] = 0;
  out[8] = xz;
  out[9] = yz;
  out[10] = zz;
  out[11] = 0;
  out[12] = -(xx * ex + xy * ey + xz * ez);
  out[13] = -(yx * ex + yy * ey + yz * ez);
  out[14] = -(zx * ex + zy * ey + zz * ez);
  out[15] = 1;
  return out;
}

function rotateY(out: Float32Array, a: Float32Array, rad: number) {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  out[0] = a[0] * c + a[8] * s;
  out[1] = a[1] * c + a[9] * s;
  out[2] = a[2] * c + a[10] * s;
  out[3] = a[3] * c + a[11] * s;
  out[8] = a[8] * c - a[0] * s;
  out[9] = a[9] * c - a[1] * s;
  out[10] = a[10] * c - a[2] * s;
  out[11] = a[11] * c - a[3] * s;
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

const VERTEX_SHADER = `
  attribute vec3 aPosition;
  uniform mat4 uProjection;
  uniform mat4 uView;
  void main() {
    gl_Position = uProjection * uView * vec4(aPosition, 1.0);
    gl_PointSize = 6.0;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform vec3 uColor;
  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

export default function WebXRChart({ rashiChart = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resourcesRef = useRef<GLResources | null>(null);
  const xrSessionRef = useRef<XRSession | null>(null);
  const frameHandleRef = useRef<number | null>(null);
  const positionCountRef = useRef(0);
  const rotationRef = useRef(0);
  const [xrSupported, setXrSupported] = useState(false);
  const [xrStatus, setXrStatus] = useState<"idle" | "active" | "unsupported">("idle");

  const chartPoints = useMemo(() => {
    const chart = rashiChart.length ? rashiChart : [];
    return chart.slice(0, 12);
  }, [rashiChart]);

  const setPositions = useCallback(
    (gl: WebGLRenderingContext, positionBuffer: WebGLBuffer) => {
      const points = chartPoints.length
        ? chartPoints
        : Array.from({ length: 12 }, (_, index) => ({ index: index + 1, occupants: [] } as ChartHouse));
      const positions: number[] = [];
      points.forEach((house, idx) => {
        const angle = (idx / points.length) * Math.PI * 2;
        const radius = 1.2;
        const height = Math.min((house.occupants?.length || 0) * 0.15, 0.6);
        positions.push(radius * Math.cos(angle), height, radius * Math.sin(angle));
      });
      const bufferData = new Float32Array(positions);
      positionCountRef.current = positions.length / 3;
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
    },
    [chartPoints],
  );

  const initScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) return;

    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) return;
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const projectionLocation = gl.getUniformLocation(program, "uProjection");
    const viewLocation = gl.getUniformLocation(program, "uView");
    const colorLocation = gl.getUniformLocation(program, "uColor");
    if (!projectionLocation || !viewLocation || !colorLocation) return;

    gl.enable(gl.DEPTH_TEST);
    resourcesRef.current = {
      gl,
      program,
      positionBuffer,
      positionLocation,
      projectionLocation,
      viewLocation,
      colorLocation,
    };

    setPositions(gl, positionBuffer);
  }, [setPositions]);

  useEffect(() => {
    initScene();
  }, [initScene]);

  useEffect(() => {
    const resources = resourcesRef.current;
    if (!resources) return;
    setPositions(resources.gl, resources.positionBuffer);
  }, [setPositions]);

  useEffect(() => {
    if (!navigator.xr) {
      setXrSupported(false);
      setXrStatus("unsupported");
      return;
    }

    navigator.xr
      .isSessionSupported("immersive-vr")
      .then((supported) => {
        setXrSupported(supported);
        setXrStatus(supported ? "idle" : "unsupported");
      })
      .catch(() => {
        setXrSupported(false);
        setXrStatus("unsupported");
      });
  }, []);

  const renderScene = useCallback(
    (projectionMatrix: Float32Array, viewMatrix: Float32Array) => {
      const resources = resourcesRef.current;
      if (!resources) return;
      const { gl, program, positionBuffer, positionLocation, projectionLocation, viewLocation, colorLocation } =
        resources;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
      gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
      gl.uniform3f(colorLocation, 0.62, 0.75, 1.0);
      gl.drawArrays(gl.LINE_LOOP, 0, positionCountRef.current);
      gl.uniform3f(colorLocation, 0.98, 0.82, 0.6);
      gl.drawArrays(gl.POINTS, 0, positionCountRef.current);
    },
    [],
  );

  const renderInline = useCallback(() => {
    const resources = resourcesRef.current;
    if (!resources) return;
    const { gl } = resources;
    const canvas = gl.canvas as HTMLCanvasElement;
    const displayWidth = canvas.clientWidth || canvas.width;
    const displayHeight = canvas.clientHeight || canvas.height;
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.02, 0.03, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    rotationRef.current += 0.003;
    const projection = new Float32Array(16);
    const view = new Float32Array(16);
    const rotated = new Float32Array(16);
    perspective(projection, Math.PI / 4, canvas.width / canvas.height, 0.1, 10);
    lookAt(view, [0, 0.6, 3.2], [0, 0, 0], [0, 1, 0]);
    rotateY(rotated, view, rotationRef.current);
    renderScene(projection, rotated);
    frameHandleRef.current = requestAnimationFrame(renderInline);
  }, [renderScene]);

  const startInlineLoop = useCallback(() => {
    if (frameHandleRef.current) {
      cancelAnimationFrame(frameHandleRef.current);
    }
    frameHandleRef.current = requestAnimationFrame(renderInline);
  }, [renderInline]);

  useEffect(() => {
    if (xrSessionRef.current) return;
    startInlineLoop();
    return () => {
      if (frameHandleRef.current) {
        cancelAnimationFrame(frameHandleRef.current);
      }
    };
  }, [startInlineLoop]);

  const stopXRSession = useCallback(() => {
    xrSessionRef.current?.end();
  }, []);

  const startXRSession = useCallback(async () => {
    if (!navigator.xr || !resourcesRef.current) return;
    try {
      const session = await navigator.xr.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor", "bounded-floor"],
      });
      const { gl } = resourcesRef.current;
      await gl.makeXRCompatible();
      session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
      const referenceSpace = await session.requestReferenceSpace("local");
      xrSessionRef.current = session;
      setXrStatus("active");

      const onXRFrame = (_: number, frame: XRFrame) => {
        const sessionRef = frame.session;
        const pose = frame.getViewerPose(referenceSpace);
        if (!pose || !resourcesRef.current) {
          sessionRef.requestAnimationFrame(onXRFrame);
          return;
        }

        const { gl } = resourcesRef.current;
        const baseLayer = sessionRef.renderState.baseLayer;
        if (!baseLayer) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, baseLayer.framebuffer);
        gl.clearColor(0.02, 0.03, 0.08, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (const view of pose.views) {
          const viewport = baseLayer.getViewport(view);
          if (!viewport) continue;
          gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
          renderScene(view.projectionMatrix, view.transform.inverse.matrix);
        }
        sessionRef.requestAnimationFrame(onXRFrame);
      };

      session.requestAnimationFrame(onXRFrame);
      session.addEventListener("end", () => {
        xrSessionRef.current = null;
        setXrStatus(xrSupported ? "idle" : "unsupported");
        startInlineLoop();
      });
    } catch (error) {
      console.warn("Unable to start XR session", error);
      setXrStatus("unsupported");
    }
  }, [renderScene, startInlineLoop, xrSupported]);

  return (
    <section className="card webxr-chart" aria-label="WebXR chart">
      <header className="section-heading webxr-chart__header">
        <div>
          <p className="eyebrow">WebXR 3D chart</p>
          <h3>Immersive wheel</h3>
          <p className="muted">
            Explore the chart in 3D. Enter VR to walk the houses or stay inline for a rotating constellation.
          </p>
        </div>
        <div className="webxr-chart__actions">
          <button
            type="button"
            className="button-link"
            onClick={xrStatus === "active" ? stopXRSession : startXRSession}
            disabled={!xrSupported}
          >
            {xrStatus === "active" ? "Exit XR" : xrSupported ? "Enter XR" : "XR unavailable"}
          </button>
          <span className="badge badge--ghost">{xrStatus === "active" ? "Live XR" : "Inline"}</span>
        </div>
      </header>
      <div className="webxr-chart__surface">
        <canvas ref={canvasRef} className="webxr-chart__canvas" role="img" aria-label="3D chart canvas" />
        <div className="webxr-chart__legend">
          {chartPoints.length ? (
            chartPoints.map((house) => (
              <div key={house.index} className="webxr-chart__legend-item">
                <span className="webxr-chart__legend-index">House {house.index}</span>
                <span>{house.sign || "Sign"}</span>
              </div>
            ))
          ) : (
            <p className="muted">Awaiting chart data. Submit a horoscope to animate the houses.</p>
          )}
        </div>
      </div>
    </section>
  );
}
