"use client";

import type { OperationsDashboardModel } from "@proofpay/agent";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const palette = {
  blue: "#1664ff",
  teal: "#0f766e",
  green: "#12b76a",
  amber: "#b7791f",
  red: "#f31260",
  gray: "#667085",
  grid: "#edf1f7",
  axis: "#98a2b3"
};

const axisStyle = {
  fill: palette.gray,
  fontSize: 11,
  fontWeight: 700
};

export type MiniChartDatum = {
  name: string;
  value: number;
  color?: string;
};

function ChartFrame({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="viz-card">
      <div className="viz-head">
        <div>
          <h3>{title}</h3>
          {sub ? <p>{sub}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

interface ChartTooltipPayload {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ChartTooltipPayload[];
}

function CustomTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload
        .filter((item) => item.value !== undefined)
        .map((item) => (
          <div key={`${item.dataKey}`}>
            <span style={{ backgroundColor: item.color }} />
            <em>{item.name}</em>
            <code>{typeof item.value === "number" ? item.value.toLocaleString("en-US") : item.value}</code>
          </div>
        ))}
    </div>
  );
}

function formatUsd(value: number) {
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
}

export function MiniRadialGauge({
  color = palette.blue,
  label,
  sub,
  value
}: {
  color?: string;
  label: string;
  sub?: string;
  value: number;
}) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="mini-chart-card">
      <div className="mini-gauge">
        <ResponsiveContainer height="100%" width="100%">
          <RadialBarChart
            barSize={10}
            cx="50%"
            cy="50%"
            data={[{ name: label, value: boundedValue, fill: color }]}
            endAngle={-270}
            innerRadius="72%"
            outerRadius="96%"
            startAngle={90}
          >
            <PolarAngleAxis domain={[0, 100]} tick={false} type="number" />
            <RadialBar background={{ fill: "#edf1f7" }} cornerRadius={10} dataKey="value" />
          </RadialBarChart>
        </ResponsiveContainer>
        <strong>{Math.round(boundedValue)}%</strong>
      </div>
      <div>
        <span>{label}</span>
        {sub ? <p>{sub}</p> : null}
      </div>
    </div>
  );
}

export function MiniBarChart({
  data,
  label,
  maxValue
}: {
  data: MiniChartDatum[];
  label: string;
  maxValue?: number;
}) {
  const domainMax = maxValue ?? Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="mini-bar-panel">
      <div className="mini-bar-head">{label}</div>
      <div className="mini-bar-chart">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ top: 4, right: 6, bottom: 2, left: 0 }}>
            <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
            <YAxis allowDecimals={false} domain={[0, domainMax]} hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(22, 100, 255, 0.06)" }} />
            <Bar animationDuration={520} dataKey="value" name="count" radius={[6, 6, 0, 0]}>
              {data.map((item) => (
                <Cell fill={item.color ?? palette.blue} key={item.name} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RiskTapeChart({ model }: { model: OperationsDashboardModel }) {
  const data = model.chartSeries.risk;
  const lineColor = model.cockpitMetrics.find((metric) => metric.id === "risk")?.tone === "negative" ? palette.red : palette.blue;

  return (
    <ChartFrame title="Risk tape" sub="submitted -> extracted -> assessed">
      <div className="viz-chart">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ top: 16, right: 26, bottom: 12, left: 0 }}>
            <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="stage" tick={axisStyle} tickLine={false} />
            <YAxis domain={[0, 100]} tick={axisStyle} tickLine={false} width={42} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: palette.axis, strokeDasharray: "4 4" }} />
            <ReferenceLine ifOverflow="extendDomain" label={{ value: "release threshold", fill: palette.gray, fontSize: 11, position: "insideTopRight" }} stroke={palette.axis} strokeDasharray="5 5" y={30} />
            <Line
              activeDot={{ r: 7 }}
              animationDuration={620}
              dataKey="score"
              dot={{ r: 4, strokeWidth: 2 }}
              name="risk score"
              stroke={lineColor}
              strokeLinecap="round"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}

export function TemperatureChart({ model }: { model: OperationsDashboardModel }) {
  const data = model.chartSeries.temperature;
  const minValue = Math.floor(Math.min(...data.flatMap((point) => [point.minC, point.lowerBound])) - 1);
  const maxValue = Math.ceil(Math.max(...data.flatMap((point) => [point.maxC, point.upperBound])) + 1);

  return (
    <ChartFrame title="Cold-chain telemetry" sub="sensor band vs contract envelope">
      <div className="viz-chart">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ top: 16, right: 26, bottom: 12, left: 0 }}>
            <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="checkpoint" interval={1} tick={axisStyle} tickLine={false} />
            <YAxis domain={[minValue, maxValue]} tick={axisStyle} tickFormatter={(value) => `${value}C`} tickLine={false} width={42} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: palette.axis, strokeDasharray: "4 4" }} />
            <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ color: palette.gray, fontSize: 12, fontWeight: 700 }} />
            <Line animationDuration={620} dataKey="lowerBound" dot={false} name="lower bound" stroke={palette.axis} strokeDasharray="5 5" strokeWidth={2} type="monotone" />
            <Line animationDuration={620} dataKey="upperBound" dot={false} name="upper bound" stroke={palette.axis} strokeDasharray="5 5" strokeWidth={2} type="monotone" />
            <Line activeDot={{ r: 6 }} animationDuration={620} dataKey="minC" dot={{ r: 3 }} name="min C" stroke={palette.teal} strokeWidth={2.6} type="monotone" />
            <Line activeDot={{ r: 6 }} animationDuration={620} dataKey="maxC" dot={{ r: 3 }} name="max C" stroke={palette.blue} strokeWidth={2.6} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}

export function CashflowChart({ model }: { model: OperationsDashboardModel }) {
  const data = model.chartSeries.cashflow;

  return (
    <ChartFrame title="Escrow cashflow" sub="locked, releasable, disputed">
      <div className="viz-chart viz-chart--bar">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ top: 16, right: 22, bottom: 12, left: 4 }}>
            <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="stage" tick={axisStyle} tickLine={false} />
            <YAxis tick={axisStyle} tickFormatter={formatUsd} tickLine={false} width={46} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(22, 100, 255, 0.06)" }} />
            <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ color: palette.gray, fontSize: 12, fontWeight: 700 }} />
            <Bar animationDuration={620} dataKey="locked" fill={palette.axis} name="locked" radius={[6, 6, 0, 0]} stackId="cash" />
            <Bar animationDuration={620} dataKey="releaseReady" fill={palette.green} name="release ready" radius={[6, 6, 0, 0]} stackId="cash" />
            <Bar animationDuration={620} dataKey="disputed" fill={palette.red} name="disputed" radius={[6, 6, 0, 0]} stackId="cash" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}

export function EvidenceCoverageChart({ model }: { model: OperationsDashboardModel }) {
  const data = model.chartSeries.evidenceCoverage;

  return (
    <ChartFrame title="Evidence coverage" sub="document-level verification score">
      <div className="viz-chart viz-chart--bar">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 16, right: 28, bottom: 12, left: 70 }}>
            <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis domain={[0, 100]} tick={axisStyle} tickLine={false} type="number" />
            <YAxis dataKey="type" tick={axisStyle} tickLine={false} type="category" width={112} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(22, 100, 255, 0.06)" }} />
            <Bar animationDuration={620} dataKey="score" name="coverage" radius={[0, 7, 7, 0]}>
              {data.map((point) => (
                <Cell fill={point.score === 100 ? palette.green : point.score > 60 ? palette.amber : palette.red} key={point.type} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
