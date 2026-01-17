import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/callback')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      success: search.success as string | undefined,
      credentialId: search.credentialId as string | undefined,
      error: search.error as string | undefined,
    }
  },
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: '/dashboard/callback' });

  useEffect(() => {
    if (searchParams.success === 'true') {
      toast.success(`Connected successfully!`);
      navigate({ to: '/dashboard/credentials' });
    } else if (searchParams.success === 'false') {
      toast.error(`Failed to connect: ${searchParams.error || 'Unknown error'}`);
      navigate({ to: '/dashboard/credentials' });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-400">Processing OAuth callback...</p>
    </div>
  );
}
