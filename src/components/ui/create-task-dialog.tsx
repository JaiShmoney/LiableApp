"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IconPlus } from "@tabler/icons-react";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CreateTaskDialogProps {
  projectId: string;
}

export function CreateTaskDialog({ projectId }: CreateTaskDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dueDate: "",
    priority: "",
    assignedTo: "",
  });

  useEffect(() => {
    async function fetchProjectMembers() {
      if (!open) return;
      
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) return;

        const memberIds = projectDoc.data().members || [];
        console.log("Current user ID:", user?.uid);
        console.log("Project members:", memberIds);
        
        const memberData = await Promise.all(
          memberIds.map(async (memberId: string) => {
            const memberDoc = await getDoc(doc(db, 'users', memberId));
            if (memberDoc.exists()) {
              const member = {
                id: memberId,
                ...memberDoc.data()
              } as Member;
              console.log("Found member:", {
                id: member.id,
                name: `${member.firstName} ${member.lastName}`,
                email: member.email,
                isCurrentUser: member.id === user?.uid
              });
              return member;
            }
            return null;
          })
        );

        const validMembers = memberData.filter((member): member is Member => member !== null);
        console.log("Setting members:", validMembers.map(m => ({ 
          id: m.id, 
          name: `${m.firstName} ${m.lastName}`,
          isCurrentUser: m.id === user?.uid
        })));
        setMembers(validMembers);
      } catch (error) {
        console.error('Error fetching project members:', error);
      }
    }

    fetchProjectMembers();
  }, [projectId, open, user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error("No user found when creating task");
      return;
    }

    console.log("Creating task with user:", {
      uid: user.uid,
      email: user.email
    });
    console.log("Form data:", formData);
    console.log("Available members:", members.map(m => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`
    })));
    
    if (!formData.assignedTo) {
      console.error("No assignedTo value selected");
      return;
    }

    const selectedMember = members.find(m => m.id === formData.assignedTo);
    if (!selectedMember) {
      console.error("Selected member not found in members list");
      return;
    }

    console.log("Selected member:", {
      id: selectedMember.id,
      name: `${selectedMember.firstName} ${selectedMember.lastName}`,
      email: selectedMember.email
    });

    setLoading(true);
    try {
      // First verify the project exists
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        console.error("Project not found:", projectId);
        return;
      }

      const taskData = {
        name: formData.name,
        description: formData.description,
        dueDate: formData.dueDate,
        priority: formData.priority,
        assignedTo: formData.assignedTo,
        projectId,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        status: "assigned",
      };

      console.log("Creating task with exact data:", taskData);

      const docRef = await addDoc(collection(db, "tasks"), taskData);
      console.log("Task created with ID:", docRef.id);

      // Verify the task was created with correct data
      const taskSnap = await getDoc(docRef);
      if (taskSnap.exists()) {
        const savedData = taskSnap.data();
        console.log("Verified saved task data:", {
          id: docRef.id,
          ...savedData,
        });
      }

      setOpen(false);
      setFormData({
        name: "",
        description: "",
        dueDate: "",
        priority: "",
        assignedTo: "",
      });
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors">
          <IconPlus className="w-5 h-5" />
          <span>Create Task</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Task Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter task name"
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-neutral-800 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              rows={3}
              disabled={loading}
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
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-neutral-800 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              required
              disabled={loading}
            >
              <option value="" className="text-neutral-500">Select priority level</option>
              <option value="low" className="text-neutral-800">Low</option>
              <option value="medium" className="text-neutral-800">Medium</option>
              <option value="high" className="text-neutral-800">High</option>
            </select>
          </div>
          <div>
            <Label htmlFor="assignedTo">Assign To</Label>
            <select
              id="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => {
                console.log("Selected assignedTo value:", e.target.value);
                const member = members.find(m => m.id === e.target.value);
                if (member) {
                  console.log("Selected member:", {
                    id: member.id,
                    name: `${member.firstName} ${member.lastName}`
                  });
                }
                setFormData(prev => ({ ...prev, assignedTo: e.target.value }));
              }}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-neutral-800 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              required
              disabled={loading}
            >
              <option value="" className="text-neutral-500">Select team member</option>
              {members.map((member) => (
                <option 
                  key={member.id} 
                  value={member.id}
                  className="text-neutral-800"
                >
                  {member.firstName} {member.lastName} ({member.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-black transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-black/90 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 