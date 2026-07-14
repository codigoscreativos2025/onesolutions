"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface SignatureCanvasProps {
  onSignature: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export function SignatureCanvas({
  onSignature,
  width = 360,
  height = 160,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCoordinates = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent
    ): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0] || (e as TouchEvent).changedTouches[0];
        if (!touch) return null;
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const coords = getCoordinates(e);
      if (!coords) return;

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      setIsDrawing(true);
      setHasSignature(true);
    },
    [getCoordinates]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;

      const coords = getCoordinates(e);
      if (!coords) return;

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    },
    [isDrawing, getCoordinates]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      onSignature(canvas.toDataURL("image/png"));
    }
  }, [isDrawing, hasSignature, onSignature]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignature("");
  }, [onSignature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-lowest cursor-crosshair w-full"
        style={{ maxWidth: width }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button
        type="button"
        onClick={clearCanvas}
        className="text-xs text-secondary hover:text-secondary/80 underline transition-colors"
      >
        Limpiar firma
      </button>
    </div>
  );
}
