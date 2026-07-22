import type { Component } from "solid-js";
import { onCleanup, onMount } from "solid-js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";

const ModelViewer: Component = () => {
  let containerRef!: HTMLDivElement;

  onMount(() => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.clientWidth / containerRef.clientHeight,
      0.1,
      100
    );

    camera.position.set(1.25, 1, -0.75);

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1);
    fillLight.position.set(-4, 3, -2);
    scene.add(fillLight);

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

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    let loadedModel: THREE.Object3D | null = null;
    let modelTarget = new THREE.Vector3(0, 1, 0);
    const startCameraPosition = new THREE.Vector3(1.25, 1, -0.75);
    const midCameraPosition = new THREE.Vector3(1.5, 1, 0);
    const endCameraPosition = new THREE.Vector3(1.25, 1, 0.75);
    const heroCopy = document.querySelector<HTMLElement>("[data-hero-copy]");
    const aboutCopy = document.querySelector<HTMLElement>("[data-about-copy]");

    let controlsActive = false;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    const lerp = (from: number, to: number, amount: number) =>
      from + (to - from) * amount;

    const applyScrollState = () => {
      const viewportHeight = window.innerHeight || 1;
      const progress = clamp(window.scrollY / viewportHeight, 0, 1);
      const viewportWidth = window.innerWidth || 1;

      if (heroCopy) {
        const heroProgress = clamp(progress * 2, 0, 1);
        heroCopy.style.opacity = String(1 - heroProgress);
        heroCopy.style.transform = `translateY(${-40 * heroProgress}px)`;
      }

      if (aboutCopy) {
        const aboutProgress = clamp((progress - 0.5) * 2, 0, 1);
        aboutCopy.style.opacity = String(aboutProgress);
        aboutCopy.style.transform = `translateY(${40 * (1 - aboutProgress)}px)`;
      }

      containerRef.style.transform = `translate3d(${lerp(-viewportWidth * 0.2, -viewportWidth * 0.6, progress)}px, 0, 0)`;

      if (progress < 0.5) {
        const localProgress = progress * 2;
        camera.position.set(
          lerp(startCameraPosition.x, midCameraPosition.x, localProgress),
          lerp(startCameraPosition.y, midCameraPosition.y, localProgress),
          lerp(startCameraPosition.z, midCameraPosition.z, localProgress)
        );
        camera.lookAt(modelTarget);
        controlsActive = false;
        controls.enabled = false;
      } else {
        const localProgress = (progress - 0.5) * 2;
        camera.position.set(
          lerp(midCameraPosition.x, endCameraPosition.x, localProgress),
          lerp(midCameraPosition.y, endCameraPosition.y, localProgress),
          lerp(midCameraPosition.z, endCameraPosition.z, localProgress)
        );

        if (progress >= 1 && !controlsActive) {
          controls.enabled = true;
          controls.target.copy(modelTarget);
          camera.position.copy(endCameraPosition);
          controls.update();
          controlsActive = true;
        }

        if (progress < 1) {
          controlsActive = false;
          controls.enabled = false;
          camera.lookAt(modelTarget);
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

        modelTarget = target;
        controls.target.copy(target);
        controls.update();
      },
      undefined,
      (error: unknown) => {
        console.error("Failed to load model:", error);
      }
    );

    const handleResize = () => {
      const width = containerRef.clientWidth;
      const height = containerRef.clientHeight;

      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      applyScrollState();
    };

    window.addEventListener("resize", handleResize);

    applyScrollState();

    let animationFrameId = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      applyScrollState();

      if (controlsActive) {
        controls.update();
      }

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

  return (
    <div
      ref={containerRef}
      class="fixed right-0 top-0 z-10 h-screen w-1/5"
      style="will-change: transform;"
    >
    </div>
  );
};

export default ModelViewer;