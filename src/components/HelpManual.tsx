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
            <div className="prose prose-slate max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-code:text-foreground prose-pre:bg-muted">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
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