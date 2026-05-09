import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const shipmentsSeed = [
  {
    id: "SHP-5370",
    route: "Kaunas → Hamburg",
    client: "DSV Solutions",
    status: "In Transit",
    eta: "May 10, 08:00",
    docs: "4 / 5",
    confidence: 94,
    risk: "Low",
    update: "2 min ago",
  },
  {
    id: "SHP-5361",
    route: "Vilnius → Berlin",
    client: "DHL Freight",
    status: "In Transit",
    eta: "May 10, 12:30",
    docs: "3 / 4",
    confidence: 89,
    risk: "Low",
    update: "5 min ago",
  },
  {
    id: "SHP-5348",
    route: "Klaipėda → Rotterdam",
    client: "Maersk",
    status: "Delayed",
    eta: "May 11, 09:00",
    docs: "2 / 6",
    confidence: 76,
    risk: "Medium",
    update: "8 min ago",
  },
  {
    id: "SHP-5332",
    route: "Riga → Stockholm",
    client: "DX Logistik",
    status: "In Transit",
    eta: "May 10, 15:00",
    docs: "5 / 5",
    confidence: 96,
    risk: "Low",
    update: "1 min ago",
  },
  {
    id: "SHP-5321",
    route: "Gdansk → Prague",
    client: "GEODIS",
    status: "In Transit",
    eta: "May 10, 18:00",
    docs: "3 / 5",
    confidence: 86,
    risk: "Low",
    update: "3 min ago",
  },
  {
    id: "SHP-5310",
    route: "Warsaw → Paris",
    client: "Kuehne+Nagel",
    status: "Delayed",
    eta: "May 11, 11:30",
    docs: "1 / 4",
    confidence: 68,
    risk: "High",
    update: "10 min ago",
  },
  {
    id: "SHP-5302",
    route: "Budapest → Milan",
    client: "DB Schenker",
    status: "At Pickup",
    eta: "May 09, 20:00",
    docs: "0 / 3",
    confidence: null,
    risk: "High",
    update: "12 min ago",
  },
  {
    id: "SHP-5291",
    route: "Tallinn → Helsinki",
    client: "Venipak",
    status: "In Transit",
    eta: "May 10, 10:00",
    docs: "4 / 4",
    confidence: 92,
    risk: "Low",
    update: "7 min ago",
  },
];

const alertsSeed = [
  { title: "High delay risk", details: "SHP-5310 Warsaw → Paris", time: "18 min ago", level: "high" },
  { title: "Low OCR confidence", details: "SHP-5348 Klaipėda → Rotterdam (76%)", time: "42 min ago", level: "medium" },
  { title: "Missing documents", details: "SHP-5302 Budapest → Milan", time: "1 hr ago", level: "high" },
  { title: "POD pending", details: "SHP-5361 Vilnius → Berlin", time: "2 hr ago", level: "medium" },
  { title: "New shipment created", details: "SHP-5375 Kaunas → Oslo", time: "3 hr ago", level: "info" },
];

const documentsData = [
  { day: "May 3", processed: 460, waiting: 330 },
  { day: "May 4", processed: 510, waiting: 290 },
  { day: "May 5", processed: 610, waiting: 340 },
  { day: "May 6", processed: 540, waiting: 300 },
  { day: "May 7", processed: 430, waiting: 260 },
  { day: "May 8", processed: 575, waiting: 310 },
  { day: "May 9", processed: 490, waiting: 270 },
];

const confidenceData = [
  { day: "May 3", value: 88 },
  { day: "May 4", value: 90 },
  { day: "May 5", value: 87 },
  { day: "May 6", value: 85 },
  { day: "May 7", value: 86 },
  { day: "May 8", value: 90 },
  { day: "May 9", value: 91 },
];

const delayData = [
  { name: "Customs Clearance", value: 35 },
  { name: "Document Issues", value: 25 },
  { name: "Weather Conditions", value: 15 },
  { name: "Carrier Delays", value: 15 },
  { name: "Other", value: 10 },
];

const recentActivity = [
  { time: "Today, 12:45", type: "Invoice", shipment: "SHP-5370", client: "DSV Solutions", result: "Processed", confidence: "94%" },
  { time: "Today, 12:43", type: "POD", shipment: "SHP-5361", client: "DHL Freight", result: "Processed", confidence: "89%" },
  { time: "Today, 12:41", type: "Delivery Note", shipment: "SHP-5348", client: "Maersk", result: "Low Confidence", confidence: "76%" },
];

