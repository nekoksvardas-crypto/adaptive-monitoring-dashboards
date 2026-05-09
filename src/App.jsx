import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const initialLoads = [
  {
    id: "LOAD-1048",
    driver: "Jonas Petrauskas",
    truck: "LT-4821",
    route: "Kaunas → Hamburg",
    pickup: "Today 10:00",
    delivery: "Tomorrow 08:00",
    gpsEta: "10:35",
    distanceKm: 82,
    status: "Delay Risk",
    risk: "High",
    contacted: false,
    location: "A2 near Marijampolė",
    client: "DSV Solutions",
  },
  {
    id: "LOAD-1049",
    driver: "Marius Kazlauskas",
    truck: "LT-3910",
    route: "Vilnius → Warsaw",
    pickup: "Today 12:30",
    delivery: "Today 22:00",
    gpsEta: "12:10",
    distanceKm: 28,
    status: "On Time",
    risk: "Low",
    contacted: true,
    location: "Near Elektrėnai",
    client: "DHL Freight",
  },
  {
    id: "LOAD-1050",
    driver: "Tomas Vaitkus",
    truck: "LT-7753",
    route: "Klaipėda → Rotterdam",
    pickup: "Today 14:00",
    delivery: "Tomorrow 16:00",
    gpsEta: "14:20",
    distanceKm: 64,
    status: "Delay Risk",
    risk: "Medium",
    contacted: false,
    location: "A1 near Raseiniai",
    client: "Maersk",
  },
  {
    id: "LOAD-1051",
    driver: "Paulius Urbonas",
    truck: "LT-2239",
    route: "Riga → Stockholm",
    pickup: "Today 09:30",
    delivery: "Tomorrow 11:00",
    gpsEta: "09:18",
    distanceKm: 14,
    status: "Arriving Soon",
    risk: "Low",
    contacted: true,
    location: "Riga terminal area",
    client: "DX Logistik",
  },
  {
    id: "LOAD-1052",
    driver: "Andrius Jankus",
    truck: "LT-9912",
    route: "Gdansk → Prague",
    pickup: "Today 16:00",
    delivery: "Tomorrow 10:30",
    gpsEta: "16:55",
    distanceKm: 121,
    status: "Delay Risk",
    risk: "High",
    contacted: false,
    location: "S7 near Elbląg",
    client: "GEODIS",
  },
  {
    id: "LOAD-1053",
    driver: "Mindaugas Mockus",
    truck: "LT-6411",
    route: "Berlin → Paris",
    pickup: "Today 18:00",
    delivery: "Tomorrow 13:00",
    gpsEta: "17:40",
    distanceKm: 42,
    status: "On Time",
    risk: "Low",
    contacted: false,
    location: "A10 Berlin ring",
    client: "Kuehne+Nagel",
  },
];

const delayReasons = [
  { name: "Driver late departure", value: 38 },
  { name: "Traffic", value: 24 },
  { name: "Wrong ETA estimate", value: 18 },
  { name: "No driver response", value: 12 },
  { name: "Other", value: 8 },
];

const weeklyRiskData = [
  { day: "Mon", high: 8, medium: 14, low: 42 },
  { day: "Tue", high: 6, medium: 11, low: 47 },
  { day: "Wed", high: 10, medium: 16, low: 39 },
  { day: "Thu", high: 5, medium: 13, low: 51 },
  { day: "Fri", high: 12, medium: 18, low: 44 },
  { day: "Sat", high: 4, medium: 8, low: 28 },
  { day: "Sun", high: 3, medium: 6, low: 25 },
];

const pieColors = ["#ef4444", "#f59e0b", "#2563eb", "#22c55e", "#94a3b8"];

function makeMessage(load) {
  return `Hello ${load.driver.split(" ")[0]}, your pickup is scheduled for ${load.pickup}. Current GPS ETA shows ${load.gpsEta}. Please confirm your current status and whether you will arrive on time. Route: ${load.route}.`;
}

