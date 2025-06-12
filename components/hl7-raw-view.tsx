"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Download } from "lucide-react"
import type { HL7Error } from "@/lib/hl7-parser"

interface HL7RawViewProps {
  message: string
  errors: HL7Error[]
  searchTerm: string // Added searchTerm prop
}

// Helper function for highlighting (can be moved to a shared utils file)
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!text) return null;
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

export function HL7RawView({ message, errors, searchTerm }: HL7RawViewProps) { // Added searchTerm to props
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  const downloadAsFile = () => {
    const blob = new Blob([message], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "hl7-message.hl7"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Split message into lines for error highlighting
  const lines = message.split(/\r?\n/)
  const errorLines = new Set(errors.filter(e => e.severity === 'error' || !e.severity).map((error) => error.line - 1))
  const warningLines = new Set(errors.filter(e => e.severity === 'warning').map((error) => error.line - 1))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Raw View</Badge>
          <span className="text-sm text-slate-600">
            {lines.length} lines, {message.length} characters
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!message}>
            <Copy className="h-4 w-4 mr-1" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadAsFile} disabled={!message}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 dark:bg-slate-800">
          <div className="relative">
            <pre className="text-sm font-mono p-4 overflow-x-auto bg-slate-50 dark:bg-slate-900 rounded-lg">
              {lines.map((line, index) => {
                let lineClass = "flex";
                if (errorLines.has(index)) {
                  lineClass += " bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 pl-2";
                } else if (warningLines.has(index)) {
                  lineClass += " bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500 pl-2";
                }
                return (
                  <div key={index} className={lineClass}>
                    <span className="text-slate-400 dark:text-slate-500 select-none w-8 text-right mr-4 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-all text-slate-900 dark:text-slate-100">
                      <HighlightedText text={line} highlight={searchTerm} />
                    </span>
                  </div>
                );
              })}
            </pre>

            {message && (
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-white dark:bg-slate-800">
                  {message.split("|")[0] || "HL7"}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error annotations */}
      {errors.length > 0 && (
        <Card className={`
          ${errors.some(e => e.severity === 'error' || !e.severity) ? 'border-red-200 dark:border-red-800 dark:bg-red-900/10' : ''}
          ${errors.some(e => e.severity === 'warning') ? 'border-yellow-200 dark:border-yellow-800 dark:bg-yellow-900/10' : ''}
          ${errors.every(e => e.severity === 'warning') ? '!border-yellow-500 dark:!border-yellow-600' : ''}
        `}>
          <CardContent className="p-4">
            <h4 className={`font-semibold mb-2
              ${errors.every(e => e.severity === 'warning') ? 'text-yellow-800 dark:text-yellow-400' : 'text-red-800 dark:text-red-400'}
            `}>
              {errors.every(e => e.severity === 'warning') ? 'Parsing Warnings' : errors.some(e => e.severity === 'error' || !e.severity) && errors.some(e => e.severity === 'warning') ? 'Parsing Errors & Warnings' : 'Parsing Errors'}
            </h4>
            <div className="space-y-2">
              {errors.map((error, index) => {
                const isWarning = error.severity === "warning";
                const severityLabel = error.severity ? `[${error.severity.toUpperCase()}] ` : "[ERROR] "; // Default to ERROR if severity not present
                const fieldInfo = error.fieldName ? `${error.fieldName} ` : "";
                // Only show segment name here if it's not already part of the line badge
                const segmentInfo = error.segmentName && (error.line <= 0) ? `(Segment: ${error.segmentName})` : "";
                const lineInfo = error.line > 0 ? `Line ${error.line}` : "";

                return (
                  <div key={index} className={`text-sm ${isWarning ? "text-yellow-700 dark:text-yellow-300" : "text-red-700 dark:text-red-300"}`}>
                    <Badge
                      variant={isWarning ? "default" : "destructive"}
                      className={`mr-2 align-middle ${isWarning ? 'bg-yellow-400 hover:bg-yellow-500 text-black' : ''}`}
                    >
                      {lineInfo || error.segmentName || "General"}
                    </Badge>
                    <span className="align-middle">{severityLabel}{fieldInfo}{error.message} {segmentInfo}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
