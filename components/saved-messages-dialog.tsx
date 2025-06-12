"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Database, FileText, Trash2, Calendar, AlertTriangle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase, testSupabaseConnection } from "@/lib/supabase"
import type { SavedMessage } from "@/lib/types"

interface SavedMessagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadMessage: (rawMessage: string) => void
}

export function SavedMessagesDialog({ open, onOpenChange, onLoadMessage }: SavedMessagesDialogProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<SavedMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const fetchMessages = async () => {
    setIsLoading(true)
    setConnectionError(null)

    try {
      // Test connection first
      const connectionTest = await testSupabaseConnection()
      if (!connectionTest.success) {
        throw new Error(connectionTest.message)
      }

      const { data, error } = await supabase.from("hl7_messages").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase fetch error:", error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log("Fetched messages:", data)
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setConnectionError(errorMessage)

      toast({
        title: "Failed to load messages",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMessage = async (id: string) => {
    try {
      const { error } = await supabase.from("hl7_messages").delete().eq("id", id)

      if (error) {
        console.error("Delete error:", error)
        throw new Error(`Delete failed: ${error.message}`)
      }

      setMessages((prev) => prev.filter((message) => message.id !== id))
      toast({
        title: "Message deleted",
        description: "The message has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      toast({
        title: "Delete failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleLoadMessage = (message: SavedMessage) => {
    onLoadMessage(message.raw_message)
    onOpenChange(false)
    toast({
      title: "Message loaded",
      description: `Loaded: ${message.name}`,
    })
  }

  const filteredMessages = messages.filter(
    (message) =>
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message_type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    if (open) {
      fetchMessages()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Saved HL7 Messages
          </DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            View and load your previously saved HL7 messages
          </DialogDescription>
        </DialogHeader>

        {/* Connection Error Alert */}
        {connectionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {connectionError}
              <Button variant="outline" size="sm" className="ml-2" onClick={fetchMessages}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            disabled={isLoading || !!connectionError}
          />
        </div>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div> {/* Assuming border-primary adapts */}
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Loading messages...</p>
              </div>
            </div>
          ) : connectionError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Connection Error</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Unable to connect to the database. Please check your configuration.
              </p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-slate-500 dark:text-slate-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No messages found</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {messages.length === 0
                  ? "You haven't saved any HL7 messages yet"
                  : "No messages match your search criteria"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[100px]">Version</TableHead>
                  <TableHead className="w-[150px]">Date Saved</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell className="font-medium">{message.name}</TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[300px]">
                      {message.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{message.message_type}</Badge>
                    </TableCell>
                    <TableCell>{message.version}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-slate-500 dark:text-slate-400" />
                        {new Date(message.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleLoadMessage(message)}
                        >
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
