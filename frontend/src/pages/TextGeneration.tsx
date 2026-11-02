import { useState, useEffect } from "react";
import { useJobs } from "../contexts/JobsContext";

function TextGeneration() {
  const { jobs, submitJob } = useJobs();
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState("");

  const activeJob = jobs.find((j) => j.id === activeJobId);

  useEffect(() => {
    if (activeJob?.status === "completed" && activeJob.result) {
      setResult((activeJob.result as Record<string, string>).generated_text || "No text returned");
    }
    if (activeJob?.status === "failed") {
      setResult(`Error: ${activeJob.error || "Job failed"}`);
    }
  }, [activeJob?.status, activeJob?.result, activeJob?.error]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setSubmitting(true);
    setResult("");
    try {
      const id = await submitJob({
        prompt: prompt.trim(),
        maxTokens: 50,
        temperature: 0.8,
        model: "ourllm",
        action: "generate",
      });
      setActiveJobId(id);
    } catch {
      setResult("Error: Could not submit job. Is the AI service running?");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = submitting || (activeJob?.status === "pending" || activeJob?.status === "running");

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">OurLLM Text Generation</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="w-full border rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="mt-3 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span>Processing... You can navigate away — result will appear in the Jobs panel.</span>
        </div>
      )}

      {result && (
        <div className="mt-4 bg-white rounded-xl border p-6">
          <h4 className="font-semibold mb-2">Result</h4>
          <p className="text-gray-700 whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}

export default TextGeneration;
