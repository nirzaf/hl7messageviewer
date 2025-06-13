"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Download,
  Copy,
  AlertTriangle,
  CheckCircle,
  Eye,
  Code,
  TreePine,
  Save,
  Play,
} from "lucide-react"
import { HL7Parser, type ParsedHL7Message, type HL7Error } from "@/lib/hl7-parser"
import { HL7TreeView } from "@/components/hl7-tree-view"
import { HL7RawView } from "@/components/hl7-raw-view"
import { HL7TableView } from "@/components/hl7-table-view"
import { ExportDialog } from "@/components/export-dialog"
import { SaveMessageDialog } from "@/components/save-message-dialog"
import { useToast } from "@/hooks/use-toast"

interface MainContentProps {
  selectedMessage: string
}

export function MainContent({ selectedMessage }: MainContentProps) {
  console.log('[MainContent] Rendering with selectedMessage:', selectedMessage);
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [parsedMessage, setParsedMessage] = useState<ParsedHL7Message | null>(null)
  const [errors, setErrors] = useState<HL7Error[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("tree")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  
  // Log state changes
  useEffect(() => {
    console.log('[MainContent] State - message:', message);
    console.log('[MainContent] State - parsedMessage:', parsedMessage);
    console.log('[MainContent] State - errors:', errors);
    console.log('[MainContent] State - isLoading:', isLoading);
  }, [message, parsedMessage, errors, isLoading]);

  const parseMessage = useCallback(async (input: string) => {
    console.log('[MainContent] parseMessage called with input:', input);
    if (!input.trim()) {
      console.log('[MainContent] Empty input, clearing state');
      setParsedMessage(null)
      setErrors([])
      return
    }

    setIsLoading(true)
    try {
      const parser = new HL7Parser()
      const result = parser.parse(input)
      setParsedMessage(result.message)
      setErrors(result.errors)
    } catch (error) {
      setErrors([
        {
          type: "critical",
          message: error instanceof Error ? error.message : "Unknown parsing error",
          line: 0,
          position: 0,
        },
      ])
      setParsedMessage(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleMessageChange = (value: string) => {
    setMessage(value)
    parseMessage(value)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: "The content has been copied to your clipboard",
        variant: "default",
      })
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard",
        variant: "destructive",
      })
    }
  }

  // Update message when selectedMessage changes
  useEffect(() => {
    console.log('[MainContent] selectedMessage changed:', selectedMessage);
    if (selectedMessage) {
      console.log('[MainContent] Setting message from selectedMessage');
      setMessage(selectedMessage)
      parseMessage(selectedMessage)
    }
  }, [selectedMessage, message, parseMessage])

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {parsedMessage ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
              <span className="text-sm font-medium">
                {parsedMessage ? "Message Parsed Successfully" : "No Message Loaded"}
              </span>
            </div>

            {parsedMessage && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Badge variant="secondary">{parsedMessage.segments.length} Segments</Badge>
                <Badge variant="secondary">Version {parsedMessage.version}</Badge>
                <Badge variant="secondary">{parsedMessage.messageType}</Badge>
              </>
            )}

            {errors.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Badge variant="destructive">
                  {errors.length} Error{errors.length !== 1 ? "s" : ""}
                </Badge>
              </>
            )}
          </div>

          {parsedMessage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(parsedMessage, null, 2))}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Input Panel */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Message Input</span>
                <Button
                  size="sm"
                  onClick={() => parseMessage(message)}
                  disabled={!message.trim() || isLoading}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Parse
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Textarea
                placeholder="Paste your HL7 message here or select from sidebar..."
                value={message}
                onChange={(e) => handleMessageChange(e.target.value)}
                className="flex-1 font-mono text-sm resize-none"
              />

              {/* Error Display */}
              {errors.length > 0 && (
                <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                  {errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Line {error.line}:</strong> {error.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Viewer Panel */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle>Message Viewer</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {parsedMessage ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tree" className="flex items-center gap-2">
                      <TreePine className="h-4 w-4" />
                      Tree View
                    </TabsTrigger>
                    <TabsTrigger value="table" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Table View
                    </TabsTrigger>
                    <TabsTrigger value="raw" className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Raw View
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 mt-4">
                    <TabsContent value="tree" className="h-full">
                      <HL7TreeView message={parsedMessage} />
                    </TabsContent>

                    <TabsContent value="table" className="h-full">
                      <HL7TableView message={parsedMessage} />
                    </TabsContent>

                    <TabsContent value="raw" className="h-full">
                      <HL7RawView message={message} errors={errors} />
                    </TabsContent>
                  </div>
                </Tabs>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Message Loaded
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Select a message from the sidebar or paste an HL7 message to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {parsedMessage && (
        <>
          <ExportDialog
            open={showExportDialog}
            onOpenChange={setShowExportDialog}
            message={parsedMessage}
            rawMessage={message}
          />
          <SaveMessageDialog
            open={showSaveDialog}
            onOpenChange={setShowSaveDialog}
            message={parsedMessage}
            rawMessage={message}
          />
        </>
      )}
    </div>
  )
}