function createDemoLoad() {
  const drivers = ["Rokas Butkus", "Egidijus Stankevičius", "Darius Zubrus", "Lukas Petrauskas"];
  const routes = ["Kaunas → Oslo", "Vilnius → Riga", "Warsaw → Milan", "Alicante → Madrid"];
  const clients = ["Demo Logistics", "Baltic Cargo", "FleetOps EU", "TransLine EU"];
  const riskPool = ["Low", "Medium", "High"];
  const risk = riskPool[Math.floor(Math.random() * riskPool.length)];

  return {
    id: `LOAD-${Math.floor(1100 + Math.random() * 500)}`,
    driver: drivers[Math.floor(Math.random() * drivers.length)],
    truck: `LT-${Math.floor(2000 + Math.random() * 7999)}`,
    route: routes[Math.floor(Math.random() * routes.length)],
    pickup: "Today 15:00",
    delivery: "Tomorrow 09:00",
    gpsEta: risk === "High" ? "15:45" : risk === "Medium" ? "15:15" : "14:45",
    distanceKm: risk === "High" ? 110 : risk === "Medium" ? 62 : 24,
    status: risk === "Low" ? "On Time" : "Delay Risk",
    risk,
    contacted: false,
    location: "GPS updated just now",
    client: clients[Math.floor(Math.random() * clients.length)],
  };
}

