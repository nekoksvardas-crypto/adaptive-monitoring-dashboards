import { useEffect, useMemo, useState } from "react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const DEFAULT_SESSION = [12, 8, 19, 4, 27, 31, 0, 22];
const DEFAULT_HISTORY = [62, 68, 64, 71, 76, 73, 81, 87];
const DEFAULT_OCR_EVENTS = [
  { time: "09:12", type: "Shipment", id: "SHP-4821", status: "Recognized", confidence: 94, severity: "normal" },
  { time: "09:16", type: "Invoice", id: "INV-1048", status: "Processed", confidence: 91, severity: "normal" },
  { time: "09:21", type: "Barcode", id: "BC-7732", status: "Detected", confidence: 88, severity: "normal" },
  { time: "09:28", type: "Delivery", id: "DLV-2190", status: "Delay Warning", confidence: 82, severity: "warning" },
];

const EURO_WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
  10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
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

function getNeighbors(center) {
  const idx = EURO_WHEEL.indexOf(center);
  if (idx === -1) return [];
  const values = new Set();
  for (let i = -9; i <= 9; i += 1) {
    values.add(EURO_WHEEL[(idx + i + EURO_WHEEL.length) % EURO_WHEEL.length]);
  }
  return [...values].sort((a, b) => a - b);
}

function createStrategy(startCenter, name) {
  return {
    name,
    balance: 100,
    center: startCenter,
    covered: getNeighbors(startCenter),
    consecutiveLosses: 0,
    waitingForSignal: true,
    martingaleLevel: 0,
    currentBet: 0,
    balances: [100],
    cycles: 0,
    wins: 0,
    losses: 0,
    status: "Waiting for 2 losses...",
  };
}

function processStrategy(num, strategy, baseBet) {
  const s = {
    ...strategy,
    covered: [...strategy.covered],
    balances: [...strategy.balances],
  };

  const hit = s.covered.includes(num);

  if (s.waitingForSignal) {
    s.currentBet = 0;
    if (!hit) {
      s.consecutiveLosses += 1;
      if (s.consecutiveLosses >= 2) {
        s.waitingForSignal = false;
        s.martingaleLevel = 0;
        s.status = "SIGNAL: recovery mode active";
      } else {
        s.status = "Waiting for 2 losses...";
      }
    } else {
      s.consecutiveLosses = 0;
      s.status = "Waiting for 2 losses...";
    }
  } else {
    const betPerNumber = baseBet * 2 ** s.martingaleLevel;
    const totalBet = betPerNumber * 19;
    s.currentBet = Number(betPerNumber.toFixed(5));

    if (hit) {
      s.balance += 36 * betPerNumber - totalBet + betPerNumber;
      s.waitingForSignal = true;
      s.martingaleLevel = 0;
      s.consecutiveLosses = 0;
      s.wins += 1;
      s.status = "WIN: waiting for next signal";

      if (s.name === "0 → 36") {
        s.center = s.center < 36 ? s.center + 1 : 0;
        if (s.center === 0) s.cycles += 1;
      } else {
        s.center = s.center > 0 ? s.center - 1 : 36;
        if (s.center === 36) s.cycles += 1;
      }
      s.covered = getNeighbors(s.center);
    } else {
      s.balance -= totalBet;
      s.martingaleLevel += 1;
      s.losses += 1;
      s.status = `LOSS: next level x${2 ** s.martingaleLevel}`;
    }
  }

  s.balance = Number(s.balance.toFixed(4));
  s.balances.push(s.balance);
  return s;
}

