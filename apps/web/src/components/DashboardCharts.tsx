"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  CrosshairMode,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type UTCTimestamp
} from "lightweight-charts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { OperationsDashboardModel } from "@proofpay/agent";

const palette = {
  blue: "#1664ff",
  teal: "#0f766e",
  green: "#12b76a",
  amber: "#b7791f",
  red: "#f31260",
  gray: "#667085"
};

const chartFont = "IBM Plex Sans, PingFang SC, Microsoft YaHei, system-ui, sans-serif";

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

function tooltipStyle() {
  return {
    background: "rgba(255, 255, 255, 0.98)",
    border: "1px solid #e7e9ee",
    borderRadius: 8,
    boxShadow: "0 12px 30px rgba(16, 24, 40, 0.12)",
    color: "#101828",
    fontSize: 12
  };
}

export function RiskTapeChart({ model }: { model: OperationsDashboardModel }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const data = model.chartSeries.risk.map((point, index) => ({
    time: (index + 1) as UTCTimestamp,
    value: point.score
  })) satisfies LineData<Time>[];

  useEffect(() => {
    if (!hostRef.current) return undefined;
    const chart = createChart(hostRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: palette.gray,
        fontFamily: chartFont,
        attributionLogo: false
      },
      grid: {
        vertLines: { color: "#edf1f7" },
        horzLines: { color: "#edf1f7" }
      },
      rightPriceScale: {
        borderColor: "#d7dde8",
        scaleMargins: { top: 0.18, bottom: 0.18 }
      },
      timeScale: {
        borderColor: "#d7dde8",
        visible: false
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#475467", labelBackgroundColor: "#344054" },
        horzLine: { color: "#475467", labelBackgroundColor: "#344054" }
      }
    });
    const series = chart.addSeries(LineSeries, {
      color: model.cockpitMetrics.find((metric) => metric.id === "risk")?.tone === "negative" ? palette.red : palette.blue,
      lineWidth: 3,
      priceLineVisible: true,
      lastValueVisible: true
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [model]);

  useEffect(() => {
    seriesRef.current?.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <ChartFrame title="Risk tape" sub="submitted -> extracted -> assessed">
      <div className="price-chart">
        <div ref={hostRef} className="price-chart__canvas" />
        <div className="price-chart__legend">
          {model.chartSeries.risk.map((point) => (
            <span key={point.stage}>
              <i style={{ backgroundColor: point.score > 75 ? palette.red : point.score > 30 ? palette.amber : palette.green }} />
              {point.stage}: {point.score}
            </span>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}

export function TemperatureChart({ model }: { model: OperationsDashboardModel }) {
  return (
    <ChartFrame title="Cold-chain telemetry" sub="sensor band vs contract envelope">
      <div className="viz-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={model.chartSeries.temperature} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid stroke="#edf1f7" vertical={false} />
            <XAxis dataKey="checkpoint" tick={{ fontSize: 11, fill: palette.gray }} />
            <YAxis tick={{ fontSize: 11, fill: palette.gray }} width={34} />
            <Tooltip contentStyle={tooltipStyle()} />
            <Legend />
            <Line dataKey="lowerBound" name="lower bound" stroke="#98a2b3" strokeDasharray="4 4" dot={false} />
            <Line dataKey="upperBound" name="upper bound" stroke="#98a2b3" strokeDasharray="4 4" dot={false} />
            <Line dataKey="minC" name="min C" stroke={palette.teal} strokeWidth={2} />
            <Line dataKey="maxC" name="max C" stroke={palette.blue} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}

export function CashflowChart({ model }: { model: OperationsDashboardModel }) {
  return (
    <ChartFrame title="Escrow cashflow" sub="locked, releasable, disputed">
      <div className="viz-chart viz-chart--bar">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={model.chartSeries.cashflow} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
            <CartesianGrid stroke="#edf1f7" vertical={false} />
            <XAxis dataKey="stage" tick={{ fontSize: 11, fill: palette.gray }} />
            <YAxis tick={{ fontSize: 11, fill: palette.gray }} width={58} />
            <Tooltip contentStyle={tooltipStyle()} />
            <Legend />
            <Bar dataKey="locked" stackId="cash" fill="#98a2b3" name="locked" />
            <Bar dataKey="releaseReady" stackId="cash" fill={palette.green} name="release ready" />
            <Bar dataKey="disputed" stackId="cash" fill={palette.red} name="disputed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}

export function EvidenceCoverageChart({ model }: { model: OperationsDashboardModel }) {
  return (
    <ChartFrame title="Evidence coverage" sub="document-level verification score">
      <div className="viz-chart viz-chart--bar">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={model.chartSeries.evidenceCoverage} layout="vertical" margin={{ left: 8, right: 18, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="#edf1f7" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: palette.gray }} />
            <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: palette.gray }} width={112} />
            <Tooltip contentStyle={tooltipStyle()} />
            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
              {model.chartSeries.evidenceCoverage.map((item) => (
                <Cell key={item.type} fill={item.score === 100 ? palette.green : item.score > 60 ? palette.amber : palette.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