export default function App() {
  const [loads, setLoads] = useState(initialLoads);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedLoad, setSelectedLoad] = useState(initialLoads[0]);
  const [toast, setToast] = useState("Fleet delay assistant ready");
  const [driverPhone, setDriverPhone] = useState("+37060000000");
  const [reminderTime, setReminderTime] = useState("");
  const [scheduledReminder, setScheduledReminder] = useState(null);

  const filteredLoads = useMemo(() => {
    return loads.filter((load) => {
      const matchSearch =
        load.id.toLowerCase().includes(search.toLowerCase()) ||
        load.driver.toLowerCase().includes(search.toLowerCase()) ||
        load.route.toLowerCase().includes(search.toLowerCase()) ||
        load.client.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (activeFilter === "All") return true;
      if (activeFilter === "High Risk") return load.risk === "High";
      if (activeFilter === "Delayed") return load.status === "Delay Risk";
      if (activeFilter === "Not Contacted") return !load.contacted;
      if (activeFilter === "On Time") return load.risk === "Low";
      return true;
    });
  }, [loads, activeFilter, search]);

  const highRisk = loads.filter((load) => load.risk === "High").length;
  const mediumRisk = loads.filter((load) => load.risk === "Medium").length;
  const notContacted = loads.filter((load) => !load.contacted && load.risk !== "Low").length;
  const delayed = loads.filter((load) => load.status === "Delay Risk").length;

  const markContacted = (id) => {
    setLoads((prev) => prev.map((load) => (load.id === id ? { ...load, contacted: true } : load)));
    if (selectedLoad?.id === id) setSelectedLoad((prev) => ({ ...prev, contacted: true }));
    setToast(`Driver marked as contacted: ${id}`);
  };

  const addDemoLoad = () => {
    const newLoad = createDemoLoad();
    setLoads((prev) => [newLoad, ...prev]);
    setSelectedLoad(newLoad);
    setToast(`New load imported from FleetHand demo: ${newLoad.id}`);
  };

  const exportDispatcherReport = () => {
    const headers = ["Load ID", "Driver", "Truck", "Route", "Pickup", "GPS ETA", "Risk", "Contacted", "Client"];
    const rows = loads.map((load) => [
      load.id,
      load.driver,
      load.truck,
      load.route,
      load.pickup,
      load.gpsEta,
      load.risk,
      load.contacted ? "Yes" : "No",
      load.client,
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fleet-dispatcher-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    setToast("Dispatcher report exported");
  };

  const scheduleReminder = () => {
    if (!selectedLoad || !reminderTime) {
      setToast("Select a load and reminder time first");
      return;
    }

    const now = new Date();
    const [hours, minutes] = reminderTime.split(":").map(Number);
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);

    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    const delay = reminderDate.getTime() - now.getTime();
    const message = makeMessage(selectedLoad);

    const reminder = {
      loadId: selectedLoad.id,
      driver: selectedLoad.driver,
      phone: driverPhone,
      time: reminderTime,
      message,
    };

    setScheduledReminder(reminder);
    setToast(`Reminder scheduled for ${selectedLoad.driver} at ${reminderTime}`);

    setTimeout(() => {
      setToast(`Reminder due: contact ${selectedLoad.driver} for ${selectedLoad.id}`);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Fleet Reminder", {
          body: `Contact ${selectedLoad.driver}: ${selectedLoad.id}`,
        });
      } else {
        alert(`Fleet Reminder

${message}`);
      }
    }, delay);
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setToast("Browser notifications are not supported here");
      return;
    }
    const permission = await Notification.requestPermission();
    setToast(permission === "granted" ? "Browser notifications enabled" : "Notifications not enabled");
  };

  const openWhatsApp = () => {
    if (!selectedLoad) return;
    const cleanPhone = driverPhone.replace(/[^0-9]/g, "");
    const message = encodeURIComponent(makeMessage(selectedLoad));
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  }; 

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-[260px] bg-[#0b2340] text-white flex-col px-4 py-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black">F</div>
            <div>
              <div className="text-2xl font-black tracking-tight">FLEET AI</div>
              <div className="text-blue-100 text-sm">Delay Assistant</div>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            {["Overview", "Loads", "Driver Alerts", "FleetHand Import", "Reports", "Settings"].map((item, index) => (
              <button key={item} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold ${index === 0 ? "bg-blue-600/25" : "text-blue-100 hover:bg-white/10"}`}>
                <span>{["⌂", "🚚", "⚠", "⇄", "▣", "⚙"][index]}</span>
                <span>{item}</span>
              </button>
            ))}
          </nav>

          <div className="border border-white/10 rounded-2xl p-4 bg-white/5">
            <div className="font-bold">FleetHand Sync</div>
            <div className="text-blue-100 text-sm mt-1">Demo mode · CSV/API ready</div>
          </div>
        </aside>

        <main className="flex-1 px-8 py-6 overflow-x-hidden">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Fleet Delay & Driver Notification Assistant</h1>
              <p className="text-slate-500 mt-1">ETA monitoring, late-risk detection and dispatcher action queue</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={addDemoLoad} className="h-12 px-5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm">＋ Import Demo Load</button>
              <button onClick={exportDispatcherReport} className="h-12 px-5 rounded-xl bg-blue-600 text-white font-bold shadow-sm hover:bg-blue-700 transition">↓ Export Dispatcher Report</button>
            </div>
          </header>

          {toast && (
            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="font-semibold">{toast}</span>
              <button onClick={() => setToast("")} className="font-black text-blue-500">×</button>
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-6">
            <KpiCard icon="🚚" label="Active Loads" value={loads.length} change="Live dispatch queue" tone="blue" />
            <KpiCard icon="🔴" label="High Risk" value={highRisk} change="Need dispatcher action" tone="red" />
            <KpiCard icon="🟠" label="Medium Risk" value={mediumRisk} change="Monitor ETA" tone="orange" />
            <KpiCard icon="📞" label="Not Contacted" value={notContacted} change="Driver notification needed" tone="purple" />
            <KpiCard icon="⏱" label="Delay Risks" value={delayed} change="GPS ETA conflict" tone="orange" />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5 mt-5">
            <LoadsPanel
              loads={filteredLoads}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              search={search}
              setSearch={setSearch}
              setSelectedLoad={setSelectedLoad}
              markContacted={markContacted}
            />

            <aside className="space-y-5">
              <ActionPanel
                load={selectedLoad}
                markContacted={markContacted}
                driverPhone={driverPhone}
                setDriverPhone={setDriverPhone}
                reminderTime={reminderTime}
                setReminderTime={setReminderTime}
                scheduleReminder={scheduleReminder}
                requestNotifications={requestNotifications}
                openWhatsApp={openWhatsApp}
                scheduledReminder={scheduledReminder}
              />
              <PriorityQueue loads={loads} setSelectedLoad={setSelectedLoad} />
            </aside>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
            <RiskChart />
            <DelayReasonChart />
            <AutomationPanel />
          </section>
        </main>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, change, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-500",
    purple: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${tones[tone]}`}>{icon}</div>
      <div>
        <div className="text-slate-500 font-semibold text-sm">{label}</div>
        <div className="text-3xl font-black mt-1">{value}</div>
        <div className="text-sm font-semibold mt-1 text-slate-500">{change}</div>
      </div>
    </div>
  );
}

function LoadsPanel({ loads, activeFilter, setActiveFilter, search, setSearch, setSelectedLoad, markContacted }) {
  const filters = ["All", "High Risk", "Delayed", "Not Contacted", "On Time"];

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h2 className="text-xl font-black">Active Loads</h2>
          <div className="relative w-full xl:w-80">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search load, driver, route..." className="w-full h-11 rounded-xl border border-slate-200 px-4 pr-10 outline-none focus:ring-2 focus:ring-blue-100" />
            <span className="absolute right-4 top-2.5 text-slate-400">⌕</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-4 py-2 rounded-lg border text-sm font-bold transition ${activeFilter === filter ? "border-blue-600 text-blue-700 bg-blue-50" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{filter}</button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-left">
              <th className="px-5 py-3 font-bold">Load</th>
              <th className="px-5 py-3 font-bold">Driver / Truck</th>
              <th className="px-5 py-3 font-bold">Route</th>
              <th className="px-5 py-3 font-bold">Pickup</th>
              <th className="px-5 py-3 font-bold">GPS ETA</th>
              <th className="px-5 py-3 font-bold">Risk</th>
              <th className="px-5 py-3 font-bold">Contacted</th>
              <th className="px-5 py-3 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loads.map((load) => (
              <tr key={load.id} onClick={() => setSelectedLoad(load)} className="border-t border-slate-100 hover:bg-slate-50/70 cursor-pointer">
                <td className="px-5 py-4"><div className="font-black text-slate-800">{load.id}</div><div className="text-slate-500 text-xs">{load.client}</div></td>
                <td className="px-5 py-4"><div className="font-bold">{load.driver}</div><div className="text-slate-500 text-xs">{load.truck}</div></td>
                <td className="px-5 py-4 font-semibold">{load.route}</td>
                <td className="px-5 py-4">{load.pickup}</td>
                <td className={`px-5 py-4 font-black ${load.status === "Delay Risk" ? "text-red-600" : "text-emerald-700"}`}>{load.gpsEta}</td>
                <td className="px-5 py-4"><RiskBadge risk={load.risk} /></td>
                <td className="px-5 py-4">{load.contacted ? <span className="text-emerald-700 font-bold">Yes</span> : <span className="text-red-600 font-bold">No</span>}</td>
                <td className="px-5 py-4"><button onClick={(e) => { e.stopPropagation(); markContacted(load.id); }} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100">Contact</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActionPanel({
  load,
  markContacted,
  driverPhone,
  setDriverPhone,
  reminderTime,
  setReminderTime,
  scheduleReminder,
  requestNotifications,
  openWhatsApp,
  scheduledReminder,
}) {
  if (!load) return null;
  const message = makeMessage(load);
  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black">Driver Notification</h2>
        <RiskBadge risk={load.risk} />
      </div>
      <div className="space-y-3 text-sm">
        <InfoRow label="Load" value={load.id} />
        <InfoRow label="Driver" value={load.driver} />
        <InfoRow label="Location" value={load.location} />
        <InfoRow label="Pickup" value={load.pickup} />
        <InfoRow label="GPS ETA" value={load.gpsEta} />
      </div>

      <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="text-slate-500 font-bold text-xs uppercase mb-2">Suggested WhatsApp / SMS message</div>
        <p className="text-slate-700 text-sm leading-relaxed">{message}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        <label className="text-sm font-bold text-slate-600">Driver phone number</label>
        <input
          value={driverPhone}
          onChange={(e) => setDriverPhone(e.target.value)}
          placeholder="+37060000000"
          className="h-11 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-blue-100"
        />

        <label className="text-sm font-bold text-slate-600">Reminder time</label>
        <input
          type="time"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="h-11 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {scheduledReminder && scheduledReminder.loadId === load.id && (
        <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 text-sm font-semibold">
          Reminder scheduled at {scheduledReminder.time} for {scheduledReminder.driver}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button onClick={copyMessage} className="h-11 rounded-xl border border-slate-200 font-bold hover:bg-slate-50">Copy Message</button>
        <button onClick={openWhatsApp} className="h-11 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">Open WhatsApp</button>
        <button onClick={requestNotifications} className="h-11 rounded-xl border border-slate-200 font-bold hover:bg-slate-50">Enable Alerts</button>
        <button onClick={scheduleReminder} className="h-11 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">Schedule Reminder</button>
        <button onClick={() => markContacted(load.id)} className="col-span-2 h-11 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800">Mark Contacted</button>
      </div>
    </section>
  );
}

