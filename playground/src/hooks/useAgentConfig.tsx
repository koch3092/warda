import {ChatMessage, useDataChannel} from "@livekit/components-react";
import {useCallback, useState} from "react";
import {ReceivedChatMessage, ReceivedDataMessage} from "@livekit/components-core";
import {generateRandomAlphanumeric} from "@/lib/util";

const agentConfigTopic = "agent-config-topic";

export interface ModelConfig {
  modelType?: string;
  dialogRound?: number;
  temperature?: number;
  outputLimit?: number;
  topP?: number;
}

export interface AgentBaseInfo {
  agentId: string;
  agentName: string;
}

export interface AgentProfileConfig {
  systemMessage?: string;
  systemMessageLimit?: number;
}

export interface AgentConfig extends AgentProfileConfig, ModelConfig, AgentBaseInfo {}

export function useAgentConfig() {
  const [agentConfig , setAgentConfig] = useState<AgentConfig>();
  const [agentConfigServiceMessages, setAgentConfigServiceMessages ]= useState<ReceivedChatMessage[]>([]);

  const onDataReceived = useCallback((msg: ReceivedDataMessage) => {
    const decoded = JSON.parse(
      new TextDecoder("utf-8").decode(msg.payload)
    );

    let timestamp = new Date().getTime();
    if ("timestamp" in decoded && decoded.timestamp > 0) {
      timestamp = decoded.timestamp;
    }

    const agentConfigServiceMessage: ReceivedChatMessage = {
      id: generateRandomAlphanumeric(12),
      message: decoded.message,
      timestamp: timestamp,
      from: decoded.from,
    };

    setAgentConfigServiceMessages([
      ...agentConfigServiceMessages,
      agentConfigServiceMessage
    ]);

    setAgentConfig(JSON.parse(decoded.message) as AgentConfig);

  }, [agentConfigServiceMessages]);

  const {send, isSending} = useDataChannel(agentConfigTopic, onDataReceived);

  const sendAgentConfig = (agentConfig: AgentConfig) => {
    const message = JSON.stringify(agentConfig);
    const timestamp = Date.now();
    const id = generateRandomAlphanumeric(12);
    const chatMessage: ChatMessage = {id, message, timestamp};

    const encodedMsg = new TextEncoder().encode(JSON.stringify(chatMessage));

    send(encodedMsg, {reliable: true, topic: agentConfigTopic});
  }

  return {sendAgentConfig, agentConfig, agentConfigServiceMessages, isSending};
}
