/**
 * "The Operations Constellation" — Three.js scenes for the hero and connect sections.
 *
 * Layers (back to front): data particle field, supply-chain node network with
 * traveling pulses, wireframe icosahedron. Falls back silently to the CSS hero
 * (orbs/mesh stay visible) when WebGL is unavailable or reduced motion is set.
 */
import * as THREE from 'three';

(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const supportsWebGL = () => {
        try {
            const c = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
        } catch {
            return false;
        }
    };
    if (!supportsWebGL()) return;

    const isNarrow = window.matchMedia('(max-width: 768px)').matches;
    const isDark = () => document.body.classList.contains('dark-mode');

    /* Soft round dot texture shared by nodes / pulses / particles */
    const dotTexture = (() => {
        const size = 64;
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.45, 'rgba(255,255,255,0.8)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    })();

    /* Palettes keyed off the site's CSS variables (light / dark) */
    const HERO_PALETTES = {
        light: {
            node: 0x8b6914, nodeOpacity: 0.9,
            line: 0x243040, lineOpacity: 0.16,
            pulse: 0xc9a227, pulseOpacity: 0.95,
            particle: 0x243040, particleOpacity: 0.3,
            ico: 0x243040, icoOpacity: 0.13
        },
        dark: {
            node: 0xd4b44a, nodeOpacity: 0.9,
            line: 0xe8eaec, lineOpacity: 0.1,
            pulse: 0xe8c85c, pulseOpacity: 0.95,
            particle: 0x9aa3ad, particleOpacity: 0.3,
            ico: 0x8fa3bf, icoOpacity: 0.16
        }
    };

    /* Connect section sits on navy (light) / near-black (dark) — bright accents in both */
    const CONNECT_PALETTES = {
        light: {
            node: 0xc9a227, nodeOpacity: 0.85,
            line: 0xffffff, lineOpacity: 0.09,
            pulse: 0xe8c85c, pulseOpacity: 0.9,
            particle: 0xaebacd, particleOpacity: 0.22,
            ico: 0xc9a227, icoOpacity: 0
        },
        dark: {
            node: 0xd4b44a, nodeOpacity: 0.85,
            line: 0xffffff, lineOpacity: 0.08,
            pulse: 0xe8c85c, pulseOpacity: 0.9,
            particle: 0x9aa3ad, particleOpacity: 0.22,
            ico: 0xd4b44a, icoOpacity: 0
        }
    };

    /**
     * Build one self-contained scene bound to a canvas.
     * Returns null if the renderer cannot be created.
     */
    function createScene(canvas, cfg) {
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        } catch {
            return null;
        }
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
        camera.position.set(0, 0, 16);

        const group = new THREE.Group();
        scene.add(group);

        /* ---- Network nodes ---- */
        const N = cfg.nodeCount;
        const base = new Float32Array(N * 3);
        const cur = new Float32Array(N * 3);
        const phase = new Float32Array(N * 3);
        const amp = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            base[i * 3] = (Math.random() - 0.5) * cfg.spread.x;
            base[i * 3 + 1] = (Math.random() - 0.5) * cfg.spread.y;
            base[i * 3 + 2] = (Math.random() - 0.5) * cfg.spread.z;
            phase[i * 3] = Math.random() * Math.PI * 2;
            phase[i * 3 + 1] = Math.random() * Math.PI * 2;
            phase[i * 3 + 2] = Math.random() * Math.PI * 2;
            amp[i] = 0.25 + Math.random() * 0.45;
        }

        const nodeGeo = new THREE.BufferGeometry();
        nodeGeo.setAttribute('position', new THREE.BufferAttribute(cur, 3));
        const nodeMat = new THREE.PointsMaterial({
            size: cfg.nodeSize,
            map: dotTexture,
            transparent: true,
            depthWrite: false,
            sizeAttenuation: true
        });
        group.add(new THREE.Points(nodeGeo, nodeMat));

        /* ---- Edges: connect near neighbours once at init (nodes only drift in small orbits) ---- */
        const edges = [];
        const degree = new Uint8Array(N);
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                if (degree[i] >= 4 || degree[j] >= 4) continue;
                const dx = base[i * 3] - base[j * 3];
                const dy = base[i * 3 + 1] - base[j * 3 + 1];
                const dz = base[i * 3 + 2] - base[j * 3 + 2];
                if (dx * dx + dy * dy + dz * dz < cfg.linkDist * cfg.linkDist) {
                    edges.push(i, j);
                    degree[i]++;
                    degree[j]++;
                }
            }
        }
        const linePos = new Float32Array(edges.length * 3);
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        const lineMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
        group.add(new THREE.LineSegments(lineGeo, lineMat));

        /* ---- Pulses traveling along edges ---- */
        const edgeCount = edges.length / 2;
        const P = Math.min(cfg.pulseCount, edgeCount);
        const pulses = [];
        for (let i = 0; i < P; i++) {
            pulses.push({
                edge: Math.floor(Math.random() * edgeCount),
                t: Math.random(),
                speed: 0.15 + Math.random() * 0.25
            });
        }
        const pulsePos = new Float32Array(P * 3);
        const pulseGeo = new THREE.BufferGeometry();
        pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
        const pulseMat = new THREE.PointsMaterial({
            size: cfg.nodeSize * 1.6,
            map: dotTexture,
            transparent: true,
            depthWrite: false,
            sizeAttenuation: true
        });
        if (P > 0) group.add(new THREE.Points(pulseGeo, pulseMat));

        /* ---- Particle depth field ---- */
        const PC = cfg.particleCount;
        const partPos = new Float32Array(PC * 3);
        for (let i = 0; i < PC; i++) {
            partPos[i * 3] = (Math.random() - 0.5) * cfg.spread.x * 1.9;
            partPos[i * 3 + 1] = (Math.random() - 0.5) * cfg.spread.y * 1.9;
            partPos[i * 3 + 2] = (Math.random() - 0.5) * cfg.spread.z * 2.4 - 3;
        }
        const partGeo = new THREE.BufferGeometry();
        partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
        const partMat = new THREE.PointsMaterial({
            size: cfg.nodeSize * 0.45,
            map: dotTexture,
            transparent: true,
            depthWrite: false,
            sizeAttenuation: true
        });
        const particles = new THREE.Points(partGeo, partMat);
        scene.add(particles);

        /* ---- Wireframe icosahedron ---- */
        let ico = null;
        if (cfg.icosahedron) {
            const icoMat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, depthWrite: false });
            ico = new THREE.Mesh(new THREE.IcosahedronGeometry(cfg.icoRadius, 1), icoMat);
            ico.position.set(cfg.icoOffset.x, cfg.icoOffset.y, cfg.icoOffset.z);
            scene.add(ico);
        }

        function applyPalette() {
            const p = cfg.palettes[isDark() ? 'dark' : 'light'];
            nodeMat.color.setHex(p.node);
            nodeMat.opacity = p.nodeOpacity;
            lineMat.color.setHex(p.line);
            lineMat.opacity = p.lineOpacity;
            pulseMat.color.setHex(p.pulse);
            pulseMat.opacity = p.pulseOpacity;
            partMat.color.setHex(p.particle);
            partMat.opacity = p.particleOpacity;
            if (ico) {
                ico.material.color.setHex(p.ico);
                ico.material.opacity = p.icoOpacity;
                ico.visible = p.icoOpacity > 0;
            }
        }
        applyPalette();

        function resize() {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (w < 1 || h < 1) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
        resize();
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(() => requestAnimationFrame(resize)).observe(canvas);
        }

        function update(time, dt, pointer, scrollTilt) {
            /* Node orbit drift */
            for (let i = 0; i < N; i++) {
                const a = amp[i];
                cur[i * 3] = base[i * 3] + Math.sin(time * 0.32 + phase[i * 3]) * a;
                cur[i * 3 + 1] = base[i * 3 + 1] + Math.sin(time * 0.27 + phase[i * 3 + 1]) * a;
                cur[i * 3 + 2] = base[i * 3 + 2] + Math.sin(time * 0.22 + phase[i * 3 + 2]) * a * 0.6;
            }
            nodeGeo.attributes.position.needsUpdate = true;

            /* Edge endpoints follow their nodes */
            for (let e = 0; e < edges.length; e++) {
                const n = edges[e];
                linePos[e * 3] = cur[n * 3];
                linePos[e * 3 + 1] = cur[n * 3 + 1];
                linePos[e * 3 + 2] = cur[n * 3 + 2];
            }
            lineGeo.attributes.position.needsUpdate = true;

            /* Pulses lerp along their edge; hop to a random edge when done */
            for (let i = 0; i < P; i++) {
                const pu = pulses[i];
                pu.t += pu.speed * dt;
                if (pu.t >= 1) {
                    pu.t = 0;
                    pu.edge = Math.floor(Math.random() * edgeCount);
                    pu.speed = 0.15 + Math.random() * 0.25;
                }
                const a = edges[pu.edge * 2];
                const b = edges[pu.edge * 2 + 1];
                pulsePos[i * 3] = cur[a * 3] + (cur[b * 3] - cur[a * 3]) * pu.t;
                pulsePos[i * 3 + 1] = cur[a * 3 + 1] + (cur[b * 3 + 1] - cur[a * 3 + 1]) * pu.t;
                pulsePos[i * 3 + 2] = cur[a * 3 + 2] + (cur[b * 3 + 2] - cur[a * 3 + 2]) * pu.t;
            }
            if (P > 0) pulseGeo.attributes.position.needsUpdate = true;

            particles.rotation.y = time * 0.012;
            if (ico) {
                ico.rotation.x = time * 0.06;
                ico.rotation.y = time * 0.09;
            }

            /* Scroll rotation + eased mouse parallax */
            group.rotation.y = scrollTilt + pointer.x * 0.06;
            group.rotation.x = pointer.y * 0.04;
            camera.position.x += (pointer.x * 0.9 - camera.position.x) * 0.04;
            camera.position.y += (-pointer.y * 0.6 - camera.position.y) * 0.04;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        }

        return { update, applyPalette };
    }

    /* ---- Boot both scenes ---- */
    const heroCanvas = document.getElementById('heroCanvas');
    const connectCanvas = document.getElementById('connectCanvas');
    const scenes = [];

    if (heroCanvas) {
        const s = createScene(heroCanvas, {
            nodeCount: isNarrow ? 42 : 80,
            particleCount: isNarrow ? 1200 : 2600,
            pulseCount: isNarrow ? 6 : 14,
            nodeSize: 0.16,
            linkDist: 4.2,
            spread: { x: 30, y: 14, z: 10 },
            icosahedron: true,
            icoRadius: 4.2,
            icoOffset: { x: 8.5, y: 1.5, z: -4 },
            palettes: HERO_PALETTES
        });
        if (s) scenes.push({ scene: s, canvas: heroCanvas, section: document.getElementById('hero'), visible: true, isHero: true });
    }

    if (connectCanvas) {
        const s = createScene(connectCanvas, {
            nodeCount: isNarrow ? 20 : 32,
            particleCount: isNarrow ? 300 : 700,
            pulseCount: 0,
            nodeSize: 0.14,
            linkDist: 5,
            spread: { x: 30, y: 10, z: 8 },
            icosahedron: false,
            icoRadius: 0,
            icoOffset: { x: 0, y: 0, z: 0 },
            palettes: CONNECT_PALETTES
        });
        if (s) scenes.push({ scene: s, canvas: connectCanvas, section: document.getElementById('contact'), visible: false, isHero: false });
    }

    if (scenes.length === 0) return;
    document.body.classList.add('webgl-on');

    /* Pause rendering when a scene's section is off screen */
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const item = scenes.find((s) => s.section === entry.target);
            if (item) item.visible = entry.isIntersecting;
        });
    }, { threshold: 0 });
    scenes.forEach((s) => { if (s.section) io.observe(s.section); });

    /* Mouse parallax (skipped on touch/narrow screens) */
    const pointer = { x: 0, y: 0 };
    if (!isNarrow) {
        window.addEventListener('mousemove', (e) => {
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
        }, { passive: true });
    }

    /* Theme swap — script.js dispatches this on dark-mode toggle */
    window.addEventListener('themechange', () => {
        scenes.forEach((s) => s.scene.applyPalette());
    });

    /* Scroll: slow rotation + hero fade as it leaves the viewport */
    let scrollTilt = 0;
    let heroFadeApplied = false;
    const onScroll = () => {
        const y = window.scrollY;
        scrollTilt = y * 0.0004;
        if (heroCanvas) {
            const heroH = heroCanvas.clientHeight || 1;
            const fade = Math.max(0, Math.min(1, 1 - y / (heroH * 0.85)));
            if (y > 0 && !heroFadeApplied) {
                heroCanvas.style.transition = 'opacity 0.15s linear';
                heroFadeApplied = true;
            }
            if (heroFadeApplied) heroCanvas.style.opacity = String(fade);
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    /* Render loop — skips hidden scenes and hidden tabs */
    const clock = new THREE.Clock();
    let rafId = 0;
    function loop() {
        rafId = requestAnimationFrame(loop);
        const dt = Math.min(clock.getDelta(), 0.05);
        const time = clock.elapsedTime;
        scenes.forEach((s) => {
            if (!s.visible) return;
            s.scene.update(time, dt, pointer, s.isHero ? scrollTilt : scrollTilt * 0.5);
        });
    }
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(rafId);
        } else {
            clock.getDelta();
            loop();
        }
    });
    loop();
})();
