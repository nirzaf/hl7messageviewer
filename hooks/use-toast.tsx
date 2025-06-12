"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Toast, ToastAction, ToastProvider, ToastViewport } from "@/components/ui/toast"
import { X } from "lucide-react"

type ToastType = {
  id: string
  title: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

type ToastOptions = {
  title: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const toast = useCallback(({ title, description, action, variant = "default", duration = 5000 }: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prevToasts) => [...prevToasts, { id, title, description, action, variant }])

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, duration)

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  const Toaster = () => {
    return (
      <ToastProvider>
        {toasts.map(({ id, title, description, action, variant }) => (
          <Toast key={id} variant={variant} className="group">
            <div className="grid gap-1">
              <div className="font-medium">{title}</div>
              {description && <div className="text-sm opacity-90">{description}</div>}
            </div>
            {action && <ToastAction altText="Action">{action}</ToastAction>}
            <button
              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => dismiss(id)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    )
  }

  return { toast, dismiss, Toaster }
}
