import { useTriggers } from '../../hooks/useWorkflows';
import type { TriggerConfig } from '../../types/workflow';

interface TriggerSelectorProps {
  value?: TriggerConfig;
  onChange: (trigger: TriggerConfig) => void;
}

export function TriggerSelector({ value, onChange }: TriggerSelectorProps) {
  const { data: triggers, isLoading } = useTriggers();

  if (isLoading) {
    return <div className="text-gray-400">Loading triggers...</div>;
  }

  const selectedTrigger = triggers?.find(
    (t) => t.serviceProvider === value?.provider && t.id === value?.triggerId
  );

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
              onChange({
                provider,
                triggerId,
                config: {},
              });
            }
          }}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
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
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2">{selectedTrigger.name}</h3>
          <p className="text-sm text-gray-400 mb-4">{selectedTrigger.description}</p>
          <div className="text-xs text-gray-500">
            Configuration will be added in a future update
          </div>
        </div>
      )}
    </div>
  );
}
