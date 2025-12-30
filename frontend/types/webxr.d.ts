declare global {
  type XRSessionMode = "inline" | "immersive-vr" | "immersive-ar";
  type XRReferenceSpaceType = "local" | "local-floor" | "bounded-floor" | "viewer";

  interface XRViewport {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface XRViewTransform {
    inverse: {
      matrix: Float32Array;
    };
  }

  interface XRView {
    projectionMatrix: Float32Array;
    transform: XRViewTransform;
  }

  interface XRViewerPose {
    views: XRView[];
  }

  interface XRFrame {
    session: XRSession;
    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | null;
  }

  type XRReferenceSpace = object;

  interface XRWebGLLayer extends WebGLRenderingContext {
    framebuffer: WebGLFramebuffer | null;
    getViewport(view: XRView): XRViewport | null;
  }

  interface XRSessionRenderState {
    baseLayer?: XRWebGLLayer;
  }

  interface XRSession {
    renderState: XRSessionRenderState;
    updateRenderState(state: { baseLayer?: XRWebGLLayer }): void;
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
    requestAnimationFrame(callback: (time: number, frame: XRFrame) => void): number;
    addEventListener(type: "end", listener: () => void): void;
    end(): Promise<void>;
  }

  interface XRSystem {
    isSessionSupported(mode: XRSessionMode): Promise<boolean>;
    requestSession(mode: XRSessionMode, options?: { optionalFeatures?: XRReferenceSpaceType[] }): Promise<XRSession>;
  }

  interface Navigator {
    xr?: XRSystem;
  }

  interface WebGLRenderingContext {
    makeXRCompatible(): Promise<void>;
  }

  const XRWebGLLayer: {
    new (session: XRSession, context: WebGLRenderingContext): XRWebGLLayer;
  };
}

export {};
