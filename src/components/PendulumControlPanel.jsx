import React from 'react';
import { Slider, InputNumber, Button } from 'antd';

const PendulumControlPanel = ({
  params,
  setParams,
  running,
  setRunning,
  paused,
  setPaused,
  onReset,
  onStart
}) => {
  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <h3 style={{ marginBottom: 16, fontSize: 18 }}>复摆参数</h3>

      <div className="slider-container">
        <div className="slider-label">杆长 L (m)：</div>
        <Slider
          min={0.2}
          max={2.0}
          step={0.1}
          value={params.length}
          onChange={value => handleParamChange('length', value)}
          style={{ flex: 1 }}
          disabled={running}
        />
        <div className="slider-value">
          <InputNumber
            min={0.2}
            max={2.0}
            step={0.1}
            value={params.length}
            onChange={value => handleParamChange('length', value)}
            style={{ width: 60 }}
            disabled={running}
          />
        </div>
      </div>

      <div className="slider-container">
        <div className="slider-label">支点位置：</div>
        <Slider
          min={0.1}
          max={0.9}
          step={0.05}
          value={params.pivotPosition}
          onChange={value => handleParamChange('pivotPosition', value)}
          style={{ flex: 1 }}
          disabled={running}
          marks={{
            0.1: '顶部',
            0.5: '中部',
            0.9: '底部'
          }}
        />
        <div className="slider-value">
          <InputNumber
            min={0.1}
            max={0.9}
            step={0.05}
            value={params.pivotPosition}
            onChange={value => handleParamChange('pivotPosition', value)}
            style={{ width: 60 }}
            disabled={running}
          />
        </div>
      </div>

      <div className="slider-container">
        <div className="slider-label">质量 m (kg)：</div>
        <Slider
          min={0.1}
          max={5.0}
          step={0.1}
          value={params.mass}
          onChange={value => handleParamChange('mass', value)}
          style={{ flex: 1 }}
          disabled={running}
        />
        <div className="slider-value">
          <InputNumber
            min={0.1}
            max={5.0}
            step={0.1}
            value={params.mass}
            onChange={value => handleParamChange('mass', value)}
            style={{ width: 60 }}
            disabled={running}
          />
        </div>
      </div>

      <div className="slider-container">
        <div className="slider-label">阻尼系数 b (N·m·s/rad)：</div>
        <Slider
          min={0}
          max={0.5}
          step={0.01}
          value={params.damping}
          onChange={value => handleParamChange('damping', value)}
          style={{ flex: 1 }}
          disabled={running}
        />
        <div className="slider-value">
          <InputNumber
            min={0}
            max={0.5}
            step={0.01}
            value={params.damping}
            onChange={value => handleParamChange('damping', value)}
            style={{ width: 60 }}
            disabled={running}
          />
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 16, padding: '8px 12px', background: '#f5f5f5', borderRadius: 4 }}>
        阻尼系数表示阻尼力矩与角速度的比例系数，影响复摆运动的能量损失和衰减速度
      </div>

      <div className="slider-container">
        <div className="slider-label">极角 (°)：</div>
        <Slider
          min={0}
          max={15}
          step={1}
          value={params.initialAngle}
          onChange={value => handleParamChange('initialAngle', value)}
          style={{ flex: 1 }}
          disabled={running}
        />
        <div className="slider-value">
          <InputNumber
            min={0}
            max={15}
            step={1}
            value={params.initialAngle}
            onChange={value => handleParamChange('initialAngle', value)}
            style={{ width: 60 }}
            disabled={running}
          />
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 16, padding: '8px 12px', background: '#f5f5f5', borderRadius: 4 }}>
        极角是复摆开始摆动时偏离竖直方向的角度，在小角度范围内（0-15°）周期基本不变，符合简谐振动近似
      </div>

      <div className="slider-container">
        <div className="slider-label">方位角 (°)：</div>
        <Slider
          min={-180}
          max={180}
          step={1}
          value={params.azimuthAngle}
          onChange={value => handleParamChange('azimuthAngle', value)}
          style={{ flex: 1 }}
          disabled={running}
        />
        <div className="slider-value">
          <InputNumber
            min={-180}
            max={180}
            step={1}
            value={params.azimuthAngle}
            onChange={value => handleParamChange('azimuthAngle', value)}
            style={{ width: 60 }}
            disabled={running}
          />
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 16, padding: '8px 12px', background: '#f5f5f5', borderRadius: 4 }}>
        方位角是摆杆在水平面上的朝向角度，与极角一起确定摆杆在三维空间中的初始姿态
      </div>

      <div className="control-buttons">
        {!running ? (
          <Button
            type="primary"
            onClick={onStart}
            className="main-btn"
            style={{ flex: 1 }}
          >
            开始实验
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setPaused(!paused)}
              style={{ flex: 1 }}
            >
              {paused ? '继续' : '暂停'}
            </Button>
            <Button
              onClick={onReset}
              style={{ flex: 1 }}
            >
              重置
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PendulumControlPanel;