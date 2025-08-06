import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingStateProps {
  className?: string;
}

export function LoadingState({ className = "flex items-center justify-center h-32" }: LoadingStateProps) {
  return (
    <div className={className}>
      <Loader className="h-6 w-6 animate-spin" />
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  error, 
  onRetry, 
  className = "flex flex-col items-center justify-center h-32 space-y-4" 
}: ErrorStateProps) {
  return (
    <div className={className}>
      <div className="text-center">
        <div className="text-2xl mb-2">😞</div>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}