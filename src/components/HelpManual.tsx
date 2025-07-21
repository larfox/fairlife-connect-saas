import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";

interface HelpManualProps {
  onBack: () => void;
}

const HelpManual: React.FC<HelpManualProps> = ({ onBack }) => {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMarkdownContent = async () => {
      try {
        const response = await fetch('/HELP_MANUAL.md');
        const content = await response.text();
        setMarkdownContent(content);
      } catch (error) {
        console.error('Error loading help manual:', error);
        setMarkdownContent('# Error\n\nUnable to load help manual content.');
      } finally {
        setLoading(false);
      }
    };

    loadMarkdownContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading help manual...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Help Manual</h1>
                <p className="text-muted-foreground mt-1">
                  Complete guide to using HealthFair Pro
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="max-w-none">
          <CardContent className="p-8">
            <div className="prose prose-lg max-w-none 
              prose-headings:text-foreground prose-headings:font-bold
              prose-h1:text-4xl prose-h1:mb-8 prose-h1:mt-12 prose-h1:border-b prose-h1:border-border prose-h1:pb-4
              prose-h2:text-2xl prose-h2:mb-6 prose-h2:mt-10 prose-h2:text-primary
              prose-h3:text-xl prose-h3:mb-4 prose-h3:mt-8
              prose-h4:text-lg prose-h4:mb-3 prose-h4:mt-6
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
              prose-strong:text-foreground prose-strong:font-semibold
              prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80 hover:prose-a:underline
              prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-muted prose-pre:border prose-pre:border-border
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
              prose-ul:my-4 prose-ol:my-4
              prose-li:text-muted-foreground prose-li:my-2
              prose-hr:border-border prose-hr:my-8
              prose-table:border-collapse prose-table:border prose-table:border-border
              prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-th:font-semibold
              prose-td:border prose-td:border-border prose-td:p-2">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children, ...props }) => (
                    <a 
                      href={href} 
                      {...props}
                      onClick={(e) => {
                        if (href?.startsWith('#')) {
                          e.preventDefault();
                          const element = document.getElementById(href.substring(1));
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                      className="text-primary hover:text-primary/80 transition-colors duration-200 cursor-pointer"
                    >
                      {children}
                    </a>
                  ),
                  h1: ({ children, ...props }) => (
                    <h1 {...props} id={String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')} className="group">
                      {children}
                      <a href={`#${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`} className="ml-2 opacity-0 group-hover:opacity-50 text-primary/50 text-lg">#</a>
                    </h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2 {...props} id={String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')} className="group">
                      {children}
                      <a href={`#${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`} className="ml-2 opacity-0 group-hover:opacity-50 text-primary/50 text-sm">#</a>
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 {...props} id={String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')} className="group">
                      {children}
                      <a href={`#${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`} className="ml-2 opacity-0 group-hover:opacity-50 text-primary/50 text-sm">#</a>
                    </h3>
                  ),
                  h4: ({ children, ...props }) => (
                    <h4 {...props} id={String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')} className="group">
                      {children}
                      <a href={`#${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`} className="ml-2 opacity-0 group-hover:opacity-50 text-primary/50 text-sm">#</a>
                    </h4>
                  ),
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpManual;