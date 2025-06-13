"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import type { ParsedHL7Message } from "@/lib/hl7-parser"

interface HL7TableViewProps {
  message: ParsedHL7Message
}

export function HL7TableView({ message }: HL7TableViewProps) {
  const [searchTerm, setSearchTerm] = useState("")

  if (!message || !message.segments) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2" />
            <p>No message data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Flatten all fields for table view
  const allFields = message.segments.flatMap((segment, segmentIndex) =>
    segment.fields.map((field, fieldIndex) => {
      const fieldValue = typeof field === 'string' ? field : field?.value || '';
      return {
        segmentName: segment.name,
        segmentIndex: segmentIndex + 1,
        fieldIndex: fieldIndex + 1,
        fieldPath: `${segment.name}.${fieldIndex + 1}`,
        value: fieldValue || "(empty)",
      };
    })
  )

  const filteredFields = allFields.filter(
    (field) =>
      field.segmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (field.value || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.fieldPath.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Field Table View</span>
          <Badge variant="secondary">{filteredFields.length} fields</Badge>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Segment</TableHead>
                <TableHead className="w-[100px]">Field</TableHead>
                <TableHead className="w-[120px]">Path</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFields.map((field, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant="default">{field.segmentName}</Badge>
                  </TableCell>
                  <TableCell>{field.fieldIndex}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {field.fieldPath}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm max-w-[400px] truncate">
                    {field.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}