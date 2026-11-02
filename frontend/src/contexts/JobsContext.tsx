import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import axios from "axios";

export interface Job {
  id: string;
  model: string;
  action: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: Record<string, unknown>;
  error?: string;
  createdAt: number;
}

interface JobsContextType {
  jobs: Job[];
  submitJob: (req: Record<string, unknown>) => Promise<string>;
  clearJob: (id: string) => void;
  clearCompleted: () => void;
}

const JobsContext = createContext<JobsContextType | null>(null);

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be inside JobsProvider");
  return ctx;
}

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const pollingRef = useRef<Set<string>>(new Set());

  const pollJob = useCallback(async (jobId: string) => {
    if (pollingRef.current.has(jobId)) return;
    pollingRef.current.add(jobId);

    const poll = async () => {
      try {
        const res = await axios.get(`/api/ai/job/${jobId}`);
        const { status, result, error } = res.data;

        if (status === "completed") {
          await axios.post(`/api/ai/job/${jobId}/complete`).catch(() => {});
          setJobs((prev) =>
            prev.map((j) => (j.id === jobId ? { ...j, status: "completed", result } : j))
          );
          pollingRef.current.delete(jobId);
          return;
        }
        if (status === "failed") {
          setJobs((prev) =>
            prev.map((j) => (j.id === jobId ? { ...j, status: "failed", error: error || "Job failed" } : j))
          );
          pollingRef.current.delete(jobId);
          return;
        }

        setJobs((prev) =>
          prev.map((j) => (j.id === jobId && j.status === "pending" ? { ...j, status: "running" } : j))
        );
        setTimeout(poll, 1000);
      } catch {
        setTimeout(poll, 2000);
      }
    };

    poll();
  }, []);

  const submitJob = useCallback(
    async (req: Record<string, unknown>): Promise<string> => {
      const res = await axios.post("/api/ai/submit", req);
      const { jobId, model, action } = res.data;
      const job: Job = {
        id: jobId,
        model,
        action,
        status: "pending",
        createdAt: Date.now(),
      };
      setJobs((prev) => [job, ...prev]);
      pollJob(jobId);
      return jobId;
    },
    [pollJob]
  );

  const clearJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    pollingRef.current.delete(id);
  }, []);

  const clearCompleted = useCallback(() => {
    setJobs((prev) => prev.filter((j) => j.status !== "completed" && j.status !== "failed"));
  }, []);

  useEffect(() => {
    return () => {
      pollingRef.current.clear();
    };
  }, []);

  return (
    <JobsContext.Provider value={{ jobs, submitJob, clearJob, clearCompleted }}>
      {children}
    </JobsContext.Provider>
  );
}
