import { useState, useEffect } from 'react';
import { useTriggers, useCredentials } from '@area/shared';
import type { TriggerConfig } from '@area/shared';

interface TriggerSelectorProps {
  value?: TriggerConfig;
  onChange: (trigger: TriggerConfig) => void;
}

export function TriggerSelector({ value, onChange }: TriggerSelectorProps) {
  const { data: triggers, isLoading: triggersLoading } = useTriggers();
  const { data: credentials, isLoading: credentialsLoading } = useCredentials();
  const [config, setConfig] = useState<Record<string, any>>(value?.config || {});

  useEffect(() => {
    if (value?.config) {
      setConfig(value.config);
    }
  }, [value?.config]);

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

    if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
      return (
        <div key={key} className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {key.charAt(0).toUpperCase() + key.slice(1)}
            {!fieldSchema.description?.includes('optional') && (
              <span className="text-red-400 ml-1">*</span>
            )}
          </label>
          <input
            type="number"
            value={fieldValue || ''}
            onChange={(e) => handleConfigChange(key, Number(e.target.value))}
            placeholder={fieldSchema.description || key}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {fieldSchema.description && (
            <p className="text-xs text-gray-500 mt-1">{fieldSchema.description}</p>
          )}
        </div>
      );
    }

    if (fieldSchema.type === 'boolean') {
      return (
        <div key={key} className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={fieldValue || false}
              onChange={(e) => handleConfigChange(key, e.target.checked)}
              className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-300">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </span>
          </label>
          {fieldSchema.description && (
            <p className="text-xs text-gray-500 mt-1 ml-6">{fieldSchema.description}</p>
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

          {selectedTrigger.requiresCredentials && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Credentials <span className="text-red-400">*</span>
              </label>
              {!availableCredentials || availableCredentials.length === 0 ? (
                <p className="text-sm text-yellow-400">
                  No connected credentials found for {value?.provider}. Please create and
                  connect credentials first.
                </p>
              ) : (
                <select
                  value={value?.config?.credentialsId || ''}
                  onChange={(e) => {
                    const credId = e.target.value ? parseInt(e.target.value) : undefined;
                    handleConfigChange('credentialsId', credId);
                  }}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select credentials...</option>
                  {availableCredentials.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

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
