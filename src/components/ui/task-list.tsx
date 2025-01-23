"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { format } from "date-fns";
import { IconFilter } from "@tabler/icons-react";
import { useAuth } from "@/lib/contexts/auth-context";

interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  createdAt: string;
  projectId: string;
  status: "assigned" | "not_started" | "in_progress" | "completed";
  priority: string;
  assignedTo: string;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TaskListProps {
  projectId: string;
  members: Member[];
}

export function TaskList({ projectId, members }: TaskListProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priority: "",
    assignedTo: "",
    status: "",
  });

  useEffect(() => {
    if (!projectId) {
      console.log("No projectId provided to TaskList");
      return;
    }

    console.log("Setting up task listener for project:", projectId);
    setLoading(true);

    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );

    console.log("Project TaskList Query:", JSON.stringify({
      collection: "tasks",
      filters: {
        projectId: projectId,
        orderBy: "createdAt desc"
      }
    }));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Project TaskList received snapshot with", snapshot.docs.length, "tasks");
      const newTasks = snapshot.docs.map(doc => {
        const data = {
          id: doc.id,
          ...doc.data()
        } as Task;
        console.log("Project TaskList task data:", data);
        return data;
      });
      
      setTasks(newTasks);
      setLoading(false);
    }, (error) => {
      console.error("Project TaskList error fetching tasks:", error);
      if (!error.message.includes("requires an index")) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [projectId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-purple-100 text-purple-800";
      case "not_started":
        return "bg-neutral-100 text-neutral-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "assigned":
        return "Assigned";
      case "not_started":
        return "Not Started";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;
    if (filters.status && task.status !== filters.status) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-neutral-200">
          <div className="w-5 h-5 bg-neutral-200 rounded animate-pulse" />
          <div className="w-32 h-8 bg-neutral-200 rounded animate-pulse" />
          <div className="w-32 h-8 bg-neutral-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
              <div className="w-20 h-6 bg-neutral-200 rounded animate-pulse" />
              <div className="w-full h-6 bg-neutral-200 rounded animate-pulse" />
              <div className="w-2/3 h-4 bg-neutral-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-neutral-200">
        <IconFilter className="w-5 h-5 text-neutral-500" />
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-1 text-sm rounded-md border border-input bg-background text-neutral-800"
        >
          <option value="">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          className="px-3 py-1 text-sm rounded-md border border-input bg-background text-neutral-800"
        >
          <option value="">All Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <select
          value={filters.assignedTo}
          onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
          className="px-3 py-1 text-sm rounded-md border border-input bg-background text-neutral-800"
        >
          <option value="">All Members</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.firstName} {member.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-neutral-600">
          No tasks found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all hover:shadow-sm"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </span>
                  </div>
                  <span className="text-sm text-neutral-600">
                    Due {format(new Date(task.dueDate), "MMM d")}
                  </span>
                </div>
                <h3 className="font-medium text-lg text-neutral-800 mb-2">{task.name}</h3>
                {task.description && (
                  <p className="text-sm text-neutral-600 line-clamp-2">{task.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-neutral-600">
                    Assigned to: {members.find(m => m.id === task.assignedTo)?.firstName} {members.find(m => m.id === task.assignedTo)?.lastName}
                  </div>
                  {task.assignedTo === user?.uid && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      Delete Task
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 