import { useState } from "react";
import axios from "axios";

function TextGeneration() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const response = await axios.post("/llm/generate", {
        prompt: prompt.trim(),
        max_tokens: 50,
        temperature: 0.8,
      });
      setResult(response.data.generated_text);
    } catch {
      setResult("Error: Could not generate text. Is the AI service running?");
    } finally {
      setLoading(false);
    }
  };

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

      {result && (
        <div className="mt-6 bg-white rounded-xl border p-6">
          <h4 className="font-semibold mb-2">Result</h4>
          <p className="text-gray-700 whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}

export default TextGeneration;
