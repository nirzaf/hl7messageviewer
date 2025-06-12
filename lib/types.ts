import type { ParsedHL7Message } from "./hl7-parser"

export interface SavedMessage {
  id: string
  name: string
  description?: string
  raw_message: string
  parsed_message: ParsedHL7Message
  message_type: string
  version: string
  created_at: string
  updated_at: string
}

export interface SaveMessageFormData {
  name: string
  description?: string
}
