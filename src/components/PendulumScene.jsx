import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';

function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

const PendulumScene = forwardRef(function PendulumScene({ params, running, paused, resetKey }, ref) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const dataRef = useRef([]);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400, styleWidth: 600, styleHeight: 400, dpr: 1 });
  
  // Dynamic canvas size adaptation
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const borderLeft = 8;
        const borderRight = 8;
        const borderTop = 8;
        const borderBottom = 1;
        const w = containerRef.current.offsetWidth - borderLeft - borderRight;
        const h = containerRef.current.offsetHeight - borderTop - borderBottom;
        setCanvasSize({ width: w * dpr, height: h * dpr, styleWidth: w, styleHeight: h, dpr });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const width = canvasSize.width;
  const height = canvasSize.height;
  const styleWidth = canvasSize.styleWidth;
  const styleHeight = canvasSize.styleHeight;
  const dpr = canvasSize.dpr;

  // Compound pendulum parameters
  const { length, pivotPosition, mass, gravity, damping, initialAngle } = params;
  
  // Expose data to parent component
  useImperativeHandle(ref, () => ({
    getPendulumData: () => {
      return dataRef.current;
    }
  }), [resetKey]);

  // Reset animation
  useEffect(() => {
    dataRef.current = [];
    drawScene(0, 0);
  }, [resetKey, length, pivotPosition, mass, gravity, damping, initialAngle, width, height]);

  // Main animation loop
  useEffect(() => {
    if (!running || paused) {
      cancelAnimationFrame(requestRef.current);
      return;
    }

    let startTime = null;
    let lastTime = 0;
    let angle = deg2rad(initialAngle);
    let angularVelocity = 0;
    
    // Distance from pivot to center of mass
    const d = Math.abs(pivotPosition - 0.5) * length;
    
    // Calculate moment of inertia I = m * (L^2/12 + d^2)
    const I = mass * (Math.pow(length, 2) / 12 + Math.pow(d, 2));
    
    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const dt = (timestamp - lastTime) / 1000; // Convert to seconds
      lastTime = timestamp;
      
      if (dt > 0 && dt < 0.1) { // Prevent time step from being too large
        // Calculate gravitational torque ¦Ó = m * g * d * sin(¦È)
        const torque = mass * gravity * d * Math.sin(angle);
        
        // Calculate damping torque ¦Ó_d = -b * ¦Ø
        const dampingTorque = -damping * angularVelocity;
        
        // Calculate angular acceleration ¦Á = ¦Ó / I
        const angularAcceleration = (torque + dampingTorque) / I;
        
        // Update angular velocity and angle
        angularVelocity += angularAcceleration * dt;
        angle += angularVelocity * dt;
        
        // Record data [time, angle, angular velocity, angular acceleration]
        const t = elapsed / 1000; // Convert to seconds
        dataRef.current.push([t, angle, angularVelocity, angularAcceleration]);
        
        // Draw scene
        drawScene(angle, t);
      }
      
      requestRef.current = requestAnimationFrame(animate);
    }
    
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [running, paused, length, pivotPosition, mass, gravity, damping, initialAngle, resetKey, width, height]);

  // Draw scene
  function drawScene(angle, time) {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate pivot position
    const pivotX = width / 2;
    const pivotY = height / 3;
    
    // Calculate rod length in pixels
    const rodLength = length * 100 * dpr; // 1 meter = 100 pixels
    
    // Calculate rod endpoints
    const endX = pivotX + Math.sin(angle) * rodLength;
    const endY = pivotY + Math.cos(angle) * rodLength;
    
    // Calculate pivot position on rod
    const pivotOffsetX = Math.sin(angle) * rodLength * pivotPosition;
    const pivotOffsetY = Math.cos(angle) * rodLength * pivotPosition;
    const rodStartX = pivotX - pivotOffsetX;
    const rodStartY = pivotY - pivotOffsetY;
    
    // Draw support
    ctx.beginPath();
    ctx.moveTo(pivotX - 50 * dpr, pivotY - 50 * dpr);
    ctx.lineTo(pivotX + 50 * dpr, pivotY - 50 * dpr);
    ctx.lineTo(pivotX, pivotY);
    ctx.closePath();
    ctx.fillStyle = '#888';
    ctx.fill();
    
    // Draw rod
    ctx.beginPath();
    ctx.moveTo(rodStartX, rodStartY);
    ctx.lineTo(rodStartX + Math.sin(angle) * rodLength, rodStartY + Math.cos(angle) * rodLength);
    ctx.lineWidth = 6 * dpr;
    ctx.strokeStyle = '#1976d2';
    ctx.stroke();
    
    // Draw pivot point
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 8 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = '#ff9800';
    ctx.fill();
    ctx.lineWidth = 2 * dpr;
    ctx.strokeStyle = '#e65100';
    ctx.stroke();
    
    // Draw angle indicator
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 30 * dpr, 0, -angle, true);
    ctx.lineWidth = 2 * dpr;
    ctx.strokeStyle = '#4caf50';
    ctx.stroke();
    
    // Draw angle text
    ctx.font = `${14 * dpr}px Arial`;
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText(`Angle: ${(angle * 180 / Math.PI).toFixed(1)}¡ã`, 20 * dpr, 30 * dpr);
    ctx.fillText(`Time: ${time.toFixed(2)}s`, 20 * dpr, 50 * dpr);
    
    // Draw parameter info
    ctx.textAlign = 'right';
    ctx.fillText(`Length: ${length.toFixed(1)}m`, width - 20 * dpr, 30 * dpr);
    ctx.fillText(`Pivot: ${pivotPosition.toFixed(2)}`, width - 20 * dpr, 50 * dpr);
    ctx.fillText(`Mass: ${mass.toFixed(1)}kg`, width - 20 * dpr, 70 * dpr);
    ctx.fillText(`Damping: ${damping.toFixed(3)}`, width - 20 * dpr, 90 * dpr);
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: '800px',
        minWidth: '400px',
        height: '400px',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: styleWidth + 'px',
          height: styleHeight + 'px',
          display: 'block',
          background: 'transparent',
          border: 'none',
          borderRadius: '16px',
        }}
      />
    </div>
  );
});

export default PendulumScene;