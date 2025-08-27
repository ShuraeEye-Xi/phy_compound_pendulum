import React, { useState, useRef, useEffect } from 'react';
import { Button, message, Modal, Input, Select, Space } from 'antd';
// For Ant Design v5
// No need to import CSS separately as it uses CSS-in-JS
import './App.css';
import PendulumControlPanel from './components/PendulumControlPanel';
import PendulumScene3D from './components/PendulumScene3D';
import DataChart from './components/DataChart';
import DataAnalysis from './components/DataAnalysis';
import TaskPanel from './components/TaskPanel';

// Calculate theoretical period of compound pendulum
function calculateTheoryPeriod(params) {
  const { length, pivotPosition, mass, gravity } = params;
  
  // Calculate moment of inertia I = m * (L^2/12 + d^2)
  // L is rod length, d is distance from pivot to center of mass
  const d = Math.abs(pivotPosition - 0.5) * length;
  const I = mass * (Math.pow(length, 2) / 12 + Math.pow(d, 2));
  
  // Calculate gravitational torque = m * g * d
  const torque = mass * gravity * d;
  
  // Compound pendulum period formula T = 2 * sqrt(I / (m * g * d))
  const period = 2 * Math.PI * Math.sqrt(I / torque);
  
  return period;
}

// Calculate damped compound pendulum period
function calculateDampedPeriod(params) {
  const { length, pivotPosition, mass, gravity, damping } = params;
  
  // Calculate moment of inertia I = m * (L^2/12 + d^2)
  const d = Math.abs(pivotPosition - 0.5) * length;
  const I = mass * (Math.pow(length, 2) / 12 + Math.pow(d, 2));
  
  // Natural frequency ω₀ = √(mgd/I)
  const omega0 = Math.sqrt(mass * gravity * d / I);
  
  // Damping ratio ζ = b/(2√(m*g*d*I))
  const zeta = damping / (2 * Math.sqrt(mass * gravity * d * I));
  
  // Damped frequency ω = ω₀√(1 - ζ²)
  const omega = omega0 * Math.sqrt(1 - zeta * zeta);
  
  // Damped period T = 2π/ω
  const period = 2 * Math.PI / omega;
  
  return period;
}

// 计算实测周期（基于θ的零点穿越，适用于3D数据格式 [t, theta, phi, thetaDot, phiDot]）
function computeMeasuredPeriodFromData(data) {
  if (!data || data.length < 5) return 0;
  const timeData = data.map(d => d[0]);
  const thetaData = data.map(d => d[1]);
  const zeroCrossings = [];
  for (let i = 1; i < thetaData.length; i++) {
    const a1 = thetaData[i - 1];
    const a2 = thetaData[i];
    if (a1 === 0) continue;
    if (a1 * a2 <= 0) {
      const t1 = timeData[i - 1];
      const t2 = timeData[i];
      // 线性插值求零点时间
      const zeroTime = t1 - a1 * (t2 - t1) / (a2 - a1);
      zeroCrossings.push(zeroTime);
    }
  }
  if (zeroCrossings.length < 2) return 0;
  const periods = [];
  for (let i = 1; i < zeroCrossings.length; i++) {
    periods.push(2 * (zeroCrossings[i] - zeroCrossings[i - 1]));
  }
  if (periods.length === 0) return 0;
  const avg = periods.reduce((s, v) => s + v, 0) / periods.length;
  return avg;
}

