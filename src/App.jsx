import { useRef, useEffect } from "react";
import * as SPLAT from "gsplat";

export default function App() {
    const canvasRef = useRef(null);

    useEffect(() => {
        // Assuming gsplat has a load method that takes a URL or file buffer
        async function loadModel() {
            await SPLAT.loadSplatModel("/");
            // or SPLAT.loadFromUrl(...)
            // Then initialize renderer if needed
            SPLAT.init();
        }
        loadModel();
    }, []);

    const startXR = async () => {
        if (!navigator.xr) {
            alert("WebXR not supported");
            return;
        }

        const canvas = canvasRef.current;
        const gl = canvas.getContext("webgl2", { xrCompatible: true });

        const session = await navigator.xr.requestSession("immersive-vr");
        await session.updateRenderState({
            baseLayer: new XRWebGLLayer(session, gl),
        });

        const refSpace = await session.requestReferenceSpace("local");

        const onXRFrame = (time, frame) => {
            session.requestAnimationFrame(onXRFrame);

            const pose = frame.getViewerPose(refSpace);
            if (!pose) return;

            const glLayer = session.renderState.baseLayer;
            for (const view of pose.views) {
                const viewport = glLayer.getViewport(view);
                gl.viewport(
                    viewport.x,
                    viewport.y,
                    viewport.width,
                    viewport.height
                );

                const viewMatrix = view.transform.inverse.matrix;
                const projMatrix = view.projectionMatrix;

                drawScene(gl, viewMatrix, projMatrix);
            }
        };

        session.requestAnimationFrame(onXRFrame);
    };

    const drawScene = (gl, viewMatrix, projMatrix) => {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        SPLAT.setCameraFromViewAndProjection(viewMatrix, projMatrix);
        SPLAT.render();
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ width: "100%" }}
            />
            <button onClick={startXR}>Enter VR</button>
        </div>
    );
}
