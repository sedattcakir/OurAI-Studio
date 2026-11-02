function Dashboard() {
  const models = [
    { name: "OurLLM", status: "active", description: "Text generation model" },
    { name: "OurImage", status: "coming", description: "Image generation model" },
    { name: "OurVoice", status: "coming", description: "Text-to-speech model" },
    { name: "OurSpeech", status: "coming", description: "Speech-to-text model" },
    { name: "OurVideo", status: "coming", description: "Video generation model" },
    { name: "OurAvatar", status: "coming", description: "Digital avatar model" },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Total Generations</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Active Models</p>
          <p className="text-2xl font-bold mt-1">1</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">API Calls Today</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-4">AI Models</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <div key={model.name} className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{model.name}</h4>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  model.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {model.status === "active" ? "Active" : "Coming Soon"}
              </span>
            </div>
            <p className="text-sm text-gray-500">{model.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
