import {useEffect, useState} from "react";
import {ConfigurationPanelItem} from "@/components/config/ConfigurationPanelItem";
import {NameValueRow} from "@/components/config/NameValueRow";
import {AgentConfig} from "@/hooks/useAgentConfig";

export interface Model {
  name: string;
  value: string;
}

type AgentConfigProps = {
  disabled: boolean;
  agentConfig: AgentConfig;
  themeColor: string;
  saveAgentConfig?: (agentConfig: AgentConfig) => void;
}

const models: Model[] = [
  {name: "GPT-4 (8K)", value: "gpt-4"},
  {name: "GPT-4 Turbo (128K)", value: "gpt-4-turbo"},
  {name: "GPT-3.5 (16K)", value: "gpt-3.5"},
];

export const AgentConfigTile = ({disabled, agentConfig, themeColor, saveAgentConfig}: AgentConfigProps) => {
  const [localAgentConfig, setLocalAgentConfig] = useState<AgentConfig>(agentConfig);

  useEffect(() => {
    setLocalAgentConfig(agentConfig);
  }, [agentConfig]);

  const handleInputChange = (key: string, value: string) => {
    setLocalAgentConfig(prevLocalAgentConfig => ({...prevLocalAgentConfig, [key]: value}));
  };

  const handleBlur = (key: keyof AgentConfig) => {
    saveAgentConfig?.({
      agentId: agentConfig.agentId,
      agentName: agentConfig.agentName,
      [key]: localAgentConfig[key]
    });
  };

  return (
    <ConfigurationPanelItem title="Model Configuration">
      <div className="flex flex-col pt-2 gap-4">
        <NameValueRow
          name="Model"
          value={
            <select
              className={`min-w-20 max-w-40 text-center bg-transparent border border-gray-800 text-gray-100 focus:outline-none focus:border-${themeColor}-700 focus:ring-1 focus:ring-${themeColor}-700`}
              disabled={disabled}
              value={localAgentConfig.modelType}
              onChange={(e) => handleInputChange('modelType', e.currentTarget.value)}
              onBlur={() => handleBlur('modelType')}
            >
              {models.map((model, index) => (
                <option className={`min-w-20 max-w-40 text-center text-gray-100 bg-black border border-gray-800`}
                        key={index} value={model.value}>
                  {model.name}
                </option>
              ))}
            </select>
          }
          valueColor="gray-800"
          valueSize="text-sm"
        />
        <NameValueRow
          name="System Message Limit"
          value={
            <input
              className={`min-w-20 max-w-40 text-center bg-transparent border border-gray-800 text-gray-100 focus:outline-none focus:border-${themeColor}-700 focus:ring-1 focus:ring-${themeColor}-700`}
              disabled={disabled}
              type="number"
              min="0"
              max="4096"
              step="1"
              value={localAgentConfig.systemMessageLimit}
              onChange={(e) => handleInputChange('systemMessageLimit', e.target.value)}
              onBlur={() => handleBlur('systemMessageLimit')}
            />
          }
          valueColor="gray-800"
          valueSize="text-sm"
        />
        <NameValueRow
          name="Temperature"
          value={
            <input
              className={`min-w-20 max-w-40 text-center bg-transparent border border-gray-800 text-gray-100 focus:outline-none focus:border-${themeColor}-700 focus:ring-1 focus:ring-${themeColor}-700`}
              disabled={disabled}
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={localAgentConfig.temperature}
              onChange={(e) => handleInputChange('temperature', e.target.value)}
              onBlur={() => handleBlur('temperature')}
            />
          }
          valueColor="gray-800"
          valueSize="text-sm"
        />
        <NameValueRow
          name="TopP"
          value={
            <input
              className={`min-w-20 max-w-40 text-center bg-transparent border border-gray-800 text-gray-100 focus:outline-none focus:border-${themeColor}-700 focus:ring-1 focus:ring-${themeColor}-700`}
              disabled={disabled}
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={localAgentConfig.topP}
              onChange={(e) => handleInputChange('topP', e.target.value)}
              onBlur={() => handleBlur('topP')}
            />
          }
          valueColor="gray-800"
          valueSize="text-sm"
        />
        <NameValueRow
          name="Response max length"
          value={
            <input
              className={`min-w-20 max-w-40 text-center bg-transparent border border-gray-800 text-gray-100 focus:outline-none focus:border-${themeColor}-700 focus:ring-1 focus:ring-${themeColor}-700`}
              disabled={disabled}
              type="number"
              min="1"
              max="4096"
              step="1"
              value={localAgentConfig.outputLimit}
              onChange={(e) => handleInputChange('outputLimit', e.target.value)}
              onBlur={() => handleBlur('outputLimit')}
            />
          }
          valueColor="gray-800"
          valueSize="text-sm"
        />
        <NameValueRow
          name="Dialog round"
          value={
            <input
              className={`min-w-20 max-w-40 text-center bg-transparent border border-gray-800 text-gray-100 focus:outline-none focus:border-${themeColor}-700 focus:ring-1 focus:ring-${themeColor}-700`}
              disabled={disabled}
              type="number"
              min="1"
              max="30"
              step="1"
              value={localAgentConfig.dialogRound}
              onChange={(e) => handleInputChange('dialogRound', e.target.value)}
              onBlur={() => handleBlur('dialogRound')}
            />
          }
          valueColor="gray-800"
          valueSize="text-sm"
        />
      </div>
    </ConfigurationPanelItem>
  );
};
