"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { format } from "date-fns";
import { IconFilter } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  createdAt: string;
  projectId: string;
  status: string;
  priority: string;
  assignedTo: string;
}

interface Project {
  id: string;
  name: string;
  course: string;
}

export default function TasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<(Task & { project: Project })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, completed

  useEffect(() => {
    if (!user) {
      console.log("No user found, skipping task fetch");
      return;
    }

    console.log("Current user details:", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });

    console.log("Setting up tasks listener for user:", user.uid);
    setLoading(true);

    // First, let's check if any tasks exist with a simpler query
    const simpleQuery = query(
      collection(db, "tasks"),
      where("assignedTo", "==", user.uid)
    );

    // Check for tasks without orderBy
    getDocs(simpleQuery).then((snapshot) => {
      console.log("Simple query found", snapshot.docs.length, "tasks");
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log("Task found in simple query:", {
          id: doc.id,
          name: data.name,
          assignedTo: data.assignedTo,
          projectId: data.projectId,
          createdAt: data.createdAt
        });
      });

      if (snapshot.docs.length > 0) {
        console.log("Tasks exist but might need index for ordered query");
      }
    }).catch(error => {
      console.error("Error with simple query:", error);
    });

    try {
      // Original query with orderBy
      const q = query(
        collection(db, "tasks"),
        where("assignedTo", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      console.log("Created ordered query:", JSON.stringify({
        collection: "tasks",
        filters: {
          assignedTo: user.uid,
          orderBy: "createdAt desc"
        }
      }));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          console.log("Received ordered snapshot with", snapshot.docs.length, "tasks");
          
          const tasksWithProjects = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const taskData = { id: doc.id, ...doc.data() } as Task;
              console.log("Processing task from ordered query:", {
                id: taskData.id,
                name: taskData.name,
                assignedTo: taskData.assignedTo,
                createdAt: taskData.createdAt
              });
              
              try {
                // Fetch project details
                const projectDoc = await getDoc(doc(db, "projects", taskData.projectId));
                console.log("Project fetch result:", {
                  taskId: taskData.id,
                  projectId: taskData.projectId,
                  exists: projectDoc.exists()
                });
                
                const projectData = projectDoc.exists() 
                  ? { id: projectDoc.id, ...projectDoc.data() } as Project 
                  : { id: "deleted", name: "Deleted Project", course: "" };

                return {
                  ...taskData,
                  project: projectData,
                };
              } catch (error) {
                console.error("Error fetching project for task:", taskData.id, error);
                return {
                  ...taskData,
                  project: { id: "error", name: "Error Loading Project", course: "" },
                };
              }
            })
          );
          
          console.log("Final processed tasks:", tasksWithProjects.map(t => ({
            id: t.id,
            name: t.name,
            assignedTo: t.assignedTo,
            projectName: t.project.name
          })));
          setTasks(tasksWithProjects);
          setLoading(false);
        } catch (error) {
          console.error("Error processing tasks:", error);
          setLoading(false);
        }
      }, (error) => {
        console.error("Error with ordered query:", error);
        if (error.message.includes("indexes?create_composite=")) {
          const indexUrl = error.message.split("indexes?create_composite=")[1].split(" ")[0];
          console.error("Please create the required index by visiting:", `https://console.firebase.google.com/project/_/firestore/${indexUrl}`);
          console.error("After creating the index, please wait a few minutes for it to be ready");
        }
        if (!error.message.includes("requires an index")) {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up query:", error);
      setLoading(false);
    }
  }, [user]);

  const filteredTasks = tasks.filter(task => {
    if (filter === "not_started") return task.status === "not_started";
    if (filter === "in_progress") return task.status === "in_progress";
    if (filter === "completed") return task.status === "completed";
    return true;
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
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
      case "not_started":
        return "Not Started";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Not Started";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not_started":
        return "⭕️";
      case "in_progress":
        return "🔄";
      case "completed":
        return "✅";
      default:
        return "⭕️";
    }
  };

  const getNextStatus = (currentStatus: string): Task["status"] => {
    switch (currentStatus) {
      case "not_started":
        return "in_progress";
      case "in_progress":
        return "completed";
      case "completed":
        return "not_started";
      default:
        return "not_started";
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-neutral-800">My Tasks</h1>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 text-sm rounded-md border border-input bg-background text-neutral-800"
            >
              <option value="all">All Tasks</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
                  <div className="w-32 h-6 bg-neutral-200 rounded animate-pulse" />
                  <div className="w-full h-6 bg-neutral-200 rounded animate-pulse" />
                  <div className="w-2/3 h-4 bg-neutral-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600">No tasks found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all hover:shadow-sm"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      {task.assignedTo === user?.uid ? (
                        <button
                          onClick={() => updateTaskStatus(task.id, getNextStatus(task.status))}
                          className={`px-3 py-1.5 text-sm rounded-md border-2 font-medium transition-all hover:opacity-80 active:scale-95 ${getStatusColor(task.status)}`}
                        >
                          {getStatusIcon(task.status)} {getStatusLabel(task.status)}
                        </button>
                      ) : (
                        <span className={`px-3 py-1.5 text-sm rounded-md border-2 font-medium ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)} {getStatusLabel(task.status)}
                        </span>
                      )}
                      <span className="text-sm text-neutral-600">
                        Due {format(new Date(task.dueDate), "MMM d")}
                      </span>
                    </div>
                    <h3 className="font-medium text-lg text-neutral-800 mb-2">{task.name}</h3>
                    {task.description && (
                      <p className="text-sm text-neutral-600 mb-3">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-neutral-600">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs mr-2 ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </span>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/projects/${task.projectId}`)}
                        className="text-sm text-neutral-500 hover:text-neutral-800"
                      >
                        View Project →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 