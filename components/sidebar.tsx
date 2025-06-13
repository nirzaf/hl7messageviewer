"use client"

import { useState, useEffect, Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar as SidebarPrimitive,
  SidebarContent as UISidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  FileText,
  Search,
  Plus,
  Database,
  Settings,
  Upload,
  Clock,
  Star,
  AlertTriangle,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// Error boundary for the Sidebar component
class SidebarErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null 
    };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[SidebarErrorBoundary] Error caught:', error);
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SidebarErrorBoundary] Error caught in componentDidCatch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Error loading sidebar</span>
          </div>
          <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-auto">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

interface SidebarProps {
  onMessageSelect: (message: string) => void
}

interface SavedMessage {
  id: string
  name: string
  type: string
  date: string
  starred: boolean
}

const sampleMessages: SavedMessage[] = [
  {
    id: "1",
    name: "ADT^A04 - Patient Registration",
    type: "ADT",
    date: "2024-01-15",
    starred: true,
  },
  {
    id: "2",
    name: "ORU^R01 - Lab Results",
    type: "ORU",
    date: "2024-01-14",
    starred: false,
  },
  {
    id: "3",
    name: "ORM^O01 - Order Message",
    type: "ORM",
    date: "2024-01-13",
    starred: true,
  },
  {
    id: "4",
    name: "SIU^S12 - Schedule Info",
    type: "SIU",
    date: "2024-01-12",
    starred: false,
  },
]

const sampleMessage = `MSH|^~\\&|EPIC|EPICADT|SMS|SMSADT|199912271408|CHARRIS|ADT^A04|1817457|D|2.5|
PID|0001|0000112234^^^MR^MRN|0000112234^^^MR^MRN~444333333^^^SSN^|EVERYMAN^ADAM^A^III||19610615|M||C|1200 N ELM STREET^^GREENSBORO^NC^27401-1020|GL|(919)379-1212|(919)271-3434~(919)277-3114|E|NON|400003716|999-99-9999|||||||||||200007010000|
NK1|0001|JONES^BARBARA^K|10^MOTHER|N/A|
PV1|0001|I|2000^2012^01||||004777^ATTEND^AARON^A|||SUR|||19|A|19961203|
DG1|0001|I9|V30.00^SINGLE LIVE BORN IN HOSPITAL^I9|SINGLE LIVE BORN IN HOSPITAL|19961203|
GT1|0001|0000112234^^^MR^MRN|EVERYMAN^ADAM^A^III||1200 N ELM STREET^^GREENSBORO^NC^27401-1020|(919)379-1212|(919)271-3434~(919)277-3114||19610615|M||1|400003716|999-99-9999||||^^^^^USA|||||||||||||||||||||||||||
IN1|0001|PPO|IP001^BLUE CROSS^IP001|BLUE CROSS|PO BOX 2187^^GREENSBORO^NC^27402-2187|||||||||19961101|19971031|||EVERYMAN^ADAM^A^III|1|19610615|1200 N ELM STREET^^GREENSBORO^NC^27401-1020|||||||||||||||||400003716|999-99-9999||||||||M|||||||||||||||||||||||||`

// Main sidebar component with error boundary
export function Sidebar({ onMessageSelect }: SidebarProps) {
  console.log('[Sidebar] Rendering Sidebar component');
  
  return (
    <SidebarErrorBoundary>
      <div className="h-full flex flex-col border-r">
        <SidebarContent onMessageSelect={onMessageSelect} />
      </div>
    </SidebarErrorBoundary>
  );
}

// Main content component
function SidebarContent({ onMessageSelect }: { onMessageSelect: (message: string) => void }) {
  console.log('[SidebarContent] Rendering SidebarContent component');
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<SavedMessage[]>(sampleMessages);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("saved");

  const filteredMessages = messages.filter(
    (msg) =>
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMessageClick = (message: string) => {
    try {
      console.log('[SidebarContent] Message clicked:', message);
      onMessageSelect(message);
    } catch (error) {
      console.error('[SidebarContent] Error in handleMessageClick:', error);
    }
  };

  const handleNewMessage = () => {
    setSelectedMessageId(null);
    onMessageSelect("");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        onMessageSelect(content)
        setSelectedMessageId(null)
      }
      reader.readAsText(file)
    }
  }

  try {
    return (
      <div className="h-full flex flex-col">
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary rounded-lg">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">HL7 Viewer</h1>
              <p className="text-xs text-muted-foreground">Message Parser</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleNewMessage}
              className="w-full justify-start" 
              variant={selectedMessageId === null ? "default" : "ghost"}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".hl7,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </SidebarHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search messages..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <h2 className="text-sm font-medium mb-2">Recent Messages</h2>
            
            <ScrollArea className="flex-1">
              <div className="space-y-1">
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent ${
                        selectedMessageId === message.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleMessageClick(sampleMessage)}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium leading-none">{message.name}</p>
                          <p className="text-xs text-muted-foreground">{message.type} • {message.date}</p>
                        </div>
                      </div>
                      {message.starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No messages found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="border-t p-4">
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              <Database className="h-4 w-4 mr-2" />
              Saved Messages
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <div className="flex justify-center pt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('[SidebarContent] Error during render:', error);
    throw error; // Let the error boundary handle it
  }
}