"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Info } from "lucide-react"
import type { ParsedHL7Message } from "@/lib/hl7-parser"
import { getFieldDefinition } from "@/lib/hl7-definitions"

interface HL7TableViewProps {
  message: ParsedHL7Message
}

export function HL7TableView({ message }: HL7TableViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)

  // Flatten all fields for table view
  const allFields = message.segments.flatMap((segment, segIndex) =>
    segment.fields.map((field, fieldIndex) => ({
      segmentName: segment.name,
      segmentIndex: segIndex,
      fieldIndex,
      field,
      definition: getFieldDefinition(segment.name, fieldIndex),
    })),
  )

  // Filter fields based on search and segment selection
  const filteredFields = allFields.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.segmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.field.value.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSegment = !selectedSegment || item.segmentName === selectedSegment

    return matchesSearch && matchesSegment
  })

  const uniqueSegments = [...new Set(message.segments.map((s) => s.name))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Table View</Badge>
          <span className="text-sm text-slate-600 dark:text-slate-400">{filteredFields.length} fields displayed</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
      </div>

      {/* Segment Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedSegment === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedSegment(null)}
        >
          All Segments
        </Button>
        {uniqueSegments.map((segmentName) => (
          <Button
            key={segmentName}
            variant={selectedSegment === segmentName ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSegment(segmentName)}
          >
            {segmentName}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-lg dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Segment</TableHead>
              <TableHead className="w-16">Field</TableHead>
              <TableHead className="w-48">Field Name</TableHead>
              <TableHead className="w-20">Type</TableHead>
              <TableHead className="w-20">Required</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFields.map((item, index) => (
              <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                <TableCell>
                  <Badge className="bg-blue-600 hover:bg-blue-700">{item.segmentName}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{item.fieldIndex}</TableCell>
                <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                  {item.definition?.name || `Field ${item.fieldIndex}`}
                </TableCell>
                <TableCell>
                  {item.definition?.dataType && (
                    <Badge variant="outline" className="text-xs">
                      {item.definition.dataType}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.definition?.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm max-w-md">
                  <div className="truncate" title={item.field.value}>
                    {item.field.value || <span className="text-slate-400 dark:text-slate-500">(empty)</span>}
                  </div>
                  {item.field.repetitions && item.field.repetitions.length > 1 && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {item.field.repetitions.length} repetitions
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.definition && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Info className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-sm">
                          <div className="space-y-2">
                            <div className="font-semibold">{item.definition.name}</div>
                            {item.definition.description && (
                              <div className="text-sm">{item.definition.description}</div>
                            )}
                            <div className="flex gap-2 text-xs">
                              <Badge variant="secondary">{item.definition.dataType}</Badge>
                              {item.definition.required && <Badge variant="destructive">Required</Badge>}
                              {item.definition.repeatable && <Badge variant="default">Repeatable</Badge>}
                            </div>
                            {item.definition.example && (
                              <div className="text-xs text-slate-600">Example: {item.definition.example}</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredFields.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">No fields match your search criteria</div>
      )}
    </div>
  )
}
