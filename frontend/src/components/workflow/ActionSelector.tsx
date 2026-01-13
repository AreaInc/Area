import { useActions } from '../../hooks/useWorkflows';
import { useCredentials } from '../../hooks/useCredentials';
import type { ActionConfig } from '../../types/workflow';

interface ActionSelectorProps {
  value?: ActionConfig;
  onChange: (action: ActionConfig) => void;
}

export function ActionSelector({ value, onChange }: ActionSelectorProps) {
  const { data: actions, isLoading: actionsLoading } = useActions();
  const { data: credentials, isLoading: credentialsLoading } = useCredentials();

  if (actionsLoading || credentialsLoading) {
    return <div className="text-gray-400">Loading actions...</div>;
  }

  const selectedAction = actions?.find(
    (a) => a.serviceProvider === value?.provider && a.id === value?.actionId
  );

  const availableCredentials = credentials?.filter(
    (c) => c.serviceProvider === value?.provider && c.isValid
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Action
        </label>
        <select
          value={value ? `${value.provider}:${value.actionId}` : ''}
          onChange={(e) => {
            const [provider, actionId] = e.target.value.split(':');
            if (provider && actionId) {
              onChange({
                provider,
                actionId,
                config: {},
                credentialsId: value?.credentialsId,
              });
            }
          }}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
        >
          <option value="">Select an action...</option>
          {actions?.map((action) => (
            <option
              key={`${action.serviceProvider}:${action.id}`}
              value={`${action.serviceProvider}:${action.id}`}
            >
              {action.name} ({action.serviceProvider})
            </option>
          ))}
        </select>
      </div>

      {selectedAction && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-white mb-2">{selectedAction.name}</h3>
            <p className="text-sm text-gray-400">{selectedAction.description}</p>
          </div>

          {selectedAction.requiresCredentials && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Credentials
              </label>
              {!availableCredentials || availableCredentials.length === 0 ? (
                <p className="text-sm text-yellow-400">
                  No connected credentials found for {value?.provider}. Please create and
                  connect credentials first.
                </p>
              ) : (
                <select
                  value={value?.credentialsId || ''}
                  onChange={(e) => {
                    onChange({
                      ...value!,
                      credentialsId: parseInt(e.target.value),
                    });
                  }}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
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

          <div className="text-xs text-gray-500">
            Advanced configuration will be added in a future update
          </div>
        </div>
      )}
    </div>
  );
}
