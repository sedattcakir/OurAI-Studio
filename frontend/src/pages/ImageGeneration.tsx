import { useState, useEffect } from "react";
import { useJobs } from "../contexts/JobsContext";

function ImageGeneration() {
  const { jobs, submitJob } = useJobs();
  const [numImages, setNumImages] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState("");

  const activeJob = jobs.find((j) => j.id === activeJobId);

  useEffect(() => {
    if (activeJob?.status === "completed" && activeJob.result) {
      const r = activeJob.result as Record<string, unknown>;
      if (Array.isArray(r.images_base64)) setImages(r.images_base64 as string[]);
    }
  }, [activeJob?.status, activeJob?.result]);

  const handleGenerate = async () => {
    setSubmitting(true);
    setImages([]);
    try {
      const id = await submitJob({
        model: "ourimage",
        action: "generate",
        params: { num_images: numImages },
      });
      setActiveJobId(id);
    } catch { /* shown in jobs panel */ }
    finally { setSubmitting(false); }
  };

  const loading = submitting || (activeJob?.status === "pending" || activeJob?.status === "running");

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">OurImage Generation</h3>
        <p className="text-sm text-gray-500 mb-4">
          Generate images using our DCGAN model (64×64 px). Model must be trained first.
        </p>
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-600">Number of images:</label>
          <select
            value={numImages}
            onChange={(e) => setNumImages(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {[1, 2, 3, 4].map((n) => (
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

      {images.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border p-6">
          <h4 className="font-semibold mb-3">Generated Images</h4>
          <div className="grid grid-cols-2 gap-4">
            {images.map((b64, i) => (
              <img
                key={i}
                src={`data:image/png;base64,${b64}`}
                alt={`Generated ${i + 1}`}
                className="w-full rounded-lg border"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGeneration;
