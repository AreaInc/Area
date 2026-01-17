import { useState } from 'react';
import { useCreateCredential } from '@area/shared';
import { Button } from '../ui/button';

interface CreateCredentialModalProps {
  onClose: () => void;
}

export default function CreateCredentialModal({ onClose }: CreateCredentialModalProps) {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('gmail');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const createMutation = useCreateCredential();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !provider || !clientId || !clientSecret) {
      alert('All fields are required');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        provider,
        clientId,
        clientSecret,
      });
      onClose();
    } catch (err) {
      alert('Failed to create credential');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Create OAuth2 Credential</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder="My Gmail Account"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="gmail">Gmail</option>
                <option value="google">Google</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder="123456789-abcdef.apps.googleusercontent.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Client Secret
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder="GOCSPX-abc123def456"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
