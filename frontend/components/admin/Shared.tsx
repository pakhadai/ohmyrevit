'use client';
import { Loader, Inbox } from 'lucide-react';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <Loader className="animate-spin h-10 w-10 text-primary" />
  </div>
);

export const EmptyState = ({ message, icon: Icon = Inbox }: { message: string; icon?: any }) => (
  <div className="text-center py-20 bg-muted/20 rounded-[24px] border border-dashed border-border">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon size={32} className="text-muted-foreground opacity-50" />
    </div>
    <p className="text-muted-foreground font-medium">{message}</p>
  </div>
);