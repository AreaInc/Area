import { useState } from 'react';
import { useCreateCredential } from '@area/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateCredentialFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateCredentialForm({ onSuccess, onCancel }: CreateCredentialFormProps) {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('gmail');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const createMutation = useCreateCredential();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !provider || !clientId || !clientSecret) {
      toast.error('All fields are required');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        provider,
        clientId,
        clientSecret,
      });
      toast.success('Credential created successfully');
      onSuccess();
    } catch (err) {
      toast.error('Failed to create credential');
    }
  };

  /* eslint-disable react/no-unescaped-entities */
  const getProviderConfig = (p: string) => {
    switch (p) {
      case 'google':
      case 'gmail':
      case 'google_sheets':
      case 'youtube':
      case 'google-calendar':
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
      case 'github':
        return {
          clientIdLabel: 'Client ID',
          clientIdPlaceholder: 'e.g. Iv1.a1b2c3d4e5f6g7h8',
          clientSecretLabel: 'Client Secret',
          clientSecretPlaceholder: 'e.g. 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0',
          helperText: 'Obtain these from your GitHub OAuth App settings.',
          dashboardUrl: 'https://github.com/settings/developers',
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Personal Account"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider">Provider</Label>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger id="provider">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gmail">Gmail</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="google_sheets">Google Sheets</SelectItem>
            <SelectItem value="spotify">Spotify</SelectItem>
            <SelectItem value="twitch">Twitch</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="google-calendar">Google Calendar</SelectItem>
            <SelectItem value="github">GitHub</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientId">{config.clientIdLabel}</Label>
        <Input
          id="clientId"
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder={config.clientIdPlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientSecret">{config.clientSecretLabel}</Label>
        <Input
          id="clientSecret"
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder={config.clientSecretPlaceholder}
        />
      </div>

      {config.helperText && (
        <div className="text-xs text-muted-foreground">
          <p>{config.helperText}</p>
          {config.dashboardUrl && (
            <a
              href={config.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline mt-1 inline-block"
            >
              Open Developer Console
            </a>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create'}
        </Button>
      </div>
    </form>
  );
}