import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  useCredentials,
  useDeleteCredential,
  getOAuthCallbackUrl,
  useInitiateOAuth
} from '@area/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Copy, Plus, Trash2, PlugZap } from 'lucide-react';
import { toast } from 'sonner';
import CreateCredentialForm from '../../components/credentials/CreateCredentialForm';

export const Route = createFileRoute('/dashboard/credentials')({
  component: CredentialsPage,
});

function CredentialsPage() {
  const { data: credentials, isLoading, error } = useCredentials();
  const deleteMutation = useDeleteCredential();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const callbackUrl = getOAuthCallbackUrl();

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(callbackUrl);
    toast.success('Callback URL copied to clipboard');
  };

  const handleConnect = (id: number) => {
    const url = useInitiateOAuth(id, window.location.href);
    window.location.href = url;
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Credential deleted');
    } catch (err) {
      toast.error('Failed to delete credential');
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading credentials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Failed to load credentials</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
          <p className="text-muted-foreground mt-1">Manage your OAuth2 credentials for services</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create OAuth2 Credential</DialogTitle>
              <DialogDescription>
                Configure a new application credential for a service provider.
              </DialogDescription>
            </DialogHeader>
            <CreateCredentialForm
              onSuccess={() => setIsCreateOpen(false)}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">OAuth2 Callback URL</CardTitle>
          <CardDescription>
            Use this URL when configuring your OAuth2 application in the provider's developer console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input readOnly value={callbackUrl} className="font-mono text-sm bg-muted" />
            <Button variant="outline" size="icon" onClick={handleCopyCallback}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {!credentials || credentials.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <PlugZap className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No credentials yet</h3>
          <p className="text-muted-foreground mb-4">Create your first credential to start connecting services.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline">
            Create Credential
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {credentials.map((credential) => (
            <Card key={credential.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-lg truncate" title={credential.name}>
                      {credential.name}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      {credential.serviceProvider.replace('_', ' ')}
                    </CardDescription>
                  </div>
                  {credential.isValid ? (
                    <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">Connected</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">Not Connected</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 text-sm text-muted-foreground">
                <p>Type: {credential.credentialType}</p>
              </CardContent>
              <CardFooter className="pt-3 border-t bg-muted/20 flex gap-2 justify-end">
                {!credential.isValid && (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleConnect(credential.id)}
                  >
                    Connect
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setDeleteId(credential.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credential?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this credential and any workflows using it may stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}