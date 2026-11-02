import { useState } from "react";
import axios from "axios";

function AvatarGeneration() {
  const [numFrames, setNumFrames] = useState(20);
  const [faceBase64, setFaceBase64] = useState("");
  const [animation, setAnimation] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState("");
  const [jobId, setJobId] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setFaceBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setAnimation("");
    setJobStatus("Submitting...");
    setJobId("");
    try {
      const params: Record<string, unknown> = { num_frames: numFrames };
      if (faceBase64) params.face_base64 = faceBase64;

      const response = await axios.post("/api/ai/generate", {
        model: "ouravatar",
        action: "animate",
        params,
      });
      const data = response.data;
      if (data.animation_base64) {
        setAnimation(data.animation_base64);
        setJobStatus("Completed");
      } else {
        setJobStatus(data.message || "Model not available");
      }
      setJobId(data.job_id || "");
    } catch {
      setJobStatus("Failed — Is the AI service running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">OurAvatar Digital Avatar</h3>
        <p className="text-sm text-gray-500 mb-4">
          Generate animated avatar from a face image. Upload a face photo or use a random face. Model must be trained first.
        </p>

        <label className="block mb-4">
          <span className="text-sm text-gray-600">Face image (optional):</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {fileName && <p className="mt-1 text-xs text-gray-400">Selected: {fileName}</p>}
        </label>

        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-600">Frames:</label>
          <select
            value={numFrames}
            onChange={(e) => setNumFrames(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {[10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Animating..." : "Animate"}
          </button>
        </div>
      </div>

      {(loading || jobStatus) && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          {loading && (
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          )}
          <span>Status: {loading ? "Processing..." : jobStatus}</span>
          {jobId && <span className="text-xs text-gray-400">Job: {jobId.slice(0, 8)}</span>}
        </div>
      )}

      {animation && (
        <div className="mt-4 bg-white rounded-xl border p-6">
          <h4 className="font-semibold mb-3">Avatar Animation</h4>
          <img
            src={`data:image/gif;base64,${animation}`}
            alt="Avatar animation"
            className="w-64 rounded-lg border mx-auto"
          />
        </div>
      )}
    </div>
  );
}

export default AvatarGeneration;
