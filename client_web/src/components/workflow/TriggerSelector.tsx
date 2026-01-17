import { useState, useEffect } from 'react';
import { useTriggers } from '@area/shared';
import type { TriggerConfig } from '@area/shared';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TriggerSelectorProps {
  value?: TriggerConfig;
  onChange: (trigger: TriggerConfig) => void;
}

export function TriggerSelector({ value, onChange }: TriggerSelectorProps) {
  const { data: triggers, isLoading } = useTriggers();
  const [config, setConfig] = useState<Record<string, any>>(value?.config || {});

  useEffect(() => {
    if (value?.config) {
      setConfig(value.config);
    }
  }, [value?.config]);

  if (isLoading) {
    return <div className="text-muted-foreground">Loading triggers...</div>;
  }

  const selectedTrigger = triggers?.find(
    (t) => t.serviceProvider === value?.provider && t.id === value?.triggerId
  );

  const configSchema = selectedTrigger?.configSchema as any;

  const handleTriggerChange = (val: string) => {
    const [provider, triggerId] = val.split(':');
    if (provider && triggerId) {
        onChange({
            provider,
            triggerId,
            config: {},
        });
        setConfig({});
    }
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
            onChange={(e) => handleConfigChange(key, Number(e.target.value))}
            placeholder={fieldSchema.description || key}
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
        <Select
          value={value ? `${value.provider}:${value.triggerId}` : ''}
          onValueChange={handleTriggerChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a trigger..." />
          </SelectTrigger>
          <SelectContent>
            {triggers?.map((trigger) => (
              <SelectItem
                key={`${trigger.serviceProvider}:${trigger.id}`}
                value={`${trigger.serviceProvider}:${trigger.id}`}
              >
                {trigger.name} ({trigger.serviceProvider})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTrigger && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-1">{selectedTrigger.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedTrigger.description}</p>
          </div>

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