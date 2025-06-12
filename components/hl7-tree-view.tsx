"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ParsedHL7Message, HL7Segment } from "@/lib/hl7-parser"
import { getFieldDefinition, getSegmentDefinition } from "@/lib/hl7-definitions"

interface HL7TreeViewProps {
  message: ParsedHL7Message
}

interface SegmentNodeProps {
  segment: HL7Segment
  index: number
}

interface FieldNodeProps {
  field: any
  fieldIndex: number
  segmentName: string
}

function FieldNode({ field, fieldIndex, segmentName }: FieldNodeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const definition = getFieldDefinition(segmentName, fieldIndex)

  const hasComponents = field.components && field.components.length > 1
  const hasSubComponents = field.subComponents && field.subComponents.some((sc: string[]) => sc.length > 1)
  const hasRepetitions = field.repetitions && field.repetitions.length > 1

  return (
    <div className="ml-4 border-l border-slate-200 dark:border-slate-600 pl-4">
      <div className="flex items-center gap-2 py-1">
        {(hasComponents || hasSubComponents || hasRepetitions) && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <Badge variant="outline" className="text-xs">
                  {segmentName}.{fieldIndex}
                </Badge>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {definition?.name || `Field ${fieldIndex}`}
                </span>
                {definition && <Info className="h-3 w-3 text-slate-400" />}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm">
              <div className="space-y-2">
                <div className="font-semibold">{definition?.name || `Field ${fieldIndex}`}</div>
                {definition?.description && <div className="text-sm">{definition.description}</div>}
                <div className="flex gap-2 text-xs">
                  {definition?.dataType && <Badge variant="secondary">{definition.dataType}</Badge>}
                  {definition?.required && <Badge variant="destructive">Required</Badge>}
                  {definition?.repeatable && <Badge variant="default">Repeatable</Badge>}
                </div>
                {definition?.example && <div className="text-xs text-slate-600">Example: {definition.example}</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">{field.value || "(empty)"}</span>
      </div>

      {isOpen && (
        <div className="ml-6 mt-2 space-y-1">
          {hasRepetitions && field.repetitions.length > 1 && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Repetitions:</div>
              <div className="text-sm font-mono text-slate-600 dark:text-slate-300 ml-2">
                {field.repetitions.map((rep: string, idx: number) => (
                  <div key={idx} className="text-sm font-mono text-slate-600 dark:text-slate-300 ml-2">
                    [{idx}] {rep}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasComponents && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Components:</div>
              {field.components.map((comp: string, idx: number) => (
                <div key={idx} className="text-sm font-mono text-slate-600 dark:text-slate-300 ml-2">
                  [{idx}] {comp || "(empty)"}
                </div>
              ))}
            </div>
          )}

          {hasSubComponents && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sub-components:</div>
              {field.subComponents.map(
                (subComps: string[], idx: number) =>
                  subComps.length > 1 && (
                    <div key={idx} className="ml-2">
                      <div className="text-xs text-slate-400">Component {idx}:</div>
                      {subComps.map((subComp: string, subIdx: number) => (
                        <div key={subIdx} className="text-sm font-mono text-slate-600 dark:text-slate-300 ml-4">
                          [{subIdx}] {subComp || "(empty)"}
                        </div>
                      ))}
                    </div>
                  ),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SegmentNode({ segment, index }: SegmentNodeProps) {
  const [isOpen, setIsOpen] = useState(index < 3) // Auto-expand first 3 segments
  const definition = getSegmentDefinition(segment.name)

  return (
    <Card className="mb-4 dark:bg-slate-800 dark:border-slate-700">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              )}
              <Badge className="bg-blue-600 hover:bg-blue-700">{segment.name}</Badge>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {definition?.name || segment.name}
                </div>
                {definition?.description && (
                  <div className="text-sm text-slate-600 dark:text-slate-400">{definition.description}</div>
                )}
              </div>
            </div>
            <Badge variant="outline">{segment.fields.length} fields</Badge>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {segment.fields.map((field, fieldIndex) => (
                <FieldNode key={fieldIndex} field={field} fieldIndex={fieldIndex} segmentName={segment.name} />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export function HL7TreeView({ message }: HL7TreeViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary">Tree View</Badge>
        <span className="text-sm text-slate-600">Expand segments to view field details and definitions</span>
      </div>

      {message.segments.map((segment, index) => (
        <SegmentNode key={index} segment={segment} index={index} />
      ))}
    </div>
  )
}
