import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export const CHART_COLORS = ['#8f3d1b', '#3d5c32', '#8a5a12', '#3e4c59', '#6b5344'];

const categoryClass = (category) => {
  if (category === 'Productive') return 'category-good';
  if (category === 'Unproductive') return 'category-bad';
  return 'category-neutral';
};

const UsageChart = ({ apps, empty }) => {
  if (!apps?.length) return <p className="text-muted">{empty}</p>;

  return (
    <>
      <div style={{ height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={apps} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={78} paddingAngle={2} stroke="#f7f4ee">
              {apps.map((entry, index) => (
                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="app-list">
        {apps.map((app, i) => (
          <li className="app-row" key={app.name}>
            <span>
              <i className="swatch" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              {app.name}
            </span>
            <span className={categoryClass(app.category)}>{app.category}</span>
          </li>
        ))}
      </ul>
    </>
  );
};

export default UsageChart;
