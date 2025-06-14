"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Calendar, Activity, FileText } from "lucide-react";
import { useOnboarding } from "@/app/providers/OnboardingProvider";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useUi } from "@/lib/hooks/useUi";
import { useNotes } from "@/lib/hooks/useNotes";
import { usePathname } from "next/navigation";

type ScheduleStepType = 'navigate' | 'create-schedule' | 'show-activity' | 'create-draft' | 'show-schedule-button';

export function ScheduleNoteStepDialog() {
  const { next, dismiss, complete, skip } = useOnboarding();
  const { updateShowCreateScheduleDialog } = useUi();
  const { createDraftNote } = useNotes();
  const router = useCustomRouter();
  const pathname = usePathname();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentSubStep, setCurrentSubStep] = useState<ScheduleStepType>('navigate');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pathname === '/queue') {
      setCurrentSubStep('create-schedule');
      setIsOpen(true);
    } else {
      setCurrentSubStep('navigate');
      setIsOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dismiss]);

  const handleNavigateToQueue = async () => {
    setIsLoading(true);
    try {
      router.push('/queue');
    } catch (error) {
      console.error('Failed to navigate to queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSchedule = () => {
    updateShowCreateScheduleDialog(true);
    setCurrentSubStep('show-activity');
  };

  const handleShowActivity = () => {
    setCurrentSubStep('create-draft');
  };

  const handleCreateDraft = async () => {
    setIsLoading(true);
    try {
      // Create a draft note scheduled for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0); // 10 AM tomorrow
      
      await createDraftNote({ scheduledTo: tomorrow });
      setCurrentSubStep('show-schedule-button');
    } catch (error) {
      console.error('Failed to create draft note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    complete();
    setIsOpen(false);
  };

  const renderStepContent = () => {
    switch (currentSubStep) {
      case 'navigate':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Let&apos;s set up your schedule</h3>
                <p className="text-sm text-muted-foreground">
                  First, we&apos;ll navigate to your queue to get started.
                </p>
              </div>
            </div>
            
                         <div className="flex justify-between gap-2">
               <Button 
                 variant="outline" 
                 onClick={skip}
                 className="text-muted-foreground"
               >
                 Skip onboarding
               </Button>
               <Button 
                 onClick={handleNavigateToQueue}
                 disabled={isLoading}
                 className="bg-primary hover:bg-primary/90"
               >
                 {isLoading ? 'Navigating...' : 'Go to Queue'}
               </Button>
             </div>
          </div>
        );

      case 'create-schedule':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Create your posting schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Pick the days and times you want to publish. This helps maintain consistency.
                </p>
              </div>
            </div>
            
                         <div className="flex justify-between gap-2">
               <Button 
                 variant="outline" 
                 onClick={skip}
                 className="text-muted-foreground"
               >
                 Skip onboarding
               </Button>
               <Button 
                 onClick={handleCreateSchedule}
                 className="bg-primary hover:bg-primary/90"
               >
                 Create Schedule
               </Button>
             </div>
          </div>
        );

      case 'show-activity':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Your activity graph</h3>
                <p className="text-sm text-muted-foreground">
                  This shows your publishing activity. We&apos;ll help keep it green by reminding you to post!
                </p>
              </div>
            </div>
            
                         <div className="flex justify-between gap-2">
               <Button 
                 variant="outline" 
                 onClick={skip}
                 className="text-muted-foreground"
               >
                 Skip onboarding
               </Button>
               <Button 
                 onClick={handleShowActivity}
                 className="bg-primary hover:bg-primary/90"
               >
                 Next
               </Button>
             </div>
          </div>
        );

      case 'create-draft':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Create your first draft</h3>
                <p className="text-sm text-muted-foreground">
                  Let&apos;s create a draft note and schedule it. You can always edit it later.
                </p>
              </div>
            </div>
            
                         <div className="flex justify-between gap-2">
               <Button 
                 variant="outline" 
                 onClick={skip}
                 className="text-muted-foreground"
               >
                 Skip onboarding
               </Button>
               <Button 
                 onClick={handleCreateDraft}
                 disabled={isLoading}
                 className="bg-primary hover:bg-primary/90"
               >
                 {isLoading ? 'Creating...' : 'Create Draft'}
               </Button>
             </div>
          </div>
        );

      case 'show-schedule-button':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Perfect! You&apos;re all set</h3>
                <p className="text-sm text-muted-foreground">
                  Draft now, polish later. Your schedule button will always be right here in the editor.
                </p>
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Pro tip:</strong> You can always come back to the queue to see your scheduled notes and adjust your posting schedule.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleFinish}
                className="bg-primary hover:bg-primary/90"
              >
                Finish Setup
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Enhanced dark backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" />
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md pointer-events-auto relative z-[10000] border-2">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Schedule Your Notes</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={dismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {renderStepContent()}
        </DialogContent>
      </Dialog>
    </>
  );
} 