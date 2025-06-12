"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Download,
  Copy,
  AlertTriangle,
  CheckCircle,
  Upload,
  Eye,
  Code,
  TreePine,
  Save,
  Database,
  Search,
} from "lucide-react"
import { HL7Parser, type ParsedHL7Message, type HL7Error } from "@/lib/hl7-parser"
import { HL7TreeView } from "@/components/hl7-tree-view"
import { HL7RawView } from "@/components/hl7-raw-view"
import { HL7TableView } from "@/components/hl7-table-view"
import { ExportDialog } from "@/components/export-dialog"
import { SaveMessageDialog } from "@/components/save-message-dialog"
import { SavedMessagesDialog } from "@/components/saved-messages-dialog"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthForm } from "@/components/auth-form"
import { HL7DiffView } from "@/components/hl7-diff-view" // Import HL7DiffView
import { useToast } from "@/hooks/use-toast"
import { testSupabaseConnection } from "@/lib/supabase"
import type { Session } from "@supabase/supabase-js" // Import Session type
import { compareHl7Messages, type DiffResult } from "@/lib/hl7-diff" // Import diffing tools

const sampleMessage = `MSH|^~\\&|EPIC|EPICADT|SMS|SMSADT|199912271408|CHARRIS|ADT^A04|1817457|D|2.5|
PID|0001|0000112234^^^MR^MRN|0000112234^^^MR^MRN~444333333^^^SSN^|EVERYMAN^ADAM^A^III||19610615|M||C|1200 N ELM STREET^^GREENSBORO^NC^27401-1020|GL|(919)379-1212|(919)271-3434~(919)277-3114|E|NON|400003716|999-99-9999|||||||||||||200007010000|
NK1|0001|JONES^BARBARA^K|10^MOTHER|N/A|
PV1|0001|I|2000^2012^01||||004777^ATTEND^AARON^A|||SUR|||19|A|19961203|
DG1|0001|I9|V30.00^SINGLE LIVE BORN IN HOSPITAL^I9|SINGLE LIVE BORN IN HOSPITAL|19961203|
GT1|0001|0000112234^^^MR^MRN|EVERYMAN^ADAM^A^III||1200 N ELM STREET^^GREENSBORO^NC^27401-1020|(919)379-1212|(919)271-3434~(919)277-3114||19610615|M||1|400003716|999-99-9999||||^^^^^USA||||||||||||||||||||||||||||
IN1|0001|PPO|IP001^BLUE CROSS^IP001|BLUE CROSS|PO BOX 2187^^GREENSBORO^NC^27402-2187|||||||||19961101|19971031|||EVERYMAN^ADAM^A^III|1|19610615|1200 N ELM STREET^^GREENSBORO^NC^27401-1020|||||||||||||||||||400003716|999-99-9999||||||||M|||||||||||||||||||||||||`

export default function HL7Viewer() {
  const { toast, Toaster } = useToast()
  const [message, setMessage] = useState("")
  const [parsedMessage, setParsedMessage] = useState<ParsedHL7Message | null>(null)
  const [errors, setErrors] = useState<HL7Error[]>([])

  const [globalSearchTermInput, setGlobalSearchTermInput] = useState("") // Input value
  const [globalSearchTerm, setGlobalSearchTerm] = useState("") // Debounced value
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const storedTab = localStorage.getItem("hl7ViewerActiveTab")
      if (storedTab && ["tree", "table", "raw"].includes(storedTab)) {
        return storedTab
      }
    }
    return "tree" // Default tab
  })
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showSavedMessagesDialog, setShowSavedMessagesDialog] = useState(false)
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null) // Still useful for general connection status
  const [session, setSession] = useState<Session | null>(null)

  // States for HL7 Diffing
  const [messageA, setMessageA] = useState("")
  const [messageB, setMessageB] = useState("")
  const [parsedMessageA, setParsedMessageA] = useState<ParsedHL7Message | null>(null)
  const [parsedMessageB, setParsedMessageB] = useState<ParsedHL7Message | null>(null)
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)

  const parseMessage = useCallback(async (input: string) => {
    if (!input.trim()) {
      // If main message input is cleared, reset its parsed state
      // This specific parseMessage is for the primary viewer, not diffing.
      // We might need separate parsing logic for diff inputs or make this more generic.
      // For now, this is fine.
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

  const loadSampleMessage = () => {
    setMessage(sampleMessage)
    parseMessage(sampleMessage)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: "The content has been copied to your clipboard",
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setMessage(content)
        parseMessage(content)
      }
      reader.readAsText(file)
    }
  }

  // Initialize parsing of any initial message
  useEffect(() => {
    if (message) {
      parseMessage(message)
    }
  }, [])

  // Debounce for global search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setGlobalSearchTerm(globalSearchTermInput)
    }, 300) // 300ms debounce delay

    return () => {
      clearTimeout(handler)
    }
  }, [globalSearchTermInput])

  // Persist active tab to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hl7ViewerActiveTab", activeTab)
    }
  }, [activeTab])

  useEffect(() => {
    const checkConnection = async () => {
      const result = await testSupabaseConnection()
      setSupabaseConnected(result.success)
      if (!result.success) {
        console.warn("Supabase connection failed:", result.message)
      }
    }
    checkConnection()
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen medical-gradient dark:from-slate-900 dark:to-slate-800 bg-gradient-to-br">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-100 dark:text-slate-100">HL7 Message Viewer</h1>
                  <p className="text-slate-300 dark:text-slate-400">
                    Advanced parsing and analysis tool for HL7 2.x messages
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setShowSavedMessagesDialog(true)}
                  className="flex items-center gap-2"
                  disabled={!session}
                  title={!session ? "Login required to view saved messages" : "View saved messages"}
                >
                  <Database className="h-4 w-4" />
                  Saved Messages
                </Button>
                <AuthForm onSessionChange={setSession} />
                <ThemeToggle />
              </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm">
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
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Input Panel */}
            <div className="xl:col-span-1">
              <Card className="h-fit flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Message Input</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={loadSampleMessage}>
                        Load Sample
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".hl7,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <Textarea
                    placeholder="Paste your HL7 message here..."
                    value={message}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                  />
                  {/* Error Display */}
                  {errors.length > 0 && (
                    <div className="mt-4 space-y-2">
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
            </div>

            {/* Viewer Panel */}
            <div className="xl:col-span-2">
              <Card className="h-fit">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Message Viewer</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {parsedMessage ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                      <TabsContent value="tree" className="mt-6">
                        <HL7TreeView message={parsedMessage} errors={errors} searchTerm={globalSearchTerm} />
                      </TabsContent>
                      <TabsContent value="table" className="mt-6">
                        <HL7TableView message={parsedMessage} errors={errors} searchTerm={globalSearchTerm} />
                      </TabsContent>
                      <TabsContent value="raw" className="mt-6">
                        <HL7RawView message={message} errors={errors} searchTerm={globalSearchTerm} />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-100 dark:text-slate-100 mb-2">
                        No Message Loaded
                      </h3>
                      <p className="text-slate-300 dark:text-slate-400 mb-4">
                        Paste an HL7 message or upload a file to get started
                      </p>
                      <Button onClick={loadSampleMessage}>Load Sample Message</Button>
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

          <SavedMessagesDialog
            open={showSavedMessagesDialog}
            onOpenChange={setShowSavedMessagesDialog}
            onLoadMessage={handleMessageChange}
          />
        </div>

        {/* Toast notifications */}
        <Toaster />
      </div>
    </ThemeProvider>
  )
}
