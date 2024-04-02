import {useChat} from "@livekit/components-react";
import type {ChatOptions} from "@livekit/components-core";

const agentConfigTopic = "agent-config-topic";
const options: ChatOptions = {channelTopic: agentConfigTopic};

export interface ModelConfig {
  modelType: string;
  dialogRound: number;
  temperature: number;
  outputLimit: number;
  topP: number;
}

export interface AgentBaseInfo {
  agentId: string;
  agentName: string;
}

export interface AgentProfileConfig {
  systemMessage: string;
  systemMessageLimit: number;
}

export interface AgentConfig extends AgentProfileConfig, ModelConfig, AgentBaseInfo {}

export function useAgentConfig() {
  const {send: sendAgentConfig} = useChat(options);

  return {sendAgentConfig, agentConfigTopic};
}
