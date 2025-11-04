// Victory-based charts for richer animations
import React from 'react';
import { View } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryTheme, VictoryLabel, VictoryPie, VictoryGroup } from 'victory-native';
import Svg from 'react-native-svg';

export function WeeklyBarChart({ labels, scans, goals, color="#059669" }) {
  const dataScans = scans.map((y, i) => ({ x: labels[i], y }));
  const dataGoals = goals.map((y, i) => ({ x: labels[i], y }));
  return (
    <Svg height={240} width="100%">
      <VictoryChart
        height={240}
        width={380}
        standalone={false}
        domainPadding={{ x: 20, y: 10 }}
        theme={VictoryTheme.material}
        animate={{ duration: 800, easing: 'quadInOut' }}
      >
        <VictoryAxis style={{ tickLabels: { fontSize: 10 } }} />
        <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 9 } }} />
        <VictoryGroup offset={14}>
          <VictoryBar data={dataScans} style={{ data: { fill: color, width: 10 } }} cornerRadius={4} />
          <VictoryBar data={dataGoals} style={{ data: { fill: '#9ca3af', opacity: 0.5, width: 10 } }} cornerRadius={4} />
        </VictoryGroup>
      </VictoryChart>
    </Svg>
  );
}

export function MaterialPie({ data }) {
  const pieData = data.map(d => ({ x: `${d.name} ${d.percentage}%`, y: d.count, fill: d.color }));
  return (
    <Svg height={220} width="100%">
      <VictoryPie
        standalone={false}
        height={220}
        width={380}
        data={pieData}
        innerRadius={60}
        padAngle={2}
        labels={({ datum }) => datum.x}
        style={{ labels: { fontSize: 10 } }}
        animate={{ duration: 900, easing: 'quadInOut' }}
      />
    </Svg>
  );
}