function App() {
  // Compound pendulum parameter states
  const [params, setParams] = useState({
    length: 1.0,        // Rod length (m)
    pivotPosition: 0.3, // Pivot position (0-1, ratio from top of rod)
    mass: 1.0,          // Mass (kg)
    gravity: 9.8,       // Gravitational acceleration (m/s^2)
    damping: 0.02,      // Damping coefficient
    initialAngle: 10,   // Initial angle (degrees)
    azimuthAngle: 10,   // Initial azimuth angle (degrees)
  });
  
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const sceneRef = useRef();
  const [pendulumData, setPendulumData] = useState([]);
  const [history, setHistory] = useState([]); // Experiment history
  const [warned, setWarned] = useState(false); // Whether warning has been shown
  const tableBodyRef = useRef(null);
  const [taskIndex, setTaskIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, rowIdx: null });
  // Feedback area states
  const [feedbacks, setFeedbacks] = useState(["", "", "", ""]);
  
  // Data filtering states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    'length', 'pivotPosition', 'mass', 'damping', 'experimentalPeriod', 'maxAngle'
  ]);
  const [allExperimentData, setAllExperimentData] = useState([]); // 储存所有实验的完整数据
  const [hasRecorded, setHasRecorded] = useState(false); // 防止重复记录

  const handleReset = () => {
    console.log("重置实验");
    setRunning(false);
    setPaused(false);
    setHasRecorded(false); // 重置记录标志
    // 延迟清空数据，确保数据记录逻辑能够执行
    setTimeout(() => {
      setPendulumData([]);
      setResetKey(k => k + 1);
    }, 100);
  };

  // Get data periodically when parameters or animation state changes
  React.useEffect(() => {
    if (!sceneRef.current) return;
    let raf;
    function update() {
      if (sceneRef.current && sceneRef.current.getPendulumData) {
        const data = sceneRef.current.getPendulumData();
        if (data && data.length > 0) {
          // ??????
          if (data.length % 50 === 0) {
            console.log("??????:", data.length, "????:", data[0]);
          }
          setPendulumData([...data]); // ????????????
        }
      }
      raf = requestAnimationFrame(update);
    }
    update();
    return () => raf && cancelAnimationFrame(raf);
  }, [params, running, paused, resetKey]);

  // Record experiment data: when running changes from true to false and pendulumData has data, record once
  useEffect(() => {
    console.log("数据记录检查:", { running, pendulumDataLength: pendulumData.length, historyLength: history.length, hasRecorded });
    
    if (!running && pendulumData.length > 0 && !hasRecorded) {
      console.log("开始记录实验数据...");
      setHasRecorded(true); // 设置记录标志，防止重复记录
      
      // Calculate damped period
      const experimentalPeriod = calculateDampedPeriod(params);
      
      // Calculate additional analysis data
      const maxAngle = Math.max(...pendulumData.map(d => Math.abs(d[1]))) * 180 / Math.PI;
      const maxVelocity = Math.max(...pendulumData.map(d => Math.abs(d[3])));
      
      // Calculate damping ratio
      let dampingRatio = 0;
      if (pendulumData.length > 10) {
        const thetaData = pendulumData.map(d => d[1]);
        const peaks = [];
        for (let i = 1; i < thetaData.length - 1; i++) {
          if ((thetaData[i] > thetaData[i-1] && thetaData[i] > thetaData[i+1]) ||
              (thetaData[i] < thetaData[i-1] && thetaData[i] < thetaData[i+1])) {
            peaks.push({ time: pendulumData[i][0], angle: Math.abs(thetaData[i]) });
          }
        }
        
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
      }
      
      // Calculate energy data
      let kineticEnergy = 0;
      let potentialEnergy = 0;
      let totalEnergy = 0;
      
      if (pendulumData.length > 0) {
        const lastData = pendulumData[pendulumData.length - 1];
        const theta = lastData[1];
        const thetaVelocity = lastData[3];
        
        // Calculate moment of inertia
        const d = Math.abs(params.pivotPosition - 0.5) * params.length;
        const I = params.mass * (Math.pow(params.length, 2) / 12 + Math.pow(d, 2));
        
        // Kinetic energy K = 0.5 * I * θ̇²
        kineticEnergy = 0.5 * I * Math.pow(thetaVelocity, 2);
        
        // Potential energy U = m * g * d * (1 - cos(θ))
        potentialEnergy = params.mass * params.gravity * d * (1 - Math.cos(theta));
        
        // Total energy
        totalEnergy = kineticEnergy + potentialEnergy;
      }
      
      // Record parameters and analysis data
      const newItem = {
        length: params.length,
        pivotPosition: params.pivotPosition,
        mass: params.mass,
        gravity: params.gravity,
        damping: params.damping,
        initialAngle: params.initialAngle,
        azimuthAngle: params.azimuthAngle,
        experimentalPeriod: experimentalPeriod,
        maxAngle: maxAngle,
        maxVelocity: maxVelocity,
        dampingRatio: dampingRatio,
        kineticEnergy: kineticEnergy,
        potentialEnergy: potentialEnergy,
        totalEnergy: totalEnergy
      };
      
      console.log("新实验数据:", newItem);
      
      let arr = [...history, newItem];
      if (arr.length > 20) arr = arr.slice(arr.length - 20);
      
      // 同时更新完整数据储存
      let allData = [...allExperimentData, newItem];
      if (allData.length > 100) allData = allData.slice(allData.length - 100); // 限制总数据量
      setAllExperimentData(allData);
      
      if (!checkSingleVar(arr, taskIndex)) {
        Modal.warning({
          title: '请遵循单变量原则',
          content: '请确保每次实验只改变当前任务要求的参数。',
        });
      }
      
      setHistory(arr);
      console.log("实验数据已记录，当前历史记录数:", arr.length);
    } else if (!running && pendulumData.length === 0) {
      console.log("实验停止但没有数据，跳过记录");
    }
  }, [running, hasRecorded]);

  // Auto scroll table to bottom
  useEffect(() => {
    if (tableBodyRef.current) {
      tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
    }
  }, [history]);

  // Intercept "Start Experiment" button, show popup when reaching 20 entries
  const handleStart = () => {
    console.log("Start button clicked");
    setHasRecorded(false); // 重置记录标志，准备记录新实验
    
    if (history.length >= 20 && !warned) {
      Modal.info({
        title: '提示',
        content: '你已进行了20次实验，表格将只记录最近20次实验，请合理设计实验。',
        onOk: () => {
          setWarned(true);
          console.log("Setting running to true (after warning)");
          setRunning(true); // Continue experiment after popup
        },
        className: 'custom-centered-modal',
      });
      return;
    }
    console.log("Setting running to true");
    setRunning(true);
  };

  const clearHistory = () => setHistory([]);

  // Single variable principle validation
  const checkSingleVar = (history, taskIndex) => {
    if (!history || history.length < 2) return true;
    // Free exploration task doesn't check single variable principle
    if (taskIndex === 3) return true;
    
    const keys = ['length', 'pivotPosition', 'mass', 'damping'];
    const key = keys[taskIndex];
    const otherKeys = keys.filter(k => k !== key);
    
    // If any non-current task parameter values are inconsistent across different experiments, it violates the rule
    for (let k of otherKeys) {
      const base = history[0][k];
      for (let i = 1; i < history.length; i++) {
        if (history[i][k] !== base) {
          return false;
        }
      }
    }
    return true;
  };

  // Delete specified row
  const handleDeleteRow = (idx) => {
    setHistory(prev => prev.filter((_, i) => i !== idx));
    setContextMenu({ visible: false, x: 0, y: 0, rowIdx: null });
  };

  // Close right-click menu
  const handleCloseMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, rowIdx: null });
  };

  const handleFeedbackChange = (idx, val) => {
    setFeedbacks(fbs => {
      const arr = [...fbs];
      arr[idx] = val;
      return arr;
    });
  };

  const handleFeedbackSubmit = () => {
    // Check if all feedback has been filled
    if (feedbacks.some(fb => !fb.trim())) {
      message.warning('请填写所有任务思考后再提交');
      return;
    }
    message.success('所有思考已提交！');
  };

  const handleFilterData = () => {
    setFilterModalVisible(true);
  };

  const handleFilterConfirm = () => {
    if (selectedColumns.length !== 6) {
      message.warning('请选择恰好6列数据（4个初始参数 + 2个实验结果）');
      return;
    }
    setFilterModalVisible(false);
    message.success('数据筛选已更新！');
  };

  const handleFilterCancel = () => {
    setFilterModalVisible(false);
  };

  // 验证列数
  const validateColumnCount = () => {
    const paramCount = selectedColumns.filter(col => 
      ['length', 'pivotPosition', 'mass', 'gravity', 'damping', 'initialAngle', 'azimuthAngle'].includes(col)
    ).length;
    const resultCount = selectedColumns.length - paramCount;
    return { paramCount, resultCount, total: selectedColumns.length };
  };

  const columnCount = validateColumnCount();

  // 获取列标题
  const getColumnTitle = (key) => {
    const titles = {
      length: '长度 (m)',
      pivotPosition: '支点位置',
      mass: '质量 (kg)',
      gravity: '重力加速度 (m/s²)',
      damping: '阻尼系数 (N·m·s/rad)',
      initialAngle: '初始角度 (°)',
      azimuthAngle: '方位角 (°)',
      experimentalPeriod: '实验周期 (s)',
      maxAngle: '最大角度 (°)',
      maxVelocity: '最大角速度 (rad/s)',
      dampingRatio: '阻尼比',
      kineticEnergy: '动能 (J)',
      potentialEnergy: '势能 (J)',
      totalEnergy: '总能量 (J)'
    };
    return titles[key] || key;
  };

  // 获取列数据
  const getColumnData = (item, key) => {
    if (key === 'pivotPosition') {
      return item[key].toFixed(2);
    } else if (['length', 'mass', 'damping'].includes(key)) {
      return item[key].toFixed(2);
    } else if (['experimentalPeriod'].includes(key)) {
      return item[key].toFixed(3);
    } else if (['maxAngle', 'maxVelocity', 'dampingRatio', 'kineticEnergy', 'potentialEnergy', 'totalEnergy'].includes(key)) {
      return item[key].toFixed(3);
    } else {
      return item[key].toFixed(2);
    }
  };

  return (
    <div className="main-layout">
      <div className="experiment-section">
        <div className="pendulum-scene">
          <PendulumScene3D
            ref={sceneRef}
            params={params}
            running={running}
            paused={paused}
            resetKey={resetKey}
          />
        </div>
        <div className="control-section">
          <div className="card-effect">
            <PendulumControlPanel
              params={params}
              setParams={setParams}
              running={running}
              setRunning={setRunning}
              paused={paused}
              setPaused={setPaused}
              onReset={handleReset}
              onStart={handleStart}
            />
          </div>
        </div>
        <div className="data-section">
          <div className="card-effect" style={{ flex: 1 }}>
            <DataChart data={pendulumData} />
          </div>
          <div className="card-effect" style={{ flex: 1 }}>
            <DataAnalysis 
              params={params} 
              data={pendulumData.length > 0 ? pendulumData : [
                [0, Math.PI * params.initialAngle / 180, 0, 0, 0]
              ]} 
            />
          </div>
        </div>
      </div>
      <div className="vertical-divider"></div>
      <div className="side-section">
        {/* Task panel */}
        <div className="task-panel">
          <TaskPanel
            taskIndex={taskIndex}
            setTaskIndex={setTaskIndex}
            history={history}
            clearHistory={clearHistory}
          />
          {/* Experiment data table */}
          <div className="card-effect" style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <b style={{ fontSize: 16 }}>实验数据表</b>
              <Button 
                type="primary" 
                size="small"
                onClick={handleFilterData}
                style={{ fontSize: 12 }}
              >
                筛选数据
              </Button>
            </div>
            <div className="table-scroll-container" ref={tableBodyRef} onClick={handleCloseMenu} style={{ position: 'relative' }}>
              <table>
                <thead>
                  <tr>
                    <th>序号</th>
                    {selectedColumns.map(key => (
                      <th key={key}>{getColumnTitle(key)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, idx) => (
                    <tr key={idx} onContextMenu={e => {
                      e.preventDefault();
                      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, rowIdx: idx });
                    }}>
                      <td>{idx + 1}</td>
                      {selectedColumns.map(key => (
                        <td key={key}>{getColumnData(item, key)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Right-click menu */}
              {contextMenu.visible && (
                <div
                  style={{
                    position: 'fixed',
                    top: contextMenu.y,
                    left: contextMenu.x,
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 8,
                    boxShadow: '0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12)',
                    zIndex: 1000,
                    minWidth: 120,
                    padding: '4px 0',
                    animation: 'fadeIn 0.1s ease-out',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      color: '#ff4d4f',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.3s',
                      margin: '2px 4px',
                      borderRadius: 4,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,79,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => handleDeleteRow(contextMenu.rowIdx)}
                  >
                    <svg viewBox="64 64 896 896" focusable="false" data-icon="delete" width="14" height="14" fill="currentColor" aria-hidden="true">
                      <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path>
                    </svg>
                    删除该条数据
                  </div>
                </div>
              )}
            </div>
            <button onClick={clearHistory} className="main-btn" style={{ marginTop: 16, width: '100%', padding: '8px 0', borderRadius: 6, fontSize: 15, cursor: 'pointer' }}>重置表格</button>
            <div style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 6 }}>
              右键点击可删除实验数据
            </div>
          </div>

          {/* Data Filter Modal */}
          <Modal
            title="数据筛选设置"
            open={filterModalVisible}
            onOk={handleFilterConfirm}
            onCancel={handleFilterCancel}
            width={600}
            okText="确认"
            cancelText="取消"
          >
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: '#666', marginBottom: 16 }}>
                请选择要在实验数据表中显示的6列数据（建议选择4个初始参数和2个实验结果）：
              </p>
              
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 8 }}>初始参数（选择4个）：</h4>
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="选择初始参数"
                  value={selectedColumns.filter(col => ['length', 'pivotPosition', 'mass', 'gravity', 'damping', 'initialAngle', 'azimuthAngle'].includes(col))}
                  onChange={(values) => {
                    const resultColumns = selectedColumns.filter(col => !['length', 'pivotPosition', 'mass', 'gravity', 'damping', 'initialAngle', 'azimuthAngle'].includes(col));
                    const newColumns = [...values, ...resultColumns];
                    if (newColumns.length <= 6) {
                      setSelectedColumns(newColumns);
                    }
                  }}
                  options={[
                    { label: '长度 (m)', value: 'length' },
                    { label: '支点位置', value: 'pivotPosition' },
                    { label: '质量 (kg)', value: 'mass' },
                    { label: '重力加速度 (m/s²)', value: 'gravity' },
                    { label: '阻尼系数 (N·m·s/rad)', value: 'damping' },
                    { label: '初始角度 (°)', value: 'initialAngle' },
                    { label: '方位角 (°)', value: 'azimuthAngle' },
                  ]}
                  maxTagCount={4}
                />
              </div>
              
              <div>
                <h4 style={{ marginBottom: 8 }}>实验结果（选择2个）：</h4>
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="选择实验结果"
                  value={selectedColumns.filter(col => !['length', 'pivotPosition', 'mass', 'gravity', 'damping', 'initialAngle', 'azimuthAngle'].includes(col))}
                  onChange={(values) => {
                    const paramColumns = selectedColumns.filter(col => ['length', 'pivotPosition', 'mass', 'gravity', 'damping', 'initialAngle', 'azimuthAngle'].includes(col));
                    const newColumns = [...paramColumns, ...values];
                    if (newColumns.length <= 6) {
                      setSelectedColumns(newColumns);
                    }
                  }}
                  options={[
                    { label: '实验周期 (s)', value: 'experimentalPeriod' },
                    { label: '最大角度 (°)', value: 'maxAngle' },
                    { label: '最大角速度 (rad/s)', value: 'maxVelocity' },
                    { label: '阻尼比', value: 'dampingRatio' },
                    { label: '动能 (J)', value: 'kineticEnergy' },
                    { label: '势能 (J)', value: 'potentialEnergy' },
                    { label: '总能量 (J)', value: 'totalEnergy' },
                  ]}
                  maxTagCount={2}
                />
              </div>
              
              <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>当前选择：</span>
                  <span style={{ 
                    fontSize: 14, 
                    color: columnCount.total === 6 ? '#52c41a' : columnCount.total > 6 ? '#ff4d4f' : '#faad14',
                    fontWeight: 500 
                  }}>
                    {columnCount.paramCount} 个参数 + {columnCount.resultCount} 个结果 = {columnCount.total} 列
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                  <strong>提示：</strong>系统会自动保存所有实验的完整数据。当您更改筛选条件时，表格会立即显示对应的数据列。
                  {columnCount.total !== 6 && (
                    <span style={{ color: '#ff4d4f' }}> 请选择恰好6列数据。</span>
                  )}
                </p>
              </div>
            </div>
          </Modal>

          {/* Experiment feedback area card */}
          <div className="card-effect" style={{ padding: '10px 24px 24px 24px', marginTop: 16 }}>
            {['探索长度与周期的关系', '探索支点位置与周期的关系', '探索质量与周期的关系', '自由探索各参数对复摆运动的影响'].map((title, idx) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>{`任务${idx + 1}思考`}</div>
                <Input.TextArea
                  value={feedbacks[idx]}
                  onChange={e => handleFeedbackChange(idx, e.target.value)}
                  rows={2}
                  placeholder={`请写下你对[${title}]的思考与发现。格式：我做了X组实验，改变了XX变量，得出XXX结论`}
                  style={{ marginBottom: 4, resize: 'none', minHeight: 48, maxHeight: 48 }}
                />
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button 
                className="main-btn" 
                style={{ 
                  fontSize: 14, 
                  padding: '6px 24px', 
                  borderRadius: 6,
                  background: '#4f8cff',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }} 
                onClick={handleFeedbackSubmit}
              >
                提交全部思考
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;