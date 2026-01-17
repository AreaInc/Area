import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/dashboard/callback')({
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: '/dashboard/callback' }) as { success?: string; credentialId?: string; error?: string };

  useEffect(() => {
    if (searchParams.success === 'true') {
      alert(`Credential ${searchParams.credentialId} connected successfully!`);
      navigate({ to: '/dashboard/credentials' });
    } else if (searchParams.success === 'false') {
      alert(`Failed to connect: ${searchParams.error || 'Unknown error'}`);
      navigate({ to: '/dashboard/credentials' });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-400">Processing OAuth callback...</p>
    </div>
  );
}
