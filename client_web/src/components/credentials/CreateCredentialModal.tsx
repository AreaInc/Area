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

  /* eslint-disable react/no-unescaped-entities */
  const getProviderConfig = (p: string) => {
    switch (p) {
      case 'google':
      case 'gmail':
      case 'google_sheets':
      case 'youtube':
        return {
          clientIdLabel: 'Client ID',
          clientIdPlaceholder: '123456789-abcdef.apps.googleusercontent.com',
          clientSecretLabel: 'Client Secret',
          clientSecretPlaceholder: 'GOCSPX-abc123def456',
          helperText: 'Obtain these from the Google Cloud Console.',
          dashboardUrl: 'https://console.cloud.google.com/apis/credentials',
        };
      case 'spotify':
        return {
          clientIdLabel: 'Client ID',
          clientIdPlaceholder: 'e.g. 3e3a... (32 characters)',
          clientSecretLabel: 'Client Secret',
          clientSecretPlaceholder: 'e.g. 9b9c... (32 characters)',
          helperText: 'Obtain these from the Spotify Developer Dashboard.',
          dashboardUrl: 'https://developer.spotify.com/dashboard',
        };
      case 'twitch':
        return {
          clientIdLabel: 'Client ID',
          clientIdPlaceholder: 'e.g. gp76... (30 characters)',
          clientSecretLabel: 'Client Secret',
          clientSecretPlaceholder: 'e.g. a1b2... (30 characters)',
          helperText: 'Obtain these from the Twitch Developer Console.',
          dashboardUrl: 'https://dev.twitch.tv/console',
        };
      default:
        return {
          clientIdLabel: 'Client ID',
          clientIdPlaceholder: 'Client ID',
          clientSecretLabel: 'Client Secret',
          clientSecretPlaceholder: 'Client Secret',
          helperText: '',
          dashboardUrl: '',
        };
    }
  };

  const config = getProviderConfig(provider);

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
                placeholder="My Personal Account"
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
                <option value="google_sheets">Google Sheets</option>
                <option value="spotify">Spotify</option>
                <option value="twitch">Twitch</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {config.clientIdLabel}
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder={config.clientIdPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {config.clientSecretLabel}
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder={config.clientSecretPlaceholder}
              />
            </div>

            {config.helperText && (
              <div className="text-xs text-gray-400">
                <p>{config.helperText}</p>
                {config.dashboardUrl && (
                  <a
                    href={config.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline mt-1 inline-block"
                  >
                    Open Developer Console
                  </a>
                )}
              </div>
            )}
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
