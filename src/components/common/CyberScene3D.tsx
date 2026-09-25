import React, { useEffect, useRef } from 'react';

interface CyberScene3DProps {
  intensity?: 'ambient' | 'active' | 'celebration';
  className?: string;
  interactive?: boolean;
  particleColors?: string[];
  ringColors?: [string, string];
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
}

export const CyberScene3D: React.FC<CyberScene3DProps> = ({
  intensity = 'ambient',
  className = '',
  interactive = true,
  particleColors,
  ringColors,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initialize 3D point cloud
    const count = intensity === 'celebration' ? 120 : intensity === 'active' ? 90 : 65;
    const points: Point3D[] = [];
    const colors = particleColors && particleColors.length > 0
      ? particleColors
      : [
          '#06b6d4', // cyan
          '#38bdf8', // sky
          '#6366f1', // indigo
          '#f59e0b', // amber
          '#10b981', // emerald
        ];

    for (let i = 0; i < count; i++) {
      points.push({
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 600,
        z: (Math.random() - 0.5) * 800 + 400,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        vz: (Math.random() - 0.5) * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 2.5 + 1.2,
      });
    }

    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      targetRotY = (mouseX / rect.width) * 0.7;
      targetRotX = -(mouseY / rect.height) * 0.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const fov = 450;
    let time = 0;

    const render = () => {
      time += 0.015;
      // Smooth camera interpolation
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY - rotY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1. Draw 3D Rotating Rings (Gimbal / Gyroscope Hologram)
      const ringRadius = 140;
      const ringSegments = 40;
      const numRings = 2;

      for (let r = 0; r < numRings; r++) {
        const ringRotOffset = r * 1.2 + time * (r % 2 === 0 ? 0.6 : -0.5);
        ctx.beginPath();
        let first = true;

        for (let s = 0; s <= ringSegments; s++) {
          const theta = (s / ringSegments) * Math.PI * 2;
          const rx = Math.cos(theta) * ringRadius;
          const ry = Math.sin(theta) * ringRadius;
          const rz = Math.sin(theta + ringRotOffset) * 40;

          // Apply 3D rotation
          const cosY = Math.cos(rotY + ringRotOffset * 0.3);
          const sinY = Math.sin(rotY + ringRotOffset * 0.3);
          const x1 = rx * cosY - rz * sinY;
          const z1 = rx * sinY + rz * cosY + 450;

          const cosX = Math.cos(rotX);
          const sinX = Math.sin(rotX);
          const y2 = ry * cosX - z1 * sinX;
          const z2 = ry * sinX + z1 * cosX;

          if (z2 > 10) {
            const scale = fov / z2;
            const px = cx + x1 * scale;
            const py = cy + y2 * scale;

            if (first) {
              ctx.moveTo(px, py);
              first = false;
            } else {
              ctx.lineTo(px, py);
            }
          }
        }

        const defaultRing1 = 'rgba(6, 182, 212, 0.25)';
        const defaultRing2 = 'rgba(245, 158, 11, 0.20)';
        ctx.strokeStyle = ringColors ? (r === 0 ? ringColors[0] : ringColors[1]) : (r === 0 ? defaultRing1 : defaultRing2);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // 2. Render 3D Point Cloud and Connections
      const projectedPoints: { x: number; y: number; z: number; color: string; size: number }[] = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Wrap around bounds
        if (p.x < -400) p.x = 400;
        if (p.x > 400) p.x = -400;
        if (p.y < -300) p.y = 300;
        if (p.y > 300) p.y = -300;
        if (p.z < 100) p.z = 800;
        if (p.z > 800) p.z = 100;

        // 3D rotation
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;

        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        if (z2 > 20) {
          const scale = fov / z2;
          const px = cx + x1 * scale;
          const py = cy + y2 * scale;
          projectedPoints.push({
            x: px,
            y: py,
            z: z2,
            color: p.color,
            size: p.size * scale * 0.7,
          });
        }
      }

      // Draw cyber mesh lines between nearby points
      for (let i = 0; i < projectedPoints.length; i++) {
        for (let j = i + 1; j < projectedPoints.length; j++) {
          const dx = projectedPoints[i].x - projectedPoints[j].x;
          const dy = projectedPoints[i].y - projectedPoints[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 65) {
            const alpha = (1 - dist / 65) * 0.15;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(projectedPoints[i].x, projectedPoints[i].y);
            ctx.lineTo(projectedPoints[j].x, projectedPoints[j].y);
            ctx.stroke();
          }
        }
      }

      // Render projected glowing particles
      for (const p of projectedPoints) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.8, p.size), 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [intensity, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
    />
  );
};
