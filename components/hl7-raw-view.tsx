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
}

export function HL7RawView({ message, errors }: HL7RawViewProps) {
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
  const errorLines = new Set(errors.map((error) => error.line - 1))

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
              {lines.map((line, index) => (
                <div
                  key={index}
                  className={`flex ${errorLines.has(index) ? "bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 pl-2" : ""}`}
                >
                  <span className="text-slate-400 dark:text-slate-500 select-none w-8 text-right mr-4 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-all text-slate-900 dark:text-slate-100">
                    {line}
                  </span>
                </div>
              ))}
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
        <Card className="border-red-200 dark:border-red-800 dark:bg-red-900/10">
          <CardContent className="p-4">
            <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">Parsing Errors</h4>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="text-sm">
                  <Badge variant="destructive" className="mr-2">
                    Line {error.line}
                  </Badge>
                  <span className="text-red-700 dark:text-red-300">{error.message}</span>
                  {error.segmentName && (
                    <Badge variant="outline" className="ml-2">
                      {error.segmentName}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
