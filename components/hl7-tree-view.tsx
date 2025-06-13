"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ParsedHL7Message, HL7Segment } from "@/lib/hl7-parser"

interface HL7TreeViewProps {
  message: ParsedHL7Message
}

interface SegmentNodeProps {
  segment: HL7Segment
  index: number
}

function SegmentNode({ segment, index }: SegmentNodeProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="border rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <Badge variant="default" className="font-mono">
          {segment.name}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Segment {index + 1} - {segment.fields.length} fields
        </span>
      </div>

      {isOpen && (
        <div className="ml-6 space-y-1">
          {segment.fields.map((field, fieldIndex) => (
            <div key={fieldIndex} className="flex items-center gap-2 py-1">
              <Badge variant="outline" className="text-xs min-w-[60px]">
                {segment.name}.{fieldIndex + 1}
              </Badge>
              <span className="text-sm font-mono text-muted-foreground">
                {typeof field === 'string' ? field : field?.value || "(empty)"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function HL7TreeView({ message }: HL7TreeViewProps) {
  if (!message || !message.segments) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p>No message data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardContent className="p-4 h-full">
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {message.segments.map((segment, index) => (
              <SegmentNode key={index} segment={segment} index={index} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}