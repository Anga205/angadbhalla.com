import { type Component, onCleanup, onMount } from "solid-js";
import * as THREE from "three";

type TechSceneProps = {
	class?: string;
	accent?: string;
};

/**
 * A 3D showcase of floating geometric primitives (icosahedron, torus knot,
 * octahedron, etc.) that slowly rotate and react to the pointer. Each shape
 * is a different "tech" node. The whole group gently bobs and spins.
 */
const TechScene: Component<TechSceneProps> = (props) => {
	let containerRef!: HTMLDivElement;

	onMount(() => {
		const container = containerRef;
		const accent = new THREE.Color(props.accent ?? "#a78bfa");

		const scene = new THREE.Scene();

		const camera = new THREE.PerspectiveCamera(
			50,
			container.clientWidth / container.clientHeight,
			0.1,
			100
		);
		camera.position.set(0, 0, 9);

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		container.appendChild(renderer.domElement);

		// Lighting
		const ambient = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambient);

		const key = new THREE.DirectionalLight(0xffffff, 1.6);
		key.position.set(4, 6, 5);
		scene.add(key);

		const rim = new THREE.DirectionalLight(accent, 1.2);
		rim.position.set(-5, -2, -4);
		scene.add(rim);

		const fill = new THREE.DirectionalLight(0xffffff, 0.5);
		fill.position.set(0, -4, 3);
		scene.add(fill);

		// Build a set of floating shapes.
		const shapes: { mesh: THREE.Mesh; newY: number; speed: number; phase: number; spin: THREE.Vector3 }[] = [];

		const addShape = (
			geometry: THREE.BufferGeometry,
			position: [number, number, number],
			scale: number,
			color: THREE.Color,
			metalness: number,
			roughness: number
		) => {
			const material = new THREE.MeshStandardMaterial({
				color,
				metalness,
				roughness,
				flatShading: true,
				emissive: color,
				emissiveIntensity: 0.08,
			});
			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(position[0], position[1], position[2]);
			mesh.scale.setScalar(scale);
			scene.add(mesh);
			shapes.push({
				mesh,
				newY: position[1],
				phase: Math.random() * Math.PI * 2,
				speed: 0.4 + Math.random() * 0.5,
				spin: new THREE.Vector3(
					(Math.random() - 0.5) * 0.4,
					(Math.random() - 0.5) * 0.4,
					(Math.random() - 0.5) * 0.4
				),
			});
		};

		const palette = [
			accent.clone(),
			new THREE.Color("#38bdf8"),
			new THREE.Color("#4ade80"),
			new THREE.Color("#fbbf24"),
			new THREE.Color("#f472b6"),
		];

		addShape(new THREE.IcosahedronGeometry(1, 0), [-2.6, 1.4, 0], 0.9, palette[0], 0.3, 0.4);
		addShape(new THREE.TorusKnotGeometry(0.7, 0.22, 100, 16), [2.7, 1.6, -0.5], 1, palette[1], 0.4, 0.3);
		addShape(new THREE.OctahedronGeometry(1, 0), [0, -1.8, -1.5], 0.8, palette[2], 0.3, 0.5);
		addShape(new THREE.TorusGeometry(0.8, 0.28, 16, 60), [2.8, -1.4, 0.5], 0.9, palette[3], 0.5, 0.3);
		addShape(new THREE.DodecahedronGeometry(1, 0), [-2.8, -1.2, 0.8], 0.7, palette[4], 0.3, 0.4);
		addShape(new THREE.ConeGeometry(0.8, 1.6, 6), [0, 2.2, -1], 0.8, palette[0], 0.4, 0.4);

		// Pointer parallax
		const pointer = { x: 0, y: 0 };
		const target = { x: 0, y: 0 };

		const handlePointer = (event: PointerEvent) => {
			pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
			pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
		};

		const handleResize = () => {
			const width = container.clientWidth;
			const height = container.clientHeight;
			if (!width || !height) return;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height);
		};

		window.addEventListener("pointermove", handlePointer, { passive: true });
		window.addEventListener("resize", handleResize);

		let frameId = 0;
		const clock = new THREE.Clock();

		const render = () => {
			frameId = requestAnimationFrame(render);
			const t = clock.getElapsedTime();

			target.x += (pointer.x - target.x) * 0.04;
			target.y += (pointer.y - target.y) * 0.04;

			// Group-level rotation follows the pointer.
			scene.rotation.y = target.x * 0.35;
			scene.rotation.x = target.y * 0.2;

			for (const s of shapes) {
				s.mesh.rotation.x += s.spin.x * 0.016;
				s.mesh.rotation.y += s.spin.y * 0.016;
				s.mesh.rotation.z += s.spin.z * 0.016;
				s.mesh.position.y = s.newY + Math.sin(t * s.speed + s.phase) * 0.25;
			}

			renderer.render(scene, camera);
		};
		render();

		onCleanup(() => {
			cancelAnimationFrame(frameId);
			window.removeEventListener("pointermove", handlePointer);
			window.removeEventListener("resize", handleResize);
			for (const s of shapes) {
				s.mesh.geometry.dispose();
				(s.mesh.material as THREE.Material).dispose();
			}
			renderer.dispose();
			renderer.domElement.remove();
		});
	});

	return (
		<div
			ref={containerRef}
			class={props.class ?? "h-full w-full"}
			aria-hidden="true"
		/>
	);
};

export default TechScene;