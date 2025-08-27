import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Convert degrees to radians
function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

// Main component using plain Three.js for 3D compound pendulum
const PendulumScene3D = forwardRef(function PendulumScene3D({ params, running, paused, resetKey }, ref) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const pendulumRef = useRef(null);
  const frameIdRef = useRef(null);
  const dataRef = useRef([]);
  
  // Tiny asymmetry settings
  const ASYM_EPS = 0.02;           // anisotropy magnitude (2%)
  const INIT_PHI_DOT = 0.05;       // small initial azimuthal rate (rad/s) when azimuthAngle != 0
  const NOISE_AMPL = 1e-4;         // tinier noise amplitude
  const NOISE_DURATION = 0.2;      // seconds to apply noise
  const TILT_EPS = 0.006;          // small gravity tilt (radians), mimics real-world misalignment
  const OMEGA_MAX = 10.0;          // cap angular rates for stability (rad/s)

  // 3D angles: theta (polar angle from vertical), phi (azimuthal angle)
  const thetaRef = useRef(deg2rad(params.initialAngle)); // angle from vertical
  const phiRef = useRef(deg2rad(params.azimuthAngle)); // azimuthal angle
  const thetaVelocityRef = useRef(0);
  const phiVelocityRef = useRef(0);
  const timeRef = useRef(0);
  
  // Function to update pendulum rotation based on spherical coordinates
  const updatePendulumRotation = () => {
    if (!pendulumRef.current) return;
    
    // Convert spherical coordinates (theta, phi) to Euler angles
    // theta: angle from vertical (0 = hanging down)
    // phi: azimuthal angle around vertical axis
    
    // Reset rotation and apply new angles
    pendulumRef.current.rotation.set(0, 0, 0);
    pendulumRef.current.rotateY(phiRef.current);
    pendulumRef.current.rotateZ(thetaRef.current);
  };
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) {
      console.error("Container ref is null");
      return;
    }
    
    console.log("Initializing Three.js scene");
    
    // ?????????
    if (dataRef.current.length === 0) {
      dataRef.current.push([
        0, // time
        thetaRef.current, // theta
        phiRef.current, // phi
        0, // theta velocity
        0  // phi velocity
      ]);
      console.log("??????:", dataRef.current[0]);
    }
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(3, 2, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create orbit controls for camera interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // adds smooth inertia
    controls.dampingFactor = 0.05;
    controls.minDistance = 1; // minimum zoom distance
    controls.maxDistance = 10; // maximum zoom distance
    controls.enablePan = true; // allow panning
    controls.enableZoom = true; // allow zooming
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI; // Allow full rotation
    controls.target.set(0, 0, 0); // Look at the pendulum pivot
    controls.update();
    
    // Store controls reference
    controlsRef.current = controls;
    
    console.log("Three.js scene and controls initialized");
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Create fixed support structure (doesn't rotate)
    const supportGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.1);
    const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.set(0, 0.5, 0);
    support.castShadow = true;
    scene.add(support);
    
    // Create pivot point (doesn't rotate)
    const pivotGeometry = new THREE.SphereGeometry(0.05);
    const pivotMaterial = new THREE.MeshStandardMaterial({ color: 0xff9800 });
    const pivot = new THREE.Mesh(pivotGeometry, pivotMaterial);
    pivot.position.set(0, 0, 0);
    pivot.castShadow = true;
    scene.add(pivot);
    
    // Create pendulum group (this will rotate around the pivot)
    const pendulumGroup = new THREE.Group();
    scene.add(pendulumGroup);
    pendulumRef.current = pendulumGroup;
    
    // Create rod (positioned relative to pivot)
    const rodGeometry = new THREE.CylinderGeometry(0.015, 0.015, params.length);
    const rodMaterial = new THREE.MeshStandardMaterial({ color: 0x1976d2 });
    const rod = new THREE.Mesh(rodGeometry, rodMaterial);
    
    // Position rod so that the pivot point is at the correct position on the rod
    const pivotOffsetFromTop = params.pivotPosition * params.length;
    rod.position.set(0, -pivotOffsetFromTop + params.length/2, 0);
    rod.castShadow = true;
    pendulumGroup.add(rod);
    
    // Create center of mass indicator (small sphere at the geometric center)
    const centerGeometry = new THREE.SphereGeometry(0.02);
    const centerMaterial = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
    const centerMass = new THREE.Mesh(centerGeometry, centerMaterial);
    centerMass.position.set(0, -pivotOffsetFromTop + params.length/2, 0);
    centerMass.castShadow = true;
    pendulumGroup.add(centerMass);
    
    // Create mass indicators at both ends
    const topMassGeometry = new THREE.SphereGeometry(0.03);
    const topMassMaterial = new THREE.MeshStandardMaterial({ color: 0xe91e63 });
    const topMass = new THREE.Mesh(topMassGeometry, topMassMaterial);
    topMass.position.set(0, -pivotOffsetFromTop + params.length, 0);
    topMass.castShadow = true;
    pendulumGroup.add(topMass);
    
    const bottomMassGeometry = new THREE.SphereGeometry(0.03);
    const bottomMassMaterial = new THREE.MeshStandardMaterial({ color: 0xe91e63 });
    const bottomMass = new THREE.Mesh(bottomMassGeometry, bottomMassMaterial);
    bottomMass.position.set(0, -pivotOffsetFromTop, 0);
    bottomMass.castShadow = true;
    pendulumGroup.add(bottomMass);
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(6, 6);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Initial rotation
    updatePendulumRotation();
    
    // Animation loop for rendering
    const animate = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Update orbit controls
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      frameIdRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && rendererRef.current && cameraRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        // Update camera aspect ratio
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        // Update renderer size
        rendererRef.current.setSize(width, height);
      }
    };
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
      
      // Dispose controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);  

  // Handle parameter changes
  useEffect(() => {
    if (!pendulumRef.current) return;
    
    const pivotOffsetFromTop = params.pivotPosition * params.length;
    
    // Update rod (index 0)
    const rod = pendulumRef.current.children[0];
    if (rod) {
      rod.geometry.dispose();
      rod.geometry = new THREE.CylinderGeometry(0.015, 0.015, params.length);
      rod.position.y = -pivotOffsetFromTop + params.length/2;
    }
    
    // Update center of mass indicator (index 1)
    const centerMass = pendulumRef.current.children[1];
    if (centerMass) {
      centerMass.position.y = -pivotOffsetFromTop + params.length/2;
    }
    
    // Update top mass (index 2)
    const topMass = pendulumRef.current.children[2];
    if (topMass) {
      topMass.position.y = -pivotOffsetFromTop + params.length;
    }
    
    // Update bottom mass (index 3)
    const bottomMass = pendulumRef.current.children[3];
    if (bottomMass) {
      bottomMass.position.y = -pivotOffsetFromTop;
    }
    
  }, [params.length, params.pivotPosition, params.mass]);
  
  // Reset simulation
  useEffect(() => {
    console.log("Resetting simulation with initial angles:", params.initialAngle + "°", ", azimuth:", params.azimuthAngle + "°");
    thetaRef.current = deg2rad(params.initialAngle);
    phiRef.current = deg2rad(params.azimuthAngle);
    thetaVelocityRef.current = 0;
    // give a tiny initial azimuthal velocity if azimuth angle is non-zero to break perfect symmetry
    phiVelocityRef.current = params.azimuthAngle !== 0 ? INIT_PHI_DOT : 0;
    timeRef.current = 0;
    
    // Clear previous data
    dataRef.current = [];
    
    // Add initial data point
    dataRef.current.push([
      0, // time
      thetaRef.current, // theta
      phiRef.current, // phi
      0, // theta velocity
      0  // phi velocity
    ]);
    
    if (pendulumRef.current) {
      updatePendulumRotation();
      console.log("Reset pendulum rotation - theta:", thetaRef.current, "phi:", phiRef.current);
    }
  }, [resetKey, params.initialAngle, params.azimuthAngle]);
  
  // 3D Physics simulation
  useEffect(() => {
    console.log("Physics simulation effect triggered:", { running, paused });
    
    if (!running || paused) {
      return;
    }
    
    console.log("Starting 3D physics simulation");
    
    // Force initial angles
    thetaRef.current = deg2rad(params.initialAngle);
    phiRef.current = deg2rad(params.azimuthAngle);
    
    if (pendulumRef.current) {
      updatePendulumRotation();
      console.log("Initial angles set - theta:", params.initialAngle + "°", "phi:", params.azimuthAngle + "°");
    }
    
    let animationFrameId = null;
    let lastTime = performance.now();
    
    // Initialize with the first data point
    if (dataRef.current.length === 0) {
      dataRef.current.push([
        timeRef.current, 
        thetaRef.current, 
        phiRef.current, 
        thetaVelocityRef.current, 
        phiVelocityRef.current
      ]);
    }
    
    // Derivatives helper for RK4: given state, compute [thetaDot, phiDot, thetaDDot, phiDDot]
    const computeDerivatives = (state) => {
      const { length, pivotPosition, mass, gravity, damping } = params;
      const d = Math.abs(pivotPosition - 0.5) * length;
      const I_cm = mass * Math.pow(length, 2) / 12;
      const I = I_cm + mass * Math.pow(d, 2);
      const theta = state.theta;
      const phi = state.phi;
      const thetaDot = state.thetaDot;
      const phiDot = state.phiDot;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const sinThetaSafe = Math.sign(sinTheta) * Math.max(Math.abs(sinTheta), 1e-3);
      const thetaDDot = sinTheta * cosTheta * phiDot * phiDot 
                        - (mass * gravity * d / I) * sinTheta 
                        - (damping / I) * thetaDot;
      const phiDDot = -2 * (cosTheta / sinThetaSafe) * thetaDot * phiDot 
                      - (damping / I) * phiDot;
      return { thetaDot, phiDot, thetaDDot, phiDDot };
    };

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.008);
      lastTime = currentTime;
      
      // Extract parameters
      const { length, pivotPosition, mass, gravity, damping } = params;
      
      // Calculate distance from pivot to center of mass
      const d = Math.abs(pivotPosition - 0.5) * length;
      
      // Calculate moment of inertia
      const I_cm = mass * Math.pow(length, 2) / 12;
      const I = I_cm + mass * Math.pow(d, 2);
      
      // 3D Spherical pendulum equations of motion
      const theta = thetaRef.current;
      const phi = phiRef.current;
      const thetaDot = thetaVelocityRef.current;
      const phiDot = phiVelocityRef.current;
      
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      
      // Avoid division by zero when theta is very small
      const sinThetaSafe = Math.max(Math.abs(sinTheta), 0.01) * Math.sign(sinTheta);
      
      // Slight anisotropic damping
      const dampingTheta = Math.max(0, damping * (1 + ASYM_EPS));
      const dampingPhi = Math.max(0, damping * (1 - ASYM_EPS));

      // 3D equations of motion for spherical pendulum:
      // θ¨ = sin(θ)cos(θ)φ̇² - (g*d/I)sin(θ) - (damping/I)θ̇
      // φ¨ = -2(cos(θ)/sin(θ))θ̇φ̇ - (damping/I)φ̇
      
      let thetaAcceleration = sinTheta * cosTheta * phiDot * phiDot 
                               - (mass * gravity * d / I) * sinTheta 
                               - (dampingTheta / I) * thetaDot;
      
      let phiAcceleration = -2 * (cosTheta / sinThetaSafe) * thetaDot * phiDot 
                             - (dampingPhi / I) * phiDot;

      // Small constant gravity tilt about x-axis to mimic real misalignment.
      // This introduces a tiny, sustained drive in φ 和 θ，避免严格平面束缚。
      // 近似地：在φ方程加入 ~ (g*d/I)*α*sin(φ)*sin(θ)，在θ方程加入 ~ -(g*d/I)*α*cos(φ)*cos(θ)
      const gravCoeff = (mass * gravity * d) / I;
      const sTheta = Math.max(-1, Math.min(1, Math.sin(theta)));
      // keep tilt drive very small and proportional to sTheta to avoid singular behavior near theta~0
      thetaAcceleration += -gravCoeff * TILT_EPS * Math.cos(phi) * cosTheta * Math.abs(sTheta);
      phiAcceleration   +=  gravCoeff * TILT_EPS * Math.sin(phi) * sTheta * Math.abs(sTheta);

      // Tiny cross-coupling and startup noise to break perfect planarity
      if (timeRef.current < NOISE_DURATION) {
        thetaAcceleration += (Math.random() * 2 - 1) * NOISE_AMPL;
        phiAcceleration += (Math.random() * 2 - 1) * NOISE_AMPL;
      }
      // remove explicit cross-coupling gain to avoid runaway
      
      // Update velocities and angles
      thetaVelocityRef.current += thetaAcceleration * deltaTime;
      phiVelocityRef.current += phiAcceleration * deltaTime;
      // clamp angular rates to ensure stability under extreme conditions
      if (!Number.isFinite(thetaVelocityRef.current)) thetaVelocityRef.current = 0;
      if (!Number.isFinite(phiVelocityRef.current)) phiVelocityRef.current = 0;
      thetaVelocityRef.current = Math.max(-OMEGA_MAX, Math.min(OMEGA_MAX, thetaVelocityRef.current));
      phiVelocityRef.current = Math.max(-OMEGA_MAX, Math.min(OMEGA_MAX, phiVelocityRef.current));
      thetaRef.current += thetaVelocityRef.current * deltaTime;
      phiRef.current += phiVelocityRef.current * deltaTime;
      timeRef.current += deltaTime;
      
      // Update pendulum rotation
      if (pendulumRef.current) {
        updatePendulumRotation();
      }
      
      // Record data [time, theta, phi, theta_velocity, phi_velocity]
      // Only record every few frames to avoid excessive data
      if (dataRef.current.length === 0 || 
          timeRef.current - dataRef.current[dataRef.current.length - 1][0] > 0.05) {
        dataRef.current.push([
          timeRef.current, 
          thetaRef.current, 
          phiRef.current, 
          thetaVelocityRef.current, 
          phiVelocityRef.current
        ]);
      }
      
      // Debug output (every second)
      if (Math.floor(timeRef.current) !== Math.floor(timeRef.current - deltaTime)) {
        console.log("3D Physics:", {
          theta: (thetaRef.current * 180 / Math.PI).toFixed(1) + "�",
          phi: (phiRef.current * 180 / Math.PI).toFixed(1) + "�",
          thetaVel: thetaVelocityRef.current.toFixed(3),
          phiVel: phiVelocityRef.current.toFixed(3),
          dataPoints: dataRef.current.length
        });
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      console.log("Cleaning up 3D physics simulation");
      cancelAnimationFrame(animationFrameId);
    };
  }, [running, paused, params]);
  
  // Expose data to parent component
  useImperativeHandle(ref, () => ({
    getPendulumData: () => {
      // ??????
      if (dataRef.current.length > 0 && dataRef.current.length % 100 === 0) {
        console.log("PendulumScene3D????:", {
          dataLength: dataRef.current.length,
          firstPoint: dataRef.current[0],
          lastPoint: dataRef.current[dataRef.current.length - 1]
        });
      }
      return dataRef.current;
    }
  }), []);
  
  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '400px',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Overlay info */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(255,255,255,0.8)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        zIndex: 10,
        fontFamily: 'monospace',
      }}>
        <div>g = 9.8 m/s²</div>
        <div>θ (极角): {(thetaRef.current * 180 / Math.PI).toFixed(1)}°</div>
        <div>φ (方位角): {(phiRef.current * 180 / Math.PI).toFixed(1)}°</div>
        <div>时间: {timeRef.current.toFixed(2)} s</div>
        <div>状态: {running ? (paused ? "已暂停" : "运行中") : "已停止"}</div>
      </div>
      
      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        background: 'rgba(255,255,255,0.8)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        zIndex: 10,
        lineHeight: '1.5',
      }}>
        <div><b>相机控制说明：</b></div>
        <div>旋转：鼠标左键拖动</div>
        <div>缩放：滚轮</div>
        <div>平移：鼠标右键拖动</div>
      </div>
    </div>
  );
});

export default PendulumScene3D;