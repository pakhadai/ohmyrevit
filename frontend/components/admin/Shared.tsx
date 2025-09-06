// frontend/components/admin/Shared.tsx
'use client';
import { Loader } from 'lucide-react';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader className="animate-spin h-8 w-8 text-purple-500" />
  </div>
);

export const EmptyState = ({ message, icon: Icon }: { message: string; icon: any }) => (
  <div className="text-center py-12 text-gray-500">
    <Icon size={48} className="mx-auto mb-4 opacity-50" />
    <p>{message}</p>
  </div>
);