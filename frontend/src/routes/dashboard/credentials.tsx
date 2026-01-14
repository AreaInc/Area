import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useCredentials, useDeleteCredential, getOAuthCallbackUrl } from '../../hooks/useCredentials';
import { Button } from '../../components/ui/button';
import CreateCredentialModal from '../../components/credentials/CreateCredentialModal';

export const Route = createFileRoute('/dashboard/credentials')({
  component: CredentialsPage,
});

function CredentialsPage() {
  const { data: credentials, isLoading, error } = useCredentials();
  const deleteMutation = useDeleteCredential();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const callbackUrl = getOAuthCallbackUrl();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading credentials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-400">Failed to load credentials</p>
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert('Failed to delete credential');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Credentials</h1>
          <p className="text-gray-400 mt-1">Manage your OAuth2 credentials for services</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Create Credential
        </Button>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">OAuth2 Callback URL</h2>
        <p className="text-xs text-gray-400 mb-2">
          Use this URL when configuring your OAuth2 application:
        </p>
        <div className="flex gap-2">
          <code className="flex-1 bg-gray-900 text-gray-300 px-3 py-2 rounded text-sm">
            {callbackUrl}
          </code>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(callbackUrl);
              alert('Copied to clipboard!');
            }}
          >
            Copy
          </Button>
        </div>
      </div>

      {!credentials || credentials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No credentials yet</p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Your First Credential
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {credentials.map((credential) => (
            <div
              key={credential.id}
              className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="text-white font-semibold">{credential.name}</h3>
                <p className="text-sm text-gray-400">
                  {credential.serviceProvider} • {credential.credentialType}
                </p>
                <div className="mt-2">
                  {credential.isValid ? (
                    <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded">
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded">
                      Not Connected
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!credential.isValid && (
                  <Button
                    onClick={() => {
                      window.location.href = `https://${import.meta.env.VITE_DEPLOY_ADDRESS ?? "localhost"}/api/oauth2-credential/auth?credentialId=${credential.id}&redirectUrl=${encodeURIComponent(window.location.href)}`;
                    }}
                  >
                    Connect
                  </Button>
                )}
                <Button
                  onClick={() => handleDelete(credential.id)}
                  disabled={deletingId === credential.id}
                >
                  {deletingId === credential.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateCredentialModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
