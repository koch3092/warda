import {useEffect, useRef} from "react";
import {SystemMessageInput} from "@/components/systemMessage/SystemMessageInput";
import {AgentConfig} from "@/hooks/useAgentConfig";

type SystemMessageProps = {
  disabled: boolean;
  agentConfig: AgentConfig;
  accentColor: string;
  saveAgentConfig?: (message: string) => void;
};

export const SystemMessageTile = ({ disabled, agentConfig, accentColor, saveAgentConfig }: SystemMessageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [containerRef]);

  return (
    <SystemMessageInput
      disabled={disabled}
      agentConfig={agentConfig}
      accentColor={accentColor}
      placeholder="Design the bot's prompt here..."
      saveAgentConfig={saveAgentConfig}
    />
  );
};
