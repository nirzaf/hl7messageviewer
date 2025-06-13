"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { HL7Error } from "@/lib/hl7-parser"

interface HL7RawViewProps {
  message: string
  errors: HL7Error[]
}

export function HL7RawView({ message = '', errors = [] }: HL7RawViewProps) {
  const { toast } = useToast()

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message || '')
      toast({
        title: "Copied to clipboard",
        description: "Raw message copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  if (!message) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No message available</p>
            <p className="text-sm mt-2">Paste or select a message to view its raw content</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const lines = message.split('\n')

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{lines.length} lines</Badge>
            <Badge variant="secondary">{message.length} characters</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>

        <ScrollArea className="h-full">
          <div className="font-mono text-sm">
            {lines.map((line, index) => {
              const lineNumber = index + 1
              const hasError = errors.some(error => error.line === lineNumber)
              
              return (
                <div
                  key={index}
                  className={`flex ${hasError ? 'bg-red-50 dark:bg-red-950' : ''}`}
                >
                  <div className="w-12 text-right pr-2 text-muted-foreground border-r">
                    {lineNumber}
                  </div>
                  <div className="flex-1 pl-2 whitespace-pre-wrap break-all">
                    {line || ' '}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}