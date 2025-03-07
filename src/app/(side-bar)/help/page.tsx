"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const faqs = [
    {
      question: "How do I create a new note?",
      answer: "You can create a new note by clicking the 'New Note' button in the top right corner of the home page or notes page. You can also use the keyboard shortcut Ctrl+N (or Cmd+N on Mac)."
    },
    {
      question: "Can I export my notes?",
      answer: "Yes, you can export your notes in various formats including PDF, Markdown, and plain text. To export a note, open it and click the 'Export' button in the toolbar."
    },
    {
      question: "How do I organize my notes?",
      answer: "You can organize your notes using tags, folders, and the status board. Tags can be added to notes for quick filtering, folders help with hierarchical organization, and the status board allows you to track the progress of your notes."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Yes, we offer mobile apps for both iOS and Android. You can download them from the App Store or Google Play Store. Your notes will sync automatically across all your devices."
    },
    {
      question: "How secure are my notes?",
      answer: "Your notes are encrypted both in transit and at rest. We use industry-standard encryption protocols to ensure your data remains private and secure. Additionally, we offer two-factor authentication for added security."
    },
    {
      question: "Can I collaborate with others on notes?",
      answer: "Yes, you can share notes with others and collaborate in real-time. To share a note, open it and click the 'Share' button. You can set different permission levels for collaborators."
    },
    {
      question: "What's the difference between the free and premium plans?",
      answer: "The free plan includes basic note-taking features with limited storage. Premium plans offer additional features such as unlimited storage, advanced formatting options, priority support, and collaboration tools."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription at any time from the Settings page. Go to Settings > Account > Subscription and click 'Cancel Subscription'. Your premium features will remain active until the end of your billing period."
    }
  ];
  
  const filteredFaqs = searchQuery 
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Help Center</h1>
      
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Search for help..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
        </TabsList>
        
        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Find answers to common questions about using our note-taking app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))
                ) : (
                  <p className="text-center py-4 text-muted-foreground">No results found for "{searchQuery}"</p>
                )}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="guides">
          <Card>
            <CardHeader>
              <CardTitle>User Guides</CardTitle>
              <CardDescription>
                Step-by-step guides to help you get the most out of our app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Getting Started</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Learn the basics of creating and managing notes.</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Advanced Formatting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Master markdown and rich text formatting options.</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Organizing Your Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Learn how to use tags, folders, and the status board.</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Collaboration Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Share and collaborate on notes with your team.</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Need help with something specific? Our support team is here to help.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Name</label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input id="email" type="email" placeholder="Your email" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                  <Input id="subject" placeholder="What's your question about?" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">Message</label>
                  <textarea 
                    id="message" 
                    rows={5} 
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Please describe your issue in detail..."
                  ></textarea>
                </div>
                
                <Button type="submit" className="w-full md:w-auto">
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 