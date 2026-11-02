import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

interface SubInfo {
  tier: string;
  dailyLimit: number;
  todayCalls: number;
  totalCalls: number;
}

const models = [
  { name: "OurLLM", description: "Text generation", path: "/text" },
  { name: "OurImage", description: "Image generation", path: "/image" },
  { name: "OurVoice", description: "Text-to-speech", path: "/voice" },
  { name: "OurSpeech", description: "Speech-to-text", path: "/speech" },
  { name: "OurVideo", description: "Video generation", path: "/video" },
  { name: "OurAvatar", description: "Talking head avatars", path: "/avatar" },
];

function Dashboard() {
  const [sub, setSub] = useState<SubInfo | null>(null);

  useEffect(() => {
    axios.get("/api/subscription").then((r) => setSub(r.data)).catch(() => {});
  }, []);

  const limit = sub ? (sub.dailyLimit === -1 ? "Unlimited" : sub.dailyLimit) : "—";

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Plan</p>
          <p className="text-2xl font-bold mt-1 capitalize">{sub?.tier ?? "—"}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">API Calls Today</p>
          <p className="text-2xl font-bold mt-1">{sub?.todayCalls ?? 0} / {limit}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Total Generations</p>
          <p className="text-2xl font-bold mt-1">{sub?.totalCalls ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Active Models</p>
          <p className="text-2xl font-bold mt-1">6</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-4">AI Models</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m) => (
          <Link
            key={m.name}
            to={m.path}
            className="bg-white rounded-xl border p-5 hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{m.name}</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
            </div>
            <p className="text-sm text-gray-500">{m.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
