import { useEffect, useMemo, useState } from 'react';

const DEFAULT_SESSION = [12, 8, 19, 4, 27, 31, 0, 22];
const DEFAULT_HISTORY = [62, 68, 64, 71, 76, 73, 81, 87];

const safeLoadArray = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export default function RealtimeMonitoringSignalDashboard() {
  const [inputValue, setInputValue] = useState('');
  const [sessionItems, setSessionItems] = useState(() =>
    safeLoadArray('monitoring-session', DEFAULT_SESSION)
  );
  const [history, setHistory] = useState(() =>
    safeLoadArray('monitoring-history', DEFAULT_HISTORY)
  );
  const [events, setEvents] = useState([
    'Signal cluster detected',
    'Adaptive probability updated',
    'OCR event captured',
    'Monitoring state synchronized',
    'Live dashboard refreshed',
  ]);

  const [signal, setSignal] = useState(87);
  const [ocr, setOcr] = useState(84);
  const [workflow, setWorkflow] = useState(96);
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    localStorage.setItem('monitoring-session', JSON.stringify(sessionItems));
  }, [sessionItems]);

  useEffect(() => {
    localStorage.setItem('monitoring-history', JSON.stringify(history));
  }, [history]);

  const heatmap = useMemo(() => {
    return Array.from({ length: 64 }, (_, index) => {
      const related = sessionItems[index % Math.max(sessionItems.length, 1)] || 0;
      return Math.min(1, 0.2 + related / 37 + Math.random() * 0.35);
    });
  }, [sessionItems]);

  const sessionStats = useMemo(() => {
    const total = sessionItems.length;
    const zeros = sessionItems.filter((n) => n === 0).length;
    const high = sessionItems.filter((n) => n >= 19 && n <= 36).length;
    const low = sessionItems.filter((n) => n >= 1 && n <= 18).length;
    const even = sessionItems.filter((n) => n !== 0 && n % 2 === 0).length;
    const odd = sessionItems.filter((n) => n !== 0 && n % 2 === 1).length;

    return { total, zeros, high, low, even, odd };
  }, [sessionItems]);

  const addEvent = (label) => {
    setEvents((prev) => [label, ...prev].slice(0, 8));
  };

  const recalculateMetrics = (items) => {
    const total = Math.max(items.length, 1);
    const unique = new Set(items).size;
    const last = items[items.length - 1] ?? 0;
    const highCount = items.filter((n) => n >= 19 && n <= 36).length;
    const evenCount = items.filter((n) => n !== 0 && n % 2 === 0).length;

    const nextSignal = Math.min(98, Math.round(45 + unique * 1.4 + (last % 10) * 2));
    const nextOcr = Math.min(98, Math.round(70 + Math.random() * 18));
    const nextWorkflow = Math.min(99, Math.round(65 + (highCount / total) * 30));
    const nextLatency = Math.round(8 + Math.random() * 20);
    const trendValue = Math.min(98, Math.round(45 + (evenCount / total) * 40 + Math.random() * 10));

    setSignal(nextSignal);
    setOcr(nextOcr);
    setWorkflow(nextWorkflow);
    setLatency(nextLatency);
    setHistory((prev) => [...prev.slice(1), trendValue]);
  };

  const addManualInput = () => {
    const raw = inputValue.trim();
    const value = Number(raw);

    if (raw === '' || Number.isNaN(value) || value < 0 || value > 36 || !Number.isInteger(value)) {
      addEvent('Invalid input ignored');
      setInputValue('');
      return;
    }

    const nextItems = [...sessionItems, value].slice(-40);
    setSessionItems(nextItems);
    setInputValue('');
    addEvent(`Manual event added: ${value}`);
    recalculateMetrics(nextItems);
  };

  const removeLast = () => {
    const nextItems = sessionItems.slice(0, -1);
    setSessionItems(nextItems);
    addEvent('Last manual event removed');
    recalculateMetrics(nextItems);
  };

  const resetSession = () => {
    setSessionItems([]);
    setHistory(DEFAULT_HISTORY);
    setSignal(50);
    setOcr(80);
    setWorkflow(70);
    setLatency(14);
    addEvent('Session reset completed');
  };

  const simulateEvent = () => {
    const value = Math.floor(Math.random() * 37);
    const nextItems = [...sessionItems, value].slice(-40);
    setSessionItems(nextItems);
    addEvent(`Simulated event captured: ${value}`);
    recalculateMetrics(nextItems);
  };

  const exportCSV = () => {
    const rows = ['index,value', ...sessionItems.map((item, index) => `${index + 1},${item}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'monitoring-session.csv';
    link.click();
    URL.revokeObjectURL(url);
    addEvent('Session exported to CSV');
  };

  const cards = [
    { title: 'Live Signal Strength', value: `${signal}%`, subtitle: 'Adaptive confidence engine' },
    { title: 'Events Tracked', value: sessionStats.total, subtitle: 'Manual + simulated inputs' },
    { title: 'OCR Event Feed', value: 'READY', subtitle: 'Prepared for screen recognition' },
    { title: 'Workflow Sync', value: `${workflow}%`, subtitle: 'Session stability tracking' },
  ];

  return (
    <div className="min-h-screen bg-[#07111f] text-white px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <Header simulateEvent={simulateEvent} exportCSV={exportCSV} />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          {cards.map((card) => (
            <InfoCard key={card.title} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <ManualInputPanel
            inputValue={inputValue}
            setInputValue={setInputValue}
            addManualInput={addManualInput}
            removeLast={removeLast}
            resetSession={resetSession}
          />
          <SessionStats stats={sessionStats} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Heatmap heatmap={heatmap} />
          <EventFeed events={events} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <SignalTrend history={history} />
          <SystemOverview signal={signal} ocr={ocr} workflow={workflow} latency={latency} />
        </div>

        <SessionHistory sessionItems={sessionItems} />
      </div>
    </div>
  );
}

function Header({ simulateEvent, exportCSV }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
      <div>
        <div className="text-cyan-400 text-sm font-semibold tracking-[0.3em] mb-3">
          AI-ASSISTED AUTOMATION SYSTEM
        </div>
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight">
          Real-Time Monitoring & Signal Dashboard
        </h1>
        <p className="text-slate-400 mt-3 text-lg max-w-3xl">
          Manual input tracking, live signal analysis, session history, CSV export and adaptive decision-support logic.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={simulateEvent} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-lg shadow-cyan-500/20">
          Simulate Event
        </button>
        <button onClick={exportCSV} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-2xl border border-slate-700">
          Export CSV
        </button>
        <div className="bg-emerald-500/15 border border-emerald-500/30 px-5 py-3 rounded-2xl">
          <div className="text-xs text-emerald-300 font-bold">SYSTEM STATUS</div>
          <div className="text-2xl font-black text-emerald-400">ONLINE</div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, value, subtitle }) {
  return (
    <div className="bg-[#101b2d] border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <div className="text-slate-400 text-sm mb-3">{title}</div>
      <div className="text-4xl font-black mb-3">{value}</div>
      <div className="text-slate-500">{subtitle}</div>
    </div>
  );
}

function ManualInputPanel({ inputValue, setInputValue, addManualInput, removeLast, resetSession }) {
  return (
    <div className="bg-[#101b2d] border border-slate-800 rounded-3xl p-6 xl:col-span-2">
      <h2 className="text-2xl font-black mb-4">Manual Input Panel</h2>
      <p className="text-slate-400 mb-5">
        Enter values from 0 to 36. The dashboard recalculates metrics and updates the session automatically.
      </p>
      <div className="flex flex-col md:flex-row gap-3">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addManualInput()}
          placeholder="Enter event value 0-36"
          className="flex-1 bg-[#0d1524] border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-400"
        />
        <button onClick={addManualInput} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-4 rounded-2xl">
          Add Event
        </button>
        <button onClick={removeLast} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-4 rounded-2xl border border-slate-700">
          Undo
        </button>
        <button onClick={resetSession} className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold px-6 py-4 rounded-2xl border border-red-500/30">
          Reset
        </button>
      </div>
    </div>
  );
}

function SessionStats({ stats }) {
  return (
    <div className="bg-[#101b2d] border border-slate-800 rounded-3xl p-6">
      <h2 className="text-2xl font-black mb-4">Session Stats</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Low" value={stats.low} />
        <StatBox label="High" value={stats.high} />
        <StatBox label="Even" value={stats.even} />
        <StatBox label="Odd" value={stats.odd} />
        <StatBox label="Zero" value={stats.zeros} />
        <StatBox label="Total" value={stats.total} />
      </div>
    </div>
  );
}

function Heatmap({ heatmap }) {
  return (
    <div className="xl:col-span-2 bg-[#101b2d] border border-slate-800 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black">Live Signal Heatmap</h2>
          <p className="text-slate-400 mt-1">Dynamic monitoring engine with adaptive visualization.</p>
        </div>
        <div className="bg-cyan-500/15 border border-cyan-500/30 px-4 py-2 rounded-xl text-cyan-300 text-sm font-bold">
          LIVE TRACKING
        </div>
      </div>
      <div className="grid grid-cols-8 gap-3">
        {heatmap.map((intensity, index) => (
          <div
            key={index}
            className="aspect-square rounded-xl transition-all duration-300 border border-cyan-300/10"
            style={{ background: `rgba(34,211,238,${0.12 + intensity * 0.82})` }}
          />
        ))}
      </div>
    </div>
  );
}

function EventFeed({ events }) {
  return (
    <div className="bg-[#101b2d] border border-slate-800 rounded-3xl p-6">
      <h2 className="text-2xl font-black mb-6">Live Event Feed</h2>
      <div className="space-y-3">
        {events.map((item, index) => (
          <div key={index} className="bg-[#0d1524] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="font-bold">{item}</div>
              <div className="text-slate-500 text-sm mt-1">Real-time monitoring event</div>
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalTrend({ history }) {
  const peak = Math.max(...history);
  const average = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
  const lowest = Math.min(...history);

  return (
    <div className="bg-[#101b2d] border border-slate-800 rounded-3xl p-6">
      <h2 className="text-2xl font-black mb-5">Real-Time Trend Analytics</h2>
      <div className="h-80 bg-[#0d1524] border border-slate-800 rounded-2xl p-5 flex items-end gap-2 overflow-hidden">
        {history.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col justify-end items-center gap-2 group">
            <div className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {value}%
            </div>
            <div
              className="w-full rounded-t-2xl bg-gradient-to-t from-cyan-500 to-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-all duration-500 hover:scale-105"
              style={{ height: `${value}%` }}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        <MiniMetric label="Peak" value={`${peak}%`} />
        <MiniMetric label="Average" value={`${average}%`} />
        <MiniMetric label="Lowest" value={`${lowest}%`} />
      </div>
    </div>
  );
}

function SystemOverview({ signal, ocr, workflow, latency }) {
  return (
    <div className="bg-[#101b2d] border border-slate-800 rounded-3xl p-6">
      <h2 className="text-2xl font-black mb-5">System Overview</h2>
      <Metric label="Signal Accuracy" value={signal} suffix="%" color="bg-cyan-400" />
      <Metric label="OCR Stability" value={ocr} suffix="%" color="bg-emerald-400" />
      <Metric label="Workflow Sync" value={workflow} suffix="%" color="bg-violet-400" />
      <Metric label="Monitoring Latency" value={Math.min(100, 100 - latency * 2)} shown={`${latency}ms`} color="bg-orange-400" />
    </div>
  );
}

function SessionHistory({ sessionItems }) {
  return (
    <div className="bg-[#101b2d] border border-slate-800 rounded-3xl p-6 mt-6">
      <h2 className="text-2xl font-black mb-5">Session History</h2>
      <div className="flex flex-wrap gap-2">
        {sessionItems.length === 0 ? (
          <div className="text-slate-500">No session data yet.</div>
        ) : (
          sessionItems.map((item, index) => (
            <div key={`${item}-${index}`} className="bg-[#0d1524] border border-slate-700 rounded-xl px-4 py-2 font-black text-cyan-300">
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-[#0d1524] border border-slate-800 rounded-2xl p-4">
      <div className="text-slate-500 text-sm">{label}</div>
      <div className="text-3xl font-black mt-1">{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="bg-[#0d1524] border border-slate-800 rounded-2xl p-4 text-center">
      <div className="text-slate-500 text-sm">{label}</div>
      <div className="text-2xl font-black mt-1 text-cyan-300">{value}</div>
    </div>
  );
}

function Metric({ label, value, shown, suffix = '', color }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2 text-sm text-slate-400">
        <span>{label}</span>
        <span>{shown || `${value}${suffix}`}</span>
      </div>
      <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
