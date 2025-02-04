import React from "react";
import {
  Brain,
  FileText,
  Lightbulb,
  Sparkles,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <header className="container mx-auto px-6 py-16 max-w-6xl">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-bold">ArticleGenius</span>
          </div>
          <div className="flex space-x-6">
            <Button variant="link">Features</Button>
            <Button variant="link">Pricing</Button>
            <Button>Get Started</Button>
          </div>
        </nav>

        <div className="flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Generate brilliant articles with
            <span className="text-indigo-600"> AI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
            Transform your content creation with AI-powered article generation.
            Get unique articles, outlines, and ideas in seconds, powered by
            millions of data points.
          </p>
          <div className="flex space-x-4">
            <Button asChild>
              <Link href="/login">
                Start Writing Now
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline">View Demo</Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-4 rounded-2xl mb-4">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Articles</h3>
              <p className="text-gray-600">
                Generate full-length articles with proper structure and engaging
                content in minutes.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-4 rounded-2xl mb-4">
                <Lightbulb className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Topic Ideas</h3>
              <p className="text-gray-600">
                Never run out of ideas with our AI-powered topic suggestion
                engine.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-4 rounded-2xl mb-4">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Outlines</h3>
              <p className="text-gray-600">
                Create detailed article outlines that ensure comprehensive
                coverage of your topic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Trusted by Content Creators
            </h2>
            <p className="text-gray-600">
              Join thousands of writers who trust ArticleGenius
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Content Marketer",
                image:
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150",
                quote:
                  "ArticleGenius has transformed how I create content. It's like having a writing assistant available 24/7.",
              },
              {
                name: "Michael Chen",
                role: "Tech Blogger",
                image:
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150",
                quote:
                  "The quality of articles and ideas I get is consistently impressive. A game-changer for my blog.",
              },
              {
                name: "Emma Williams",
                role: "Freelance Writer",
                image:
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150",
                quote:
                  "I've doubled my content output while maintaining quality. The outline generator is fantastic.",
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full mx-auto mb-4"
                />
                <p className="text-gray-600 mb-4">
                  &quot;{testimonial.quote}&quot;
                </p>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 text-white py-20">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Content Creation?
          </h2>
          <p className="text-indigo-100 mb-8">
            Join thousands of content creators who are already using
            ArticleGenius to produce high-quality content faster than ever
            before.
          </p>
          <Button asChild>
            <Link href="/login">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="w-6 h-6 text-indigo-400" />
              <span className="text-lg font-bold text-white">
                ArticleGenius
              </span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white">
                Terms
              </a>
              <a href="#" className="hover:text-white">
                Privacy
              </a>
              <a href="#" className="hover:text-white">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            © 2024 ArticleGenius. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
