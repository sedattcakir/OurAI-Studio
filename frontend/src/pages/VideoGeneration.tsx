import { useState, useEffect } from "react";
import { useJobs } from "../contexts/JobsContext";

function VideoGeneration() {
  const { jobs, submitJob } = useJobs();
  const [numVideos, setNumVideos] = useState(1);
  const [videos, setVideos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState("");

  const activeJob = jobs.find((j) => j.id === activeJobId);

  useEffect(() => {
    if (activeJob?.status === "completed" && activeJob.result) {
      const r = activeJob.result as Record<string, unknown>;
      if (Array.isArray(r.videos_base64)) setVideos(r.videos_base64 as string[]);
    }
  }, [activeJob?.status, activeJob?.result]);

  const handleGenerate = async () => {
    setSubmitting(true);
    setVideos([]);
    try {
      const id = await submitJob({
        model: "ourvideo",
        action: "generate",
        params: { num_videos: numVideos },
      });
      setActiveJobId(id);
    } catch { /* shown in jobs panel */ }
    finally { setSubmitting(false); }
  };

  const loading = submitting || (activeJob?.status === "pending" || activeJob?.status === "running");

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">OurVideo Generation</h3>
        <p className="text-sm text-gray-500 mb-4">
          Generate short video clips using our 3D Conv VAE model (16 frames × 64×64 px). Model must be trained first.
        </p>
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-600">Number of videos:</label>
          <select
            value={numVideos}
            onChange={(e) => setNumVideos(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {[1, 2].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span>Processing... You can navigate away safely.</span>
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border p-6">
          <h4 className="font-semibold mb-3">Generated Videos</h4>
          <div className="grid grid-cols-2 gap-4">
            {videos.map((b64, i) => (
              <img
                key={i}
                src={`data:image/gif;base64,${b64}`}
                alt={`Generated video ${i + 1}`}
                className="w-full rounded-lg border"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoGeneration;
