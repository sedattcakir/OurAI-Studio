import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

interface Tier {
  name: string;
  dailyLimit: number;
  price: number;
}

const features: Record<string, string[]> = {
  free: ["50 API calls/day", "All 6 AI models", "Community support"],
  starter: ["500 API calls/day", "All 6 AI models", "Email support", "API key access"],
  pro: ["5,000 API calls/day", "All 6 AI models", "Priority support", "API key access", "Webhooks"],
  enterprise: ["Unlimited API calls", "All 6 AI models", "Dedicated support", "Custom integrations", "SLA guarantee"],
};

function PricingPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);

  useEffect(() => {
    axios.get("/api/subscription/tiers").then((r) => setTiers(r.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="text-center py-16 px-4">
        <h1 className="text-4xl font-bold text-gray-900">CakAI Studio</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          All AI models built from scratch. No third-party APIs. Your data stays yours.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register" className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
            Get Started Free
          </Link>
          <Link to="/login" className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Sign In
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-6 flex flex-col ${
                tier.name === "pro" ? "border-primary-500 ring-2 ring-primary-200 bg-white" : "bg-white"
              }`}
            >
              {tier.name === "pro" && (
                <span className="text-xs font-semibold text-primary-600 uppercase mb-2">Most Popular</span>
              )}
              <h3 className="text-lg font-semibold capitalize">{tier.name}</h3>
              <div className="mt-4">
                <span className="text-3xl font-bold">${tier.price}</span>
                {tier.price > 0 && <span className="text-gray-500 text-sm">/month</span>}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {tier.dailyLimit === -1 ? "Unlimited" : tier.dailyLimit.toLocaleString()} calls/day
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {(features[tier.name] || []).map((f, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`mt-6 block text-center py-2 rounded-lg text-sm font-medium transition-colors ${
                  tier.name === "pro"
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">6 AI Models, Built From Scratch</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: "OurLLM", desc: "Text generation" },
            { name: "OurImage", desc: "Image generation" },
            { name: "OurVoice", desc: "Text-to-speech" },
            { name: "OurSpeech", desc: "Speech-to-text" },
            { name: "OurVideo", desc: "Video generation" },
            { name: "OurAvatar", desc: "Talking head avatars" },
          ].map((m) => (
            <div key={m.name} className="border rounded-lg p-4 text-center bg-white">
              <p className="font-semibold text-gray-800">{m.name}</p>
              <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-gray-400 border-t">
        CakAI Studio — All models trained from scratch, no third-party AI APIs.
      </footer>
    </div>
  );
}

export default PricingPage;
