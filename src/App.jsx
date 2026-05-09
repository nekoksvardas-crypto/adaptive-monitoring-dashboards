import { useEffect, useMemo, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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
  const [inputValue, setInputValue] = useState("");

  const [sessionItems, setSessionItems] = useState(() =>
    safeLoadArray("monitoring-session", DEFAULT_SESSION)
  );

  const [history, setHistory] = useState(() =>
    safeLoadArray("monitoring-history", DEFAULT_HISTORY)
  );

  const [events, setEvents] = useState([
    "Signal cluster detected",
    "Adaptive probability updated",
    "OCR event captured",
    "Monitoring state synchronized",
    "Live dashboard refreshed",
  ]);

  useEffect(() => {
    localStorage.setItem(
      "monitoring-session",
      JSON.stringify(sessionItems)
    );
  }, [sessionItems]);

  useEffect(() => {
    localStorage.setItem(
      "monitoring-history",
      JSON.stringify(history)
    );
  }, [history]);

  const stats = useMemo(() => {
    return {
      low: sessionItems.filter((n) => n >= 1 && n <= 18).length,
      high: sessionItems.filter((n) => n >= 19).length,
      even: sessionItems.filter((n) => n !== 0 && n % 2 === 0).length,
      odd: sessionItems.filter((n) => n % 2 === 1).length,
      zero: sessionItems.filter((n) => n === 0).length,
      total: sessionItems.length,
    };
  }, [sessionItems]);

  const chartData = history.map((value, index) => ({
    id: index + 1,
    value,
  }));

  const addEvent = () => {
    const value = Number(inputValue);

    if (isNaN(value) || value < 0 || value > 36) return;

    const updatedSession = [...sessionItems, value];
    setSessionItems(updatedSession);

    const randomMetric = Math.floor(
      60 + Math.random() * 35
    );

    setHistory((prev) => [...prev.slice(-11), randomMetric]);

    const feedMessages = [
      "Signal cluster detected",
      "Adaptive probability updated",
      "OCR event captured",
      "Monitoring state synchronized",
      "Live dashboard refreshed",
      "Pattern recognition updated",
      "Probability recalculated",
      "Live sequence processed",
    ];

    const randomFeed =
      feedMessages[
        Math.floor(Math.random() * feedMessages.length)
      ];

    setEvents((prev) => [randomFeed, ...prev.slice(0, 4)]);

    setInputValue("");
  };

  const undoLast = () => {
    setSessionItems((prev) => prev.slice(0, -1));
  };

  const resetSession = () => {
    setSessionItems([]);
    setHistory(DEFAULT_HISTORY);

    setEvents([
      "System reset complete",
      "Monitoring session restarted",
      "Adaptive engine synchronized",
    ]);
  };

  const simulateEvent = () => {
    const randomValue = Math.floor(Math.random() * 37);

    setInputValue(randomValue.toString());

    setTimeout(() => {
      addEvent();
    }, 100);
  };

  const exportCSV = () => {
    const csv = sessionItems.join(",");

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "monitoring-session.csv";

    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

          <div>
            <div className="text-cyan-400 text-sm tracking-[0.3em] uppercase mb-3">
              AI-Assisted Automation System
            </div>

            <h1 className="text-5xl font-black leading-tight">
              Real-Time Monitoring & Signal Dashboard
            </h1>

            <p className="text-slate-400 mt-4 max-w-2xl">
              Manual input tracking, live signal analysis,
              session history, CSV export and adaptive
              decision-support logic.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <button
                onClick={simulateEvent}
                className="bg-cyan-500 hover:bg-cyan-400 transition px-6 py-3 rounded-2xl font-semibold"
              >
                Simulate Event
              </button>

              <button
                onClick={exportCSV}
                className="bg-slate-800 border border-slate-700 hover:bg-slate-700 transition px-6 py-3 rounded-2xl font-semibold"
              >
                Export CSV
              </button>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-4 rounded-2xl">
              <div className="text-xs text-emerald-300 uppercase">
                System Status
              </div>

              <div className="text-3xl font-black text-emerald-400">
                ONLINE
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-5 mt-10">
          <MetricCard
            title="Live Signal Strength"
            value="87%"
            subtitle="Adaptive confidence engine"
          />

          <MetricCard
            title="Events Tracked"
            value={sessionItems.length}
            subtitle="Manual + simulated inputs"
          />

          <MetricCard
            title="OCR Event Feed"
            value="READY"
            subtitle="Prepared for screen recognition"
          />

          <MetricCard
            title="Workflow Sync"
            value="96%"
            subtitle="Session stability tracking"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">

          <div className="lg:col-span-2 bg-[#08152b] border border-slate-800 rounded-3xl p-6">

            <h2 className="text-3xl font-bold">
              Manual Input Panel
            </h2>

            <p className="text-slate-400 mt-2">
              Enter values from 0 to 36. The dashboard
              recalculates metrics and updates the session
              automatically.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">

              <input
                type="number"
                value={inputValue}
                onChange={(e) =>
                  setInputValue(e.target.value)
                }
                placeholder="Enter event value 0-36"
                className="bg-[#020817] border border-slate-700 rounded-2xl px-5 py-4 flex-1 min-w-[220px] outline-none"
              />

              <button
                onClick={addEvent}
                className="bg-emerald-500 hover:bg-emerald-400 transition px-6 py-4 rounded-2xl font-semibold"
              >
                Add Event
              </button>

              <button
                onClick={undoLast}
                className="bg-slate-700 hover:bg-slate-600 transition px-6 py-4 rounded-2xl"
              >
                Undo
              </button>

              <button
                onClick={resetSession}
                className="bg-rose-900/50 border border-rose-500/30 hover:bg-rose-800/50 transition px-6 py-4 rounded-2xl"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-bold">
              Session Stats
            </h2>

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

          <div className="lg:col-span-2 bg-[#08152b] border border-slate-800 rounded-3xl p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-3xl font-bold">
                  Live Signal Analytics
                </h2>

                <p className="text-slate-400 mt-2">
                  Real-time adaptive monitoring visualization.
                </p>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-xl text-cyan-400 text-sm">
                LIVE TRACKING
              </div>
            </div>

            <div className="h-[350px]">

              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={chartData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                  />

                  <XAxis
                    dataKey="id"
                    stroke="#64748b"
                  />

                  <YAxis stroke="#64748b" />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#06b6d4"
                    strokeWidth={4}
                    dot={false}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>
          </div>

          <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">

            <h2 className="text-3xl font-bold mb-6">
              Live Event Feed
            </h2>

            <div className="space-y-4">

              {events.map((event, index) => (
                <div
                  key={index}
                  className="bg-[#020817] border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">
                      {event}
                    </div>

                    <div className="text-slate-500 text-sm mt-1">
                      Real-time monitoring event
                    </div>
                  </div>

                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="bg-[#08152b] border border-slate-800 rounded-3xl p-6">
      <div className="text-slate-400 text-sm">
        {title}
      </div>

      <div className="text-5xl font-black mt-3">
        {value}
      </div>

      <div className="text-slate-500 mt-3 text-sm">
        {subtitle}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-[#0d1524] border border-slate-800 rounded-2xl p-4">
      <div className="text-slate-500 text-sm">
        {label}
      </div>

      <div className="text-4xl font-black mt-2">
        {value}
      </div>
    </div>
  );
}