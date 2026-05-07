"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { calendarApi, apiRequest } from "@/lib/api"
import type { CalendarEvent } from "@/lib/types"
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react"
import { format, startOfMonth, endOfMonth, addMonths, isSameDay, eachDayOfInterval, startOfWeek, endOfWeek, getDay } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { EventForm } from "./event-form"

interface CalendarInfo {
  id: string
  name: string
  color: string
}

export default function CalendarPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<{ connected: boolean; email?: string } | null>(null)
  const [calendars, setCalendars] = useState<CalendarInfo[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [eventsCache, setEventsCache] = useState<Map<string, CalendarEvent[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [loadingMonth, setLoadingMonth] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    const connected = searchParams.get("google_connected")
    const error = searchParams.get("google_error")
    if (connected === "true") {
      toast.success("Google Calendar connected successfully!")
    } else if (error) {
      toast.error("Failed to connect Google Calendar")
    }
  }, [searchParams])

  useEffect(() => {
    loadStatus()
  }, [])

  useEffect(() => {
    if (status?.connected && calendars.length === 0) {
      loadCalendars()
    }
  }, [status?.connected])

  async function loadStatus() {
    try {
      const data = await calendarApi.getStatus()
      setStatus(data)
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  async function loadCalendars() {
    try {
      const data = await calendarApi.getCalendars()
      setCalendars(data)
    } catch {
      setCalendars([])
    }
  }

  function getMonthKey(date: Date): string {
    return format(date, "yyyy-MM")
  }

  async function loadEventsForMonth(month: Date): Promise<CalendarEvent[]> {
    const timeMin = startOfMonth(month).toISOString()
    const timeMax = endOfMonth(month).toISOString()
    return calendarApi.getEvents(timeMin, timeMax)
  }

  async function prefetchMonths(centerMonth: Date) {
    const monthsToLoad: Date[] = []
    for (let i = -6; i <= 6; i++) {
      monthsToLoad.push(addMonths(centerMonth, i))
    }

    const fetchPromises = monthsToLoad.map(async (month) => {
      const key = getMonthKey(month)
      if (eventsCache.has(key)) return

      setLoadingMonth(key)
      try {
        const data = await loadEventsForMonth(month)
        setEventsCache(prev => new Map(prev).set(key, data))
      } catch {
        // ignore errors
      } finally {
        setLoadingMonth(null)
      }
    })

    await Promise.all(fetchPromises)
  }

  useEffect(() => {
    if (!status?.connected) return
    
    const currentKey = getMonthKey(currentMonth)
    
    if (eventsCache.has(currentKey)) {
      setEvents(eventsCache.get(currentKey) || [])
    } else {
      loadEventsForMonth(currentMonth).then(data => {
        setEventsCache(prev => new Map(prev).set(currentKey, data))
        setEvents(data)
      })
    }
    
    prefetchMonths(currentMonth)
  }, [status?.connected, currentMonth])

  async function handleConnect() {
    setConnecting(true)
    try {
      const { url } = await apiRequest<{ url: string }>("/auth/google")
      window.location.href = url
    } catch {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    try {
      await calendarApi.disconnect()
      setStatus({ connected: false })
      setCalendars([])
      setEvents([])
    } catch {
      // ignore
    }
  }

  function getEventsForDate(date: Date): CalendarEvent[] {
    return events.filter((event) => {
      const eventDate = new Date(event.start)
      return isSameDay(eventDate, date)
    })
  }

  function handleEventSave() {
    const currentKey = getMonthKey(currentMonth)
    loadEventsForMonth(currentMonth).then(data => {
      setEventsCache(prev => new Map(prev).set(currentKey, data))
      setEvents(data)
    })
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
            <CalendarDays className="w-6 h-6" />
            Calendar
          </h1>
          <p className="text-muted-foreground">Sync your Google Calendar events</p>
        </div>
        {status?.connected && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Connected as {status.email}</span>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        )}
      </div>

      {!status?.connected && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connect Google Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Connect your Google Calendar to view your events here.
            </p>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Connect Google Calendar
            </Button>
          </CardContent>
        </Card>
      )}

      {status?.connected && (
        <>
          {calendars.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Calendars</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {calendars.map((cal) => (
                    <Badge
                      key={cal.id}
                      className="px-3 py-1"
                      style={{ backgroundColor: cal.color, color: '#fff' }}
                    >
                      {cal.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentMonth(new Date())
                      setSelectedDate(new Date())
                    }}
                  >
                    Today
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {eachDayOfInterval({ 
                    start: startOfWeek(startOfMonth(currentMonth)), 
                    end: endOfWeek(endOfMonth(currentMonth))
                  }).map((date) => {
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                    const dayEvents = getEventsForDate(date)
                    const isSelected = selectedDate && isSameDay(date, selectedDate)
                    const isToday = isSameDay(date, new Date())
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "min-h-[60px] p-1 rounded-md border flex flex-col items-start justify-start transition-colors",
                          isSelected ? "bg-secondary border-primary" : "hover:bg-accent/50",
                          isToday && "ring-1 ring-primary",
                          !isCurrentMonth && "opacity-30"
                        )}
                      >
                        <span className={cn("text-sm font-medium", isSelected && "text-primary")}>
                          {date.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-auto">
                            {dayEvents.slice(0, 3).map((event, idx) => (
                              <div
                                key={idx}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: event.calendarColor || '#888' }}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingEvent(null)
                    setEventFormOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDate && getEventsForDate(selectedDate).length === 0 && (
                  <p className="text-muted-foreground text-sm">No events on this day</p>
                )}
                {selectedDate &&
                  getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      style={{ borderLeftColor: event.calendarColor || '#888', borderLeftWidth: '4px' }}
                      onClick={() => {
                        setEditingEvent(event)
                        setEventFormOpen(true)
                      }}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.isAllDay
                          ? "All day"
                          : `${format(new Date(event.start), "h:mm a")} - ${format(new Date(event.end), "h:mm a")}`}
                      </div>
                      {event.calendarName && (
                        <div className="text-xs mt-1 font-medium" style={{ color: event.calendarColor }}>
                          {event.calendarName}
                        </div>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <EventForm
        open={eventFormOpen}
        onOpenChange={setEventFormOpen}
        calendars={calendars}
        selectedDate={selectedDate}
        editingEvent={editingEvent}
        onSave={handleEventSave}
      />
    </div>
  )
}