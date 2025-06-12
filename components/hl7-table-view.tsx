"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Info, View } from "lucide-react" // Added View icon
import type { ParsedHL7Message, HL7Error } from "@/lib/hl7-parser"
import { getFieldDefinition } from "@/lib/hl7-definitions"
import { AlertTriangle } from "lucide-react"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu" // Added DropdownMenu components
import { Checkbox } from "@/components/ui/checkbox" // Added Checkbox, though DropdownMenuCheckboxItem is likely better

interface HL7TableViewProps {
  message: ParsedHL7Message
  errors: HL7Error[]
  searchTerm: string // Added searchTerm prop
}

// Define Column names and default visibility
const defaultColumnConfig = {
  segmentName: { label: "Segment", visible: true },
  fieldIndex: { label: "Field Index", visible: true },
  fieldName: { label: "Field Name", visible: true },
  dataType: { label: "Type", visible: true },
  required: { label: "Required", visible: true },
  value: { label: "Value", visible: true },
  info: { label: "Info", visible: true },
};

type ColumnId = keyof typeof defaultColumnConfig;


import { useEffect, useMemo } from "react"; // Added useEffect and useMemo

// Helper function for highlighting
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
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

export function HL7TableView({ message, errors, searchTerm }: HL7TableViewProps) { // Added searchTerm to props
  // const [searchTerm, setSearchTerm] = useState("") // Removed internal searchTerm state
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const storedPrefs = typeof window !== "undefined" ? localStorage.getItem("hl7TableViewColumnPrefs") : null;
    if (storedPrefs) {
      try {
        const parsedPrefs = JSON.parse(storedPrefs);
        // Validate if parsedPrefs matches structure of defaultColumnConfig keys
        const defaultKeys = Object.keys(defaultColumnConfig);
        const storedKeys = Object.keys(parsedPrefs);
        if (defaultKeys.every(key => storedKeys.includes(key)) && storedKeys.every(key => defaultKeys.includes(key))) {
          return parsedPrefs as Record<ColumnId, boolean>;
        }
      } catch (e) {
        console.error("Failed to parse column preferences from localStorage", e);
      }
    }
    const initialVisibility: Record<ColumnId, boolean> = {} as Record<ColumnId, boolean>;
    for (const key in defaultColumnConfig) {
      initialVisibility[key as ColumnId] = defaultColumnConfig[key as ColumnId].visible;
    }
    return initialVisibility;
  });

  // Effect to save column visibility to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hl7TableViewColumnPrefs", JSON.stringify(columnVisibility));
    }
  }, [columnVisibility]);


  // Function to get errors for a specific field
  const getFieldErrors = (segmentName: string, fieldIndex: number) => {
    return errors.filter(
      (err) =>
        err.segmentName === segmentName &&
        err.fieldIndex === fieldIndex &&
        err.line // Ensure it's a field specific error tied to a line
    );
  };

  // Flatten all fields for table view
  const allFields = message.segments.flatMap((segment, segIndex) =>
    segment.fields.map((field, fieldIndex) => {
      const fieldErrors = getFieldErrors(segment.name, fieldIndex);
      return {
        segmentName: segment.name,
        segmentIndex: segIndex,
        fieldIndex,
        field,
        definition: getFieldDefinition(segment.name, fieldIndex, message.version), // Pass version
        errors: fieldErrors,
      };
    }),
  )

  // Create a set of field identifiers that have errors for quick lookup in header
  const fieldsWithErrors = new Set(
    errors.filter(e => e.fieldIndex !== undefined).map(e => `${e.segmentName}-${e.fieldIndex}`)
  );

    // Create a set of segment identifiers that have errors for quick lookup in header
  const segmentsWithErrors = new Set(
    errors.filter(e => e.segmentName !== undefined && e.fieldIndex === undefined).map(e => e.segmentName)
  );


  // Filter fields based on search and segment selection
  // Use useMemo for filteredFields to avoid re-calculating on every render unless dependencies change
  const filteredFields = useMemo(() => {
    return allFields.filter((item) => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch =
        !lowerSearchTerm ||
        item.segmentName.toLowerCase().includes(lowerSearchTerm) ||
        item.definition?.name?.toLowerCase().includes(lowerSearchTerm) ||
        item.field.value.toLowerCase().includes(lowerSearchTerm)

      const matchesSegment = !selectedSegment || item.segmentName === selectedSegment

      return matchesSearch && matchesSegment
    })
  }, [allFields, searchTerm, selectedSegment]);

  const uniqueSegments = [...new Set(message.segments.map((s) => s.name))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Table View</Badge>
          <span className="text-sm text-slate-600 dark:text-slate-400">{filteredFields.length} fields displayed</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Column Visibility Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <View className="h-4 w-4 mr-1" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(defaultColumnConfig).map(([key, { label }]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  className="capitalize"
                  checked={columnVisibility[key as ColumnId]}
                  onCheckedChange={(value) => {
                    setColumnVisibility((prev) => ({
                      ...prev,
                      [key as ColumnId]: !!value,
                    }))
                  }}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Search input removed from here, will use global search term from props */}
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
              {columnVisibility.segmentName && (
                <TableHead className="w-24">
                  Segment{" "}
                  {Array.from(segmentsWithErrors).some(segName => !selectedSegment || selectedSegment === segName) && (
                    <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 inline-block ml-1" />
                  )}
                </TableHead>
              )}
              {columnVisibility.fieldIndex && (
                <TableHead className="w-16">
                  Field{" "}
                  {filteredFields.some(f => f.errors && f.errors.length > 0 && f.fieldIndex !== undefined) && (
                    <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 inline-block ml-1" />
                  )}
                </TableHead>
              )}
              {columnVisibility.fieldName && <TableHead className="w-48">Field Name</TableHead>}
              {columnVisibility.dataType && <TableHead className="w-20">Type</TableHead>}
              {columnVisibility.required && <TableHead className="w-20">Required</TableHead>}
              {columnVisibility.value && <TableHead>Value</TableHead>}
              {columnVisibility.info && <TableHead className="w-12">Info</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFields.map((item, index) => {
              const rowErrors = item.errors || [];
              const hasError = rowErrors.length > 0;
              const rowClass = hasError
                ? item.errors.some(e => e.severity === 'warning')
                  ? "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/40"
                  : "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40"
                : "hover:bg-slate-50 dark:hover:bg-slate-800";

              return (
                <TableRow key={index} className={rowClass}>
                  {columnVisibility.segmentName && (
                    <TableCell>
                      <Badge variant="default">
                        <HighlightedText text={item.segmentName} highlight={searchTerm} />
                      </Badge>
                    </TableCell>
                  )}
                  {columnVisibility.fieldIndex && (
                    <TableCell className="font-mono text-sm">{item.fieldIndex}</TableCell>
                  )}
                  {columnVisibility.fieldName && (
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      <HighlightedText text={item.definition?.name || `Field ${item.fieldIndex}`} highlight={searchTerm} />
                    </TableCell>
                  )}
                  {columnVisibility.dataType && (
                    <TableCell>
                      {item.definition?.dataType && (
                        <Badge variant="outline" className="text-xs">
                          {item.definition.dataType}
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  {columnVisibility.required && (
                    <TableCell>
                      {item.definition?.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  {columnVisibility.value && (
                    <TableCell className="font-mono text-sm max-w-md">
                      <div className="flex items-center">
                        <span className="truncate" title={item.field.value}>
                          {item.field.value ? (
                            <HighlightedText text={item.field.value} highlight={searchTerm} />
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">(empty)</span>
                          )}
                        </span>
                        {hasError && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className={`h-4 w-4 ml-2 flex-shrink-0 ${rowErrors.some(e => e.severity === 'warning') ? 'text-yellow-600 dark:text-yellow-500' : 'text-red-600 dark:text-red-500'}`} />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <ul className="list-disc list-inside space-y-1">
                                  {rowErrors.map((err, i) => (
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
                      {item.field.repetitions && item.field.repetitions.length > 1 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {item.field.repetitions.length} repetitions
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  {columnVisibility.info && (
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
                  )}
                </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>

      {filteredFields.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">No fields match your search criteria</div>
      )}
    </div>
  )
}
