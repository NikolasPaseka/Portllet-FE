"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { todoApi } from "@/lib/api"
import type { TodoSection, TodoTask, RepeatType } from "@/lib/types"
import { Plus, Trash2, GripVertical, ListTodo, ChevronDown, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { TaskForm } from "./task-form"
import { toast } from "sonner"

export default function TodoPage() {
  const [sections, setSections] = useState<TodoSection[]>([])
  const [loading, setLoading] = useState(true)
  const [newSectionName, setNewSectionName] = useState("")
  const [newSectionColor, setNewSectionColor] = useState("#6366f1")
  const [creatingSection, setCreatingSection] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; sourceSectionId: string } | null>(null)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [taskFormSectionId, setTaskFormSectionId] = useState<string>("")
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null)

  useEffect(() => {
    loadSections()
  }, [])

  async function loadSections() {
    try {
      const data = await todoApi.getSections()
      setSections(data)
      const expanded = new Set(data.map(s => s.id))
      setExpandedSections(expanded)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSection() {
    if (!newSectionName.trim()) return
    const tempId = `temp-${Date.now()}`
    const newSection: TodoSection = {
      id: tempId,
      name: newSectionName,
      color: newSectionColor,
      position: sections.length,
      tasks: [],
    }
    setSections([...sections, newSection])
    setNewSectionName("")
    setExpandedSections(prev => new Set([...prev, tempId]))
    
    try {
      const section = await todoApi.createSection(newSectionName, newSectionColor)
      setSections(prev => prev.map(s => s.id === tempId ? { ...section, tasks: [] } : s))
    } catch {
      setSections(prev => prev.filter(s => s.id !== tempId))
      toast.error("Failed to create section")
    }
  }

  async function handleDeleteSection(sectionId: string) {
    const prevSections = sections
    setSections(sections.filter(s => s.id !== sectionId))
    
    try {
      await todoApi.deleteSection(sectionId)
    } catch {
      setSections(prevSections)
      toast.error("Failed to delete section")
    }
  }

  function handleToggleTask(task: TodoTask) {
    const sectionId = task.sectionId || sections.find(s => s.tasks.some(t => t.id === task.id))?.id
    if (!sectionId) return

    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section
      return {
        ...section,
        tasks: section.tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)
      }
    }))

    todoApi.updateTask({
      id: task.id,
      completed: !task.completed,
      sectionId,
    }).catch(() => {
      setSections(prev => prev.map(section => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          tasks: section.tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)
        }
      }))
      toast.error("Failed to update task")
    })
  }

  function handleToggleSubtask(taskId: string, subtaskId: string, completed: boolean) {
    const section = sections.find(s => s.tasks.some(t => t.id === taskId))
    if (!section) return

    setSections(prev => prev.map(s => {
      if (s.id !== section.id) return s
      return {
        ...s,
        tasks: s.tasks.map(t => {
          if (t.id !== taskId) return t
          return {
            ...t,
            subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !completed } : st)
          }
        })
      }
    }))

    const task = section.tasks.find(t => t.id === taskId)
    if (!task) return

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !completed } : st
    )

    todoApi.updateTask({
      id: taskId,
      sectionId: section.id,
      subtasks: updatedSubtasks.map(st => ({ id: st.id, title: st.title, completed: st.completed })),
    }).catch(() => {
      loadSections()
      toast.error("Failed to update subtask")
    })
  }

  function handleDeleteTask(taskId: string) {
    const prevSections = [...sections]
    setSections(prev => prev.map(s => ({
      ...s,
      tasks: s.tasks.filter(t => t.id !== taskId)
    })))

    todoApi.deleteTask(taskId).catch(() => {
      setSections(prevSections)
      toast.error("Failed to delete task")
    })
  }

  function toggleSection(sectionId: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  function handleDragStart(e: React.DragEvent, taskId: string, sectionId: string) {
    setDraggedTask({ taskId, sourceSectionId: sectionId })
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", taskId)
  }

  function handleDragOver(e: React.DragEvent, sectionId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverSection(sectionId)
  }

  function handleDragLeave() {
    setDragOverSection(null)
  }

  async function handleDrop(e: React.DragEvent, targetSectionId: string) {
    e.preventDefault()
    setDragOverSection(null)
    
    if (!draggedTask) return

    if (draggedTask.sourceSectionId === targetSectionId) {
      setDraggedTask(null)
      return
    }

    const sourceSection = sections.find(s => s.id === draggedTask.sourceSectionId)
    const targetSection = sections.find(s => s.id === targetSectionId)
    if (!sourceSection || !targetSection) return

    const newPosition = targetSection.tasks.length

    try {
      await todoApi.updateTask({
        id: draggedTask.taskId,
        sectionId: targetSectionId,
        position: newPosition,
      })
      loadSections()
    } catch {
      // ignore
    }

    setDraggedTask(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListTodo className="w-6 h-6" />
            Todo
          </h1>
          <p className="text-muted-foreground">Manage your tasks and projects</p>
        </div>
      </div>

      <Card className="max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Section name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateSection()}
            />
            <Input
              type="color"
              value={newSectionColor}
              onChange={(e) => setNewSectionColor(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
          </div>
          <Button onClick={handleCreateSection} disabled={creatingSection || !newSectionName.trim()} className="w-full">
            {creatingSection ? <Spinner className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            Create Section
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader
              className="py-3 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                  <CardTitle className="text-base">{section.name}</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    ({section.tasks.length} tasks)
                  </span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has(section.id) && (
              <CardContent 
                className={cn(
                  "pt-0 transition-colors",
                  dragOverSection === section.id && "bg-accent/30"
                )}
                onDragOver={(e) => handleDragOver(e, section.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, section.id)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mb-2"
                  onClick={() => {
                    setEditingTask(null)
                    setTaskFormSectionId(section.id)
                    setTaskFormOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
                {section.tasks.length === 0 ? (
                  <div className={cn(
                    "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                    dragOverSection === section.id ? "border-primary bg-primary/10" : "border-muted"
                  )}>
                    <p className="text-sm text-muted-foreground">
                      Drag tasks here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {section.tasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id, section.id)}
                        className={cn(
                          "flex items-start gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-move",
                          task.completed && "opacity-60",
                          draggedTask?.taskId === task.id && "opacity-50"
                        )}
                      >
                        <GripVertical className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task)}
                          className="mt-1"
                        />
                        <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              setEditingTask(task)
                              setTaskFormSectionId(section.id)
                              setTaskFormOpen(true)
                            }}
                          >
                          <div className={cn("font-medium", task.completed && "line-through text-muted-foreground")}>
                            {task.title}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-1">
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                Due: {format(new Date(task.dueDate), "MMM d")}
                              </span>
                            )}
                            {task.duration && (
                              <span className="text-xs text-muted-foreground">
                                {task.duration} min
                              </span>
                            )}
                            {task.repeat !== "none" && (
                              <span className="text-xs text-muted-foreground capitalize">
                                Repeat: {task.repeat}
                              </span>
                            )}
                          </div>
                          {task.subtasks.length > 0 && (
                            <div className="mt-2 pl-4 space-y-1">
                              {task.subtasks.map((subtask) => (
                                <div key={subtask.id} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={subtask.completed}
                                    onCheckedChange={() => handleToggleSubtask(task.id, subtask.id, subtask.completed)}
                                    className="h-3 w-3"
                                  />
                                  <span className={cn("text-sm", subtask.completed && "line-through text-muted-foreground")}>
                                    {subtask.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        sections={sections}
        sectionId={taskFormSectionId}
        editingTask={editingTask}
        onSave={loadSections}
      />
    </div>
  )
}