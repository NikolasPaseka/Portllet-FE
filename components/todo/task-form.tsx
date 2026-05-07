"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { todoApi } from "@/lib/api"
import type { TodoSection, TodoTask, RepeatType } from "@/lib/types"
import { Plus, Trash2 } from "lucide-react"

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections: TodoSection[]
  sectionId?: string
  editingTask?: TodoTask | null
  onSave: () => void
}

interface SubtaskInput {
  id?: string
  title: string
  completed: boolean
}

export function TaskForm({
  open,
  onOpenChange,
  sections,
  sectionId,
  editingTask,
  onSave,
}: TaskFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedSectionId, setSelectedSectionId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [duration, setDuration] = useState("")
  const [repeat, setRepeat] = useState<RepeatType>("none")
  const [subtasks, setSubtasks] = useState<SubtaskInput[]>([])
  const [newSubtask, setNewSubtask] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title)
      setDescription(editingTask.description || "")
      setSelectedSectionId(editingTask.sectionId || sections[0]?.id || "")
      setDueDate(editingTask.dueDate ? editingTask.dueDate.split("T")[0] : "")
      setDuration(editingTask.duration?.toString() || "")
      setRepeat(editingTask.repeat)
      setSubtasks(editingTask.subtasks.map(s => ({ id: s.id, title: s.title, completed: s.completed })))
    } else {
      setTitle("")
      setDescription("")
      setSelectedSectionId(sectionId || sections[0]?.id || "")
      setDueDate("")
      setDuration("")
      setRepeat("none")
      setSubtasks([])
    }
    setNewSubtask("")
  }, [editingTask, sectionId, sections, open])

  function addSubtask() {
    if (!newSubtask.trim()) return
    setSubtasks([...subtasks, { title: newSubtask, completed: false }])
    setNewSubtask("")
  }

  function removeSubtask(index: number) {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!title.trim() || !selectedSectionId) return

    const tempId = editingTask?.id || 'new'
    onOpenChange(false)

    try {
      if (editingTask) {
        await todoApi.updateTask({
          id: editingTask.id,
          title,
          description: description || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          duration: duration ? parseInt(duration) : null,
          repeat,
          sectionId: selectedSectionId,
          subtasks: subtasks.map(s => ({ id: s.id, title: s.title, completed: s.completed })),
        })
      } else {
        await todoApi.createTask({
          sectionId: selectedSectionId,
          title,
          description: description || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          duration: duration ? parseInt(duration) : undefined,
          repeat,
          subtasks: subtasks.map(s => ({ title: s.title })),
        })
      }
      onSave()
    } catch (err) {
      console.error("Failed to save task:", err)
      toast.error("Failed to save task. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          <div className="grid gap-2">
            <Label>Section</Label>
            <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: section.color }}
                      />
                      {section.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Repeat</Label>
            <Select value={repeat} onValueChange={(v) => setRepeat(v as RepeatType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Subtasks</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add subtask"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSubtask()}
              />
              <Button type="button" variant="outline" size="icon" onClick={addSubtask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {subtasks.length > 0 && (
              <div className="space-y-1 mt-2">
                {subtasks.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span>{st.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto"
                      onClick={() => removeSubtask(idx)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
            {editingTask ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}