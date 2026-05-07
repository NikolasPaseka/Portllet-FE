"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { calendarApi } from "@/lib/api"
import type { CalendarEvent } from "@/lib/types"

interface CalendarInfo {
  id: string
  name: string
  color: string
}

interface EventFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  calendars: CalendarInfo[]
  selectedDate?: Date
  editingEvent?: CalendarEvent | null
  onSave: () => void
}

export function EventForm({
  open,
  onOpenChange,
  calendars,
  selectedDate,
  editingEvent,
  onSave,
}: EventFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [calendarId, setCalendarId] = useState("")
  const [isAllDay, setIsAllDay] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("10:00")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title)
      setDescription(editingEvent.description || "")
      setCalendarId(editingEvent.calendarId || calendars[0]?.id || "")
      setIsAllDay(editingEvent.isAllDay)
      
      const start = new Date(editingEvent.start)
      setStartDate(format(start, "yyyy-MM-dd"))
      setStartTime(format(start, "HH:mm"))
      
      const end = new Date(editingEvent.end)
      setEndDate(format(end, "yyyy-MM-dd"))
      setEndTime(format(end, "HH:mm"))
    } else {
      setTitle("")
      setDescription("")
      setCalendarId(calendars[0]?.id || "")
      setIsAllDay(false)
      
      const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
      setStartDate(dateStr)
      setEndDate(dateStr)
      setStartTime("09:00")
      setEndTime("10:00")
    }
  }, [editingEvent, selectedDate, calendars, open])

  async function handleSave() {
    if (!title.trim() || !calendarId) return

    setSaving(true)
    try {
      const start = isAllDay 
        ? `${startDate}T00:00:00` 
        : `${startDate}T${startTime}:00`
      const end = isAllDay 
        ? `${endDate}T23:59:59` 
        : `${endDate}T${endTime}:00`

      if (editingEvent) {
        await calendarApi.updateEvent({
          eventId: editingEvent.id,
          summary: title,
          description: description || undefined,
          start,
          end,
          calendarId,
          isAllDay,
        })
      } else {
        await calendarApi.createEvent({
          summary: title,
          description: description || undefined,
          start,
          end,
          calendarId,
          isAllDay,
        })
      }
      onSave()
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to save event:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingEvent || !editingEvent.calendarId) return

    setDeleting(true)
    try {
      await calendarApi.deleteEvent(editingEvent.id, editingEvent.calendarId)
      onSave()
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to delete event:", err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingEvent ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
            />
          </div>

          <div className="grid gap-2">
            <Label>Calendar</Label>
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger>
                <SelectValue placeholder="Select calendar" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cal.color }}
                      />
                      {cal.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allDay">All day</Label>
            <Switch
              id="allDay"
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start {isAllDay ? "Date" : "Date & Time"}</Label>
              {isAllDay ? (
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-24"
                  />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>End {isAllDay ? "Date" : "Date & Time"}</Label>
              {isAllDay ? (
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-24"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="justify-between">
          <div>
            {editingEvent && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Spinner className="h-4 w-4 mr-2" /> : null}
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
              {editingEvent ? "Save" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}