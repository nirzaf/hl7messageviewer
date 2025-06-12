import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables:", {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
  })
  throw new Error("Missing Supabase environment variables")
}

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // persistSession: true, // Default is true, so this can be omitted or explicitly set.
  },
})

// Test connection function
export async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...")

    // First test basic connectivity
    const { data, error } = await supabase.from("hl7_messages").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Supabase connection test failed:", error)
      throw error
    }

    console.log("Supabase connection successful, record count:", data)
    return { success: true, message: "Connected to Supabase successfully" }
  } catch (error) {
    console.error("Supabase connection error:", error)
    let message = "Supabase connection failed"

    if (error && typeof error === "object" && "message" in error) {
      message += `: ${error.message}`
    }

    return { success: false, message }
  }
}

// Test insert function to verify permissions
export async function testSupabaseInsert() {
  try {
    console.log("Testing Supabase insert permissions...")

    const testData = {
      name: `Connection Test ${Date.now()}`,
      description: "Test insert to verify permissions",
      raw_message: "MSH|^~\\&|TEST|TEST|TEST|TEST|20231201120000||ADT^A01|123|P|2.5|",
      parsed_message: { messageType: "ADT^A01", version: "2.5", segments: [] },
      message_type: "ADT^A01",
      version: "2.5",
    }

    const { data, error } = await supabase.from("hl7_messages").insert([testData]).select()

    if (error) {
      console.error("Supabase insert test failed:", error)
      throw error
    }

    // Clean up test record
    if (data && data[0]) {
      await supabase.from("hl7_messages").delete().eq("id", data[0].id)
    }

    console.log("Supabase insert test successful")
    return { success: true, message: "Insert permissions verified" }
  } catch (error) {
    console.error("Supabase insert test error:", error)
    let message = "Insert test failed"

    if (error && typeof error === "object" && "message" in error) {
      message += `: ${error.message}`
    }

    return { success: false, message }
  }
}
