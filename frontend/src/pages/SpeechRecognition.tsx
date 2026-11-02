import { useState } from "react";
import axios from "axios";

function SpeechRecognition() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setResult("");
    setJobStatus("Reading file...");

    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      setJobStatus("Submitting...");
      const response = await axios.post("/api/ai/generate", {
        model: "ourspeech",
        action: "transcribe",
        params: { audio_base64: base64 },
      });
      const data = response.data;
      setResult(data.transcription || data.message || JSON.stringify(data));
      setJobStatus(data.status === "not_available" ? "Model Not Trained" : "Completed");
    } catch {
      setResult("Error: Could not reach the AI service.");
      setJobStatus("Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">OurSpeech Recognition</h3>
        <p className="text-sm text-gray-500 mb-4">
          Transcribe audio using our CTC-based STT model. Model must be trained first.
        </p>
        <label className="block">
          <span className="text-sm text-gray-600">Upload audio file (WAV):</span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            disabled={loading}
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
          />
        </label>
        {fileName && (
          <p className="mt-2 text-xs text-gray-400">Selected: {fileName}</p>
        )}
      </div>

      {(loading || jobStatus) && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          {loading && (
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          )}
          <span>Status: {loading ? "Processing..." : jobStatus}</span>
        </div>
      )}

      {result && (
        <div className="mt-4 bg-white rounded-xl border p-6">
          <h4 className="font-semibold mb-2">Transcription</h4>
          <p className="text-gray-700 whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}

export default SpeechRecognition;
