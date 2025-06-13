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
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ParsedHL7Message } from "@/lib/hl7-parser"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: ParsedHL7Message
  rawMessage: string
}

export function ExportDialog({ open, onOpenChange, message, rawMessage }: ExportDialogProps) {
  const { toast } = useToast()
  const [format, setFormat] = useState("json")
  const [includeRaw, setIncludeRaw] = useState(true)

  const handleExport = () => {
    try {
      let content = ""
      let filename = ""
      let mimeType = ""

      switch (format) {
        case "json":
          content = JSON.stringify(
            {
              ...(includeRaw && { rawMessage }),
              parsedMessage: message,
              exportedAt: new Date().toISOString(),
            },
            null,
            2
          )
          filename = `hl7-message-${Date.now()}.json`
          mimeType = "application/json"
          break

        case "csv":
          const csvRows = [
            ["Segment", "Field", "Value"],
            ...message.segments.flatMap((segment, segmentIndex) =>
              segment.fields.map((field, fieldIndex) => [
                segment.name,
                `${segment.name}.${fieldIndex + 1}`,
                field || "",
              ])
            ),
          ]
          content = csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")
          filename = `hl7-message-${Date.now()}.csv`
          mimeType = "text/csv"
          break

        case "txt":
          content = includeRaw ? rawMessage : message.segments.map(s => s.fields.join("|")).join("\n")
          filename = `hl7-message-${Date.now()}.txt`
          mimeType = "text/plain"
          break
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export successful",
        description: `Message exported as ${filename}`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export the message",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export HL7 Message
          </DialogTitle>
          <DialogDescription>
            Choose the format and options for exporting your HL7 message
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json">JSON (Structured data)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV (Spreadsheet)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" />
                <Label htmlFor="txt">Text (Raw format)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-raw"
              checked={includeRaw}
              onCheckedChange={setIncludeRaw}
            />
            <Label htmlFor="include-raw">Include raw message</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}