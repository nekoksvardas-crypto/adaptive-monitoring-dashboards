import { useEffect, useMemo, useState } from "react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const DEFAULT_OCR_EVENTS = [
  {
    time: "09:12",
    type: "Shipment",
    id: "SHP-4821",
    client: "Nordic Freight",
    route: "Kaunas → Warsaw",
    eta: "14:30",
    status: "Recognized",
    confidence: 94,
    severity: "normal",
    risk: "Low",
  },
  {
    time: "09:16",
    type: "Invoice",
    id: "INV-1048",
    client: "Baltic Cargo",
    route: "Vilnius → Riga",
    eta: "11:45",
    status: "Processed",
    confidence: 91,
    severity: "normal",
    risk: "Low",
  },
  {
    time: "09:21",
    type: "Barcode",
    id: "BC-7732",
    client: "TransLine EU",
    route: "Berlin → Hamburg",
    eta: "16:10",
    status: "Detected",
    confidence: 88,
    severity: "normal",
    risk: "Medium",
  },
  {
    time: "09:28",
    type: "Delivery",
    id: "DLV-2190",
    client: "Express Logistics",
    route: "Madrid → Valencia",
    eta: "Delayed",
    status: "Delay Warning",
    confidence: 82,
    severity: "warning",
    risk: "High",
  },
];

const DEFAULT_DAILY_HISTORY = [
  { date: "Mon", value: 12, documents: 86 },
  { date: "Tue", value: 19, documents: 104 },
  { date: "Wed", value: 15, documents: 97 },
  { date: "Thu", value: 27, documents: 132 },
  { date: "Fri", value: 22, documents: 118 },
  { date: "Sat", value: 31, documents: 145 },
  { date: "Sun", value: 26, documents: 126 },
];

const safeLoadArray = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

