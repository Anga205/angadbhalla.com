import type { Component } from "solid-js";
import { onCleanup, onMount } from "solid-js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";

type ModelViewerProps = {
	class?: string;
	style?: string;
	mode?: "desktop" | "mobile";
};

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

const ModelViewer: Component<ModelViewerProps> = (props) => {
	let containerRef!: HTMLDivElement;
	const isMobile = props.mode === "mobile";

	onMount(() => {
		const scene = new THREE.Scene();

		const camera = new THREE.PerspectiveCamera(
			45,
			containerRef.clientWidth / containerRef.clientHeight,
			0.1,
			100
		);

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		});

		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1;

		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(
			containerRef.clientWidth,
			containerRef.clientHeight
		);

		containerRef.appendChild(renderer.domElement);

		scene.add(new THREE.AmbientLight(0xffffff, 0.8));

		const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
		keyLight.position.set(5, 8, 5);
		scene.add(keyLight);

		const fillLight = new THREE.DirectionalLight(0xffffff, 1);
		fillLight.position.set(-4, 3, -2);
		scene.add(fillLight);

		const controls = new OrbitControls(
			camera,
			renderer.domElement
		);

		controls.enablePan = false;
		controls.enableZoom = false;
		controls.enableRotate = true;

		controls.enableDamping = true;
		controls.dampingFactor = 0.08;

		controls.minPolarAngle = Math.PI * 0.25;
		controls.maxPolarAngle = Math.PI * 0.75;

		renderer.domElement.style.cursor = "grab";

		const heroCopy =
			document.querySelector<HTMLElement>("[data-hero-copy]");

		const aboutCopy =
			document.querySelector<HTMLElement>("[data-about-copy]");

		let viewportHeight = window.innerHeight || 1;
		let viewportWidth = window.innerWidth || 1;

		let targetProgress = clamp(
			window.scrollY / viewportHeight,
			0,
			1
		);

		let currentProgress = targetProgress;

		const clock = new THREE.Clock();

		let loadedModel: THREE.Object3D | null = null;
		let modelTarget = new THREE.Vector3(0, 1, 0);
		const heroCameraPosition = new THREE.Vector3(
			1.25,
			1,
			-0.75
		);

		const aboutCameraPosition = new THREE.Vector3(
			1.25,
			1,
			0.75
		);

		if (isMobile) {
			camera.position.set(0, 1.2, 3.25);
		} else {
			camera.position.copy(heroCameraPosition);
		}

		const loader = new GLTFLoader();
		loader.setMeshoptDecoder(MeshoptDecoder);

		loader.load(
			"/models/anga.glb",
			(gltf: GLTF) => {
				loadedModel = gltf.scene;

				const bounds = new THREE.Box3().setFromObject(
					loadedModel
				);

				const center = bounds.getCenter(
					new THREE.Vector3()
				);

				loadedModel.position.sub(center);

				const groundedBounds =
					new THREE.Box3().setFromObject(loadedModel);

				loadedModel.position.y -= groundedBounds.min.y;

				scene.add(loadedModel);

				const finalBounds =
					new THREE.Box3().setFromObject(loadedModel);

				modelTarget = finalBounds.getCenter(
					new THREE.Vector3()
				);

				controls.target.copy(modelTarget);
				controls.update();
			},
			undefined,
			(error) => {
				console.error("Failed to load model:", error);
			}
		);

		const updateScene = () => {
			if (isMobile) {
				camera.position.set(0, 1.2, 3.25);
				camera.lookAt(0, 1.1, 0);
				controls.enabled = false;
				containerRef.style.transform = "translate3d(0, 0, 0)";
			} else {
				camera.position.lerpVectors(
					heroCameraPosition,
					aboutCameraPosition,
					currentProgress
				);

				camera.lookAt(modelTarget);

				controls.enabled = currentProgress < 0.02 || currentProgress > 0.98;

				const x = THREE.MathUtils.lerp(
					-viewportWidth * 0.2,
					-viewportWidth * 0.6,
					currentProgress
				);

				const navbarProgress = clamp(
					currentProgress / 0.25,
					0,
					1
				);

				const y = THREE.MathUtils.lerp(
					0,
					64,
					navbarProgress
				);

				containerRef.style.transform =
					`translate3d(${x}px, ${y}px, 0)`;
			}

			if (heroCopy) {
				const progress = clamp(
					currentProgress / 0.25,
					0,
					1
				);

				heroCopy.style.opacity = `${1 - progress}`;
				heroCopy.style.transform =
					`translateY(${-40 * progress}px)`;
			}

			if (aboutCopy) {
				const progress = clamp(
					(currentProgress - 0.75) / 0.25,
					0,
					1
				);

				aboutCopy.style.opacity = `${progress}`;
				aboutCopy.style.transform =
					`translateY(${40 * (1 - progress)}px)`;
			}

		};

		const handleScroll = () => {
			targetProgress = clamp(
				window.scrollY / viewportHeight,
				0,
				1
			);
		};

		const handleResize = () => {
			viewportHeight = window.innerHeight || 1;
			viewportWidth = window.innerWidth || 1;

			const width = containerRef.clientWidth;
			const height = containerRef.clientHeight;

			if (!width || !height) {
				return;
			}

			camera.aspect = width / height;
			camera.updateProjectionMatrix();

			renderer.setPixelRatio(
				Math.min(window.devicePixelRatio, 2)
			);

			renderer.setSize(width, height);

			handleScroll();
		};

		window.addEventListener(
			"scroll",
			handleScroll,
			{ passive: true }
		);

		window.addEventListener(
			"resize",
			handleResize
		);

		let animationFrameId = 0;

		const render = () => {
			animationFrameId =
				requestAnimationFrame(render);

			const delta = clock.getDelta();

			currentProgress = THREE.MathUtils.damp(
				currentProgress,
				targetProgress,
				6,
				delta
			);

			updateScene();

			if (controls.enabled) {
				controls.update();
			}

			renderer.render(scene, camera);
		};

		updateScene();
		render();

		onCleanup(() => {
			cancelAnimationFrame(animationFrameId);

			window.removeEventListener(
				"scroll",
				handleScroll
			);

			window.removeEventListener(
				"resize",
				handleResize
			);

			controls.dispose();

			if (loadedModel) {
				loadedModel.traverse((child) => {
					if (!(child instanceof THREE.Mesh)) {
						return;
					}

					child.geometry.dispose();

					const materials = Array.isArray(child.material)
						? child.material
						: [child.material];

					for (const material of materials) {
						for (const value of Object.values(material)) {
							if (value instanceof THREE.Texture) {
								value.dispose();
							}
						}

						material.dispose();
					}
				});

				scene.remove(loadedModel);
			}

			renderer.dispose();
			renderer.domElement.remove();
		});
	});

	return (
		<div
			ref={containerRef}
			class={props.class ?? "fixed right-0 top-0 z-10 h-screen w-1/5"}
			style={props.style ?? "will-change: transform;"}
		/>
	);
};

export default ModelViewer;