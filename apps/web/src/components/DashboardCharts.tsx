"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { GlyphCircle } from "@visx/glyph";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear, scalePoint } from "@visx/scale";
import { Bar, LinePath } from "@visx/shape";

import type { OperationsDashboardModel } from "@proofpay/agent";

const palette = {
  blue: "#1664ff",
  teal: "#0f766e",
  green: "#12b76a",
  amber: "#b7791f",
  red: "#f31260",
  gray: "#667085"
};

const chart = {
  width: 760,
  height: 304,
  margin: {
    top: 22,
    right: 28,
    bottom: 42,
    left: 54
  }
};

const innerWidth = chart.width - chart.margin.left - chart.margin.right;
const innerHeight = chart.height - chart.margin.top - chart.margin.bottom;

const axisStyles = {
  tickLabelProps: () => ({
    fill: palette.gray,
    fontSize: 11,
    fontWeight: 700
  }),
  stroke: "#d8dde6",
  tickStroke: "#d8dde6"
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

function Legend({ items }: { items: Array<{ label: string; color: string; dashed?: boolean }> }) {
  return (
    <div className="viz-legend">
      {items.map((item) => (
        <span key={item.label}>
          <i className={item.dashed ? "is-dashed" : undefined} style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function yAxisTicks(max: number) {
  if (max <= 10) return [0, 4, 8, Math.ceil(max)];
  if (max <= 100) return [0, 30, 60, 100];
  return [0, Math.round(max / 2), Math.round(max)];
}

export function RiskTapeChart({ model }: { model: OperationsDashboardModel }) {
  const data = model.chartSeries.risk;
  const xScale = scalePoint<string>({
    domain: data.map((point) => point.stage),
    range: [0, innerWidth],
    padding: 0.45
  });
  const yScale = scaleLinear<number>({
    domain: [0, 100],
    range: [innerHeight, 0],
    nice: true
  });
  const lineColor = model.cockpitMetrics.find((metric) => metric.id === "risk")?.tone === "negative" ? palette.red : palette.blue;
  const thresholdY = yScale(30);

  return (
    <ChartFrame title="Risk tape" sub="submitted -> extracted -> assessed">
      <div className="viz-chart">
        <svg className="viz-component-chart" role="img" viewBox={`0 0 ${chart.width} ${chart.height}`}>
          <Group left={chart.margin.left} top={chart.margin.top}>
            <GridRows scale={yScale} stroke="#edf1f7" tickValues={yAxisTicks(100)} width={innerWidth} />
            <line className="viz-threshold" x1={0} x2={innerWidth} y1={thresholdY} y2={thresholdY} />
            <LinePath
              className="viz-line"
              curve={undefined}
              data={data}
              stroke={lineColor}
              strokeWidth={3}
              x={(point) => xScale(point.stage) ?? 0}
              y={(point) => yScale(point.score)}
            />
            {data.map((point) => (
              <Group key={point.stage} left={xScale(point.stage) ?? 0} top={yScale(point.score)}>
                <GlyphCircle className="viz-glyph" fill={lineColor} r={5} />
                <text className="viz-point-label" dy={-12} textAnchor="middle">{point.score}</text>
              </Group>
            ))}
            <AxisLeft scale={yScale} tickValues={yAxisTicks(100)} {...axisStyles} />
            <AxisBottom scale={xScale} top={innerHeight} {...axisStyles} />
          </Group>
        </svg>
      </div>
      <Legend items={[{ label: "risk score", color: lineColor }, { label: "release threshold", color: "#98a2b3", dashed: true }]} />
    </ChartFrame>
  );
}

export function TemperatureChart({ model }: { model: OperationsDashboardModel }) {
  const data = model.chartSeries.temperature;
  const minValue = Math.floor(Math.min(...data.flatMap((point) => [point.minC, point.lowerBound])) - 1);
  const maxValue = Math.ceil(Math.max(...data.flatMap((point) => [point.maxC, point.upperBound])) + 1);
  const xScale = scalePoint<string>({
    domain: data.map((point) => point.checkpoint),
    range: [0, innerWidth],
    padding: 0.35
  });
  const yScale = scaleLinear<number>({
    domain: [minValue, maxValue],
    range: [innerHeight, 0],
    nice: true
  });

  return (
    <ChartFrame title="Cold-chain telemetry" sub="sensor band vs contract envelope">
      <div className="viz-chart">
        <svg className="viz-component-chart" role="img" viewBox={`0 0 ${chart.width} ${chart.height}`}>
          <Group left={chart.margin.left} top={chart.margin.top}>
            <GridRows scale={yScale} stroke="#edf1f7" tickValues={yAxisTicks(maxValue)} width={innerWidth} />
            <LinePath className="viz-threshold-path" data={data} stroke="#98a2b3" x={(point) => xScale(point.checkpoint) ?? 0} y={(point) => yScale(point.lowerBound)} />
            <LinePath className="viz-threshold-path" data={data} stroke="#98a2b3" x={(point) => xScale(point.checkpoint) ?? 0} y={(point) => yScale(point.upperBound)} />
            <LinePath className="viz-line" data={data} stroke={palette.teal} strokeWidth={2.5} x={(point) => xScale(point.checkpoint) ?? 0} y={(point) => yScale(point.minC)} />
            <LinePath className="viz-line" data={data} stroke={palette.blue} strokeWidth={2.5} x={(point) => xScale(point.checkpoint) ?? 0} y={(point) => yScale(point.maxC)} />
            <AxisLeft scale={yScale} tickValues={yAxisTicks(maxValue)} {...axisStyles} />
            <AxisBottom scale={xScale} top={innerHeight} {...axisStyles} tickValues={data.filter((_, index) => index % 2 === 0).map((point) => point.checkpoint)} />
          </Group>
        </svg>
      </div>
      <Legend items={[{ label: "min C", color: palette.teal }, { label: "max C", color: palette.blue }, { label: "contract band", color: "#98a2b3", dashed: true }]} />
    </ChartFrame>
  );
}

export function CashflowChart({ model }: { model: OperationsDashboardModel }) {
  const data = model.chartSeries.cashflow;
  const xScale = scaleBand<string>({
    domain: data.map((point) => point.stage),
    range: [0, innerWidth],
    padding: 0.34
  });
  const maxTotal = Math.max(...data.map((point) => point.locked + point.releaseReady + point.disputed), 1);
  const yScale = scaleLinear<number>({
    domain: [0, maxTotal],
    range: [innerHeight, 0],
    nice: true
  });
  const segments = [
    { key: "locked", label: "locked", color: "#98a2b3" },
    { key: "releaseReady", label: "release ready", color: palette.green },
    { key: "disputed", label: "disputed", color: palette.red }
  ] as const;

  return (
    <ChartFrame title="Escrow cashflow" sub="locked, releasable, disputed">
      <div className="viz-chart viz-chart--bar">
        <svg className="viz-component-chart" role="img" viewBox={`0 0 ${chart.width} ${chart.height}`}>
          <Group left={chart.margin.left} top={chart.margin.top}>
            <GridRows scale={yScale} stroke="#edf1f7" tickValues={yAxisTicks(maxTotal)} width={innerWidth} />
            {data.map((point) => {
              const x = xScale(point.stage) ?? 0;
              let accumulated = 0;
              return (
                <Group key={point.stage}>
                  {segments.map((segment) => {
                    const value = point[segment.key];
                    const y = yScale(accumulated + value);
                    const height = yScale(accumulated) - y;
                    accumulated += value;
                    return <Bar className="viz-bar" fill={segment.color} height={Math.max(0, height)} key={segment.key} rx={5} width={xScale.bandwidth()} x={x} y={y} />;
                  })}
                </Group>
              );
            })}
            <AxisLeft scale={yScale} tickValues={yAxisTicks(maxTotal)} {...axisStyles} />
            <AxisBottom scale={xScale} top={innerHeight} {...axisStyles} />
          </Group>
        </svg>
      </div>
      <Legend items={segments.map((segment) => ({ label: segment.label, color: segment.color }))} />
    </ChartFrame>
  );
}

export function EvidenceCoverageChart({ model }: { model: OperationsDashboardModel }) {
  const data = model.chartSeries.evidenceCoverage;
  const yScale = scaleBand<string>({
    domain: data.map((point) => point.type),
    range: [0, innerHeight],
    padding: 0.32
  });
  const xScale = scaleLinear<number>({
    domain: [0, 100],
    range: [0, innerWidth],
    nice: true
  });

  return (
    <ChartFrame title="Evidence coverage" sub="document-level verification score">
      <div className="viz-chart viz-chart--bar">
        <svg className="viz-component-chart" role="img" viewBox={`0 0 ${chart.width} ${chart.height}`}>
          <Group left={chart.margin.left + 72} top={chart.margin.top}>
            <GridRows scale={yScale} stroke="#edf1f7" width={innerWidth - 72} />
            {data.map((point) => {
              const color = point.score === 100 ? palette.green : point.score > 60 ? palette.amber : palette.red;
              return (
                <Group key={point.type}>
                  <Bar fill="#edf1f7" height={yScale.bandwidth()} rx={7} width={innerWidth - 72} x={0} y={yScale(point.type) ?? 0} />
                  <Bar className="viz-bar" fill={color} height={yScale.bandwidth()} rx={7} width={xScale(point.score) - xScale(0)} x={0} y={yScale(point.type) ?? 0} />
                  <text className="viz-point-label" x={Math.max(30, xScale(point.score) - 8)} y={(yScale(point.type) ?? 0) + yScale.bandwidth() / 2 + 4} textAnchor="end">
                    {point.score}
                  </text>
                </Group>
              );
            })}
            <AxisLeft scale={yScale} left={0} {...axisStyles} />
            <AxisBottom scale={xScale} top={innerHeight} {...axisStyles} tickValues={[0, 50, 100]} />
          </Group>
        </svg>
      </div>
    </ChartFrame>
  );
}
