"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IconPlus } from "@tabler/icons-react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/lib/contexts/auth-context";
import { useEffect } from "react";
import { format } from "date-fns";

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  projectId: string;
  createdAt: string;
}

interface MilestoneListProps {
  projectId: string;
}

export function MilestoneList({ projectId }: MilestoneListProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, "milestones"),
      where("projectId", "==", projectId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMilestones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Milestone));
      setMilestones(newMilestones);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "milestones"), {
        ...formData,
        completed: false,
        projectId,
        createdAt: new Date().toISOString(),
      });

      setOpen(false);
      setFormData({
        title: "",
        description: "",
        dueDate: "",
      });
    } catch (error) {
      console.error("Error creating milestone:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestone = async (milestoneId: string, completed: boolean) => {
    try {
      await deleteDoc(doc(db, "milestones", milestoneId));
    } catch (error) {
      console.error("Error toggling milestone:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-neutral-200 p-4 space-y-2">
            <div className="w-32 h-6 bg-neutral-200 rounded animate-pulse" />
            <div className="w-full h-4 bg-neutral-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-800">Project Milestones</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center space-x-2 px-3 py-1.5 bg-black text-white text-sm rounded-lg hover:bg-black/90 transition-colors">
              <IconPlus className="w-4 h-4" />
              <span>Add Milestone</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Project Milestone</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Milestone Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter milestone title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter milestone description"
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-neutral-800 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-black/90 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Milestone"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-8 text-neutral-600">
          No milestones added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-neutral-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-neutral-800">{milestone.title}</h3>
                  {milestone.description && (
                    <p className="text-sm text-neutral-600 mt-1">{milestone.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-neutral-500">
                      Due {format(new Date(milestone.dueDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleMilestone(milestone.id, !milestone.completed)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 