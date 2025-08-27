import React, { useEffect, useRef } from 'react';

const DataChart = ({ data }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    // Set chart margins
    const margin = { top: 35, right: 70, bottom: 40, left: 70 };
    const chartWidth = displayWidth - margin.left - margin.right;
    const chartHeight = displayHeight - margin.top - margin.bottom;
    
    // Extract data from 3D pendulum format [time, theta, phi, theta_velocity, phi_velocity]
    const timeData = data.map(d => d[0]);
    const thetaData = data.map(d => d[1]); // Polar angle (theta)
    const phiData = data.map(d => d[2]);   // Azimuthal angle (phi)
    const thetaVelocityData = data.map(d => d[3]);
    const phiVelocityData = data.map(d => d[4]);
    
    const maxTime = Math.max(...timeData);
    const minTime = Math.min(...timeData);
    const maxAngle = Math.max(...thetaData.map(a => Math.abs(a)));
    const maxVelocity = Math.max(...thetaVelocityData.map(v => Math.abs(v)));
    
    // Set scales
    const xScale = chartWidth / (maxTime - minTime || 1);
    const yScaleAngle = chartHeight / 2 / (maxAngle || 1);
    const yScaleVelocity = chartHeight / 2 / (maxVelocity || 1);
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    
    // X axis
    ctx.moveTo(margin.left, margin.top + chartHeight / 2);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight / 2);
    ctx.stroke();
    
    // Y axis
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();
    
    // X axis ticks
    const timeStep = Math.max(1, Math.ceil(maxTime / 5));
    for (let t = 0; t <= maxTime; t += timeStep) {
      const x = margin.left + t * xScale;
      ctx.moveTo(x, margin.top + chartHeight / 2 - 5);
      ctx.lineTo(x, margin.top + chartHeight / 2 + 5);
      ctx.stroke();
      
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText(t.toFixed(1) + 's', x, margin.top + chartHeight + 15);
    }
    
    // Y axis ticks - angle
    const angleStep = Math.max(0.5, Math.ceil(maxAngle / 3));
    for (let a = -maxAngle; a <= maxAngle; a += angleStep) {
      const y = margin.top + chartHeight / 2 - a * yScaleAngle;
      ctx.moveTo(margin.left - 5, y);
      ctx.lineTo(margin.left + 5, y);
      ctx.stroke();
      
      ctx.fillStyle = '#1976d2';
      ctx.textAlign = 'right';
      ctx.fillText((a * 180 / Math.PI).toFixed(0) + '°', margin.left - 10, y + 4);
    }
    
    // Y axis ticks - angular velocity
    const velocityStep = Math.max(0.5, Math.ceil(maxVelocity / 3));
    for (let v = -maxVelocity; v <= maxVelocity; v += velocityStep) {
      const y = margin.top + chartHeight / 2 - v * yScaleVelocity;
      ctx.moveTo(margin.left + chartWidth - 8, y);
      ctx.lineTo(margin.left + chartWidth + 8, y);
      ctx.stroke();
      
      ctx.fillStyle = '#e91e63';
      ctx.textAlign = 'left';
      ctx.fillText(v.toFixed(1) + ' rad/s', margin.left + chartWidth + 15, y + 4);
    }
    
    // Draw legend
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(margin.left + 10, margin.top + 10, 15, 10);
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText('极角 θ (rad)', margin.left + 30, margin.top + 18);
    
    ctx.fillStyle = '#e91e63';
    ctx.fillRect(margin.left + 120, margin.top + 10, 15, 10);
    ctx.fillStyle = '#333';
    ctx.fillText('角速度 ω (rad/s)', margin.left + 140, margin.top + 18);
    
    // Draw theta angle curve
    ctx.beginPath();
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2;
    for (let i = 0; i < data.length; i++) {
      const t = data[i][0];
      const theta = data[i][1]; // Polar angle (theta)
      const x = margin.left + (t - minTime) * xScale;
      const y = margin.top + chartHeight / 2 - theta * yScaleAngle;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Draw theta angular velocity curve
    ctx.beginPath();
    ctx.strokeStyle = '#e91e63';
    ctx.lineWidth = 2;
    for (let i = 0; i < data.length; i++) {
      const t = data[i][0];
      const thetaVelocity = data[i][3]; // Theta velocity
      const x = margin.left + (t - minTime) * xScale;
      const y = margin.top + chartHeight / 2 - thetaVelocity * yScaleVelocity;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('复摆运动数据', displayWidth / 2, margin.top / 2);
    
    // Draw axis labels
    ctx.fillStyle = '#555';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('时间 (s)', displayWidth / 2, displayHeight - 5);
    
    ctx.save();
    ctx.translate(35, displayHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('角度 / 角速度', 0, 0);
    ctx.restore();
    
  }, [data]);
  
  return (
    <div>
      <h3 style={{ marginBottom: 16, fontSize: 18 }}>运动数据图表</h3>
      <div className="chart-container">
        <canvas 
          ref={canvasRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #f0f0f0'
          }}
        />
      </div>
    </div>
  );
};

export default DataChart;