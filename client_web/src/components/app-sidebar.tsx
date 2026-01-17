import * as React from "react"
import {
  Plus,
  Key,
  Grid,
  GalleryVerticalEnd,
  Settings,
  LogOut,
  ChevronsUpDown,
  Clock
} from "lucide-react"
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useWorkflows, useCreateWorkflow } from '@area/shared';
import { workflowSlug } from '../lib/slug';
import { signOut, useSession } from '../lib/auth-client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: workflows } = useWorkflows();
  const createMutation = useCreateWorkflow();
  const navigate = useNavigate();
  
  const search = useSearch({ from: '/dashboard' });
  const selectedWorkflowSlug = search.workflow;

  const { data: session } = useSession()
  const user = session?.user

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
      navigate({
        to: '/dashboard',
        search: { workflow: workflowSlug(newWorkflow.id, newWorkflow.name) },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workflow';
      alert(`Failed to create workflow: ${errorMessage}`);
    }
  };

  const handleLogout = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  const formatLastRun = (date: Date | string | null | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="cursor-pointer">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold">Plug & Play</span>
                  <span className="">v1.0.0</span>
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
                    tooltip="New Workflow"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
                >
                    <Plus className="!w-5 !h-5" />
                    <span className="font-semibold">{createMutation.isPending ? 'Creating...' : 'New Workflow'}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Your Workflows</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workflows?.map((wf) => (
                <SidebarMenuItem key={wf.id}>
                  <SidebarMenuButton 
                    isActive={selectedWorkflowSlug === workflowSlug(wf.id, wf.name)}
                    onClick={() => {
                        navigate({
                            to: '/dashboard',
                            search: { workflow: workflowSlug(wf.id, wf.name) },
                        });
                    }}
                    className="h-auto py-2"
                  >
                    <div className="flex flex-col gap-1 w-full text-left overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{wf.name}</span>
                            {wf.isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock size={10} />
                            <span>{formatLastRun(wf.lastRun)}</span>
                        </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                        {user?.name?.slice(0, 2).toUpperCase() || 'CN'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {user?.name?.slice(0, 2).toUpperCase() || 'CN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.name}</span>
                      <span className="truncate text-xs">{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate({ to: '/dashboard/services' })}>
                    <Grid />
                    Services
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: '/dashboard/credentials' })}>
                    <Key />
                    Credentials
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: '/dashboard/profile' })}>
                    <Settings />
                    Profile
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}