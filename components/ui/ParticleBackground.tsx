"use client";

import { useEffect, useRef } from "react";

class Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;

  constructor(w: number, h: number) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 1;
    this.vy = (Math.random() - 0.5) * 1;
    this.size = 3;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,255,255,0.9)";
    ctx.fill();
  }

  update(w: number, h: number) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;
  }
}

class WaveParticle {
  baseX: number;
  baseY: number;
  speed: number;
  amplitude: number;
  type: "sin" | "cos";
  index: number;
  period: number;
  size: number;
  alpha: number;

  constructor(index: number, type: "sin" | "cos", w: number, h: number) {
    this.index = index;
    this.type = type;
    this.baseX = Math.random() * w;
    this.baseY = h / 2 + (Math.random() - 0.5) * 50;
    this.speed = 0.005 + Math.random() * 0.01;
    this.amplitude = 100 + Math.random() * 50;
    this.period = (Math.random() + 0.1) * (type === "cos" ? 1.5 : 1);
    this.size = Math.random() * 1.5;
    this.alpha = 0.3 + Math.random() * 0.4;
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    let y: number;
    if (this.type === "sin") {
      y = this.baseY + Math.sin(this.index * 0.05 + time * this.speed * 1.2) * this.amplitude;
    } else {
      y = this.baseY + Math.cos(this.index * 0.03 + time * this.speed) * (this.amplitude * 1.5);
    }
    ctx.beginPath();
    ctx.arc(this.baseX, y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,255,255,${this.alpha})`;
    ctx.fill();
  }
}

const NODE_COUNT = 80;
const WAVE_COUNT = 1000;
const CONNECTION_DIST = 150;

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let animationId: number;

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const nodes: Node[] = [];
    for (let i = 0; i < NODE_COUNT; i++) nodes.push(new Node(w, h));

    const waves: WaveParticle[] = [];
    for (let i = 0; i < WAVE_COUNT; i++)
      waves.push(new WaveParticle(i, i % 2 === 0 ? "sin" : "cos", w, h));

    function animate(time: number) {
      if (!time) time = 0;
      ctx!.clearRect(0, 0, w, h);
      for (let i = 0; i < WAVE_COUNT; i++) waves[i].draw(ctx!, time);
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes[i].update(w, h);
        nodes[i].draw(ctx!);
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            const opacity = 1 - dist / CONNECTION_DIST;
            ctx!.strokeStyle = `rgba(180,180,180,${opacity * 0.5})`;
            ctx!.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" aria-hidden="true" />;
}
