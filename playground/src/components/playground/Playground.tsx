"use client";

import { LoadingSVG } from "@/components/button/LoadingSVG";
import { ChatMessageType, ChatTile } from "@/components/chat/ChatTile";
import { ColorPicker } from "@/components/colorPicker/ColorPicker";
import { AudioInputTile } from "@/components/config/AudioInputTile";
import { ConfigurationPanelItem } from "@/components/config/ConfigurationPanelItem";
import { NameValueRow } from "@/components/config/NameValueRow";
import { PlaygroundHeader } from "@/components/playground/PlaygroundHeader";
import {
  PlaygroundTab,
  PlaygroundTabbedTile,
  PlaygroundTile,
} from "@/components/playground/PlaygroundTile";
import { AgentMultibandAudioVisualizer } from "@/components/visualization/AgentMultibandAudioVisualizer";
import { useMultibandTrackVolume } from "@/hooks/useTrackVolume";
import { AgentState } from "@/lib/types";
import {
  VideoTrack,
  useChat,
  useConnectionState,
  useDataChannel,
  useLocalParticipant,
  useParticipantInfo,
  useRemoteParticipant,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";
import {
  ConnectionState,
  LocalParticipant,
  RoomEvent,
  Track,
} from "livekit-client";
import { QRCodeSVG } from "qrcode.react";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {SystemMessageTile} from "@/components/systemMessage/SystemMessageTile";
import {AgentBaseInfo, AgentConfig, AgentProfileConfig, ModelConfig, useAgentConfig} from "@/hooks/useAgentConfig";
import {AgentConfigTile} from "@/components/agentConfig/agentConfigTile";

export enum PlaygroundOutputs {
  Video,
  Audio,
  Chat,
}

export interface PlaygroundMeta {
  name: string;
  value: string;
}

export interface PlaygroundProps {
  logo?: ReactNode;
  title?: string;
  githubLink?: string;
  description?: ReactNode;
  themeColors: string[];
  defaultColor: string;
  outputs?: PlaygroundOutputs[];
  showQR?: boolean;
  onConnect: (connect: boolean, opts?: { token: string; url: string }) => void;
  metadata?: PlaygroundMeta[];
  videoFit?: "contain" | "cover";
}

const headerHeight = 56;

const defaultModelConfig: ModelConfig = {
  modelType: "gpt-4-turbo",
  dialogRound: 5,
  temperature: 0.8,
  outputLimit: 200,
  topP: 0.9,
};

const defaultAgentBaseInfo: AgentBaseInfo = {
  agentId: "unknown_agent",
  agentName: "Unknown Agent",
}

const defaultAgentProfileConfig: AgentProfileConfig = {
  systemMessage: "",
  systemMessageLimit: 1000,
};

const defaultAgentConfig: AgentConfig = {
  ...defaultModelConfig,
  ...defaultAgentBaseInfo,
  ...defaultAgentProfileConfig,
};

export default function Playground({
  logo,
  title,
  githubLink,
  description,
  outputs,
  showQR,
  themeColors,
  defaultColor,
  onConnect,
  metadata,
  videoFit,
}: PlaygroundProps) {
  const [agentState, setAgentState] = useState<AgentState>("offline");
  const [themeColor, setThemeColor] = useState(defaultColor);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [transcripts, setTranscripts] = useState<ChatMessageType[]>([]);
  const [localAgentConfig, setLocalAgentConfig] = useState<AgentConfig>(defaultAgentConfig);

  const {localParticipant} = useLocalParticipant();

  const participants = useRemoteParticipants({
    updateOnlyOn: [RoomEvent.ParticipantMetadataChanged],
  });
  const agentParticipant = participants.find((p) => p.isAgent);

  const {send: sendChat, chatMessages} = useChat();

  const {sendAgentConfig, agentConfig, agentConfigServiceMessages} = useAgentConfig();

  const visualizerState = useMemo(() => {
    if (agentState === "thinking") {
      return "thinking";
    } else if (agentState === "speaking") {
      return "talking";
    }
    return "idle";
  }, [agentState]);

  const roomState = useConnectionState();
  const tracks = useTracks();

  const agentAudioTrack = tracks.find(
    (trackRef) =>
      trackRef.publication.kind === Track.Kind.Audio &&
      trackRef.participant.isAgent
  );

  const agentVideoTrack = tracks.find(
    (trackRef) =>
      trackRef.publication.kind === Track.Kind.Video &&
      trackRef.participant.isAgent
  );

  const subscribedVolumes = useMultibandTrackVolume(
    agentAudioTrack?.publication.track,
    5
  );

  const localTracks = tracks.filter(
    ({participant}) => participant instanceof LocalParticipant
  );
  const localVideoTrack = localTracks.find(
    ({source}) => source === Track.Source.Camera
  );
  const localMicTrack = localTracks.find(
    ({source}) => source === Track.Source.Microphone
  );

  const localMultibandVolume = useMultibandTrackVolume(
    localMicTrack?.publication.track,
    20
  );

  useEffect(() => {
    if (!agentParticipant) {
      setAgentState("offline");
      return;
    }
    let agentMd: any = {};
    if (agentParticipant.metadata) {
      agentMd = JSON.parse(agentParticipant.metadata);
    }
    if (agentMd.agent_state) {
      setAgentState(agentMd.agent_state);
    } else {
      setAgentState("starting");
    }
  }, [agentParticipant, agentParticipant?.metadata]);

  useEffect(() => {
    setLocalAgentConfig(agentConfig || defaultAgentConfig);
  }, [agentConfig]);

  const isAgentConnected = ["offline", "starting"].indexOf(agentState) === -1;

  const onDataReceived = useCallback(
    (msg: any) => {
      if (msg.topic === "transcription") {
        const transDecoded = JSON.parse(
          new TextDecoder("utf-8").decode(msg.payload)
        );
        let transTimestamp = new Date().getTime();
        if ("timestamp" in transDecoded && transDecoded.timestamp > 0) {
          transTimestamp = transDecoded.timestamp;
        }
        setTranscripts([
          ...transcripts,
          {
            name: "You",
            message: transDecoded.text,
            timestamp: transTimestamp,
            isSelf: true,
          },
        ]);
      }
    },
    [transcripts]
  );

  // combine transcripts and chat together
  useEffect(() => {
    const allMessages = [...transcripts];
    for (const msg of chatMessages) {
      const isAgent = msg.from?.identity === agentParticipant?.identity;
      const isSelf = msg.from?.identity === localParticipant?.identity;
      let name = msg.from?.name;
      if (!name) {
        if (isAgent) {
          name = "Agent";
        } else if (isSelf) {
          name = "You";
        } else {
          name = "Unknown";
        }
      }
      allMessages.push({
        name,
        message: msg.message,
        timestamp: msg?.timestamp,
        isSelf: isSelf,
      });
    }

    for (const msg of agentConfigServiceMessages) {
      allMessages.push({
        name: "Configuration",
        message: msg.message,
        timestamp: msg.timestamp,
        isSelf: false,
      });
    }

    allMessages.sort((a, b) => a.timestamp - b.timestamp);
    setMessages(allMessages);
  }, [transcripts, chatMessages, agentConfigServiceMessages, localParticipant, agentParticipant]);

  useDataChannel(onDataReceived);

  const videoTileContent = useMemo(() => {
    const videoFitClassName = `object-${videoFit}`;
    return (
      <div className="flex flex-col w-full grow text-gray-950 bg-black rounded-sm border border-gray-800 relative">
        {agentVideoTrack ? (
          <VideoTrack
            trackRef={agentVideoTrack}
            className={`absolute top-1/2 -translate-y-1/2 ${videoFitClassName} object-position-center w-full h-full`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-gray-700 text-center h-full w-full">
            <LoadingSVG/>
            Waiting for video track
          </div>
        )}
      </div>
    );
  }, [agentVideoTrack, videoFit]);

  const audioTileContent = useMemo(() => {
    return (
      <div className="flex items-center justify-center w-full">
        {agentAudioTrack ? (
          <AgentMultibandAudioVisualizer
            state={agentState}
            barWidth={30}
            minBarHeight={30}
            maxBarHeight={150}
            accentColor={themeColor}
            accentShade={500}
            frequencies={subscribedVolumes}
            borderRadius={12}
            gap={16}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-700 text-center w-full">
            <LoadingSVG/>
            Waiting for audio track
          </div>
        )}
      </div>
    );
  }, [agentAudioTrack, subscribedVolumes, themeColor, agentState]);

  const chatTileContent = useMemo(() => {
    return (
      <ChatTile
        messages={messages}
        accentColor={themeColor}
        onSend={sendChat}
      />
    );
  }, [messages, themeColor, sendChat]);

  const systemMessageTileContent = useMemo(() => {
    return (
      <SystemMessageTile
        disabled={!isAgentConnected}
        agentConfig={localAgentConfig}
        accentColor={themeColor}
        saveAgentConfig={sendAgentConfig}
      />
    );
  }, [isAgentConnected, localAgentConfig, themeColor, sendAgentConfig]);

  const agentConfigTileContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4 h-full w-full items-start overflow-y-auto">
        <AgentConfigTile
          disabled={!isAgentConnected}
          agentConfig={localAgentConfig}
          themeColor={themeColor}
          saveAgentConfig={sendAgentConfig}
        />
      </div>
    );
  }, [isAgentConnected, localAgentConfig, themeColor, sendAgentConfig]);

  const settingsTileContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4 h-full w-full items-start overflow-y-auto">
        {description && (
          <ConfigurationPanelItem title="Description">
            {description}
          </ConfigurationPanelItem>
        )}

        <ConfigurationPanelItem title="Settings">
          <div className="flex flex-col gap-2">
            {metadata?.map((data, index) => (
              <NameValueRow
                key={data.name + index}
                name={data.name}
                value={data.value}
              />
            ))}
          </div>
        </ConfigurationPanelItem>
        <ConfigurationPanelItem title="Status">
          <div className="flex flex-col gap-2">
            <NameValueRow
              name="Room connected"
              value={
                roomState === ConnectionState.Connecting ? (
                  <LoadingSVG diameter={16} strokeWidth={2}/>
                ) : (
                  roomState
                )
              }
              valueColor={
                roomState === ConnectionState.Connected
                  ? `${themeColor}-500`
                  : "gray-500"
              }
            />
            <NameValueRow
              name="Agent connected"
              value={
                isAgentConnected ? (
                  "true"
                ) : roomState === ConnectionState.Connected ? (
                  <LoadingSVG diameter={12} strokeWidth={2}/>
                ) : (
                  "false"
                )
              }
              valueColor={isAgentConnected ? `${themeColor}-500` : "gray-500"}
            />
            <NameValueRow
              name="Agent ID"
              value={
                isAgentConnected ? (
                  localAgentConfig.agentId
                ) : roomState === ConnectionState.Connected ? (
                  <LoadingSVG diameter={12} strokeWidth={2}/>
                ) : (
                  "offline"
                )
              }
              valueColor={isAgentConnected ? `${themeColor}-500` : "gray-500"}
            />
            <NameValueRow
              name="Agent name"
              value={
                isAgentConnected ? (
                  localAgentConfig.agentName
                ) : roomState === ConnectionState.Connected ? (
                  <LoadingSVG diameter={12} strokeWidth={2}/>
                ) : (
                  "offline"
                )
              }
              valueColor={isAgentConnected ? `${themeColor}-500` : "gray-500"}
            />
            <NameValueRow
              name="Agent status"
              value={
                agentState !== "offline" && agentState !== "speaking" ? (
                  <div className="flex gap-2 items-center">
                    <LoadingSVG diameter={12} strokeWidth={2}/>
                    {agentState}
                  </div>
                ) : (
                  agentState
                )
              }
              valueColor={
                agentState === "speaking" ? `${themeColor}-500` : "gray-500"
              }
            />
          </div>
        </ConfigurationPanelItem>
        {localVideoTrack && (
          <ConfigurationPanelItem
            title="Camera"
            deviceSelectorKind="videoinput"
          >
            <div className="relative">
              <VideoTrack
                className="rounded-sm border border-gray-800 opacity-70 w-full"
                trackRef={localVideoTrack}
              />
            </div>
          </ConfigurationPanelItem>
        )}
        {localMicTrack && (
          <ConfigurationPanelItem
            title="Microphone"
            deviceSelectorKind="audioinput"
          >
            <AudioInputTile frequencies={localMultibandVolume}/>
          </ConfigurationPanelItem>
        )}
        <div className="w-full">
          <ConfigurationPanelItem title="Color">
            <ColorPicker
              colors={themeColors}
              selectedColor={themeColor}
              onSelect={(color) => {
                setThemeColor(color);
              }}
            />
          </ConfigurationPanelItem>
        </div>
        {showQR && (
          <div className="w-full">
            <ConfigurationPanelItem title="QR Code">
              <QRCodeSVG value={window.location.href} width="128"/>
            </ConfigurationPanelItem>
          </div>
        )}
      </div>
    );
  }, [
    localAgentConfig,
    agentState,
    description,
    isAgentConnected,
    localMicTrack,
    localMultibandVolume,
    localVideoTrack,
    metadata,
    roomState,
    themeColor,
    themeColors,
    showQR,
  ]);

  let mobileTabs: PlaygroundTab[] = [];

  mobileTabs.push({
    title: "Configuration",
    content: (
      <PlaygroundTile
        padding={false}
        className="h-full w-full basis-1/4 items-start overflow-y-auto flex"
        childrenClassName="h-full grow items-start"
      >
        {agentConfigTileContent}
      </PlaygroundTile>
    ),
  });

  mobileTabs.push({
    title: "Profile & Prompt",
    content: (
      <PlaygroundTile
        className="w-full h-full grow"
        childrenClassName="justify-center"
      >
        {systemMessageTileContent}
      </PlaygroundTile>
    ),
  });

  if (outputs?.includes(PlaygroundOutputs.Video)) {
    mobileTabs.push({
      title: "Video",
      content: (
        <PlaygroundTile
          className="w-full h-full grow"
          childrenClassName="justify-center"
        >
          {videoTileContent}
        </PlaygroundTile>
      ),
    });
  }

  if (outputs?.includes(PlaygroundOutputs.Audio)) {
    mobileTabs.push({
      title: "Audio",
      content: (
        <PlaygroundTile
          className="w-full h-full grow"
          childrenClassName="justify-center"
        >
          {audioTileContent}
        </PlaygroundTile>
      ),
    });
  }

  if (outputs?.includes(PlaygroundOutputs.Chat)) {
    mobileTabs.push({
      title: "Chat",
      content: chatTileContent,
    });
  }

  mobileTabs.push({
    title: "Settings",
    content: (
      <PlaygroundTile
        padding={false}
        backgroundColor="gray-950"
        className="h-full w-full basis-1/4 items-start overflow-y-auto flex"
        childrenClassName="h-full grow items-start"
      >
        {settingsTileContent}
      </PlaygroundTile>
    ),
  });

  return (
    <>
      <PlaygroundHeader
        title={title}
        logo={logo}
        githubLink={githubLink}
        height={headerHeight}
        accentColor={themeColor}
        connectionState={roomState}
        onConnectClicked={() =>
          onConnect(roomState === ConnectionState.Disconnected)
        }
      />
      <div
        className={`flex gap-4 py-4 grow w-full selection:bg-${themeColor}-900`}
        style={{height: `calc(100% - ${headerHeight}px)`}}
      >
        <div className="flex flex-col grow basis-1/2 gap-4 h-full lg:hidden">
          <PlaygroundTabbedTile
            className="h-full"
            tabs={mobileTabs}
            initialTab={mobileTabs.length - 1}
          />
        </div>

        <PlaygroundTile
          title="Configuration"
          padding={false}
          className="flex-col h-full w-full basis-1/6 overflow-y-auto hidden max-w-[480px] lg:flex"
          childrenClassName="h-full grow items-start"
        >
          {agentConfigTileContent}
        </PlaygroundTile>

        <div className="flex-col w-full grow basis-1/3 gap-2 h-full hidden lg:flex">
          <PlaygroundTile
            title="Profile & Prompt"
            className="w-full h-full grow"
            childrenClassName="justify-center"
          >
            {systemMessageTileContent}
          </PlaygroundTile>
        </div>

        <div
          className={`flex-col grow basis-1/3 gap-2 h-full hidden lg:${
            !outputs?.includes(PlaygroundOutputs.Audio) &&
            !outputs?.includes(PlaygroundOutputs.Video) &&
            !outputs?.includes(PlaygroundOutputs.Chat)
              ? "hidden"
              : "flex"
          }`}
        >
          {outputs?.includes(PlaygroundOutputs.Video) && (
            <PlaygroundTile
              title="Video"
              className="w-full grow min-h-80"
              childrenClassName="justify-center"
            >
              {videoTileContent}
            </PlaygroundTile>
          )}

          {outputs?.includes(PlaygroundOutputs.Audio) && (
            <PlaygroundTile
              title="Audio"
              className="w-full grow min-h-52"
              childrenClassName="justify-center"
            >
              {audioTileContent}
            </PlaygroundTile>
          )}

          {outputs?.includes(PlaygroundOutputs.Chat) && (
            <PlaygroundTile
              title="Chat"
              className="w-full h-full overflow-y-auto"
            >
              {chatTileContent}
            </PlaygroundTile>
          )}
        </div>

        <PlaygroundTile
          padding={false}
          backgroundColor="gray-950"
          className="h-full w-full basis-1/6 items-start overflow-y-auto hidden max-w-[480px] lg:flex"
          childrenClassName="h-full grow items-start"
        >
          {settingsTileContent}
        </PlaygroundTile>
      </div>
    </>
  );
}
