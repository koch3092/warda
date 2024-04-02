import {useEffect, useRef, useState} from "react";
import {AgentConfig} from "@/hooks/useAgentConfig";

type SystemMessageInput = {
  disabled: boolean;
  agentConfig: AgentConfig;
  placeholder: string;
  accentColor: string;
  saveAgentConfig?: (message: string) => void;
};

export const SystemMessageInput = ({
  disabled,
  agentConfig,
  placeholder,
  accentColor,
  saveAgentConfig
}: SystemMessageInput) => {
  const [counter, setCounter] = useState(0);
  const [composing, setComposing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [systemMessage, setSystemMessage] = useState<string>("");

  const lengthExceeded = counter > agentConfig.systemMessageLimit;

  useEffect(() => {
    if (agentConfig.systemMessage === null) {
      agentConfig.systemMessage = "";
    }
    setSystemMessage(agentConfig.systemMessage);
    setCounter(agentConfig.systemMessage ? agentConfig.systemMessage.length : 0);
  }, [agentConfig]);

  return (
    <div className="flex flex-col gap-4 w-full h-full relative">
      <textarea
        ref={inputRef}
        className={`w-full h-full text-xs caret-${accentColor}-700 bg-transparent opacity-25 text-gray-300 p-2 pr-6 rounded-sm focus:opacity-100 focus:outline-none focus:border-${accentColor}-700 focus:ring-1 focus:ring-${accentColor}-700`}
        style={{resize: "none"}}
        placeholder={placeholder}
        value={systemMessage}
        disabled={disabled}
        onChange={(e) => {
          setSystemMessage(e.target.value);
          if (!composing) {
            setCounter(e.target.value.length);
          }
        }}
        onCompositionStart={(e) => {
          setComposing(true);
        }}
        onCompositionEnd={(e) => {
          setComposing(false);
          setCounter(e.currentTarget.value.length);
        }}
        onBlur={() => {
          saveAgentConfig?.(JSON.stringify({
            agentId: agentConfig.agentId,
            agentName: agentConfig.agentName,
            systemMessage: systemMessage
          }));
        }}
      />
      <div className={`absolute bottom-3 right-3 text-xs font-bold ${lengthExceeded ? 'text-red-500' : 'text-gray-300'}`}>
        {counter} / {agentConfig.systemMessageLimit} Tokens
      </div>
    </div>
  );
};
