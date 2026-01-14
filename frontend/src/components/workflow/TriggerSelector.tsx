import { useState, useEffect } from 'react';
import { useTriggers } from '../../hooks/useWorkflows';
import type { TriggerConfig } from '../../types/workflow';

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
    return <div className="text-gray-400">Loading triggers...</div>;
  }

  const selectedTrigger = triggers?.find(
    (t) => t.serviceProvider === value?.provider && t.id === value?.triggerId
  );

  const configSchema = selectedTrigger?.configSchema as any;

  const handleTriggerChange = (provider: string, triggerId: string) => {
    onChange({
      provider,
      triggerId,
      config: {},
    });
    setConfig({});
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
        <div key={key} className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {key.charAt(0).toUpperCase() + key.slice(1)}
            {!fieldSchema.description?.includes('optional') && (
              <span className="text-red-400 ml-1">*</span>
            )}
          </label>
          <input
            type="text"
            value={fieldValue || ''}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            placeholder={fieldSchema.description || key}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {fieldSchema.description && (
            <p className="text-xs text-gray-500 mt-1">{fieldSchema.description}</p>
          )}
        </div>
      );
    }

    if (fieldSchema.type === 'array' && fieldSchema.items?.type === 'string') {
      const arrayValue = Array.isArray(fieldValue) ? fieldValue.join(', ') : '';
      return (
        <div key={key} className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {key.charAt(0).toUpperCase() + key.slice(1)}
            {!fieldSchema.description?.includes('optional') && (
              <span className="text-red-400 ml-1">*</span>
            )}
          </label>
          <input
            type="text"
            value={arrayValue}
            onChange={(e) => {
              const values = e.target.value.split(',').map((v) => v.trim()).filter((v) => v);
              handleConfigChange(key, values.length > 0 ? values : undefined);
            }}
            placeholder={fieldSchema.description || 'Comma-separated values'}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {fieldSchema.description && (
            <p className="text-xs text-gray-500 mt-1">{fieldSchema.description}</p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Trigger
        </label>
        <select
          value={value ? `${value.provider}:${value.triggerId}` : ''}
          onChange={(e) => {
            const [provider, triggerId] = e.target.value.split(':');
            if (provider && triggerId) {
              handleTriggerChange(provider, triggerId);
            }
          }}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a trigger...</option>
          {triggers?.map((trigger) => (
            <option
              key={`${trigger.serviceProvider}:${trigger.id}`}
              value={`${trigger.serviceProvider}:${trigger.id}`}
            >
              {trigger.name} ({trigger.serviceProvider})
            </option>
          ))}
        </select>
      </div>

      {selectedTrigger && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-white mb-2">{selectedTrigger.name}</h3>
            <p className="text-sm text-gray-400">{selectedTrigger.description}</p>
          </div>

          {configSchema?.properties && (
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Configuration</h4>
              <div className="space-y-2">
                {Object.entries(configSchema.properties).map(([key, fieldSchema]: [string, any]) =>
                  renderConfigField(key, fieldSchema)
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
