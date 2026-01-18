import { useState, useEffect, useMemo } from 'react';
import { useTriggers, useCredentials } from '@area/shared';
import type { TriggerConfig } from '@area/shared';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TriggerSelectorProps {
  value?: TriggerConfig;
  onChange: (trigger: TriggerConfig) => void;
}

export function TriggerSelector({ value, onChange }: TriggerSelectorProps) {
  const { data: triggers, isLoading: triggersLoading } = useTriggers();
  const { data: credentials, isLoading: credentialsLoading } = useCredentials();
  const [config, setConfig] = useState<Record<string, any>>(value?.config || {});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value?.config) {
      setConfig(value.config);
    }
  }, [value?.config]);

  const groupedTriggers = useMemo(() => {
    if (!triggers) return {};
    return triggers.reduce((acc, trigger) => {
      const provider = trigger.serviceProvider;
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(trigger);
      return acc;
    }, {} as Record<string, typeof triggers>);
  }, [triggers]);

  if (triggersLoading || credentialsLoading) {
    return <div className="text-gray-400">Loading triggers...</div>;
  }

  const selectedTrigger = triggers?.find(
    (t) => t.serviceProvider === value?.provider && t.id === value?.triggerId
  );

  const configSchema = selectedTrigger?.configSchema as any;

  const availableCredentials = credentials?.filter(
    (c) => c.serviceProvider === value?.provider && c.isValid
  );

  const handleTriggerSelect = (provider: string, triggerId: string) => {
    onChange({
      provider,
      triggerId,
      config: {},
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

  const renderConfigField = (key: string, fieldSchema: any) => {
    const fieldValue = config[key];

    if (fieldSchema.type === 'string') {
      return (
        <div key={key} className="space-y-2">
          <Label>
            {key.charAt(0).toUpperCase() + key.slice(1)}
            {!fieldSchema.description?.includes('optional') && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <Input
            type="text"
            value={fieldValue || ''}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            placeholder={fieldSchema.description || key}
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
            {!fieldSchema.description?.includes('optional') && (
              <span className="text-destructive ml-1">*</span>
            )}
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
            {!fieldSchema.description?.includes('optional') && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <Input
            type="number"
            value={fieldValue || ''}
            onChange={(e) => {
              const val = e.target.value;
              handleConfigChange(key, val === '' ? undefined : Number(val));
            }}
            placeholder={fieldSchema.description || key}
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
        <Label>Select Trigger</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {value ? (
                selectedTrigger ? `${selectedTrigger.name} (${selectedTrigger.serviceProvider})` : "Trigger not found"
              ) : (
                "Select a trigger..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command className="h-auto">
              <CommandInput placeholder="Search trigger..." />
              <CommandList>
                <CommandEmpty>No trigger found.</CommandEmpty>
                {Object.entries(groupedTriggers).map(([provider, triggers]) => (
                  <CommandGroup key={provider} heading={provider}>
                    {triggers.map((trigger) => (
                      <CommandItem
                        key={`${trigger.serviceProvider}:${trigger.id}`}
                        value={`${trigger.serviceProvider} ${trigger.name}`}
                        onSelect={() => handleTriggerSelect(trigger.serviceProvider, trigger.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value?.provider === trigger.serviceProvider && value?.triggerId === trigger.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {trigger.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedTrigger && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-1">{selectedTrigger.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedTrigger.description}</p>
          </div>

          {selectedTrigger.requiresCredentials && (
            <div className="space-y-2">
              <Label>
                Credentials <span className="text-destructive ml-1">*</span>
              </Label>
              {!availableCredentials || availableCredentials.length === 0 ? (
                <p className="text-sm text-yellow-500">
                  No connected credentials found for {value?.provider}. Please create and
                  connect credentials first.
                </p>
              ) : (
                <Select
                  value={value?.config?.credentialsId?.toString() || ''}
                  onValueChange={(val) => {
                    const credId = val ? parseInt(val) : undefined;
                    handleConfigChange('credentialsId', credId);
                  }}
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

          {configSchema?.properties && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium">Configuration</h4>
              {Object.entries(configSchema.properties).map(([key, fieldSchema]: [string, any]) =>
                renderConfigField(key, fieldSchema)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
