"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, Wifi, WifiOff, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase, testSupabaseConnection, testSupabaseInsert } from "@/lib/supabase"
import type { ParsedHL7Message } from "@/lib/hl7-parser"
import type { SaveMessageFormData } from "@/lib/types"

interface SaveMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: ParsedHL7Message
  rawMessage: string
}

export function SaveMessageDialog({ open, onOpenChange, message, rawMessage }: SaveMessageDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<SaveMessageFormData>({
    name: `${message.messageType} - ${new Date().toLocaleString()}`,
    description: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    canInsert: boolean
    message: string
  } | null>(null)

  // Test Supabase connection and permissions when dialog opens
  useEffect(() => {
    if (open) {
      testConnectionAndPermissions()
    }
  }, [open])

  const testConnectionAndPermissions = async () => {
    console.log("Testing connection and permissions...")

    // Test basic connection
    const connectionTest = await testSupabaseConnection()

    if (!connectionTest.success) {
      setConnectionStatus({
        connected: false,
        canInsert: false,
        message: connectionTest.message,
      })
      return
    }

    // Test insert permissions
    const insertTest = await testSupabaseInsert()

    setConnectionStatus({
      connected: connectionTest.success,
      canInsert: insertTest.success,
      message: insertTest.success
        ? "Database connection and permissions verified"
        : `Connection OK, but ${insertTest.message}`,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for this message",
        variant: "destructive",
      })
      return
    }

    if (!connectionStatus?.connected) {
      toast({
        title: "Database connection failed",
        description: "Cannot save message. Please check your Supabase configuration.",
        variant: "destructive",
      })
      return
    }

    if (!connectionStatus?.canInsert) {
      toast({
        title: "Permission denied",
        description: "Cannot save message. Database permissions issue detected.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Prepare the data for insertion
      const messageData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        raw_message: rawMessage,
        parsed_message: message,
        message_type: message.messageType,
        version: message.version,
      }

      console.log("Attempting to save message:", messageData)

      const { data, error } = await supabase.from("hl7_messages").insert([messageData]).select()

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })

        // Provide specific error messages for common issues
        let errorMessage = error.message

        if (error.message.includes("row-level security")) {
          errorMessage = "Database security policy prevents saving. Please check RLS configuration."
        } else if (error.message.includes("permission denied")) {
          errorMessage = "Permission denied. Please check database permissions."
        } else if (error.message.includes("relation") && error.message.includes("does not exist")) {
          errorMessage = "Database table not found. Please run the setup script."
        }

        throw new Error(errorMessage)
      }

      console.log("Message saved successfully:", data)

      toast({
        title: "Message saved",
        description: "Your HL7 message has been saved successfully",
      })

      // Reset form and close dialog
      setFormData({
        name: `${message.messageType} - ${new Date().toLocaleString()}`,
        description: "",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving message:", error)

      let errorMessage = "There was an error saving your message. Please try again."
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Save failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save HL7 Message
          </DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            Save this message to your database for later reference
          </DialogDescription>
        </DialogHeader>

        {/* Connection Status */}
        {connectionStatus && (
          <Alert variant={connectionStatus.connected && connectionStatus.canInsert ? "default" : "destructive"}>
            {connectionStatus.connected && connectionStatus.canInsert ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <AlertDescription>
              {connectionStatus.message}
              {(!connectionStatus.connected || !connectionStatus.canInsert) && (
                <Button variant="outline" size="sm" className="ml-2" onClick={testConnectionAndPermissions}>
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* RLS Warning */}
        {connectionStatus?.connected && !connectionStatus?.canInsert && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Row Level Security Issue:</strong> The database table has RLS enabled but no policies allow
              inserts. Please run the setup script or disable RLS on the hl7_messages table.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Message Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter a name for this message"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes or context about this message"
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">Message Details</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <div>Type: {message.messageType}</div>
              <div>Version: {message.version}</div>
              <div>Segments: {message.segments.length}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !connectionStatus?.connected || !connectionStatus?.canInsert}
          >
            {isSaving ? "Saving..." : "Save Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
