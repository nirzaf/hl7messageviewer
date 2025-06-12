"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, Code, Table } from "lucide-react"
import type { ParsedHL7Message } from "@/lib/hl7-parser"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: ParsedHL7Message
  rawMessage: string
}

export function ExportDialog({ open, onOpenChange, message, rawMessage }: ExportDialogProps) {
  const [format, setFormat] = useState("json")
  const [includeDefinitions, setIncludeDefinitions] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)

  const exportData = () => {
    let data: string
    let filename: string
    let mimeType: string

    switch (format) {
      case "json":
        data = JSON.stringify(
          {
            ...(includeMetadata && {
              metadata: {
                version: message.version,
                messageType: message.messageType,
                controlId: message.controlId,
                exportedAt: new Date().toISOString(),
                segmentCount: message.segments.length,
              },
            }),
            message,
            ...(includeDefinitions && { includeDefinitions: true }),
          },
          null,
          2,
        )
        filename = "hl7-message.json"
        mimeType = "application/json"
        break

      case "xml":
        data = convertToXML(message, includeMetadata, includeDefinitions)
        filename = "hl7-message.xml"
        mimeType = "application/xml"
        break

      case "csv":
        data = convertToCSV(message)
        filename = "hl7-message.csv"
        mimeType = "text/csv"
        break

      case "raw":
        data = rawMessage
        filename = "hl7-message.hl7"
        mimeType = "text/plain"
        break

      default:
        return
    }

    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    onOpenChange(false)
  }

  const convertToXML = (msg: ParsedHL7Message, metadata: boolean, definitions: boolean): string => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<HL7Message>\n'

    if (metadata) {
      xml += "  <Metadata>\n"
      xml += `    <Version>${msg.version}</Version>\n`
      xml += `    <MessageType>${msg.messageType}</MessageType>\n`
      xml += `    <ControlId>${msg.controlId}</ControlId>\n`
      xml += `    <ExportedAt>${new Date().toISOString()}</ExportedAt>\n`
      xml += "  </Metadata>\n"
    }

    xml += "  <Segments>\n"
    msg.segments.forEach((segment, segIndex) => {
      xml += `    <Segment name="${segment.name}" index="${segIndex}">\n`
      segment.fields.forEach((field, fieldIndex) => {
        xml += `      <Field index="${fieldIndex}">\n`
        xml += `        <Value><![CDATA[${field.value}]]></Value>\n`
        if (field.components.length > 1) {
          xml += "        <Components>\n"
          field.components.forEach((comp, compIndex) => {
            xml += `          <Component index="${compIndex}"><![CDATA[${comp}]]></Component>\n`
          })
          xml += "        </Components>\n"
        }
        xml += "      </Field>\n"
      })
      xml += "    </Segment>\n"
    })
    xml += "  </Segments>\n</HL7Message>"

    return xml
  }

  const convertToCSV = (msg: ParsedHL7Message): string => {
    const headers = ["Segment", "Field_Index", "Field_Value", "Components", "Repetitions"]
    const rows = [headers.join(",")]

    msg.segments.forEach((segment) => {
      segment.fields.forEach((field, fieldIndex) => {
        const row = [
          segment.name,
          fieldIndex.toString(),
          `"${field.value.replace(/"/g, '""')}"`,
          `"${field.components.join("^").replace(/"/g, '""')}"`,
          field.repetitions.length.toString(),
        ]
        rows.push(row.join(","))
      })
    })

    return rows.join("\n")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export HL7 Message
          </DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            Choose your preferred export format and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium dark:text-slate-200">Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  JSON (Structured data)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xml" id="xml" />
                <Label htmlFor="xml" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  XML (Structured markup)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  CSV (Tabular data)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="raw" id="raw" />
                <Label htmlFor="raw" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Raw HL7 (Original format)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {(format === "json" || format === "xml") && (
            <div className="space-y-3">
              <Label className="text-base font-medium dark:text-slate-200">Export Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metadata"
                    checked={includeMetadata}
                    onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                  />
                  <Label htmlFor="metadata" className="text-sm dark:text-slate-300">
                    Include metadata (version, message type, etc.)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="definitions"
                    checked={includeDefinitions}
                    onCheckedChange={(checked) => setIncludeDefinitions(checked as boolean)}
                  />
                  <Label htmlFor="definitions" className="text-sm dark:text-slate-300">
                    Include field definitions and descriptions
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
