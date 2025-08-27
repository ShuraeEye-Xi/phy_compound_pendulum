import React, { useMemo } from 'react';

const DataAnalysis = ({ params, data }) => {
  const { length, pivotPosition, mass, gravity, damping } = params;
  
  // ??????
  React.useEffect(() => {
    console.log("DataAnalysis??????:", {
      dataExists: !!data,
      dataLength: data?.length || 0,
      sampleData: data && data.length > 0 ? data[0] : null
    });
  }, [data]);
  
  const analysis = useMemo(() => {
    // Default values if no data
    const defaultAnalysis = {
      experimentalPeriod: 0,
      maxAngle: 0,
      maxVelocity: 0,
      dampingRatio: 0,
      kineticEnergy: 0,
      potentialEnergy: 0,
      totalEnergy: 0
    };
    
    // Check if we have enough data points
    if (!data || data.length < 5) {
      console.log("数据不足，数据点数:", data?.length || 0);
      return defaultAnalysis;
    }
    
    console.log("开始分析，数据点数", data.length, "个");
    
    try {
      // Calculate distance from pivot to center of mass
      const d = Math.abs(pivotPosition - 0.5) * length;
      
      // Calculate moment of inertia I = m * (L^2/12 + d^2)
      const I = mass * (Math.pow(length, 2) / 12 + Math.pow(d, 2));
      
      // Calculate damped period
      const naturalFrequency = Math.sqrt(mass * gravity * d / I);
      const zeta = damping / (2 * Math.sqrt(mass * gravity * d * I));
      const dampedFrequency = naturalFrequency * Math.sqrt(1 - zeta * zeta);
      const experimentalPeriod = 2 * Math.PI / dampedFrequency;
      
      // Validate data format
      // Data format: [time, theta, phi, theta_velocity, phi_velocity]
      console.log("数据格式检查:", {
        firstDataPoint: data[0],
        isArray: Array.isArray(data[0]),
        length: data[0]?.length
      });
      
      // Filter valid data
      const validData = data.filter(d => Array.isArray(d) && d.length >= 5);
      if (validData.length < 5) {
        console.error("有效数据点不足");
        return defaultAnalysis;
      }
      
      // Extract data from 3D pendulum format [time, theta, phi, theta_velocity, phi_velocity]
      const timeData = validData.map(d => d[0]);
      const thetaData = validData.map(d => d[1]); // Use theta (polar angle) as the main angle
      const phiData = validData.map(d => d[2]);   // Azimuthal angle
      const thetaVelocityData = validData.map(d => d[3]);
      const phiVelocityData = validData.map(d => d[4]);
      
      // Calculate maximum angles and velocities
      const maxTheta = Math.max(...thetaData.map(a => Math.abs(a)));
      const maxPhi = Math.max(...phiData.map(a => Math.abs(a)));
      const maxThetaVelocity = Math.max(...thetaVelocityData.map(v => Math.abs(v)));
      const maxPhiVelocity = Math.max(...phiVelocityData.map(v => Math.abs(v)));
      
      // Use the maximum of theta and phi for display
      const maxAngle = Math.max(maxTheta, maxPhi);
      const maxVelocity = Math.max(maxThetaVelocity, maxPhiVelocity);
      
      // Calculate damping ratio
      let dampingRatio = 0;
      if (data.length > 10) {
        // Find consecutive amplitude peaks for theta (polar angle)
        const peaks = [];
        for (let i = 1; i < thetaData.length - 1; i++) {
          if ((thetaData[i] > thetaData[i-1] && thetaData[i] > thetaData[i+1]) ||
              (thetaData[i] < thetaData[i-1] && thetaData[i] < thetaData[i+1])) {
            peaks.push({ time: timeData[i], angle: Math.abs(thetaData[i]) });
          }
        }
        
        // Calculate logarithmic decrement
        if (peaks.length >= 2) {
          const lnRatios = [];
          for (let i = 1; i < peaks.length; i++) {
            if (peaks[i].angle > 0 && peaks[i-1].angle > 0) {
              lnRatios.push(Math.log(peaks[i-1].angle / peaks[i].angle));
            }
          }
          
          if (lnRatios.length > 0) {
            const avgLnRatio = lnRatios.reduce((sum, r) => sum + r, 0) / lnRatios.length;
            dampingRatio = avgLnRatio / (2 * Math.PI);
          }
        }
        
        // If we couldn't calculate from peaks, use the damping parameter directly
        if (dampingRatio === 0) {
          dampingRatio = damping / (2 * Math.sqrt(mass * gravity * d * I));
        }
      }
      
      // Calculate current energy
      let kineticEnergy = 0;
      let potentialEnergy = 0;
      let totalEnergy = 0;
      
      if (data.length > 0) {
        const lastData = data[data.length - 1];
        const theta = lastData[1];  // Polar angle
        const phi = lastData[2];    // Azimuthal angle
        const thetaVelocity = lastData[3];
        const phiVelocity = lastData[4];
        
        // For 3D pendulum, kinetic energy includes both theta and phi components
        // K = 0.5 * I * (θ̇² + sin²(θ) * φ̇²)
        const sinTheta = Math.sin(theta);
        kineticEnergy = 0.5 * I * (Math.pow(thetaVelocity, 2) + 
                                  Math.pow(sinTheta * phiVelocity, 2));
        
        // Potential energy U = m * g * h = m * g * d * (1 - cos(θ))
        potentialEnergy = mass * gravity * d * (1 - Math.cos(theta));
        
        // Total energy
        totalEnergy = kineticEnergy + potentialEnergy;
      }
      
      return {
        experimentalPeriod: experimentalPeriod,
        maxAngle: maxAngle,
        maxVelocity: maxVelocity,
        dampingRatio: dampingRatio,
        kineticEnergy: kineticEnergy,
        potentialEnergy: potentialEnergy,
        totalEnergy: totalEnergy
      };
    } catch (error) {
      console.error("Error in data analysis:", error);
      return defaultAnalysis;
    }
  }, [data, length, pivotPosition, mass, gravity, damping]);
  
  return (
    <div>
      <h3 style={{ marginBottom: 16, fontSize: 18 }}>数据分析</h3>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 500 }}>实验周期：</span>
          <span>{analysis.experimentalPeriod.toFixed(3)} s</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 500 }}>最大角度：</span>
          <span>{(analysis.maxAngle * 180 / Math.PI).toFixed(2)}°</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 500 }}>最大角速度：</span>
          <span>{analysis.maxVelocity.toFixed(3)} rad/s</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 500 }}>阻尼比：</span>
          <span>{analysis.dampingRatio.toFixed(4)}</span>
        </div>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 16, marginBottom: 8 }}>能量分析</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 500 }}>动能：</span>
          <span>{analysis.kineticEnergy.toFixed(3)} J</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 500 }}>势能：</span>
          <span>{analysis.potentialEnergy.toFixed(3)} J</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 500 }}>总能量：</span>
          <span>{analysis.totalEnergy.toFixed(3)} J</span>
        </div>
      </div>
      
      <div style={{ fontSize: 14, color: '#666', marginTop: 16 }}>
        <div style={{
          background: '#f8f8f8',
          borderRadius: 8,
          padding: '12px 18px',
          marginTop: 8,
          fontFamily: 'serif',
          fontSize: 16,
          lineHeight: 1.8,
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)'
        }}>
          <div style={{ marginBottom: 6 }}>
            <b>阻尼复摆周期公式：</b>
            <div style={{ fontSize: 18, margin: '8px 0', textAlign: 'center', fontFamily: 'Cambria,Times New Roman,serif' }}>
              T = <div style={{ display: 'inline-block', textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{ fontSize: 20 }}>2π</div>
                <div style={{ borderTop: '1px solid #333', margin: '2px 0' }}></div>
                <div style={{ fontSize: 16 }}>ω₀√(1 - ζ²)</div>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontWeight: 500 }}>ω₀ = </span>
            <div style={{ display: 'inline-block', textAlign: 'center', verticalAlign: 'middle' }}>
              <div style={{ fontSize: 16 }}>√(mgd)</div>
              <div style={{ borderTop: '1px solid #333', margin: '1px 0' }}></div>
              <div style={{ fontSize: 16 }}>√I</div>
            </div>
            &nbsp;（固有频率）
          </div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontWeight: 500 }}>ζ = </span>
            <div style={{ display: 'inline-block', textAlign: 'center', verticalAlign: 'middle' }}>
              <div style={{ fontSize: 16 }}>b</div>
              <div style={{ borderTop: '1px solid #333', margin: '1px 0' }}></div>
              <div style={{ fontSize: 16 }}>2√(mgdI)</div>
            </div>
            &nbsp;（阻尼比）
          </div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontWeight: 500 }}>I = m(</span>
            <div style={{ display: 'inline-block', textAlign: 'center', verticalAlign: 'middle' }}>
              <div style={{ fontSize: 16 }}>L²</div>
              <div style={{ borderTop: '1px solid #333', margin: '1px 0' }}></div>
              <div style={{ fontSize: 16 }}>12</div>
            </div>
            <span style={{ fontWeight: 500 }}> + d²)</span> &nbsp;（转动惯量）
          </div>
          <div>
            <span style={{ fontWeight: 500 }}>d</span> 为支点到质心的距离
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAnalysis;