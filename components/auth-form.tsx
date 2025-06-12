"use client"

import { supabase } from "@/lib/supabase"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"

interface AuthFormProps {
  onSessionChange: (session: Session | null) => void;
}

export function AuthForm({ onSessionChange }: AuthFormProps) {
  // Internal session for UI aspects like email, but call prop for global state
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [internalSession, setInternalSession] = useState<Session | null>(null);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setInternalSession(currentSession);
      onSessionChange(currentSession);
      setUserEmail(currentSession?.user?.email);
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setInternalSession(currentSession);
      onSessionChange(currentSession);
      setUserEmail(currentSession?.user?.email);
      if (_event === "SIGNED_IN") {
        setDialogOpen(false) // Close dialog on successful sign-in
      }
    })

    return () => subscription.unsubscribe()
  }, [onSessionChange])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // onSessionChange will be called by the listener, updating global state
  }

  if (!internalSession) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Login / Sign Up</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Access Your Account</DialogTitle>
            <DialogDescription>
              Sign in or create an account to save and manage your messages.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: "hsl(221.2 83.2% 53.3%)", // Blue, similar to shadcn primary
                      brandAccent: "hsl(221.2 83.2% 60%)",
                    },
                    // To better match shadcn/ui, you might need to customize fonts, borders, etc.
                    // For now, ThemeSupa provides a decent starting point.
                  },
                },
              }}
              providers={[]} // No social providers for now
              localization={{
                variables: {
                  sign_in: { email_label: "Email", password_label: "Password" },
                  sign_up: { email_label: "Email", password_label: "Password" },
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // If session exists, show user email and logout button
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 dark:text-slate-400 hidden md:inline">
        {userEmail}
      </span>
      <Button variant="outline" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  )
}
