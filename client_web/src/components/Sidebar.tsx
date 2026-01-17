import { useNavigate } from '@tanstack/react-router';
import { Clock, Plus, Key, Grid, Play } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useWorkflows, useCreateWorkflow } from '@area/shared';
import { useState } from 'react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"

export function Sidebar({ ...props }: React.ComponentProps<typeof ShadcnSidebar>) {
  const { data: workflows } = useWorkflows();
  const createMutation = useCreateWorkflow();
  const navigate = useNavigate();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);

  const handleCreateWorkflow = async () => {
    try {
      const newWorkflow = await createMutation.mutateAsync({
        name: 'New Workflow',
        description: 'Created via Sidebar',
        trigger: {
          provider: 'gmail',
          triggerId: 'receive-email',
          config: {},
        },
        action: {
          provider: 'gmail',
          actionId: 'send-email',
          config: {},
        },
      });
      setSelectedWorkflowId(newWorkflow.id);
      navigate({ to: '/dashboard' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workflow';
      alert(`Failed to create workflow: ${errorMessage}`);
    }
  };

  return (
    <ShadcnSidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate({ to: '/dashboard' })}>
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Play className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold text-lg bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    Plug & Play
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleCreateWorkflow}
                disabled={createMutation.isPending}
                className="text-primary hover:text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 data-[active=true]:bg-primary/20"
                tooltip="New Workflow"
              >
                <Plus />
                <span>{createMutation.isPending ? 'Creating...' : 'New Workflow'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate({ to: '/dashboard/services' })}
                tooltip="Services"
              >
                <Grid />
                <span>Services</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate({ to: '/dashboard/credentials' })}
                tooltip="Credentials"
              >
                <Key />
                <span>Credentials</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Your Workflows</SidebarGroupLabel>
          <SidebarMenu>
            {workflows?.map((wf) => (
              <SidebarMenuItem key={wf.id}>
                <SidebarMenuButton
                  onClick={() => {
                    setSelectedWorkflowId(wf.id);
                    navigate({ to: '/dashboard' });
                  }}
                  isActive={selectedWorkflowId === wf.id}
                  className="h-auto py-2"
                >
                  <div className="flex flex-col gap-1 w-full text-left">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium truncate">{wf.name}</span>
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          wf.isActive
                            ? 'bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/50'
                            : 'bg-muted-foreground/30'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={10} />
                      <span>
                        {wf.lastRun ? new Date(wf.lastRun).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  );
}