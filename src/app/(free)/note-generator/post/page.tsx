"use client";

import { useNotesGeneratorPost } from "@/app/(free)/note-generator/post/useNotesGeneratorPost";
import UrlAnalysisInput from "@/components/analysis/url-analysis-input";
import { LoginDialog } from "@/components/auth/login-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NoteComponent from "@/components/ui/note-component";
import { ToastStepper } from "@/components/ui/toast-stepper";
import { CountdownBanner } from "@/components/ui/countdown-banner";
import { AxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "react-toastify";

const loadingStates = [
  {
    text: "Checking if the post URL is valid...",
    delay: 1000,
  },
  {
    text: "Getting your past notes...",
    delay: 12000,
  },
  {
    text: "Generating note...",
    delay: 10000,
  },
  {
    text: "Finalizing...",
    delay: 9999999,
  },
];

export default function NoteGeneratorArticlePage() {
  const [postUrl, setPostUrl] = useState("");
  const {
    isLoading,
    hasData,
    authorName,
    authorImage,
    isInputDisabled,
    handleBylineSelect,
    data,
    showLoginDialog,
    handleCloseLoginDialog,
    getLoginRedirect,
    generateNote,
    selectedByline,
    removeNote,
    nextGenerateDate,
  } = useNotesGeneratorPost();

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">
          Generate a Teasing Note for Your Article
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Enter your Substack URL below to generate a teasing note for your
          article.
        </p>
      </motion.div>

      <UrlAnalysisInput
        onBylineSelected={handleBylineSelect}
        isLoading={isLoading}
        hasData={hasData}
        authorName={authorName}
        authorImage={authorImage}
        isInputDisabled={isInputDisabled}
        disabledButton={isInputDisabled}
        buttonText="Analyze"
        headerClassName="mb-8"
        headerText="Notes generated"
      />
      <AnimatePresence>
        {selectedByline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            // show only if selectedByline is not null
            className="flex flex-col md:flex-row gap-4"
          >
            <Input
              placeholder="Enter your post URL"
              value={postUrl}
              onChange={e => setPostUrl(e.target.value)}
              disabled={isLoading}
            />
            <Button
              disabled={isLoading || !!nextGenerateDate}
              onClick={() => generateNote(postUrl)}
            >
              Generate
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {nextGenerateDate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CountdownBanner nextGenerateDate={new Date(nextGenerateDate)} />
          </motion.div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data &&
            data.length > 0 &&
            data.map(note => (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
                key={note.id}
              >
                <NoteComponent
                  note={note}
                  isFree={true}
                  onNoteArchived={() => removeNote(note.id)}
                />
              </motion.div>
            ))}
        </div>
      </AnimatePresence>
      <LoginDialog
        isOpen={showLoginDialog}
        onOpenChange={handleCloseLoginDialog}
        title="Login to see your results"
        description="To avoid abuse and keep this tool a unique experience, I'll need you to quickly sign up (Less than 10 seconds)."
        redirectPath={getLoginRedirect()}
      />
      <ToastStepper
        loadingStates={loadingStates}
        loading={isLoading}
        duration={1500}
        position="bottom-right"
      />
    </div>
  );
}
