import type { Component } from "solid-js";
import { createSignal, onCleanup, onMount } from "solid-js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";

const ModelViewer: Component = () => {
  let containerRef!: HTMLDivElement;
  const [hintVisible, setHintVisible] = createSignal(false);

  onMount(() => {
    // -------------------------------------------------------------------------
    // Scene
    // -------------------------------------------------------------------------
    const scene = new THREE.Scene();

    // -------------------------------------------------------------------------
    // Camera
    // -------------------------------------------------------------------------
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.clientWidth / containerRef.clientHeight,
      0.1,
      100
    );

    camera.position.set(1.25, 1, -0.75);
    camera.lookAt(0, 1, 0);

    // -------------------------------------------------------------------------
    // Renderer
    // -------------------------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.clientWidth, containerRef.clientHeight);

    // Physically correct output
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    containerRef.appendChild(renderer.domElement);

    // -------------------------------------------------------------------------
    // Lighting
    // -------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1);
    fillLight.position.set(-4, 3, -2);
    scene.add(fillLight);

    // -------------------------------------------------------------------------
    // Orbit Controls
    // -------------------------------------------------------------------------
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableRotate = true;

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    controls.screenSpacePanning = false;

    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.75;

    controls.target.set(0, 1, 0);
    controls.update();

    renderer.domElement.style.cursor = "grab";

    const setGrabCursor = () => {
      renderer.domElement.style.cursor = "grab";
    };

    const setGrabbingCursor = () => {
      renderer.domElement.style.cursor = "grabbing";
    };

    const handleControlStart = () => {
      cancelIntro();
      setGrabbingCursor();
    };

    const handleControlEnd = () => {
      setGrabCursor();
    };

    controls.addEventListener("start", handleControlStart);
    controls.addEventListener("end", handleControlEnd);

    // -------------------------------------------------------------------------
    // Model Loading
    // -------------------------------------------------------------------------
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    let loadedModel: THREE.Object3D | null = null;

    const INTRO_DELAY = 1500;
    const INTRO_FORWARD_DURATION = 1000;
    const INTRO_PAUSE_DURATION = 220;
    const INTRO_RETURN_DURATION = 1000;
    const INTRO_ROTATION = THREE.MathUtils.degToRad(12);

    let introPhase: "idle" | "forward" | "pause" | "reverse" | "done" = "idle";
    let introBlocked = false;
    let introTimerId: number | undefined;
    let introPhaseStart = 0;
    let introAppliedOffset = 0;
    let previousDamping = controls.enableDamping;

    const easeInOutCubic = (value: number) =>
      value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;

    const finishIntro = () => {
      introPhase = "done";
      introAppliedOffset = 0;
      setHintVisible(false);
      controls.enableDamping = previousDamping;
    };

    const cancelIntro = () => {
      if (introPhase === "done") return;

      introBlocked = true;

      if (introTimerId !== undefined) {
        window.clearTimeout(introTimerId);
        introTimerId = undefined;
      }

      finishIntro();
    };

    const startIntro = () => {
      if (introBlocked || introPhase !== "idle") return;

      introPhase = "forward";
      introPhaseStart = performance.now();
      introAppliedOffset = 0;
      previousDamping = controls.enableDamping;
      controls.enableDamping = false;
      setHintVisible(true);
    };

    const scheduleIntro = () => {
      if (introBlocked || introPhase !== "idle") return;

      if (introTimerId !== undefined) {
        window.clearTimeout(introTimerId);
      }

      introTimerId = window.setTimeout(startIntro, INTRO_DELAY);
    };

    const updateIntro = (now: number) => {
      if (introPhase === "forward") {
        const progress = Math.min((now - introPhaseStart) / INTRO_FORWARD_DURATION, 1);
        const offset = INTRO_ROTATION * easeInOutCubic(progress);
        const delta = offset - introAppliedOffset;

        if (delta !== 0) {
          controls.rotateLeft(delta);
        }

        introAppliedOffset = offset;

        if (progress >= 1) {
          introPhase = "pause";
          introPhaseStart = now;
        }
      } else if (introPhase === "pause") {
        if (now - introPhaseStart >= INTRO_PAUSE_DURATION) {
          introPhase = "reverse";
          introPhaseStart = now;
        }
      } else if (introPhase === "reverse") {
        const progress = Math.min((now - introPhaseStart) / INTRO_RETURN_DURATION, 1);
        const offset = INTRO_ROTATION * (1 - easeInOutCubic(progress));
        const delta = offset - introAppliedOffset;

        if (delta !== 0) {
          controls.rotateLeft(delta);
        }

        introAppliedOffset = offset;

        if (progress >= 1) {
          finishIntro();
        }
      }
    };

    loader.load(
      "/models/anga.glb",
      (gltf: GLTF) => {
        loadedModel = gltf.scene;

        // Center model around origin
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());

        loadedModel.position.sub(center);

        // Keep model sitting naturally on the ground plane
        const centeredBox = new THREE.Box3().setFromObject(loadedModel);
        const minY = centeredBox.min.y;
        loadedModel.position.y -= minY;

        scene.add(loadedModel);

        // Update orbit target to model center
        const finalBox = new THREE.Box3().setFromObject(loadedModel);
        const target = finalBox.getCenter(new THREE.Vector3());

        controls.target.copy(target);
        controls.update();

        scheduleIntro();
      },
      undefined,
      (error: unknown) => {
        console.error("Failed to load model:", error);
      }
    );

    // -------------------------------------------------------------------------
    // Resize Handling
    // -------------------------------------------------------------------------
    const handleResize = () => {
      const width = containerRef.clientWidth;
      const height = containerRef.clientHeight;

      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // -------------------------------------------------------------------------
    // Render Loop
    // -------------------------------------------------------------------------
    let animationFrameId = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      updateIntro(performance.now());
      controls.update();
      renderer.render(scene, camera);
    };

    render();

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------
    onCleanup(() => {
      cancelAnimationFrame(animationFrameId);

      if (introTimerId !== undefined) {
        window.clearTimeout(introTimerId);
      }

      window.removeEventListener("resize", handleResize);

      controls.removeEventListener("start", handleControlStart);
      controls.removeEventListener("end", handleControlEnd);

      controls.dispose();

      if (loadedModel) {
        loadedModel.traverse((child: THREE.Object3D) => {
          if (!(child instanceof THREE.Mesh)) return;

          const mesh = child;

          mesh.geometry.dispose();

          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          materials.forEach((material: THREE.Material) => {
            for (const value of Object.values(material) as unknown[]) {
              if (value instanceof THREE.Texture) {
                value.dispose();
              }
            }

            material.dispose();
          });
        });

        scene.remove(loadedModel);
      }

      renderer.dispose();

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    });
  });

  return (
    <div ref={containerRef} class="relative h-full w-full">
      <div
        aria-hidden="true"
        classList={{
          "opacity-0": !hintVisible(),
          "opacity-50": hintVisible(),
        }}
        class="pointer-events-none absolute bottom-4 right-4 select-none text-[13px] text-white transition-opacity duration-300"
      >
        Drag to rotate
      </div>
    </div>
  );
};

export default ModelViewer;