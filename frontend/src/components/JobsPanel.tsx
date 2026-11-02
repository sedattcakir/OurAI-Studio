import { useJobs, type Job } from "../contexts/JobsContext";

const statusColors: Record<Job["status"], string> = {
  pending: "bg-yellow-400",
  running: "bg-blue-400 animate-pulse",
  completed: "bg-green-400",
  failed: "bg-red-400",
};

function JobsPanel() {
  const { jobs, clearJob, clearCompleted } = useJobs();

  if (jobs.length === 0) return null;

  return (
    <div className="border-t border-gray-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-300">Jobs ({jobs.length})</span>
        {jobs.some((j) => j.status === "completed" || j.status === "failed") && (
          <button onClick={clearCompleted} className="text-xs text-gray-500 hover:text-gray-300">
            Clear
          </button>
        )}
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {jobs.slice(0, 10).map((job) => (
          <div key={job.id} className="flex items-center gap-2 text-xs text-gray-300 py-1">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[job.status]}`} />
            <span className="truncate flex-1">{job.model}</span>
            <span className="text-gray-500 capitalize">{job.status}</span>
            {(job.status === "completed" || job.status === "failed") && (
              <button onClick={() => clearJob(job.id)} className="text-gray-500 hover:text-gray-300">
                x
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default JobsPanel;