const pieColors = ["#ef4444", "#f59e0b", "#2563eb", "#22c55e", "#94a3b8"];

export default function App() {
  const [shipments, setShipments] = useState(shipmentsSeed);
  const [alerts, setAlerts] = useState(alertsSeed);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const matchesSearch =
        shipment.id.toLowerCase().includes(search.toLowerCase()) ||
        shipment.route.toLowerCase().includes(search.toLowerCase()) ||
        shipment.client.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (activeFilter === "All") return true;
      if (activeFilter === "On Time") return shipment.status !== "Delayed" && shipment.risk === "Low";
      if (activeFilter === "Delayed") return shipment.status === "Delayed";
      if (activeFilter === "Low Confidence") return shipment.confidence !== null && shipment.confidence < 80;
      if (activeFilter === "Exceptions") return shipment.risk === "High";
      return true;
    });
  }, [shipments, activeFilter, search]);

  const addOcrEvent = () => {
    const newShipment = {
      id: `SHP-${Math.floor(5400 + Math.random() * 499)}`,
      route: "Kaunas → Oslo",
      client: "Demo Logistics",
      status: "In Transit",
      eta: "May 10, 16:30",
      docs: "1 / 3",
      confidence: Math.floor(78 + Math.random() * 19),
      risk: "Low",
      update: "just now",
    };

    setShipments((prev) => [newShipment, ...prev].slice(0, 10));
    setAlerts((prev) => [
      { title: "New OCR event processed", details: `${newShipment.id} ${newShipment.route}`, time: "just now", level: "info" },
      ...prev,
    ].slice(0, 6));
  };

  const exportReport = () => {
    const headers = ["Shipment ID", "Route", "Client", "Status", "ETA", "Documents", "OCR Confidence", "Risk", "Last Update"];
    const rows = shipments.map((item) => [
      item.id,
      item.route,
      item.client,
      item.status,
      item.eta,
      item.docs,
      item.confidence ?? "-",
      item.risk,
      item.update,
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "logistics-operations-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1 px-8 py-6 overflow-x-hidden">
          <TopBar exportReport={exportReport} />

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-6">
            <KpiCard icon="🚚" label="Active Shipments" value="1,248" change="↑ 12% vs yesterday" tone="blue" />
            <KpiCard icon="🕒" label="Delayed Shipments" value="87" change="↑ 8% vs yesterday" tone="orange" />
            <KpiCard icon="📄" label="Documents Waiting" value="236" change="Needs review" tone="purple" />
            <KpiCard icon="✅" label="OCR Accuracy" value="91.4%" change="↑ 2.6% vs yesterday" tone="green" />
            <KpiCard icon="▥" label="Barcode Reads" value="4,562" change="Today" tone="blue" />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 mt-5">
            <ShipmentsPanel
              shipments={filteredShipments}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              search={search}
              setSearch={setSearch}
            />

            <aside className="space-y-5">
              <AlertsPanel alerts={alerts} />
              <QuickActions addOcrEvent={addOcrEvent} exportReport={exportReport} />
            </aside>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
            <DocumentsChart />
            <ConfidenceChart />
            <DelayReasonsChart />
          </section>

          <RecentActivity />
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const nav = [
    ["⌂", "Overview"],
    ["🚚", "Shipments"],
    ["📄", "Documents (OCR)"],
    ["⚠", "Alerts"],
    ["↗", "Analytics"],
    ["▣", "Reports"],
    ["👥", "Clients"],
    ["⚙", "Settings"],
  ];

  return (
    <aside className="hidden lg:flex w-[250px] bg-[#0b2340] text-white flex-col px-4 py-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black">◇</div>
        <div>
          <div className="text-2xl font-black tracking-tight">LOGIX AI</div>
          <div className="text-blue-100 text-sm">Operations Console</div>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {nav.map(([icon, label], index) => (
          <button
            key={label}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold transition ${
              index === 0 ? "bg-blue-600/25 text-white" : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <span className="w-5 text-center">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="space-y-3">
        <div className="border border-white/10 rounded-2xl p-4 bg-white/5">
          <div className="font-bold">Demo Logistics</div>
          <div className="text-blue-100 text-sm">Operations Team</div>
        </div>
        <div className="border border-white/10 rounded-2xl p-4 bg-white/5">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> System Status
          </div>
          <div className="text-blue-100 text-sm mt-1">All systems operational</div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ exportReport }) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Operations Overview</h1>
        <p className="text-slate-500 mt-1">Real-time logistics and OCR monitoring</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="h-12 px-5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm">📅 May 9, 2026</button>
        <button className="h-12 px-5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm">⚱ Filters</button>
        <button onClick={exportReport} className="h-12 px-5 rounded-xl bg-blue-600 text-white font-bold shadow-sm hover:bg-blue-700 transition">↓ Export Report</button>
      </div>
    </header>
  );
}

function KpiCard({ icon, label, value, change, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-500",
    purple: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  const changeColor = change.includes("↑") && tone !== "orange" ? "text-emerald-600" : tone === "orange" ? "text-red-500" : "text-orange-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${tones[tone]}`}>{icon}</div>
      <div>
        <div className="text-slate-500 font-semibold text-sm">{label}</div>
        <div className="text-3xl font-black mt-1">{value}</div>
        <div className={`text-sm font-semibold mt-1 ${changeColor}`}>{change}</div>
      </div>
    </div>
  );
}

function ShipmentsPanel({ shipments, activeFilter, setActiveFilter, search, setSearch }) {
  const filters = [
    ["All", "1,248"],
    ["On Time", "1,038"],
    ["Delayed", "87"],
    ["Low Confidence", "123"],
    ["Exceptions", "42"],
  ];

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h2 className="text-xl font-black">Shipments</h2>
          <div className="relative w-full xl:w-80">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search shipments..."
              className="w-full h-11 rounded-xl border border-slate-200 px-4 pr-10 outline-none focus:ring-2 focus:ring-blue-100"
            />
            <span className="absolute right-4 top-2.5 text-slate-400">⌕</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {filters.map(([label, count]) => (
            <button
              key={label}
              onClick={() => setActiveFilter(label)}
              className={`px-4 py-2 rounded-lg border text-sm font-bold transition ${
                activeFilter === label ? "border-blue-600 text-blue-700 bg-blue-50" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label} <span className="ml-2 text-xs">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-left">
              <th className="px-5 py-3 font-bold">Shipment ID</th>
              <th className="px-5 py-3 font-bold">Route</th>
              <th className="px-5 py-3 font-bold">Client</th>
              <th className="px-5 py-3 font-bold">Status</th>
              <th className="px-5 py-3 font-bold">ETA</th>
              <th className="px-5 py-3 font-bold">Documents</th>
              <th className="px-5 py-3 font-bold">OCR Confidence</th>
              <th className="px-5 py-3 font-bold">Risk</th>
              <th className="px-5 py-3 font-bold">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => (
              <tr key={shipment.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                <td className="px-5 py-4 font-black text-slate-800">{shipment.id}</td>
                <td className="px-5 py-4 font-semibold">{shipment.route}</td>
                <td className="px-5 py-4">{shipment.client}</td>
                <td className="px-5 py-4"><StatusBadge status={shipment.status} /></td>
                <td className={`px-5 py-4 font-semibold ${shipment.status === "Delayed" ? "text-red-600" : "text-slate-700"}`}>{shipment.eta}</td>
                <td className="px-5 py-4 font-semibold">{shipment.docs}</td>
                <td className="px-5 py-4"><ConfidenceBar value={shipment.confidence} /></td>
                <td className="px-5 py-4"><RiskBadge risk={shipment.risk} /></td>
                <td className="px-5 py-4 text-slate-500">{shipment.update}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-5 border-t border-slate-100 text-sm text-slate-500">
        <button className="text-blue-600 font-bold">View all shipments →</button>
        <div>Showing 1 to {shipments.length} of 1,248</div>
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const styles = {
    "In Transit": "bg-blue-50 text-blue-700",
    Delayed: "bg-red-50 text-red-700",
    "At Pickup": "bg-violet-50 text-violet-700",
  };
  return <span className={`px-3 py-1 rounded-lg font-bold ${styles[status]}`}>{status}</span>;
}

function RiskBadge({ risk }) {
  const styles = {
    Low: "bg-emerald-50 text-emerald-700",
    Medium: "bg-orange-50 text-orange-700",
    High: "bg-red-50 text-red-700",
  };
  return <span className={`px-3 py-1 rounded-lg font-bold ${styles[risk]}`}>{risk}</span>;
}

function ConfidenceBar({ value }) {
  if (value === null) return <span className="text-slate-400 font-bold">—</span>;
  const color = value >= 85 ? "bg-emerald-500" : value >= 75 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3 min-w-[120px]">
      <span className="font-bold w-9">{value}%</span>
      <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function AlertsPanel({ alerts }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black">Alerts & Priority Tasks</h2>
        <button className="text-blue-600 font-bold text-sm">View all</button>
      </div>
      <div className="divide-y divide-slate-100">
        {alerts.map((alert, index) => (
          <div key={`${alert.title}-${index}`} className="py-4 flex items-start gap-3">
            <div className={`mt-1 ${alert.level === "high" ? "text-red-500" : alert.level === "medium" ? "text-orange-500" : "text-blue-500"}`}>⚠</div>
            <div className="flex-1">
              <div className="font-black">{alert.title}</div>
              <div className="text-slate-500 text-sm mt-1">{alert.details}</div>
            </div>
            <div className="text-slate-400 text-xs whitespace-nowrap">{alert.time}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickActions({ addOcrEvent, exportReport }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-xl font-black mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={addOcrEvent} className="h-11 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100">Add OCR Event</button>
        <button className="h-11 rounded-xl border border-slate-200 font-bold hover:bg-slate-50">Upload Docs</button>
        <button onClick={exportReport} className="h-11 rounded-xl border border-slate-200 font-bold hover:bg-slate-50">Generate Report</button>
        <button className="h-11 rounded-xl border border-slate-200 font-bold hover:bg-slate-50">Schedule Report</button>
      </div>
    </section>
  );
}

function DocumentsChart() {
  return (
    <ChartCard title="Documents Processed (Daily)" action="7D">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={documentsData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip />
          <Bar dataKey="processed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
          <Bar dataKey="waiting" stackId="a" fill="#cbd5e1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ConfidenceChart() {
  return (
    <ChartCard title="OCR Confidence Trend" action="7D">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={confidenceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" stroke="#64748b" />
          <YAxis stroke="#64748b" domain={[60, 100]} tickFormatter={(value) => `${value}%`} />
          <Tooltip formatter={(value) => [`${value}%`, "Confidence"]} />
          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={4} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function DelayReasonsChart() {
  return (
    <ChartCard title="Top Delay Reasons" action="30D">
      <div className="grid grid-cols-[170px_1fr] gap-4 items-center min-h-[260px]">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={delayData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>
              {delayData.map((entry, index) => <Cell key={entry.name} fill={pieColors[index]} />)}
            </Pie>
            <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-3">
          {delayData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[index] }} />
                <span className="text-slate-600">{item.name}</span>
              </div>
              <span className="font-black">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function ChartCard({ title, action, children }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black">{title}</h2>
        <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600">{action}</button>
      </div>
      {children}
    </section>
  );
}

function RecentActivity() {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-5 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <h2 className="text-xl font-black">Recent OCR Activity</h2>
        <button className="text-blue-600 font-bold text-sm">View all activity →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-left bg-slate-50">
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Document Type</th>
              <th className="px-5 py-3">Shipment ID</th>
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">Result</th>
              <th className="px-5 py-3">OCR Confidence</th>
              <th className="px-5 py-3">Processed By</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((activity) => (
              <tr key={`${activity.time}-${activity.shipment}`} className="border-t border-slate-100">
                <td className="px-5 py-4 text-slate-600">{activity.time}</td>
                <td className="px-5 py-4 font-semibold">{activity.type}</td>
                <td className="px-5 py-4 font-black">{activity.shipment}</td>
                <td className="px-5 py-4">{activity.client}</td>
                <td className="px-5 py-4"><span className={`px-3 py-1 rounded-lg font-bold ${activity.result === "Low Confidence" ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"}`}>{activity.result}</span></td>
                <td className="px-5 py-4 font-bold">{activity.confidence}</td>
                <td className="px-5 py-4 text-slate-600">System</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
