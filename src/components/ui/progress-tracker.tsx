"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

interface ProgressTrackerProps {
  projectId: string;
}

interface TaskStats {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
}

export function ProgressTracker({ projectId }: ProgressTrackerProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newStats = snapshot.docs.reduce((acc, doc) => {
        const status = doc.data().status;
        return {
          ...acc,
          total: acc.total + 1,
          [status === "not_started" ? "notStarted" : 
           status === "in_progress" ? "inProgress" : 
           "completed"]: acc[status === "not_started" ? "notStarted" : 
                         status === "in_progress" ? "inProgress" : 
                         "completed"] + 1
        };
      }, {
        total: 0,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
      });

      setStats(newStats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const getProgressPercentage = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-2 bg-neutral-200 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-neutral-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium text-neutral-800">Project Progress</h2>
          <span className="text-sm font-medium text-neutral-600">{getProgressPercentage()}% Complete</span>
        </div>
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-semibold text-red-700">{stats.notStarted}</div>
          <div className="text-sm text-red-600">Not Started</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-semibold text-blue-700">{stats.inProgress}</div>
          <div className="text-sm text-blue-600">In Progress</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-semibold text-green-700">{stats.completed}</div>
          <div className="text-sm text-green-600">Completed</div>
        </div>
      </div>
    </div>
  );
} 