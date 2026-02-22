'use client';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

export function DottedSurface({ className, ...props }) {
    const { theme } = useTheme();
    const containerRef = useRef(null);
    const requestRef = useRef();
    
    // Config - Lower these numbers if it's still laggy
    const config = useMemo(() => ({
        amountX: 35, // Reduced from 40
        amountY: 45, // Reduced from 60
        separation: 160,
    }), []);

    useEffect(() => {
        if (!containerRef.current) return;

        const isDark = theme === 'dark';
        const bgColor = isDark ? 0x09090b : 0xfdf2f8;
        const dotColor = isDark 
            ? new THREE.Color(0x71717a) // zinc-500, brighter for dark mode
            : new THREE.Color(0xa1a1aa); // zinc-400, darker for light mode

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(bgColor, 3000, 10000);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(0, 355, 1220);

        const renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: false, // Turned off for performance boost
            powerPreference: "high-performance" 
        });
        
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for 4k monitors
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(bgColor, 1);
        containerRef.current.appendChild(renderer.domElement);

        const numParticles = config.amountX * config.amountY;
        const positions = new Float32Array(numParticles * 3);
        const colors = new Float32Array(numParticles * 3);

        const geometry = new THREE.BufferGeometry();
        let i = 0;
        for (let ix = 0; ix < config.amountX; ix++) {
            for (let iy = 0; iy < config.amountY; iy++) {
                positions[i * 3] = ix * config.separation - (config.amountX * config.separation) / 2;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = iy * config.separation - (config.amountY * config.separation) / 2;

                colors[i * 3] = dotColor.r;
                colors[i * 3 + 1] = dotColor.g;
                colors[i * 3 + 2] = dotColor.b;
                i++;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 15,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            sizeAttenuation: true,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        let count = 0;
        const animate = () => {
            requestRef.current = requestAnimationFrame(animate);
            const positionAttr = geometry.attributes.position;
            const posArray = positionAttr.array;

            let i = 0;
            for (let ix = 0; ix < config.amountX; ix++) {
                for (let iy = 0; iy < config.amountY; iy++) {
                    // Optimized Sine Wave calculation
                    posArray[i * 3 + 1] = (Math.sin((ix + count) * 0.3) * 50) + (Math.sin((iy + count) * 0.5) * 50);
                    i++;
                }
            }

            positionAttr.needsUpdate = true;
            renderer.render(scene, camera);
            count += 0.05; // Slower, smoother movement
        };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            if (containerRef.current) containerRef.current.innerHTML = '';
        };
    }, [theme, config]);

    return <div ref={containerRef} className={cn('fixed inset-0 -z-10', className)} {...props} />;
}
