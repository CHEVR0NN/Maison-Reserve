import { useMemo } from "react";
import {
  Chart as ChartJS,
  BarController, LineController,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Tooltip, Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { SGD } from "../utils";

ChartJS.register(
  BarController, LineController,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Tooltip, Filler,
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const sgt   = (d) => { try { return new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" }); } catch { return ""; } };
const nowSG = ()  => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
const shift = (base, n) => sgt(new Date(`${base}T00:00:00+08:00`).getTime() + n * 86400000);

// ── Theme-aware tokens ────────────────────────────────────────────────────────
const DARK = {
  honey:     "#CC9A3E", honey2:    "#E8B85A", honeyDeep: "#8A6B2C",
  cream:     "#F1E7D2", creamDim:  "#C7B999",
  muted:     "#8E8064", surface:   "#241D15", line:      "#4A3B28",
  green:     "#5E9151", red:       "#B14A3F", orange:    "#C17A35",
  grid:      "rgba(244,230,200,0.10)",
  bar:       "rgba(241,231,210,0.12)", barStroke: "rgba(241,231,210,0.32)",
  revLine:   "#CC9A3E",
  revFill0:  "rgba(204,154,62,0.26)", revFill1: "rgba(204,154,62,0.00)",
};
const LIGHT = {
  honey:     "#A67A2E", honey2:    "#C08F3B", honeyDeep: "#7A5A22",
  cream:     "#241C12", creamDim:  "#4A3D2A",
  muted:     "#7A6B50", surface:   "#FDFBF5", line:      "#DCCFB0",
  green:     "#4C7A41", red:       "#A33B31", orange:    "#A6631E",
  grid:      "rgba(60,46,26,0.10)",
  bar:       "rgba(36,28,18,0.08)",  barStroke: "rgba(36,28,18,0.22)",
  revLine:   "#A67A2E",
  revFill0:  "rgba(166,122,46,0.20)", revFill1: "rgba(166,122,46,0.00)",
};

const getT = (theme) => theme === "light" ? LIGHT : DARK;

const STAGE_LABELS = ["Captured", "Packed", "Out for Delivery", "Delivered"];

// Stage colours don't change between themes — they're intentional semantic hues
const STAGE_COLORS_DARK  = ["#8E8064", "#C17A35", "#CC9A3E", "#5E9151"];
const STAGE_COLORS_LIGHT = ["#7A6B50", "#A6631E", "#A67A2E", "#4C7A41"];

const makeTip = (T) => ({
  backgroundColor: T.surface,
  borderColor: T.line,
  borderWidth: 1,
  titleColor: T.cream,
  bodyColor: T.creamDim,
  padding: 14,
  cornerRadius: 10,
  displayColors: true,
  titleFont: { size: 12, weight: "600" },
  bodyFont: { size: 12 },
});

// ── Glow dot on "today" point ─────────────────────────────────────────────────
const glowDotPlugin = {
  id: "glowDot",
  afterDraw(chart) {
    const idx = chart.options._todayIdx;
    if (idx == null || idx < 0) return;
    const meta = chart.getDatasetMeta(0);
    const pt   = meta?.data?.[idx];
    if (!pt) return;
    const { ctx } = chart;
    const { x, y } = pt.getProps(["x", "y"], true);
    ctx.save();
    const T = chart.options._T || DARK;
    ctx.shadowColor = T.honey; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = T.honey2; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.restore();
  },
};

// ── Pipeline bar count labels ─────────────────────────────────────────────────
const pipelineValuePlugin = {
  id: "pipelineValue",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const T = chart.options._T || DARK;
    chart.data.datasets.forEach((ds, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, j) => {
        const v = ds.data[j];
        const { x, y } = bar.getProps(["x", "y"], true);
        ctx.save();
        ctx.fillStyle    = v > 0 ? T.creamDim : T.muted;
        ctx.font         = `${v > 0 ? "600" : "400"} 11px system-ui, sans-serif`;
        ctx.textAlign    = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(v > 0 ? v : "0", x + 8, y);
        ctx.restore();
      });
    });
  },
};

// ── HTML legend row ───────────────────────────────────────────────────────────
// items: { color, shape:"line"|"bar", label, bg?, stroke? }
// For bars: bg = fill, stroke = border — mirrors the exact dataset colours.
function Legend({ items, T }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
      {items.map(({ color, shape, label, bg, stroke }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {shape === "line" ? (
            <svg width="18" height="10" viewBox="0 0 18 10">
              <line x1="0" y1="5" x2="18" y2="5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="9" cy="5" r="3" fill={color} />
            </svg>
          ) : (
            <div style={{
              width: 12, height: 12, borderRadius: 3,
              background: bg ?? color,
              border: `1.5px solid ${stroke ?? color}`,
            }} />
          )}
          <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Revenue + Orders dual-metric chart ────────────────────────────────────────
function RevenueOrdersChart({ labels, revenues, orders, todayIdx, height = 188, theme }) {
  const T   = getT(theme);
  const tip = makeTip(T);

  const gradientFill = (ctx) => {
    const { chart } = ctx;
    const { chartArea } = chart;
    if (!chartArea) return "transparent";
    const g = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0,   T.revFill0);
    g.addColorStop(0.65, "rgba(204,154,62,0.04)");
    g.addColorStop(1,   T.revFill1);
    return g;
  };

  const data = {
    labels,
    datasets: [
      {
        type: "line",
        label: "Revenue",
        data: revenues,
        fill: true,
        backgroundColor: gradientFill,
        borderColor: T.revLine,
        borderWidth: 2.5,
        tension: 0.42,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: T.honey2,
        pointHoverBorderColor: T.revLine,
        pointHoverBorderWidth: 2,
        yAxisID: "yRev",
        order: 1,
      },
      {
        type: "bar",
        label: "Orders",
        data: orders,
        backgroundColor: T.bar,
        borderColor: T.barStroke,
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.85,
        yAxisID: "yOrd",
        order: 2,
      },
    ],
  };

  const maxRev = Math.max(...revenues.filter(Boolean), 1);
  const maxOrd = Math.max(...orders.filter(Boolean), 1);

  const opts = {
    _T: T,
    _todayIdx: todayIdx,
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 6, right: 8, bottom: 4, left: 4 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tip,
        callbacks: {
          title: (items) => items[0]?.label ?? "",
          label: (ctx) =>
            ctx.dataset.label === "Revenue"
              ? `Revenue: ${SGD(ctx.raw ?? 0)}`
              : `Orders: ${ctx.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: T.muted,
          font: { size: labels.length > 20 ? 8 : 10 },
          maxRotation: labels.length > 15 ? 40 : 0,
          maxTicksLimit: 10,
        },
      },
      yRev: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        max: Math.ceil(maxRev * 1.28),
        grid: { color: T.grid, drawBorder: false },
        border: { display: false },
        ticks: { color: T.muted, font: { size: 10 }, maxTicksLimit: 5, callback: (v) => SGD(v, true) },
      },
      yOrd: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        max: Math.ceil(maxOrd * 2.8),
        grid: { display: false },
        border: { display: false },
        ticks: { color: T.muted, font: { size: 9 }, maxTicksLimit: 4, stepSize: 1 },
      },
    },
  };

  return (
    <>
      <Legend T={T} items={[
        { color: T.revLine, shape: "line", label: "Revenue (SGD)" },
        { color: T.creamDim, shape: "bar", label: "Orders", bg: T.bar, stroke: T.barStroke },
      ]} />
      <div style={{ height }}>
        <Chart type="line" data={data} options={opts} plugins={[glowDotPlugin]} />
      </div>
    </>
  );
}

// ── Pipeline funnel chart ─────────────────────────────────────────────────────
function PipelineFunnel({ orders, height = 200, theme }) {
  const T          = getT(theme);
  const tip        = makeTip(T);
  const stageColors = theme === "light" ? STAGE_COLORS_LIGHT : STAGE_COLORS_DARK;

  const counts = useMemo(() => {
    const c = Array(STAGE_LABELS.length).fill(0);
    for (const o of orders) {
      const s = typeof o.stage === "number" ? o.stage : 0;
      if (s >= 0 && s < c.length) c[s]++;
    }
    return c;
  }, [orders]);

  const maxVal = Math.max(...counts, 1);

  const data = {
    labels: STAGE_LABELS,
    datasets: [{
      data: counts,
      backgroundColor: stageColors.map((c) => c + "2A"),
      borderColor:     stageColors.map((c) => c + "BB"),
      borderWidth: 1.5,
      borderRadius: 5,
      minBarLength: 6,
      barPercentage: 0.58,
      categoryPercentage: 0.9,
    }],
  };

  const opts = {
    _T: T,
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 48, left: 4 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tip,
        callbacks: {
          title: (items) => items[0]?.label ?? "",
          label: (ctx) => `${ctx.raw} order${ctx.raw !== 1 ? "s" : ""}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: Math.ceil(maxVal * 1.4),
        grid: { color: maxVal > 0 ? T.grid : "transparent", drawBorder: false },
        border: { display: false },
        ticks: { color: T.muted, font: { size: 10 }, stepSize: 1, maxTicksLimit: 6, display: maxVal > 0 },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: T.creamDim, font: { size: 11 } },
      },
    },
  };

  return (
    <>
      <Legend T={T} items={STAGE_LABELS.map((label, i) => ({ color: stageColors[i], shape: "bar", label }))} />
      <div style={{ height }}>
        <Chart type="bar" data={data} options={opts} plugins={[pipelineValuePlugin]} />
      </div>
    </>
  );
}

// ── Wrapper card ──────────────────────────────────────────────────────────────
function ChartWrap({ children }) {
  return (
    <div className="card" style={{ padding: "20px 22px 18px", marginBottom: 18 }}>
      {children}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function TodayCharts({ ord, range, ordReady, theme }) {
  if (!ordReady) return null;

  const today = nowSG();

  if (range === "today") {
    return (
      <ChartWrap>
        <PipelineFunnel orders={ord.filter((o) => sgt(o.updatedAt) === today)} theme={theme} />
      </ChartWrap>
    );
  }

  if (range === "tomorrow") {
    return (
      <ChartWrap>
        <PipelineFunnel orders={ord.filter((o) => (o.stage ?? 0) < 3)} theme={theme} />
      </ChartWrap>
    );
  }

  if (range === "7d") {
    const days   = Array.from({ length: 7 }, (_, i) => shift(today, -(6 - i)));
    const fmtDay = (d) => new Date(`${d}T00:00:00+08:00`).toLocaleDateString("en-SG", { weekday: "short", timeZone: "Asia/Singapore" });
    const bars   = days.map((d) => {
      const list = ord.filter((o) => sgt(o.updatedAt) === d);
      return { label: fmtDay(d), revenue: list.reduce((s, o) => s + (Number(o.totalValue) || 0), 0), orders: list.length };
    });
    return (
      <ChartWrap>
        <RevenueOrdersChart
          labels={bars.map((b) => b.label)}
          revenues={bars.map((b) => b.revenue)}
          orders={bars.map((b) => b.orders)}
          todayIdx={days.indexOf(today)}
          theme={theme}
        />
      </ChartWrap>
    );
  }

  if (range === "30d") {
    const days   = Array.from({ length: 30 }, (_, i) => shift(today, -(29 - i)));
    const fmtDay = (d) => new Date(`${d}T00:00:00+08:00`).toLocaleDateString("en-SG", { day: "numeric", month: "short", timeZone: "Asia/Singapore" });
    const bars   = days.map((d) => {
      const list = ord.filter((o) => sgt(o.updatedAt) === d);
      return { label: fmtDay(d), revenue: list.reduce((s, o) => s + (Number(o.totalValue) || 0), 0), orders: list.length };
    });
    return (
      <ChartWrap>
        <RevenueOrdersChart
          labels={bars.map((b) => b.label)}
          revenues={bars.map((b) => b.revenue)}
          orders={bars.map((b) => b.orders)}
          todayIdx={days.indexOf(today)}
          height={192}
          theme={theme}
        />
      </ChartWrap>
    );
  }

  if (range === "all") {
    const monthMap = {};
    for (const o of ord) {
      const mk = sgt(o.updatedAt)?.substring(0, 7);
      if (!mk) continue;
      if (!monthMap[mk]) monthMap[mk] = { revenue: 0, orders: 0 };
      monthMap[mk].revenue += Number(o.totalValue) || 0;
      monthMap[mk].orders  += 1;
    }
    const months    = Object.keys(monthMap).sort();
    const thisMonth = today.substring(0, 7);
    const fmtM      = (m) => {
      const [y, mo] = m.split("-");
      return new Date(+y, +mo - 1).toLocaleString("en-SG", { month: "short" }) + " '" + y.slice(2);
    };
    return (
      <ChartWrap>
        <RevenueOrdersChart
          labels={months.map(fmtM)}
          revenues={months.map((m) => Math.round(monthMap[m].revenue))}
          orders={months.map((m) => monthMap[m].orders)}
          todayIdx={months.indexOf(thisMonth)}
          height={192}
          theme={theme}
        />
      </ChartWrap>
    );
  }

  return null;
}
