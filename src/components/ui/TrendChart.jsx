import {
  Chart as ChartJS,
  LineController, LineElement, PointElement,
  CategoryScale, LinearScale,
  Tooltip, Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

// Zinc/emerald tokens mirrored by hand — Chart.js draws to <canvas>, which
// can't resolve CSS custom properties, so these must track DESIGN.md's
// palette manually if it changes.
const DARK = { line: "#10b981", fill0: "rgba(16,185,129,0.20)", fill1: "rgba(16,185,129,0.00)", grid: "rgba(255,255,255,0.06)", tick: "#A1A1AA", tooltipBg: "#18181b", tooltipBorder: "#27272a", tooltipText: "#f8fafc" };
const LIGHT = { line: "#059669", fill0: "rgba(5,150,105,0.14)", fill1: "rgba(5,150,105,0.00)", grid: "rgba(0,0,0,0.06)", tick: "#71717a", tooltipBg: "#ffffff", tooltipBorder: "#e4e4e7", tooltipText: "#09090b" };

export default function TrendChart({ labels, values, valueLabel = "Value", height = 160, theme = "dark" }) {
  const T = theme === "light" ? LIGHT : DARK;

  const data = {
    labels,
    datasets: [{
      data: values,
      borderColor: T.line,
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: T.line,
      pointHoverBorderWidth: 0,
      fill: true,
      backgroundColor: (ctx) => {
        const { chartArea, ctx: c } = ctx.chart;
        if (!chartArea) return T.fill0;
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, T.fill0);
        g.addColorStop(1, T.fill1);
        return g;
      },
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: T.tooltipBg,
        borderColor: T.tooltipBorder,
        borderWidth: 1,
        titleColor: T.tooltipText,
        bodyColor: T.tooltipText,
        padding: 8,
        cornerRadius: 6,
        displayColors: false,
        callbacks: { label: (ctx) => `${valueLabel}: ${ctx.formattedValue}` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: T.tick, font: { size: 10 }, maxTicksLimit: 8 },
      },
      y: {
        beginAtZero: true,
        grid: { color: T.grid },
        border: { display: false },
        ticks: { color: T.tick, font: { size: 10 }, maxTicksLimit: 4, precision: 0 },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}
