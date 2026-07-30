import { type Component, onCleanup, onMount } from "solid-js";
import * as THREE from "three";

type ParticleFieldProps = {
	class?: string;
	accent?: string;
	count?: number;
};

/**
 * A full-bleed interactive particle network rendered with Three.js.
 * Particles drift in 3D space and connect with lines to nearby neighbors,
 * creating a "constellation" effect. The camera subtly follows the pointer.
 */
const ParticleField: Component<ParticleFieldProps> = (props) => {
	let containerRef!: HTMLDivElement;

	onMount(() => {
		const container = containerRef;
		const accent = new THREE.Color(props.accent ?? "#a78bfa");

		const scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0x0a0a0a, 0.0016);

		const camera = new THREE.PerspectiveCamera(
			75,
			container.clientWidth / container.clientHeight,
			0.1,
			1000
		);
		camera.position.z = 60;

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(container.clientWidth, container.clientHeight);
		container.appendChild(renderer.domElement);

		const count = props.count ?? 900;
		const positions = new Float32Array(count * 3);
		const colors = new Float32Array(count * 3);

		for (let i = 0; i < count; i++) {
			positions[i * 3] = (Math.random() - 0.5) * 160;
			positions[i * 3 + 1] = (Math.random() - 0.5) * 160;
			positions[i * 3 + 2] = (Math.random() - 0.5) * 160;

			const c = accent.clone();
			c.offsetHSL(Math.random() * 0.08 - 0.04, 0, Math.random() * 0.3);
			colors[i * 3] = c.r;
			colors[i * 3 + 1] = c.g;
			colors[i * 3 + 2] = c.b;
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

		const material = new THREE.PointsMaterial({
			size: 0.6,
			vertexColors: true,
			transparent: true,
			opacity: 0.9,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		});

		const points = new THREE.Points(geometry, material);
		scene.add(points);

		// Line connections between nearby particles
		const lineMaterial = new THREE.LineBasicMaterial({
			color: accent,
			transparent: true,
			opacity: 0.12,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		});
		const lineGeometry = new THREE.BufferGeometry();
		const linePositions = new Float32Array(count * 3 * 2);
		lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
		const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
		scene.add(lines);

		const connectionThreshold = 14;
		const posAttr = geometry.attributes.position as THREE.BufferAttribute;
		const lineAttr = lineGeometry.attributes.position as THREE.BufferAttribute;

		const updateConnections = () => {
			let idx = 0;
			const p = posAttr.array as Float32Array;
			const lp = lineAttr.array as Float32Array;

			for (let i = 0; i < count; i++) {
				for (let j = i + 1; j < count; j++) {
					const dx = p[i * 3] - p[j * 3];
					const dy = p[i * 3 + 1] - p[j * 3 + 1];
					const dz = p[i * 3 + 2] - p[j * 3 + 2];
					const distSq = dx * dx + dy * dy + dz * dz;

					if (distSq < connectionThreshold * connectionThreshold) {
						lp[idx * 6] = p[i * 3];
						lp[idx * 6 + 1] = p[i * 3 + 1];
						lp[idx * 6 + 2] = p[i * 3 + 2];
						lp[idx * 6 + 3] = p[j * 3];
						lp[idx * 6 + 4] = p[j * 3 + 1];
						lp[idx * 6 + 5] = p[j * 3 + 2];
						idx++;
					}
				}
			}
			lineAttr.needsUpdate = true;
			lineGeometry.setDrawRange(0, idx * 2);
		};

		updateConnections();

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
			const delta = clock.getDelta();

			// Slow ambient rotation.
			points.rotation.y += delta * 0.02;
			lines.rotation.y += delta * 0.02;

			// Camera eases toward the pointer.
			target.x += (pointer.x - target.x) * 0.02;
			target.y += (pointer.y - target.y) * 0.02;
			camera.position.x += (target.x * 12 - camera.position.x) * 0.02;
			camera.position.y += (target.y * 8 - camera.position.y) * 0.02;
			camera.lookAt(0, 0, 0);

			renderer.render(scene, camera);
		};
		render();

		onCleanup(() => {
			cancelAnimationFrame(frameId);
			window.removeEventListener("pointermove", handlePointer);
			window.removeEventListener("resize", handleResize);
			geometry.dispose();
			material.dispose();
			lineGeometry.dispose();
			lineMaterial.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		});
	});

	return (
		<div
			ref={containerRef}
			class={props.class ?? "pointer-events-none absolute inset-0"}
			aria-hidden="true"
		/>
	);
};

export default ParticleField;