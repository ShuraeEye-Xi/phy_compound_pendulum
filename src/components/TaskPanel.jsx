import React from 'react';
import { Tabs } from 'antd';

const TaskPanel = ({ taskIndex, setTaskIndex, history, clearHistory }) => {
  const handleTabChange = (key) => {
    setTaskIndex(parseInt(key));
    clearHistory();
  };
  
  const tasks = [
    {
      title: '任务1：长度与周期',
      description: '探索杆长对复摆周期的影响',
      content: (
        <div>
          <p>本任务需要你探索杆长对复摆周期的影响。</p>
          <h4 style={{ marginTop: 16, fontSize: 16 }}>实验步骤：</h4>
          <ol style={{ paddingLeft: 20 }}>
            <li>保持支点位置、质量和阻尼系数不变</li>
            <li>改变杆长，进行多组实验</li>
            <li>记录不同杆长下的周期数据</li>
            <li>分析杆长与周期的关系</li>
          </ol>
          <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <p style={{ fontWeight: 500 }}>思考问题：</p>
            <p>1. 当杆长增加时，周期如何变化？</p>
            <p>2. 若将杆长加倍，周期是否约变为原来的√2倍？为什么？</p>
            <p>3. 如果画出周期T与长度L的平方根的关系，会得到什么？</p>
          </div>
        </div>
      )
    },
    {
      title: '任务2：支点位置与周期',
      description: '探索支点位置对复摆周期的影响',
      content: (
        <div>
          <p>本任务需要你探索支点位置对复摆周期的影响。</p>
          <h4 style={{ marginTop: 16, fontSize: 16 }}>实验步骤：</h4>
          <ol style={{ paddingLeft: 20 }}>
            <li>保持杆长、质量和阻尼系数不变</li>
            <li>改变支点位置，进行多组实验</li>
            <li>记录不同支点位置下的周期数据</li>
            <li>分析支点位置与周期的关系</li>
          </ol>
          <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <p style={{ fontWeight: 500 }}>思考问题：</p>
            <p>1. 支点在哪个位置时周期最小？为什么？</p>
            <p>2. 支点位置与转动惯量的关系是什么？</p>
            <p>3. 如果支点正好在质心处会发生什么？</p>
          </div>
        </div>
      )
    },
    {
      title: '任务3：质量与周期',
      description: '探索质量对复摆周期的影响',
      content: (
        <div>
          <p>本任务需要你探索质量对复摆周期的影响。</p>
          <h4 style={{ marginTop: 16, fontSize: 16 }}>实验步骤：</h4>
          <ol style={{ paddingLeft: 20 }}>
            <li>保持杆长、支点位置和阻尼系数不变</li>
            <li>改变质量，进行多组实验</li>
            <li>记录不同质量下的周期数据</li>
            <li>分析质量与周期的关系</li>
          </ol>
          <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <p style={{ fontWeight: 500 }}>思考问题：</p>
            <p>1. 质量变化会影响周期吗？为什么？</p>
            <p>2. 质量对复摆的动能和势能有何影响？</p>
            <p>3. 实际情况下，质量是否会间接影响周期？</p>
          </div>
        </div>
      )
    },
    {
      title: '任务4：自由探索',
      description: '自由探索各参数对复摆运动的影响',
      content: (
        <div>
          <p>本任务中，你可以自由探索各参数对复摆运动的影响。</p>
          <h4 style={{ marginTop: 16, fontSize: 16 }}>探索方向：</h4>
          <ol style={{ paddingLeft: 20 }}>
            <li>探索重力加速度对周期的影响</li>
            <li>探索初始角度对周期的影响</li>
            <li>探索不同参数组合下的能量转化</li>
            <li>自行设计并验证你的假设</li>
          </ol>
          <h4 style={{ marginTop: 16, fontSize: 16 }}>提示：</h4>
          <p>尝试改变多个参数，观察其组合效应。</p>
          <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <p style={{ fontWeight: 500 }}>思考问题：</p>
            <p>1. 在不同重力环境（如月球、火星）下复摆运动有何不同？</p>
            <p>2. 小幅近似下，初始角度是否影响周期？</p>
            <p>3. 能否找到使复摆运动最接近简谐运动的条件？</p>
          </div>
        </div>
      )
    }
  ];
  
  return (
    <div className="card-effect">
      <h3 style={{ marginBottom: 16, fontSize: 18 }}>实验任务</h3>
      <Tabs
        activeKey={taskIndex.toString()}
        onChange={handleTabChange}
        items={tasks.map((task, index) => ({
          key: index.toString(),
          label: `任务${index + 1}`,
          children: (
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>{task.title}</h3>
              <p style={{ color: '#666', marginBottom: 16 }}>{task.description}</p>
              {task.content}
            </div>
          )
        }))}
      />
    </div>
  );
};

export default TaskPanel;