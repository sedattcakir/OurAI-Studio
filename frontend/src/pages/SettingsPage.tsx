import { useState, useEffect } from "react";
import axios from "axios";

interface ApiKeyInfo {
  id: number;
  name: string;
  keyPrefix: string;
  createdAt: string;
  isActive: boolean;
}

interface SubInfo {
  tier: string;
  dailyLimit: number;
  expiresAt: string | null;
  todayCalls: number;
  totalCalls: number;
}

function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState("");

  useEffect(() => {
    axios.get("/api/keys").then((r) => setKeys(r.data));
    axios.get("/api/subscription").then((r) => setSub(r.data));
  }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    const res = await axios.post("/api/keys", { name: newKeyName.trim() });
    setNewKey(res.data.key);
    setNewKeyName("");
    axios.get("/api/keys").then((r) => setKeys(r.data));
  };

  const revokeKey = async (id: number) => {
    await axios.delete(`/api/keys/${id}`);
    setKeys(keys.map((k) => (k.id === id ? { ...k, isActive: false } : k)));
  };

  const upgrade = async (tier: string) => {
    const res = await axios.post("/api/subscription/upgrade", { tier });
    setSub(res.data);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Subscription</h3>
        {sub && (
          <div className="space-y-2 text-sm">
            <p>Current Plan: <span className="font-medium capitalize">{sub.tier}</span></p>
            <p>Daily Limit: {sub.dailyLimit === -1 ? "Unlimited" : sub.dailyLimit} calls</p>
            <p>Today: {sub.todayCalls} / {sub.dailyLimit === -1 ? "∞" : sub.dailyLimit}</p>
            <p>Total Calls: {sub.totalCalls}</p>
            {sub.expiresAt && <p>Expires: {new Date(sub.expiresAt).toLocaleDateString()}</p>}
            <div className="flex gap-2 mt-4">
              {["free", "starter", "pro", "enterprise"].map((tier) => (
                <button
                  key={tier}
                  onClick={() => upgrade(tier)}
                  disabled={sub.tier === tier}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    sub.tier === tier
                      ? "bg-primary-100 text-primary-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">API Keys</h3>
        {newKey && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">New API Key (copy now, shown once):</p>
            <code className="text-xs break-all">{newKey}</code>
          </div>
        )}
        <div className="flex gap-2 mb-4">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={createKey}
            disabled={!newKeyName.trim()}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            Create Key
          </button>
        </div>
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{k.name}</p>
                <p className="text-xs text-gray-400">{k.keyPrefix}... · {new Date(k.createdAt).toLocaleDateString()}</p>
              </div>
              {k.isActive ? (
                <button
                  onClick={() => revokeKey(k.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Revoke
                </button>
              ) : (
                <span className="text-xs text-gray-400">Revoked</span>
              )}
            </div>
          ))}
          {keys.length === 0 && <p className="text-sm text-gray-400">No API keys yet.</p>}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
