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

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  projectId: string;
  createdAt: string;
}

interface MeetingListProps {
  projectId: string;
}

export function MeetingList({ projectId }: MeetingListProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });

  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, "meetings"),
      where("projectId", "==", projectId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMeetings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Meeting));
      setMeetings(newMeetings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "meetings"), {
        ...formData,
        projectId,
        createdAt: new Date().toISOString(),
      });

      setOpen(false);
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
      });
    } catch (error) {
      console.error("Error creating meeting:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;
    
    try {
      await deleteDoc(doc(db, "meetings", meetingId));
    } catch (error) {
      console.error("Error deleting meeting:", error);
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
        <h2 className="text-lg font-medium text-neutral-800">Team Meetings</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center space-x-2 px-3 py-1.5 bg-black text-white text-sm rounded-lg hover:bg-black/90 transition-colors">
              <IconPlus className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule Team Meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter meeting title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter meeting description"
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-neutral-800 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter meeting location or link"
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
                  {loading ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-8 text-neutral-600">
          No meetings scheduled yet.
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-neutral-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-neutral-800">{meeting.title}</h3>
                  {meeting.description && (
                    <p className="text-sm text-neutral-600 mt-1">{meeting.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-neutral-500">
                      {format(new Date(`${meeting.date}T${meeting.time}`), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {meeting.location}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteMeeting(meeting.id)}
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