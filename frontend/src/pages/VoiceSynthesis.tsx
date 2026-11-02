import { useState, useEffect } from "react";
import { useJobs } from "../contexts/JobsContext";

function VoiceSynthesis() {
  const { jobs, submitJob } = useJobs();
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState("");

  const activeJob = jobs.find((j) => j.id === activeJobId);

  useEffect(() => {
    if (activeJob?.status === "completed" && activeJob.result) {
      const r = activeJob.result as Record<string, string>;
      setResult(r.message || JSON.stringify(activeJob.result));
    }
    if (activeJob?.status === "failed") {
      setResult(`Error: ${activeJob.error || "Job failed"}`);
    }
  }, [activeJob?.status, activeJob?.result, activeJob?.error]);

  const handleSynthesize = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    setResult("");
    try {
      const id = await submitJob({
        model: "ourvoice",
        action: "synthesize",
        params: { text: text.trim() },
      });
      setActiveJobId(id);
    } catch { setResult("Error: Could not submit job."); }
    finally { setSubmitting(false); }
  };

  const loading = submitting || (activeJob?.status === "pending" || activeJob?.status === "running");

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">OurVoice Text-to-Speech</h3>
        <p className="text-sm text-gray-500 mb-4">
          Convert text to speech using our Tacotron-lite TTS model. Model must be trained first.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to synthesize..."
          className="w-full border rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={handleSynthesize}
          disabled={loading || !text.trim()}
          className="mt-3 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Synthesizing..." : "Synthesize"}
        </button>
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span>Processing... You can navigate away safely.</span>
        </div>
      )}

      {result && (
        <div className="mt-4 bg-white rounded-xl border p-6">
          <h4 className="font-semibold mb-2">Result</h4>
          <p className="text-gray-700">{result}</p>
        </div>
      )}
    </div>
  );
}

export default VoiceSynthesis;
