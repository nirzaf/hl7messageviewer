"use client"

import React, { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Sidebar } from "@/components/sidebar"
import { MainContent } from "@/components/main-content"
import { Toaster } from "@/components/ui/toaster"

// Minimal component to help identify the source of the error
export default function DebugApp() {
  const [step, setStep] = useState(0);
  
  // Try rendering components one by one to identify which one causes the error
  useEffect(() => {
    console.log(`Rendering step ${step}`);
  }, [step]);

  // Step 0: Render complete app shell
  if (step === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <div className="w-64 border-r">
            <Sidebar onMessageSelect={() => {}} />
          </div>
          <div className="flex-1 overflow-auto">
            <MainContent selectedMessage="" />
          </div>
          <Toaster />
          <div className="fixed bottom-4 right-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-green-600 font-medium">App shell rendered successfully!</p>
            <button 
              onClick={() => setStep(1)}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Next Step
            </button>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Step 1: Try importing and rendering SidebarProvider
  if (step === 1) {
    try {
      const { SidebarProvider } = require("@/components/ui/sidebar");
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Step 1: SidebarProvider</h1>
          <p className="mb-4">Rendering SidebarProvider...</p>
          <SidebarProvider>
            <div className="p-4 border border-green-500 rounded">
              <p className="text-green-600">SidebarProvider rendered successfully!</p>
              <button 
                onClick={() => setStep(2)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Next Step
              </button>
            </div>
          </SidebarProvider>
        </div>
      );
    } catch (error) {
      console.error('Error in step 1:', error);
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error in Step 1</h1>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
            {error instanceof Error ? error.toString() : 'Unknown error occurred'}
          </pre>
        </div>
      );
    }
  }

  // Step 2: Try importing and rendering Sidebar
  if (step === 2) {
    try {
      const { Sidebar } = require("@/components/sidebar");
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Step 2: Sidebar</h1>
          <p className="mb-4">Rendering Sidebar...</p>
          <div className="flex">
            <Sidebar onMessageSelect={() => {}} />
            <div className="p-4">
              <p className="text-green-600">Sidebar rendered successfully!</p>
              <button 
                onClick={() => setStep(3)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error in step 2:', error);
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error in Step 2</h1>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
            {error instanceof Error ? error.toString() : 'Unknown error occurred'}
          </pre>
        </div>
      );
    }
  }

  // Step 3: Try importing and rendering MainContent
  if (step === 3) {
    try {
      const { MainContent } = require("@/components/main-content");
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Step 3: MainContent</h1>
          <p className="mb-4">Rendering MainContent...</p>
          <div className="border rounded p-4">
            <MainContent selectedMessage="" />
            <p className="mt-4 text-green-600">MainContent rendered successfully!</p>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error in step 3:', error);
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error in Step 3</h1>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
            {error instanceof Error ? error.toString() : 'Unknown error occurred'}
          </pre>
        </div>
      );
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debugging Complete</h1>
      <p className="mb-4">All components rendered successfully!</p>
      <button 
        onClick={() => setStep(0)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Start Over
      </button>
    </div>
  );
}