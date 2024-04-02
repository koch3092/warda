import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Literal, Dict, Any

from livekit.rtc import DataPacketKind, DataPacket, Room, Participant
from pydantic import BaseModel, ConfigDict, Field

from utils.utils import generate_random_base62
from core.event_emitter import EventEmitter

_AGENT_CONFIG_TOPIC = "agent-config-topic"

EventTypes = Literal["agent_config_received",]


class AgentConfig(BaseModel):
    agent_name: str = Field(default_factory=generate_random_base62)
    system_message: Optional[str] = Field(None, alias="systemMessage")
    max_tokens: Optional[int] = Field(None, alias="maxTokens")
    model: Optional[str] = Field(None, alias="modelType")
    max_memories: Optional[int] = Field(None, alias="dialogRound")
    temperature: Optional[float] = Field(None)
    output_limit: Optional[int] = Field(None, alias="outputLimit")
    timestamp: Optional[int] = None


class AgentConfigMessage(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    message: Optional[AgentConfig] = None
    id: str = Field(default_factory=generate_random_base62)
    timestamp: datetime = datetime.now()
    participant: Optional[Participant] = None


class AgentConfigurationManager(EventEmitter[EventTypes]):
    def __init__(self, room: Room):
        super().__init__()
        self._lp = room.local_participant
        self._room = room

        room.on("data_received", self._on_data_received)

    async def send_config(self, agent_config: AgentConfig) -> "AgentConfigMessage":
        msg = AgentConfigMessage(
            agent_config=agent_config,
            participant=self._lp,
        )
        await self._lp.publish_data(
            payload=msg.model_dump_json(),
            kind=DataPacketKind.KIND_RELIABLE,
            topic=_AGENT_CONFIG_TOPIC,
        )
        return msg

    def _on_data_received(self, dp: DataPacket):
        if dp.topic == _AGENT_CONFIG_TOPIC:
            try:
                logging.info("Received data: %s", dp.data)
                parsed = json.loads(dp.data)
                msg = AgentConfigMessage.from_jsondict(parsed)
                if dp.participant:
                    msg.participant = dp.participant
                self.emit("agent_config_received", msg)
            except Exception as e:
                logging.warning("failed to parse chat message: %s", e, exc_info=e)


@dataclass
class AgentConfigMessage:
    message: Optional[AgentConfig] = None
    id: str = field(default_factory=generate_random_base62)
    timestamp: datetime = field(default_factory=datetime.now)

    # These fields are not part of the wire protocol. They are here to provide
    # context for the application.
    participant: Optional[Participant] = None
    is_local: bool = field(default=False)

    @classmethod
    def from_jsondict(cls, d: Dict[str, Any]) -> "AgentConfigMessage":
        # older version of the protocol didn't contain a message ID, so we'll create one
        msg_id = d.get("id") or generate_random_base62()
        timestamp = datetime.now()
        message = AgentConfig.model_validate_json(d.get("message"))

        if d.get("timestamp"):
            timestamp = datetime.fromtimestamp(d.get("timestamp", 0) / 1000.0)
        elif message and message.timestamp:
            timestamp = datetime.fromtimestamp(message.timestamp / 1000.0)

        msg = cls(
            id=msg_id,
            timestamp=timestamp,
            message=message,
        )

        return msg

    def asjsondict(self):
        """Returns a JSON serializable dictionary representation of the message."""
        d = {
            "id": self.id,
            "message": self.message.model_dump(),
            "timestamp": int(self.timestamp.timestamp() * 1000),
        }
        return d
