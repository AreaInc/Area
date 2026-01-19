import { useState, useEffect, useMemo } from 'react';
import { useActions } from '@area/shared';
import { useCredentials } from '@area/shared';
import type { ActionConfig } from '@area/shared';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionSelectorProps {
  value?: ActionConfig;
  onChange: (action: ActionConfig) => void;
}

export function ActionSelector({ value, onChange }: ActionSelectorProps) {
  const { data: actions, isLoading: actionsLoading } = useActions();
  const { data: credentials, isLoading: credentialsLoading } = useCredentials();
  const [config, setConfig] = useState<Record<string, any>>(value?.config || {});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value?.config) {
      setConfig(value.config);
    }
  }, [value?.config]);

  const groupedActions = useMemo(() => {
    if (!actions) return {};
    return actions.reduce((acc, action) => {
      const provider = action.serviceProvider;
      if (!acc[provider]) {
        acc[provider] = {
          items: [],
          imageUrl: action.imageUrl
        };
      }
      acc[provider].items.push(action);
      return acc;
    }, {} as Record<string, { items: typeof actions, imageUrl?: string }>);
  }, [actions]);

  if (actionsLoading || credentialsLoading) {
    return <div className="text-muted-foreground">Loading actions...</div>;
  }

  const selectedAction = actions?.find(
    (a) => a.serviceProvider === value?.provider && a.id === value?.actionId
  );

  const availableCredentials = credentials?.filter(
    (c) => c.serviceProvider === value?.provider && c.isValid
  );

  const inputSchema = selectedAction?.inputSchema as any;

  const handleActionSelect = (provider: string, actionId: string) => {
    onChange({
      provider,
      actionId,
      config: {},
      credentialsId: value?.credentialsId,
    });
    setConfig({});
    setOpen(false);
  };

  const handleConfigChange = (key: string, newValue: any) => {
    const updatedConfig = { ...config };
    if (newValue === '' || newValue === null || newValue === undefined) {
      delete updatedConfig[key];
    } else {
      updatedConfig[key] = newValue;
    }
    setConfig(updatedConfig);
    onChange({
      ...value!,
      config: updatedConfig,
    });
  };

  const renderConfigField = (key: string, fieldSchema: any, required: boolean = false) => {
    const fieldValue = config[key];

    if (fieldSchema.type === 'string') {
      return (
        <div key={key} className="space-y-2">
          <Label>
            {key.charAt(0).toUpperCase() + key.slice(1)}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="text"
            value={fieldValue || ''}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            placeholder={fieldSchema.description || key}
            required={required}
          />
          {fieldSchema.description && (
            <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
          )}
        </div>
      );
    }

    if (fieldSchema.type === 'array' && fieldSchema.items?.type === 'string') {
      const arrayValue = Array.isArray(fieldValue) ? fieldValue.join(', ') : '';
      return (
        <div key={key} className="space-y-2">
          <Label>
            {key.charAt(0).toUpperCase() + key.slice(1)}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="text"
            value={arrayValue}
            onChange={(e) => {
              const values = e.target.value.split(',').map((v: string) => v.trim()).filter((v: string) => v);
              handleConfigChange(key, values.length > 0 ? values : undefined);
            }}
            placeholder={fieldSchema.description || 'Comma-separated values'}
          />
          {fieldSchema.description && (
            <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
          )}
        </div>
      );
    }

    if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
      return (
        <div key={key} className="space-y-2">
          <Label>
            {key.charAt(0).toUpperCase() + key.slice(1)}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="number"
            value={fieldValue || ''}
            onChange={(e) => {
              const val = e.target.value;
              handleConfigChange(key, val === '' ? undefined : Number(val));
            }}
            placeholder={fieldSchema.description || key}
            required={required}
            step={fieldSchema.type === 'integer' ? '1' : 'any'}
          />
          {fieldSchema.description && (
            <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
          )}
        </div>
      );
    }

    if (fieldSchema.type === 'boolean') {
      return (
        <div key={key} className="flex items-center space-x-2 py-2">
          <Checkbox
            id={key}
            checked={fieldValue || false}
            onCheckedChange={(checked) => handleConfigChange(key, checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor={key} className="cursor-pointer">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Label>
            {fieldSchema.description && (
              <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Select Action</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {value ? (
                selectedAction ? `${selectedAction.name} (${selectedAction.serviceProvider})` : "Action not found"
              ) : (
                "Select an action..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command className="h-auto">
              <CommandInput placeholder="Search action..." />
              <ScrollArea className="h-[300px]">
                <CommandList className="max-h-full overflow-hidden">
                  <CommandEmpty>No action found.</CommandEmpty>
                  {Object.entries(groupedActions).map(([provider, group]) => (
                    <CommandGroup 
                      key={provider} 
                      heading={
                        <div className="flex items-center gap-2">
                          {group.imageUrl && (
                            <img src={group.imageUrl} alt="" className="w-4 h-4 object-contain" />
                          )}
                          <span className="capitalize">{provider}</span>
                        </div>
                      }
                    >
                      {group.items.map((action) => (
                        <CommandItem
                          key={`${action.serviceProvider}:${action.id}`}
                          value={`${action.serviceProvider} ${action.name}`}
                          onSelect={() => handleActionSelect(action.serviceProvider, action.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value?.provider === action.serviceProvider && value?.actionId === action.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {action.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </ScrollArea>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <ScrollArea className='h-[600px]'>
      {selectedAction && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-1">{selectedAction.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedAction.description}</p>
          </div>

          {selectedAction.requiresCredentials && (
            <div className="space-y-2">
              <Label>
                Credentials <span className="text-destructive">*</span>
              </Label>
              {!availableCredentials || availableCredentials.length === 0 ? (
                <p className="text-sm text-yellow-500 dark:text-yellow-400">
                  No connected credentials found for {value?.provider}. Please create and
                  connect credentials first.
                </p>
              ) : (
                <Select
                  value={value?.credentialsId?.toString() || ''}
                  onValueChange={(val) => {
                    onChange({
                      ...value!,
                      credentialsId: val ? parseInt(val) : undefined,
                    });
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select credentials..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCredentials.map((cred) => (
                      <SelectItem key={cred.id} value={cred.id.toString()}>
                        {cred.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          {inputSchema?.properties && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium">Configuration</h4>
              <div className="space-y-2">
                {Object.entries(inputSchema.properties).map(([key, fieldSchema]: [string, any]) => {
                  const required = inputSchema.required?.includes(key) || false;
                  return renderConfigField(key, fieldSchema, required);
                })}
              </div>
            </div>
          )}
        </div>
      )}
      </ScrollArea>
    </div>
  );
}