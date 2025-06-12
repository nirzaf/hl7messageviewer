"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ParsedHL7Message, HL7Segment, HL7Error } from "@/lib/hl7-parser" // Added HL7Error
import { getFieldDefinition, getSegmentDefinition } from "@/lib/hl7-definitions"
import { AlertTriangle } from "lucide-react"; // Added AlertTriangle

import { useMemo } from "react"; // Import useMemo

interface HL7TreeViewProps {
  message: ParsedHL7Message
  errors: HL7Error[]
  searchTerm: string // Added searchTerm prop
}

interface SegmentNodeProps {
  segment: HL7Segment
  index: number
  errors: HL7Error[]
  messageVersion: string
  searchTerm: string // Added searchTerm prop
}

interface FieldNodeProps {
  field: any
  fieldIndex: number
  segmentName: string
  errors: HL7Error[]
  messageVersion: string
  searchTerm: string // Added searchTerm prop
}

// Helper function for highlighting (can be moved to a shared utils file)
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!text) return null; // Handle null or undefined text
  if (!highlight.trim()) {
    return <>{text}</>;
  }
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-300 dark:bg-yellow-500 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};


function FieldNode({ field, fieldIndex, segmentName, errors, messageVersion, searchTerm }: FieldNodeProps) { // Added searchTerm
  const [isOpen, setIsOpen] = useState(false)
  const definition = getFieldDefinition(segmentName, fieldIndex, messageVersion)

  const fieldErrors = errors.filter(
    (err) => err.segmentName === segmentName && err.fieldIndex === fieldIndex
  );
  const hasError = fieldErrors.length > 0;
  const isWarning = hasError && fieldErrors.some(e => e.severity === 'warning');


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
              <div className={`flex items-center gap-1 cursor-help p-1 rounded ${hasError ? (isWarning ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30') : ''}`}>
                <Badge variant="outline" className="text-xs">
                  {segmentName}.{fieldIndex}
                </Badge>
                <span className={`text-sm font-medium ${hasError ? (isWarning ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300') : 'text-slate-900 dark:text-slate-100'}`}>
                  <HighlightedText text={definition?.name || `Field ${fieldIndex}`} highlight={searchTerm} />
                </span>
                {definition && !hasError && <Info className="h-3 w-3 text-slate-400 dark:text-slate-500" />}
                {hasError && <AlertTriangle className={`h-4 w-4 ${isWarning ? 'text-yellow-600 dark:text-yellow-500' : 'text-red-600 dark:text-red-500'}`} />}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm">
              {hasError && (
                <ul className="list-disc list-inside space-y-1 mb-2 border-b pb-2">
                  {fieldErrors.map((err, i) => (
                    <li key={i} className={`${err.severity === 'warning' ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'}`}>
                      <strong>[{err.severity?.toUpperCase() || 'ERROR'}]</strong> {err.message}
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-2">
                <div className="font-semibold">
                  <HighlightedText text={definition?.name || `Field ${fieldIndex}`} highlight={searchTerm} />
                </div>
                {definition?.description && <div className="text-sm"><HighlightedText text={definition.description} highlight={searchTerm} /></div>}
                <div className="flex gap-2 text-xs">
                  {definition?.dataType && <Badge variant="secondary"><HighlightedText text={definition.dataType} highlight={searchTerm} /></Badge>}
                  {definition?.required && <Badge variant="destructive">Required</Badge>}
                  {definition?.repeatable && <Badge variant="default">Repeatable</Badge>}
                </div>
                {definition?.example && <div className="text-xs text-slate-600">Example: <HighlightedText text={definition.example} highlight={searchTerm} /></div>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className={`text-sm font-mono ${hasError ? (isWarning ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400') : 'text-slate-600 dark:text-slate-400'}`}>
          {field.value ? <HighlightedText text={field.value} highlight={searchTerm} /> : "(empty)"}
        </span>
      </div>

      {isOpen && (
        <div className="ml-6 mt-2 space-y-1">
          {hasRepetitions && field.repetitions.length > 1 && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Repetitions:</div>
              <div className="text-sm font-mono text-slate-600 dark:text-slate-300 ml-2">
                {field.repetitions.map((rep: string, idx: number) => (
                  <div key={idx} className="text-sm font-mono text-slate-600 dark:text-slate-300 ml-2">
                    [{idx}] <HighlightedText text={rep} highlight={searchTerm} />
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
                  [{idx}] {comp ? <HighlightedText text={comp} highlight={searchTerm} /> : "(empty)"}
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
                          [{subIdx}] {subComp ? <HighlightedText text={subComp} highlight={searchTerm} /> : "(empty)"}
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

function SegmentNode({ segment, index, errors, messageVersion, searchTerm }: SegmentNodeProps) { // Added searchTerm
  const [isOpen, setIsOpen] = useState(index < 3)
  const definition = getSegmentDefinition(segment.name, messageVersion)

  const segmentErrors = errors.filter(
    (err) => err.segmentName === segment.name && err.fieldIndex === undefined
  );
  const hasSegmentError = segmentErrors.length > 0;
  const hasAnyErrorInFields = errors.some(err => err.segmentName === segment.name && err.fieldIndex !== undefined);
  const isSegmentWarning = hasSegmentError && segmentErrors.some(e => e.severity === 'warning');

  // Auto-expand segment if its name/description or any of its fields' name/value matches search term
  const shouldAutoExpand = useMemo(() => {
    if (!searchTerm.trim()) return index < 3; // Default expansion for first 3 segments if no search
    if (definition?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        definition?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        segment.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return true;
    }
    return segment.fields.some(f => {
      const fieldDef = getFieldDefinition(segment.name, f.fieldIndex, messageVersion);
      return fieldDef?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             f.value?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, segment, definition, index, messageVersion]);

  useEffect(() => {
    if (searchTerm.trim()) { // Only auto-expand/collapse based on search if there is a search term
      setIsOpen(shouldAutoExpand);
    } else {
      setIsOpen(index < 3); // Revert to default expansion when search is cleared
    }
  }, [shouldAutoExpand, searchTerm, index]);

  const cardClasses = `mb-4 dark:bg-slate-800 dark:border-slate-700 ${
    hasSegmentError ? (isSegmentWarning ? 'border-yellow-500 dark:border-yellow-600' : 'border-red-500 dark:border-red-600') :
    hasAnyErrorInFields ? 'border-red-300 dark:border-red-700' : ''
  }`;


  return (
    <Card className={cardClasses}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors rounded-t-lg ${hasSegmentError ? (isSegmentWarning ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30') : ''}`}>
            <div className="flex items-center gap-3">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              )}
              <Badge variant="default">
                <HighlightedText text={segment.name} highlight={searchTerm} />
              </Badge>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${hasSegmentError ? (isSegmentWarning ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300') : 'text-slate-900 dark:text-slate-100'}`}>
                    <HighlightedText text={definition?.name || segment.name} highlight={searchTerm} />
                  </span>
                  {hasSegmentError && (
                     <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <AlertTriangle className={`h-4 w-4 ${isSegmentWarning ? 'text-yellow-600 dark:text-yellow-500' : 'text-red-600 dark:text-red-500'}`} />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <ul className="list-disc list-inside space-y-1">
                            {segmentErrors.map((err, i) => (
                              <li key={i} className={`${err.severity === 'warning' ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'}`}>
                                <strong>[{err.severity?.toUpperCase() || 'ERROR'}]</strong> {err.message}
                              </li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {definition?.description && (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <HighlightedText text={definition.description} highlight={searchTerm} />
                  </div>
                )}
              </div>
            </div>
            <Badge variant="outline">{segment.fields.length} fields</Badge>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-2 p-2">
              {segment.fields.map((field, fieldIndex) => (
                <FieldNode key={fieldIndex} field={field} fieldIndex={fieldIndex} segmentName={segment.name} errors={errors} messageVersion={messageVersion} searchTerm={searchTerm} />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export function HL7TreeView({ message, errors, searchTerm }: HL7TreeViewProps) { // Added searchTerm to props
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary">Tree View</Badge>
        <span className="text-sm text-slate-600 dark:text-slate-400">Expand segments to view field details and definitions</span>
      </div>

      {message.segments.map((segment, index) => (
        <SegmentNode key={index} segment={segment} index={index} errors={errors} messageVersion={message.version} searchTerm={searchTerm} /> // Pass searchTerm
      ))}
    </div>
  )
}
