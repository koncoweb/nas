"use client"

import { format } from "date-fns"
import { IconCircleCheck, IconCircle, IconClock } from "@tabler/icons-react"

interface TimelineEvent {
  id: string
  title: string
  description?: string
  date: string
  type: "milestone" | "activity" | "status_change"
  status?: "completed" | "in_progress" | "pending"
}

interface ProjectTimelineProps {
  events: TimelineEvent[]
  projectStatus: "planning" | "in_progress" | "completed"
}

export function ProjectTimeline({ events, projectStatus }: ProjectTimelineProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a")
    } catch {
      return dateString
    }
  }

  const getIcon = (event: TimelineEvent) => {
    if (event.status === "completed") {
      return <IconCircleCheck className="w-5 h-5 text-green-600" />
    }
    if (event.status === "in_progress") {
      return <IconClock className="w-5 h-5 text-yellow-600" />
    }
    return <IconCircle className="w-5 h-5 text-gray-400" />
  }

  const getEventColor = (event: TimelineEvent) => {
    if (event.status === "completed") return "border-green-600"
    if (event.status === "in_progress") return "border-yellow-600"
    return "border-gray-300"
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <IconClock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No timeline events yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          {/* Timeline line and icon */}
          <div className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white ${getEventColor(
                event
              )}`}
            >
              {getIcon(event)}
            </div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-full min-h-[40px] bg-gray-200 mt-2" />
            )}
          </div>

          {/* Event content */}
          <div className="flex-1 pb-8">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-sm">{event.title}</h4>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                {formatDate(event.date)}
              </span>
            </div>
            {event.type && (
              <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                {event.type.replace("_", " ")}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