function randomId(prefix) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 8999)}`;
}

function makeOcrEvent() {
  const types = ["Shipment", "Invoice", "Barcode", "CMR", "POD", "Warehouse Label", "Delivery Note"];
  const statuses = ["Recognized", "Processed", "Detected", "Classified", "Delay Warning", "Mismatch Alert", "Low Confidence"];
  const clients = ["Nordic Freight", "Baltic Cargo", "TransLine EU", "Express Logistics", "Iberia Supply", "Warehouse Hub", "FleetOps Group"];
  const routes = ["Kaunas → Warsaw", "Vilnius → Riga", "Berlin → Hamburg", "Madrid → Valencia", "Barcelona → Zaragoza", "Rotterdam → Bremen", "Paris → Lyon"];

  const type = types[Math.floor(Math.random() * types.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const confidence = Math.floor(72 + Math.random() * 27);
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const severity = status.includes("Warning") || status.includes("Alert") || status.includes("Low") ? "warning" : "normal";
  const risk = severity === "warning" || confidence < 80 ? "High" : confidence < 88 ? "Medium" : "Low";
  const eta = status.includes("Delay") ? "Delayed" : `${String(10 + Math.floor(Math.random() * 8)).padStart(2, "0")}:${String(Math.floor(Math.random() * 6) * 10).padStart(2, "0")}`;
  const prefix = type === "Shipment" ? "SHP" : type === "Invoice" ? "INV" : type === "Barcode" ? "BC" : type === "CMR" ? "CMR" : type === "POD" ? "POD" : "DOC";

  return {
    time,
    type,
    id: randomId(prefix),
    client: clients[Math.floor(Math.random() * clients.length)],
    route: routes[Math.floor(Math.random() * routes.length)],
    eta,
    status,
    confidence,
    severity,
    risk,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [events, setEvents] = useState([
    "OCR pipeline synchronized",
    "Shipment status analyzed",
    "Invoice classification completed",
    "Warehouse scan received",
    "Risk engine online",
  ]);

  const [ocrEvents, setOcrEvents] = useState(() => safeLoadArray("ocr-events-history", DEFAULT_OCR_EVENTS));
  const [ocrTrend, setOcrTrend] = useState(() => safeLoadArray("ocr-trend-history", [88, 91, 87, 94, 90, 96, 92, 95]));
  const [dailyHistory, setDailyHistory] = useState(() => safeLoadArray("daily-operations-history", DEFAULT_DAILY_HISTORY));

  useEffect(() => localStorage.setItem("ocr-events-history", JSON.stringify(ocrEvents)), [ocrEvents]);
  useEffect(() => localStorage.setItem("ocr-trend-history", JSON.stringify(ocrTrend)), [ocrTrend]);
  useEffect(() => localStorage.setItem("daily-operations-history", JSON.stringify(dailyHistory)), [dailyHistory]);

  const latestOcrConfidence = ocrEvents.length ? ocrEvents[0].confidence : 0;
  const activeAlerts = ocrEvents.filter((event) => event.severity === "warning").length;
  const processedDocs = ocrEvents.length;
  const avgOcrConfidence = processedDocs ? Math.round(ocrEvents.reduce((sum, event) => sum + event.confidence, 0) / processedDocs) : 0;
  const delayedShipments = ocrEvents.filter((event) => event.eta === "Delayed" || event.status.includes("Delay")).length;
  const processedInvoices = ocrEvents.filter((event) => event.type === "Invoice").length;
  const barcodeReads = ocrEvents.filter((event) => event.type === "Barcode" || event.type === "Warehouse Label").length;
  const lowRisk = ocrEvents.filter((event) => event.risk === "Low").length;

  const ocrChartData = ocrTrend.map((value, index) => ({ id: index + 1, confidence: value }));
  const ocrTypeData = ["Shipment", "Invoice", "Barcode", "CMR", "POD", "Warehouse Label", "Delivery Note"].map((type) => ({
    type,
    count: ocrEvents.filter((event) => event.type === type).length,
  }));

  const addFeed = (message) => setEvents((prev) => [message, ...prev.slice(0, 5)]);

  const simulateOcrScan = () => {
    const event = makeOcrEvent();
    setOcrEvents((prev) => [event, ...prev].slice(0, 25));
    setOcrTrend((prev) => [...prev.slice(-11), event.confidence]);
    addFeed(`OCR processed: ${event.id}`);
  };

  const simulateOperationsDay = () => {
    const nextDocuments = Math.floor(80 + Math.random() * 70);
    const nextValue = Math.floor(10 + Math.random() * 35);
    const dayLabel = `Day ${dailyHistory.length + 1}`;
    setDailyHistory((prev) => [...prev, { date: dayLabel, value: nextValue, documents: nextDocuments }].slice(-14));
    addFeed(`Daily operations report generated: ${nextDocuments} docs`);
  };

  const clearOcrData = () => {
    setOcrEvents([]);
    setOcrTrend([80, 82, 84, 86, 88, 90, 92, 94]);
    addFeed("OCR monitor cleared");
  };

  const exportOcrReport = () => {
    const headers = ["time", "type", "id", "client", "route", "eta", "status", "confidence", "risk"];
    const rows = ocrEvents.map((event) => headers.map((key) => String(event[key] ?? "").replaceAll(",", " ")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ocr-logistics-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    addFeed("OCR logistics report exported");
  };

  const summary = {
    latestOcrConfidence,
    activeAlerts,
    processedDocs,
    avgOcrConfidence,
    delayedShipments,
    processedInvoices,
    barcodeReads,
    lowRisk,
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <Header simulateOcrScan={simulateOcrScan} exportOcrReport={exportOcrReport} />

        <div className="flex gap-3 mt-8 mb-8 flex-wrap">
          <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>Operations Dashboard</TabButton>
          <TabButton active={activeTab === "ocr"} onClick={() => setActiveTab("ocr")}>OCR Operations Monitor</TabButton>
          <TabButton active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")}>Analytics</TabButton>
        </div>

        {activeTab === "dashboard" ? (
          <OperationsDashboard
            summary={summary}
            events={events}
            dailyHistory={dailyHistory}
            simulateOperationsDay={simulateOperationsDay}
            simulateOcrScan={simulateOcrScan}
          />
        ) : activeTab === "ocr" ? (
          <OcrOperationsMonitor
            ocrEvents={ocrEvents}
            ocrChartData={ocrChartData}
            ocrTypeData={ocrTypeData}
            simulateOcrScan={simulateOcrScan}
            clearOcrData={clearOcrData}
            exportOcrReport={exportOcrReport}
            summary={summary}
          />
        ) : (
          <AnalyticsPage dailyHistory={dailyHistory} ocrChartData={ocrChartData} summary={summary} />
        )}
      </div>
    </div>
  );
}

function Header({ simulateOcrScan, exportOcrReport }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
      <div>
        <div className="text-cyan-400 text-sm tracking-[0.3em] uppercase mb-3">AI-Assisted Logistics Automation</div>
        <h1 className="text-5xl font-black leading-tight">Logistics OCR & Operations Monitoring Suite</h1>
        <p className="text-slate-400 mt-4 max-w-2xl">
          A portfolio demo for shipment monitoring, document OCR, warehouse scanning, risk alerts and operational analytics.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <button onClick={simulateOcrScan} className="bg-cyan-500 hover:bg-cyan-400 transition px-6 py-3 rounded-2xl font-semibold text-black">Simulate OCR Scan</button>
          <button onClick={exportOcrReport} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 transition px-6 py-3 rounded-2xl font-semibold">Export Report</button>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-4 rounded-2xl">
          <div className="text-xs text-emerald-300 uppercase">System Status</div>
          <div className="text-3xl font-black text-emerald-400">ONLINE</div>
        </div>
      </div>
    </div>
  );
}

function OperationsDashboard({ summary, events, dailyHistory, simulateOperationsDay, simulateOcrScan }) {
  return (
    <>
      <div className="grid md:grid-cols-4 gap-5 mt-10">
        <MetricCard title="Documents Processed" value={summary.processedDocs} subtitle="Current OCR queue" />
        <MetricCard title="OCR Accuracy" value={`${summary.avgOcrConfidence}%`} subtitle="Average confidence" />
        <MetricCard title="Delayed Shipments" value={summary.delayedShipments} subtitle="Detected ETA risks" />
        <MetricCard title="Low Risk Items" value={summary.lowRisk} subtitle="Cleared operations" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-[#08152b] border border-slate-800 rounded-3xl p-6">
          <div className="text-cyan-400 text-sm tracking-[0.25em] uppercase mb-3">Control Center</div>
          <h2 className="text-3xl font-bold">Operations Simulation Panel</h2>
          <p className="text-slate-400 mt-2">
            Demonstrates how a logistics team could monitor shipments, OCR document flow, barcode reads and delay warnings in one place.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <button onClick={simulateOcrScan} className="bg-cyan-500 hover:bg-cyan-400 transition px-6 py-4 rounded-2xl font-semibold text-black">Add Live OCR Event</button>
            <button onClick={simulateOperationsDay} className="bg-emerald-500 hover:bg-emerald-400 transition px-6 py-4 rounded-2xl font-semibold text-black">Generate Daily Report</button>
          </div>
        </div>
        <EventFeed events={events} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <DailyOperationsChart data={dailyHistory} />
        <AiStatusPanel />
      </div>
    </>
  );
}

function OcrOperationsMonitor({ ocrEvents, ocrChartData, ocrTypeData, simulateOcrScan, clearOcrData, exportOcrReport, summary }) {
  const [filter, setFilter] = useState("all");

  const filteredEvents = ocrEvents.filter((event) => {
    if (filter === "all") return true;
    if (filter === "warnings") return event.severity === "warning";
    if (filter === "processed") return event.severity !== "warning";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-5">
        <MetricCard title="OCR Confidence" value={`${summary.latestOcrConfidence}%`} subtitle="Latest detection confidence" />
        <MetricCard title="Documents Processed" value={summary.processedDocs} subtitle="Simulated logistics events" />
        <MetricCard title="Delayed Shipments" value={summary.delayedShipments} subtitle="Detected ETA risks" />
        <MetricCard title="Average Accuracy" value={`${summary.avgOcrConfidence}%`} subtitle="Across captured events" />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <MetricCard title="Processed Invoices" value={summary.processedInvoices} subtitle="Invoice OCR queue" />
        <MetricCard title="Barcode Reads" value={summary.barcodeReads} subtitle="Warehouse scan events" />
        <MetricCard title="Active Alerts" value={summary.activeAlerts} subtitle="Warnings and anomalies" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#08152b] border border-slate-800 rounded-3xl p-6">
          <div className="text-cyan-400 text-sm tracking-[0.25em] uppercase mb-3">Logistics OCR Operations</div>
          <h2 className="text-3xl font-bold">Shipment, Invoice & Warehouse OCR Monitor</h2>
          <p className="text-slate-400 mt-2">Simulated OCR pipeline for transport documents, shipment IDs, invoices, barcodes, CMR, POD and warehouse labels.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <button onClick={simulateOcrScan} className="bg-cyan-500 hover:bg-cyan-400 transition px-6 py-4 rounded-2xl font-semibold text-black">Simulate OCR Scan</button>
            <button onClick={exportOcrReport} className="bg-emerald-500 hover:bg-emerald-400 transition px-6 py-4 rounded-2xl font-semibold text-black">Export OCR Report</button>
            <button onClick={clearOcrData} className="bg-rose-900/50 border border-rose-500/30 hover:bg-rose-800/50 transition px-6 py-4 rounded-2xl">Clear OCR Data</button>
          </div>
        </div>
        <AiStatusPanel />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <OcrConfidenceChart data={ocrChartData} />
        <OcrTypeChart data={ocrTypeData} />
      </div>

      <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-3xl font-bold">Processed Logistics Events</h2>
            <p className="text-slate-400 mt-2">Route, client, ETA, risk and OCR confidence overview.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
            <FilterButton active={filter === "warnings"} onClick={() => setFilter("warnings")}>Warnings</FilterButton>
            <FilterButton active={filter === "processed"} onClick={() => setFilter("processed")}>Processed</FilterButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Route</th>
                <th className="py-3 px-3">ETA</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, index) => (
                <tr key={`${event.id}-${index}`} className="border-b border-slate-900 hover:bg-slate-900/40">
                  <td className="py-3 px-3 text-slate-300">{event.time}</td>
                  <td className="py-3 px-3 font-bold">{event.type}</td>
                  <td className="py-3 px-3 text-cyan-300">{event.id}</td>
                  <td className="py-3 px-3 text-slate-300">{event.client ?? "-"}</td>
                  <td className="py-3 px-3 text-slate-300">{event.route ?? "-"}</td>
                  <td className={`py-3 px-3 font-bold ${event.eta === "Delayed" ? "text-orange-300" : "text-slate-300"}`}>{event.eta ?? "-"}</td>
                  <td className={`py-3 px-3 font-bold ${event.severity === "warning" ? "text-orange-300" : "text-emerald-300"}`}>{event.status}</td>
                  <td className="py-3 px-3">{event.confidence}%</td>
                  <td className={`py-3 px-3 font-black ${event.risk === "High" ? "text-rose-300" : event.risk === "Medium" ? "text-orange-300" : "text-emerald-300"}`}>{event.risk ?? "Low"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPage({ dailyHistory, ocrChartData, summary }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-5">
        <MetricCard title="Operational Throughput" value={`${dailyHistory.reduce((s, d) => s + d.documents, 0)}`} subtitle="Total demo documents" />
        <MetricCard title="Average OCR" value={`${summary.avgOcrConfidence}%`} subtitle="Current data quality" />
        <MetricCard title="Risk Alerts" value={summary.activeAlerts} subtitle="Open anomalies" />
        <MetricCard title="Automation Status" value="READY" subtitle="Workflow demo online" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <DailyOperationsChart data={dailyHistory} />
        <OcrConfidenceChart data={ocrChartData} />
      </div>
    </div>
  );
}

function DailyOperationsChart({ data }) {
  return (
    <div className="lg:col-span-2 bg-[#08152b] border border-slate-800 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Daily Operations Analytics</h2>
          <p className="text-slate-400 mt-2">Documents processed and operational alerts across days.</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-xl text-cyan-400 text-sm">DAILY TRACKING</div>
      </div>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="dailyOps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip contentStyle={{ background: "#020817", border: "1px solid #334155", borderRadius: "14px", color: "#fff" }} />
            <Area type="monotone" dataKey="documents" stroke="#22d3ee" fill="url(#dailyOps)" strokeWidth={4} dot={false} activeDot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function OcrConfidenceChart({ data }) {
  const fallback = data.length ? data : [{ id: 1, confidence: 0 }];
  return (
    <div className="lg:col-span-2 bg-[#08152b] border border-slate-800 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">OCR Confidence Trend</h2>
          <p className="text-slate-400 mt-2">Confidence movement across processed documents.</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-xl text-cyan-400 text-sm">OCR LIVE</div>
      </div>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fallback}>
            <defs>
              <linearGradient id="ocrConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="id" stroke="#64748b" />
            <YAxis stroke="#64748b" domain={[60, 100]} />
            <Tooltip contentStyle={{ background: "#020817", border: "1px solid #334155", borderRadius: "14px", color: "#fff" }} formatter={(value) => [`${value}%`, "Confidence"]} />
            <Area type="monotone" dataKey="confidence" stroke="#22d3ee" fill="url(#ocrConfidence)" strokeWidth={4} dot={false} activeDot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function OcrTypeChart({ data }) {
  return (
    <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
      <h2 className="text-3xl font-bold mb-6">Detection Types</h2>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" stroke="#64748b" allowDecimals={false} />
            <YAxis dataKey="type" type="category" stroke="#64748b" width={105} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#020817", border: "1px solid #334155", borderRadius: "14px", color: "#fff" }} />
            <Bar dataKey="count" fill="#22d3ee" radius={[0, 10, 10, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AiStatusPanel() {
  return (
    <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
      <h2 className="text-3xl font-bold">AI Pipeline Status</h2>
      <div className="space-y-3 mt-6">
        <StatusPill label="OCR Engine" value="ONLINE" color="emerald" />
        <StatusPill label="Auto Classification" value="ACTIVE" color="cyan" />
        <StatusPill label="Risk Detection" value="ENABLED" color="orange" />
        <StatusPill label="CSV Export" value="READY" color="violet" />
      </div>
    </div>
  );
}

function EventFeed({ events }) {
  return (
    <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
      <h2 className="text-3xl font-bold mb-6">Live Event Feed</h2>
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="bg-[#020817] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{event}</div>
              <div className="text-slate-500 text-sm mt-1">Real-time monitoring event</div>
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ label, value, color }) {
  const colorMap = {
    emerald: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
    cyan: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
    orange: "text-orange-300 border-orange-500/30 bg-orange-500/10",
    violet: "text-violet-300 border-violet-500/30 bg-violet-500/10",
  };
  return (
    <div className={`flex items-center justify-between border rounded-2xl p-4 ${colorMap[color]}`}>
      <span className="text-slate-300">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button onClick={onClick} className={`px-5 py-3 rounded-2xl font-bold border transition ${active ? "bg-cyan-500 text-black border-cyan-400" : "bg-[#08152b] border-slate-800 text-slate-300 hover:bg-slate-800"}`}>
      {children}
    </button>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl font-bold border transition ${active ? "bg-cyan-500 text-black border-cyan-400" : "bg-[#020817] border-slate-800 text-slate-300 hover:bg-slate-800"}`}>
      {children}
    </button>
  );
}

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
      <div className="text-slate-400 text-sm">{title}</div>
      <div className="text-5xl font-black mt-3">{value}</div>
      <div className="text-slate-500 mt-3 text-sm">{subtitle}</div>
    </div>
  );
}
