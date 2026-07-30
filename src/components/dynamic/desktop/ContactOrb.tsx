import { type Component, onCleanup, onMount } from "solid-js";
import * as THREE from "three";

type ContactOrbProps = {
	class?: string;
	accent?: string;
};

/**
 * A glowing wireframe orb that reacts to the pointer. The sphere is built
 * from a dense wireframe with additive-blended points, and it subtly
 * pulses and tilts toward the cursor. A second, larger ghost ring orbits it.
 */
const ContactOrb: Component<ContactOrbProps> = (props) => {
	let containerRef!: HTMLDivElement;

	onMount(() => {
		const container = containerRef;
		const accent = new THREE.Color(props.accent ?? "#a78bfa");

		const scene = new THREE.Scene();

		const camera = new THREE.PerspectiveCamera(
			45,
			container.clientWidth / container.clientHeight,
			0.1,
			100
		);
		camera.position.set(0, 0, 6);

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		container.appendChild(renderer.domElement);

		// Core wireframe sphere
		const coreGeo = new THREE.SphereGeometry(1.6, 32, 24);
		const coreMat = new THREE.MeshBasicMaterial({
			color: accent,
			wireframe: true,
			transparent: true,
			opacity: 0.35,
		});
		const core = new THREE.Mesh(coreGeo, coreMat);
		scene.add(core);

		// Dense point cloud on the sphere surface
		const pointCount = 2200;
		const positions = new Float32Array(pointCount * 3);
		for (let i = 0; i < pointCount; i++) {
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			const r = 1.6;
			positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
			positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
			positions[i * 3 + 2] = r * Math.cos(phi);
		}
		const pointsGeo = new THREE.BufferGeometry();
		pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		const pointsMat = new THREE.PointsMaterial({
			color: accent,
			size: 0.035,
			transparent: true,
			opacity: 0.9,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		});
		const points = new THREE.Points(pointsGeo, pointsMat);
		scene.add(points);

		// Orbiting ring
		const ringGeo = new THREE.TorusGeometry(2.4, 0.02, 8, 100);
		const ringMat = new THREE.MeshBasicMaterial({
			color: accent,
			transparent: true,
			opacity: 0.4,
		});
		const ring = new THREE.Mesh(ringGeo, ringMat);
		ring.rotation.x = Math.PI / 2.4;
		scene.add(ring);

		// Second ring, perpendicular
		const ring2Geo = new THREE.TorusGeometry(2.7, 0.012, 8, 100);
		const ring2Mat = new THREE.MeshBasicMaterial({
			color: new THREE.Color("#38bdf8"),
			transparent: true,
			opacity: 0.25,
		});
		const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
		ring2.rotation.z = Math.PI / 3;
		scene.add(ring2);

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

			target.x += (pointer.x - target.x) * 0.05;
			target.y += (pointer.y - target.y) * 0.05;

			core.rotation.y = t * 0.15 + target.x * 0.4;
			core.rotation.x = target.y * 0.3;
			points.rotation.y = t * 0.15 + target.x * 0.4;
			points.rotation.x = target.y * 0.3;

			ring.rotation.z += 0.004;
			ring2.rotation.y += 0.003;
			ring2.rotation.x = Math.PI / 2.8 + Math.sin(t * 0.3) * 0.2;

			renderer.render(scene, camera);
		};
		render();

		onCleanup(() => {
			cancelAnimationFrame(frameId);
			window.removeEventListener("pointermove", handlePointer);
			window.removeEventListener("resize", handleResize);
			coreGeo.dispose();
			coreMat.dispose();
			pointsGeo.dispose();
			pointsMat.dispose();
			ringGeo.dispose();
			ringMat.dispose();
			ring2Geo.dispose();
			ring2Mat.dispose();
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

export default ContactOrb;