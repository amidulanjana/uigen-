"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileSystemProvider } from "@/lib/contexts/file-system-context";
import { ChatProvider } from "@/lib/contexts/chat-context";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FileTree } from "@/components/editor/FileTree";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderActions } from "@/components/HeaderActions";

interface MainContentProps {
  user?: {
    id: string;
    email: string;
  } | null;
  project?: {
    id: string;
    name: string;
    messages: any[];
    data: any;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function MainContent({ user, project }: MainContentProps) {
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");
  const [codeViewMounted, setCodeViewMounted] = useState(false);

  const handleTabChange = (v: string) => {
    const newView = v as "preview" | "code";
    setActiveView(newView);
    if (newView === "code" && !codeViewMounted) {
      setCodeViewMounted(true);
    }
  };

  const handleHeaderMouseDown = () => {
    // Restore focus to the parent window if the preview iframe has captured it,
    // so subsequent tab-button clicks register on the first attempt.
    if (document.activeElement instanceof HTMLIFrameElement) {
      document.activeElement.blur();
    }
  };

  return (
    <FileSystemProvider initialData={project?.data}>
      <ChatProvider projectId={project?.id} initialMessages={project?.messages}>
        <div className="h-screen w-screen overflow-hidden bg-neutral-50">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Chat */}
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
              <div className="h-full flex flex-col bg-white">
                {/* Chat Header */}
                <div className="h-14 flex items-center px-6 border-b border-neutral-200/60">
                  <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">React Component Generator</h1>
                </div>

                {/* Chat Content */}
                <div className="flex-1 overflow-hidden">
                  <ChatInterface />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-[1px] bg-neutral-200 hover:bg-neutral-300 transition-colors" />

            {/* Right Panel - Preview/Code */}
            <ResizablePanel defaultSize={65}>
              <div className="h-full flex flex-col bg-white">
                {/* Top Bar */}
                <div
                  className="h-14 border-b border-neutral-200/60 px-6 flex items-center justify-between bg-neutral-50/50"
                  onMouseDown={handleHeaderMouseDown}
                >
                  <Tabs
                    value={activeView}
                    onValueChange={handleTabChange}
                  >
                    <TabsList className="bg-white/60 border border-neutral-200/60 p-0.5 h-9 shadow-sm">
                      <TabsTrigger value="preview" className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-600 px-4 py-1.5 text-sm font-medium transition-all">Preview</TabsTrigger>
                      <TabsTrigger value="code" className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-600 px-4 py-1.5 text-sm font-medium transition-all">Code</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <HeaderActions user={user} projectId={project?.id} />
                </div>

                {/* Content Area - both views kept mounted to preserve iframe/editor state */}
                <div className="flex-1 overflow-hidden bg-neutral-50">
                  <div className={activeView === "preview" ? "h-full bg-white" : "hidden"}>
                    <PreviewFrame />
                  </div>
                  {codeViewMounted && (
                    <div className={activeView === "code" ? "h-full" : "hidden"}>
                      <ResizablePanelGroup
                        direction="horizontal"
                        className="h-full"
                      >
                        {/* File Tree */}
                        <ResizablePanel
                          defaultSize={30}
                          minSize={20}
                          maxSize={50}
                        >
                          <div className="h-full bg-neutral-50 border-r border-neutral-200">
                            <FileTree />
                          </div>
                        </ResizablePanel>

                        <ResizableHandle className="w-[1px] bg-neutral-200 hover:bg-neutral-300 transition-colors" />

                        {/* Code Editor */}
                        <ResizablePanel defaultSize={70}>
                          <div className="h-full bg-white">
                            <CodeEditor />
                          </div>
                        </ResizablePanel>
                      </ResizablePanelGroup>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </ChatProvider>
    </FileSystemProvider>
  );
}
