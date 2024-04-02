import json
import logging
from abc import ABC
from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal, List, Optional, Dict, Any, cast

from livekit import agents
from livekit.rtc import Room, DataPacket, Participant, DataPacketKind, LocalParticipant
from pydantic import BaseModel

from plugins.camel import SimpleAgent
from .service_topic import service_topic
from core import EventEmitter
from utils.utils import generate_random_base62


_CHAT_TOPIC = "lk-chat-topic"
_CHAT_UPDATE_TOPIC = "lk-chat-update-topic"

EventTypes = Literal["service_received", "service_attached"]


class Service(ABC, EventEmitter[EventTypes]):
    def __init__(self, topic: service_topic = None):
        super().__init__()
        if not topic:
            raise ValueError("topic is required for Service")
        self._topic = topic
        self._ctx: Optional[agents.JobContext] = None
        self._lp: Optional[LocalParticipant] = None
        self._room: Optional[Room] = None
        self._chat_agent: Optional[SimpleAgent] = None

        ServiceManager.register_service(self)

        self.on("service_received", self.service_received)

    def close(self):
        self.off("service_received", self.service_received)

    @property
    def topic(self):
        return self._topic

    def attach(self, ctx: agents.JobContext, room: Room, chat_agent: SimpleAgent):
        self._ctx = ctx
        self._room = room
        self._lp = room.local_participant
        self._chat_agent = chat_agent

        self.emit("service_attached")

    def service_received(self, msg: "ServiceMessage"):
        raise NotImplementedError("service_received not implemented")

    async def send_message(self, message: str) -> "ServiceMessage":
        msg = ServiceMessage(
            message=message,
            is_local=True,
            participant=self._lp,
        )
        await self._lp.publish_data(payload=json.dumps(msg.asjsondict()), topic=self._topic)
        return msg


class ServiceManager:
    registered_services: List[Service] = []

    def __init__(self, ctx: agents.JobContext, room: Room, chat_agent: SimpleAgent):
        self._ctx = ctx
        self._room = room
        self._lp = self._room.local_participant
        self._chat_agent = chat_agent

        self._room.on("data_received", self._on_data_received)

    @classmethod
    def register_service(cls, service: Service):
        cls.registered_services.append(service)

    def close(self):
        self._room.off("data_received", self._on_data_received)

    def fetch_service(self, topic: service_topic) -> Any:
        for service in self.registered_services:
            if service.topic == topic:
                service.attach(self._ctx, self._room, self._chat_agent)
                return service

    def _on_data_received(self, dp: DataPacket):
        if dp.topic in (_CHAT_TOPIC, _CHAT_UPDATE_TOPIC):
            return

        asserted_topic = cast(service_topic, dp.topic)
        service = self.fetch_service(asserted_topic)

        if not service:
            raise Exception(f"Service not found for topic {dp.topic}")

        try:
            parsed = json.loads(dp.data)
            msg = ServiceMessage.from_jsondict(parsed)
            if dp.participant:
                msg.participant = dp.participant
            service.emit("service_received", msg)
        except Exception as e:
            logging.warning("failed to parse service message: %s", e, exc_info=e)


class ServiceMessagePayload(BaseModel):
    pass


@dataclass
class ServiceMessage:
    message: Optional[str] = None
    id: str = field(default_factory=generate_random_base62)
    timestamp: datetime = field(default_factory=datetime.now)

    # These fields are not part of the wire protocol. They are here to provide
    # context for the application.
    participant: Optional[Participant] = None
    is_local: bool = field(default=False)

    @classmethod
    def from_jsondict(cls, d: Dict[str, Any]) -> "ServiceMessage":
        # older version of the protocol didn't contain a message ID, so we'll create one
        id = d.get("id") or generate_random_base62()
        timestamp = datetime.now()
        if d.get("timestamp"):
            timestamp = datetime.fromtimestamp(d.get("timestamp", 0) / 1000.0)

        msg = cls(
            id=id,
            timestamp=timestamp,
            message=d.get("message"),
        )
        msg.update_from_jsondict(d)
        return msg

    def update_from_jsondict(self, d: Dict[str, Any]) -> None:
        self.message = d.get("message")

    def asjsondict(self):
        """Returns a JSON serializable dictionary representation of the message."""
        d = {
            "id": self.id,
            "message": self.message,
            "timestamp": int(self.timestamp.timestamp() * 1000),
        }
        return d