function PriorityQueue({ loads, setSelectedLoad }) {
  const priority = loads.filter((load) => load.risk !== "Low" || !load.contacted).slice(0, 5);
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-xl font-black mb-4">Priority Queue</h2>
      <div className="space-y-3">
        {priority.map((load) => (
          <button key={load.id} onClick={() => setSelectedLoad(load)} className="w-full text-left border border-slate-100 rounded-xl p-3 hover:bg-slate-50">
            <div className="flex items-center justify-between"><span className="font-black">{load.id}</span><RiskBadge risk={load.risk} /></div>
            <div className="text-slate-500 text-sm mt-1">{load.driver} · {load.route}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

function RiskChart() {
  return (
    <ChartCard title="Weekly Risk Overview" action="7D">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={weeklyRiskData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip />
          <Bar dataKey="low" stackId="a" fill="#22c55e" />
          <Bar dataKey="medium" stackId="a" fill="#f59e0b" />
          <Bar dataKey="high" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function DelayReasonChart() {
  return (
    <ChartCard title="Delay Root Causes" action="30D">
      <div className="grid grid-cols-[150px_1fr] gap-4 items-center min-h-[260px]">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={delayReasons} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {delayReasons.map((entry, index) => <Cell key={entry.name} fill={pieColors[index]} />)}
            </Pie>
            <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-3">
          {delayReasons.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[index] }} /><span className="text-slate-600">{item.name}</span></div>
              <span className="font-black">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function AutomationPanel() {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-lg font-black mb-4">Automation Rules</h2>
      <div className="space-y-3">
        <Rule title="ETA exceeds pickup time" status="Enabled" />
        <Rule title="Driver not contacted" status="Enabled" />
        <Rule title="High risk after 30 min" status="Enabled" />
        <Rule title="Export dispatcher summary" status="Ready" />
      </div>
    </section>
  );
}

function Rule({ title, status }) {
  return <div className="flex items-center justify-between border border-slate-100 rounded-xl p-3"><span className="font-semibold">{title}</span><span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg font-bold text-sm">{status}</span></div>;
}

function ChartCard({ title, action, children }) {
  return <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-black">{title}</h2><button className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600">{action}</button></div>{children}</section>;
}

function InfoRow({ label, value }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-slate-500">{label}</span><span className="font-bold text-right">{value}</span></div>;
}

function RiskBadge({ risk }) {
  const styles = { Low: "bg-emerald-50 text-emerald-700", Medium: "bg-orange-50 text-orange-700", High: "bg-red-50 text-red-700" };
  return <span className={`px-3 py-1 rounded-lg font-bold ${styles[risk]}`}>{risk}</span>;
}
