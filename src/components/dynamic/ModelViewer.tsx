import type { Component } from "solid-js";
import { onMount, onCleanup } from "solid-js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";

const ModelViewer: Component = () => {
  let containerRef!: HTMLDivElement;

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

    camera.position.set(1.5, 1, -1);
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

    // -------------------------------------------------------------------------
    // Model Loading
    // -------------------------------------------------------------------------
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    let loadedModel: THREE.Object3D | null = null;

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

      controls.update();
      renderer.render(scene, camera);
    };

    render();

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------
    onCleanup(() => {
      cancelAnimationFrame(animationFrameId);

      window.removeEventListener("resize", handleResize);

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

  return <div ref={containerRef} class="w-full h-full" />;
};

export default ModelViewer;