function randomId(prefix) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 8999)}`;
}

function makeOcrEvent() {
  const types = ["Shipment", "Invoice", "Barcode", "CMR", "POD", "Warehouse Label", "Delivery Note"];
  const statuses = ["Recognized", "Processed", "Detected", "Classified", "Delay Warning", "Mismatch Alert", "Low Confidence"];
  const type = types[Math.floor(Math.random() * types.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const confidence = Math.floor(72 + Math.random() * 27);
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const severity = status.includes("Warning") || status.includes("Alert") || status.includes("Low") ? "warning" : "normal";
  const prefix = type === "Shipment" ? "SHP" : type === "Invoice" ? "INV" : type === "Barcode" ? "BC" : type === "CMR" ? "CMR" : type === "POD" ? "POD" : "DOC";

  return { time, type, id: randomId(prefix), status, confidence, severity };
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [inputValue, setInputValue] = useState("");
  const [rouletteInput, setRouletteInput] = useState("");

  const [sessionItems, setSessionItems] = useState(() => safeLoadArray("monitoring-session", DEFAULT_SESSION));
  const [history, setHistory] = useState(() => safeLoadArray("monitoring-history", DEFAULT_HISTORY));
  const [dailyHistory, setDailyHistory] = useState(() => safeLoadArray("daily-performance-history", []));
  const [ocrEvents, setOcrEvents] = useState(() => safeLoadArray("ocr-events-history", DEFAULT_OCR_EVENTS));
  const [ocrTrend, setOcrTrend] = useState(() => safeLoadArray("ocr-trend-history", [88, 91, 87, 94, 90, 96, 92, 95]));

  const [events, setEvents] = useState([
    "Signal cluster detected",
    "Adaptive probability updated",
    "OCR event captured",
    "Monitoring state synchronized",
    "Live dashboard refreshed",
  ]);

  const [strategyA, setStrategyA] = useState(() => createStrategy(0, "0 → 36"));
  const [strategyB, setStrategyB] = useState(() => createStrategy(36, "36 → 0"));
  const [spinCount, setSpinCount] = useState(0);

  const baseBet = 0.01;

  useEffect(() => localStorage.setItem("monitoring-session", JSON.stringify(sessionItems)), [sessionItems]);
  useEffect(() => localStorage.setItem("monitoring-history", JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem("daily-performance-history", JSON.stringify(dailyHistory)), [dailyHistory]);
  useEffect(() => localStorage.setItem("ocr-events-history", JSON.stringify(ocrEvents)), [ocrEvents]);
  useEffect(() => localStorage.setItem("ocr-trend-history", JSON.stringify(ocrTrend)), [ocrTrend]);

  const stats = useMemo(() => ({
    low: sessionItems.filter((n) => n >= 1 && n <= 18).length,
    high: sessionItems.filter((n) => n >= 19).length,
    even: sessionItems.filter((n) => n !== 0 && n % 2 === 0).length,
    odd: sessionItems.filter((n) => n % 2 === 1).length,
    zero: sessionItems.filter((n) => n === 0).length,
    total: sessionItems.length,
  }), [sessionItems]);

  const chartData = history.map((value, index) => ({ id: index + 1, value }));

  const rouletteChartData = strategyA.balances.map((value, index) => {
    const aBalance = value;
    const bBalance = strategyB.balances[index] ?? strategyB.balances[strategyB.balances.length - 1];
    return { id: index + 1, a: Number((aBalance - 100).toFixed(4)), b: Number((bBalance - 100).toFixed(4)) };
  });

  const combinedPL = Number((strategyA.balance + strategyB.balance - 200).toFixed(2));
  const totalWins = strategyA.wins + strategyB.wins;
  const totalLosses = strategyA.losses + strategyB.losses;
  const combinedWinRate = totalWins + totalLosses > 0 ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(2) : "0.00";

  const dailyChartData = dailyHistory.map((day, index) => ({ id: index + 1, value: day.cumulative, daily: day.pl, date: day.date }));
  const totalDailyPL = Number(dailyHistory.reduce((sum, day) => sum + day.pl, 0).toFixed(2));
  const winDays = dailyHistory.filter((day) => day.pl > 0).length;
  const lossDays = dailyHistory.filter((day) => day.pl < 0).length;
  const bestDay = dailyHistory.length ? Math.max(...dailyHistory.map((day) => day.pl)) : 0;
  const worstDay = dailyHistory.length ? Math.min(...dailyHistory.map((day) => day.pl)) : 0;

  const ocrChartData = ocrTrend.map((value, index) => ({ id: index + 1, confidence: value }));
  const latestOcrConfidence = ocrEvents.length ? ocrEvents[0].confidence : 0;
  const activeAlerts = ocrEvents.filter((event) => event.severity === "warning").length;
  const processedDocs = ocrEvents.length;
  const avgOcrConfidence = processedDocs ? Math.round(ocrEvents.reduce((sum, event) => sum + event.confidence, 0) / processedDocs) : 0;
  const ocrTypeData = ["Shipment", "Invoice", "Barcode", "CMR", "POD", "Warehouse Label", "Delivery Note"].map((type) => ({
    type,
    count: ocrEvents.filter((event) => event.type === type).length,
  }));

  const addFeed = (message) => setEvents((prev) => [message, ...prev.slice(0, 4)]);

  const addEvent = () => {
    const value = Number(inputValue);
    if (Number.isNaN(value) || value < 0 || value > 36) return;
    setSessionItems((prev) => [...prev, value]);
    setHistory((prev) => [...prev.slice(-11), Math.floor(60 + Math.random() * 35)]);
    addFeed("Live sequence processed");
    setInputValue("");
  };

  const simulateEvent = () => {
    const randomValue = Math.floor(Math.random() * 37);
    setSessionItems((prev) => [...prev, randomValue]);
    setHistory((prev) => [...prev.slice(-11), Math.floor(60 + Math.random() * 35)]);
    addFeed(`Simulated event captured: ${randomValue}`);
  };

  const exportCSV = () => {
    const csv = sessionItems.join(",");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "monitoring-session.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const processRouletteSpin = () => {
    const value = Number(rouletteInput);
    if (Number.isNaN(value) || value < 0 || value > 36 || !Number.isInteger(value)) return;
    setStrategyA((prev) => processStrategy(value, prev, baseBet));
    setStrategyB((prev) => processStrategy(value, prev, baseBet));
    setSpinCount((prev) => prev + 1);
    addFeed(`Roulette analytics processed: ${value}`);
    setRouletteInput("");
  };

  const closeDay = () => {
    const today = new Date().toLocaleDateString("en-GB");
    const previousCumulative = dailyHistory.length ? dailyHistory[dailyHistory.length - 1].cumulative : 0;
    const dayRecord = { date: today, pl: combinedPL, cumulative: Number((previousCumulative + combinedPL).toFixed(2)), spins: spinCount };
    setDailyHistory((prev) => [...prev, dayRecord]);
    setStrategyA(createStrategy(0, "0 → 36"));
    setStrategyB(createStrategy(36, "36 → 0"));
    setSpinCount(0);
    addFeed(`Day closed and saved: ${combinedPL >= 0 ? "+" : ""}${combinedPL.toFixed(2)} P/L`);
  };

  const clearDailyHistory = () => {
    setDailyHistory([]);
    addFeed("Daily performance history cleared");
  };

  const resetRoulette = () => {
    setStrategyA(createStrategy(0, "0 → 36"));
    setStrategyB(createStrategy(36, "36 → 0"));
    setSpinCount(0);
    addFeed("Roulette module reset");
  };

  const simulateOcrScan = () => {
    const event = makeOcrEvent();
    setOcrEvents((prev) => [event, ...prev].slice(0, 20));
    setOcrTrend((prev) => [...prev.slice(-11), event.confidence]);
    addFeed(`OCR processed: ${event.id}`);
  };

  const clearOcrData = () => {
    setOcrEvents([]);
    setOcrTrend([80, 82, 84, 86, 88, 90, 92, 94]);
    addFeed("OCR monitor cleared");
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <Header simulateEvent={simulateEvent} exportCSV={exportCSV} />

        <div className="flex gap-3 mt-8 mb-8 flex-wrap">
          <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>Main Dashboard</TabButton>
          <TabButton active={activeTab === "roulette"} onClick={() => setActiveTab("roulette")}>Roulette Strategy Module</TabButton>
          <TabButton active={activeTab === "ocr"} onClick={() => setActiveTab("ocr")}>OCR Operations Monitor</TabButton>
        </div>

        {activeTab === "dashboard" ? (
          <MainDashboard
            stats={stats}
            events={events}
            dailyHistory={dailyHistory}
            dailyChartData={dailyChartData}
            totalDailyPL={totalDailyPL}
            winDays={winDays}
            lossDays={lossDays}
            bestDay={bestDay}
            worstDay={worstDay}
            currentSessionPL={combinedPL}
            closeDay={closeDay}
            clearDailyHistory={clearDailyHistory}
          />
        ) : activeTab === "roulette" ? (
          <RouletteModule
            strategyA={strategyA}
            strategyB={strategyB}
            rouletteInput={rouletteInput}
            setRouletteInput={setRouletteInput}
            processRouletteSpin={processRouletteSpin}
            resetRoulette={resetRoulette}
            rouletteChartData={rouletteChartData}
            spinCount={spinCount}
            combinedPL={combinedPL}
            combinedWinRate={combinedWinRate}
          />
        ) : (
          <OcrOperationsMonitor
            ocrEvents={ocrEvents}
            ocrChartData={ocrChartData}
            ocrTypeData={ocrTypeData}
            simulateOcrScan={simulateOcrScan}
            clearOcrData={clearOcrData}
            latestOcrConfidence={latestOcrConfidence}
            activeAlerts={activeAlerts}
            processedDocs={processedDocs}
            avgOcrConfidence={avgOcrConfidence}
          />
        )}
      </div>
    </div>
  );
}

function Header({ simulateEvent, exportCSV }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
      <div>
        <div className="text-cyan-400 text-sm tracking-[0.3em] uppercase mb-3">AI-Assisted Automation System</div>
        <h1 className="text-5xl font-black leading-tight">Real-Time Monitoring & Signal Dashboard</h1>
        <p className="text-slate-400 mt-4 max-w-2xl">Operations monitoring, strategy modules, OCR simulation, CSV export and adaptive dashboard logic.</p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <button onClick={simulateEvent} className="bg-cyan-500 hover:bg-cyan-400 transition px-6 py-3 rounded-2xl font-semibold text-black">Simulate Event</button>
          <button onClick={exportCSV} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 transition px-6 py-3 rounded-2xl font-semibold">Export CSV</button>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-4 rounded-2xl">
          <div className="text-xs text-emerald-300 uppercase">System Status</div>
          <div className="text-3xl font-black text-emerald-400">ONLINE</div>
        </div>
      </div>
    </div>
  );
}

function MainDashboard({ stats, events, dailyHistory, dailyChartData, totalDailyPL, winDays, lossDays, bestDay, worstDay, currentSessionPL, closeDay, clearDailyHistory }) {
  return (
    <>
      <div className="grid md:grid-cols-4 gap-5 mt-10">
        <MetricCard title="Current Session P/L" value={`${currentSessionPL >= 0 ? "+" : ""}${currentSessionPL.toFixed(2)}`} subtitle="Pulled from strategy module" />
        <MetricCard title="Total Saved P/L" value={`${totalDailyPL >= 0 ? "+" : ""}${totalDailyPL.toFixed(2)}`} subtitle="All closed days" />
        <MetricCard title="Win / Loss Days" value={`${winDays}/${lossDays}`} subtitle="Positive vs negative days" />
        <MetricCard title="Best / Worst Day" value={`${bestDay >= 0 ? "+" : ""}${bestDay.toFixed(2)} / ${worstDay >= 0 ? "+" : ""}${worstDay.toFixed(2)}`} subtitle="Daily performance range" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-[#08152b] border border-slate-800 rounded-3xl p-6">
          <h2 className="text-3xl font-bold">Daily Performance Control</h2>
          <p className="text-slate-400 mt-2">The dashboard automatically reads the current P/L from the strategy module. Close the day to save it into the long-term history.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <button onClick={closeDay} className="bg-emerald-500 hover:bg-emerald-400 transition px-6 py-4 rounded-2xl font-semibold text-black">Close Day / Save P&L</button>
            <button onClick={clearDailyHistory} className="bg-rose-900/50 border border-rose-500/30 hover:bg-rose-800/50 transition px-6 py-4 rounded-2xl">Clear Daily History</button>
          </div>
        </div>
        <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
          <h2 className="text-3xl font-bold">Session Stats</h2>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <StatBox label="Low" value={stats.low} />
            <StatBox label="High" value={stats.high} />
            <StatBox label="Even" value={stats.even} />
            <StatBox label="Odd" value={stats.odd} />
            <StatBox label="Zero" value={stats.zero} />
            <StatBox label="Total" value={stats.total} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <DailyPerformanceChart data={dailyChartData} />
        <EventFeed events={events} />
      </div>

      <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6 mt-8">
        <h2 className="text-3xl font-bold mb-5">Daily History</h2>
        {dailyHistory.length === 0 ? (
          <p className="text-slate-500">No closed days yet. Use the strategy module, then press Close Day / Save P&L.</p>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {dailyHistory.map((day, index) => (
              <div key={`${day.date}-${index}`} className="bg-[#0d1524] border border-slate-800 rounded-2xl p-4">
                <div className="text-slate-500 text-sm">Day {index + 1} · {day.date}</div>
                <div className={`text-3xl font-black mt-2 ${day.pl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{day.pl >= 0 ? "+" : ""}{day.pl.toFixed(2)}</div>
                <div className="text-slate-500 text-sm mt-2">Cumulative: {day.cumulative >= 0 ? "+" : ""}{day.cumulative.toFixed(2)} · Spins: {day.spins}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function RouletteModule({ strategyA, strategyB, rouletteInput, setRouletteInput, processRouletteSpin, resetRoulette, rouletteChartData, spinCount, combinedPL, combinedWinRate }) {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#08152b] border border-slate-800 rounded-3xl p-6">
          <h2 className="text-3xl font-bold">Roulette Dual Strategy Analytics</h2>
          <p className="text-slate-400 mt-2">Converted from your Python CustomTkinter strategy into a React portfolio module.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <input type="number" value={rouletteInput} onChange={(e) => setRouletteInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && processRouletteSpin()} placeholder="Enter spin 0-36" className="bg-[#020817] border border-slate-700 rounded-2xl px-5 py-4 flex-1 min-w-[220px] outline-none" />
            <button onClick={processRouletteSpin} className="bg-cyan-500 hover:bg-cyan-400 transition px-6 py-4 rounded-2xl font-semibold text-black">Process Spin</button>
            <button onClick={resetRoulette} className="bg-rose-900/50 border border-rose-500/30 hover:bg-rose-800/50 transition px-6 py-4 rounded-2xl">Reset Module</button>
          </div>
        </div>
        <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
          <h2 className="text-3xl font-bold">Module Stats</h2>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <StatBox label="Spins" value={spinCount} />
            <StatBox label="Combined P/L" value={`${combinedPL >= 0 ? "+" : ""}${combinedPL.toFixed(2)}`} />
            <StatBox label="Win Rate" value={`${combinedWinRate}%`} />
            <StatBox label="Base Bet" value="$0.01" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <StrategyCard strategy={strategyA} color="cyan" />
        <StrategyCard strategy={strategyB} color="rose" />
      </div>

      <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Strategy P/L Curves</h2>
            <p className="text-slate-400 mt-2">Separate profit/loss curves for each strategy. Zero line represents break-even.</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-xl text-cyan-400 text-sm">LIVE MODULE</div>
        </div>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rouletteChartData} margin={{ top: 20, right: 35, left: 5, bottom: 10 }}>
              <defs>
                <linearGradient id="strategyBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="strategyPink" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
              <XAxis dataKey="id" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[(dataMin) => Math.min(-1, Math.floor(dataMin - 2)), (dataMax) => Math.max(1, Math.ceil(dataMax + 2))]} tickFormatter={(value) => `${value > 0 ? "+" : ""}${value}`} />
              <Tooltip contentStyle={{ background: "#020817", border: "1px solid #334155", borderRadius: "14px", color: "#fff" }} formatter={(value, name) => [`${value > 0 ? "+" : ""}${Number(value).toFixed(2)} P/L`, name]} labelFormatter={(label) => `Spin ${label}`} />
              <Legend wrapperStyle={{ color: "#cbd5e1" }} />
              <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="6 6" opacity={0.7} />
              <Area type="monotone" dataKey="a" name="0 → 36 Strategy" stroke="#38bdf8" fill="url(#strategyBlue)" strokeWidth={4} dot={false} activeDot={false} />
              <Area type="monotone" dataKey="b" name="36 → 0 Strategy" stroke="#fb7185" fill="url(#strategyPink)" strokeWidth={4} dot={false} activeDot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function OcrOperationsMonitor({ ocrEvents, ocrChartData, ocrTypeData, simulateOcrScan, clearOcrData, latestOcrConfidence, activeAlerts, processedDocs, avgOcrConfidence }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-5">
        <MetricCard title="OCR Confidence" value={`${latestOcrConfidence}%`} subtitle="Latest detection confidence" />
        <MetricCard title="Documents Processed" value={processedDocs} subtitle="Simulated OCR events" />
        <MetricCard title="Active Alerts" value={activeAlerts} subtitle="Warnings and anomalies" />
        <MetricCard title="Average Accuracy" value={`${avgOcrConfidence}%`} subtitle="Across captured events" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#08152b] border border-slate-800 rounded-3xl p-6">
          <h2 className="text-3xl font-bold">OCR Operations Monitor</h2>
          <p className="text-slate-400 mt-2">Simulated logistics OCR pipeline for shipments, invoices, barcodes, CMR, POD and warehouse labels.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <button onClick={simulateOcrScan} className="bg-cyan-500 hover:bg-cyan-400 transition px-6 py-4 rounded-2xl font-semibold text-black">Simulate OCR Scan</button>
            <button onClick={clearOcrData} className="bg-rose-900/50 border border-rose-500/30 hover:bg-rose-800/50 transition px-6 py-4 rounded-2xl">Clear OCR Data</button>
          </div>
        </div>
        <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
          <h2 className="text-3xl font-bold">AI Pipeline Status</h2>
          <div className="space-y-3 mt-6">
            <StatusPill label="OCR Engine" value="ONLINE" color="emerald" />
            <StatusPill label="Auto Classification" value="ACTIVE" color="cyan" />
            <StatusPill label="Anomaly Detection" value="ENABLED" color="orange" />
            <StatusPill label="Data Export" value="READY" color="violet" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <OcrConfidenceChart data={ocrChartData} />
        <OcrTypeChart data={ocrTypeData} />
      </div>

      <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
        <h2 className="text-3xl font-bold mb-5">Live Detection Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Document Type</th>
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {ocrEvents.map((event, index) => (
                <tr key={`${event.id}-${index}`} className="border-b border-slate-900 hover:bg-slate-900/40">
                  <td className="py-3 px-3 text-slate-300">{event.time}</td>
                  <td className="py-3 px-3 font-bold">{event.type}</td>
                  <td className="py-3 px-3 text-cyan-300">{event.id}</td>
                  <td className={`py-3 px-3 font-bold ${event.severity === "warning" ? "text-orange-300" : "text-emerald-300"}`}>{event.status}</td>
                  <td className="py-3 px-3">{event.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function DailyPerformanceChart({ data }) {
  const fallbackData = data.length ? data : [{ id: 1, value: 0, daily: 0, date: "No data" }];
  return (
    <div className="lg:col-span-2 bg-[#08152b] border border-slate-800 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">All-Time Daily P/L Analytics</h2>
          <p className="text-slate-400 mt-2">Cumulative performance from closed days.</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-xl text-cyan-400 text-sm">DAILY TRACKING</div>
      </div>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fallbackData}>
            <defs>
              <linearGradient id="dailyPL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="id" stroke="#64748b" />
            <YAxis stroke="#64748b" tickFormatter={(value) => `${value > 0 ? "+" : ""}${value}`} />
            <Tooltip contentStyle={{ background: "#020817", border: "1px solid #334155", borderRadius: "14px", color: "#fff" }} formatter={(value, name) => [`${value > 0 ? "+" : ""}${Number(value).toFixed(2)}`, name === "value" ? "Cumulative P/L" : "Daily P/L"]} labelFormatter={(label) => `Day ${label}`} />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="6 6" opacity={0.7} />
            <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#dailyPL)" strokeWidth={4} dot={false} activeDot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StrategyCard({ strategy, color }) {
  const pl = strategy.balance - 100;
  const colorClass = color === "cyan" ? "text-cyan-300" : "text-rose-300";
  const borderClass = color === "cyan" ? "border-l-cyan-400" : "border-l-rose-400";
  const winRate = strategy.wins + strategy.losses > 0 ? ((strategy.wins / (strategy.wins + strategy.losses)) * 100).toFixed(2) : "0.00";
  return (
    <div className={`bg-[#08152b] border border-slate-800 border-l-4 ${borderClass} rounded-3xl p-6`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className={`text-3xl font-black ${colorClass}`}>{strategy.name}</h3>
          <p className="text-slate-400 mt-2">Center: {strategy.center} · Covered numbers: {strategy.covered.join(", ")}</p>
        </div>
        <div className="text-right">
          <div className="text-slate-500 text-sm">Balance</div>
          <div className="text-4xl font-black">${strategy.balance.toFixed(2)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        <StatBox label="P/L" value={`${pl >= 0 ? "+" : ""}${pl.toFixed(2)}`} />
        <StatBox label="Bet / Num" value={strategy.currentBet.toFixed(5)} />
        <StatBox label="Wins" value={strategy.wins} />
        <StatBox label="Losses" value={strategy.losses} />
        <StatBox label="Win Rate" value={`${winRate}%`} />
      </div>
      <div className="mt-6 bg-[#020817] border border-slate-800 rounded-2xl p-4">
        <div className="text-slate-500 text-sm">Status</div>
        <div className={`font-bold mt-1 ${strategy.status.includes("WIN") ? "text-emerald-300" : strategy.status.includes("LOSS") ? "text-orange-300" : "text-slate-300"}`}>{strategy.status}</div>
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

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
      <div className="text-slate-400 text-sm">{title}</div>
      <div className="text-5xl font-black mt-3">{value}</div>
      <div className="text-slate-500 mt-3 text-sm">{subtitle}</div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-[#0d1524] border border-slate-800 rounded-2xl p-4">
      <div className="text-slate-500 text-sm">{label}</div>
      <div className="text-2xl md:text-3xl font-black mt-2">{value}</div>
    </div>
  );
}
