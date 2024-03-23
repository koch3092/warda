import asyncio
import json
import logging
import os
from enum import Enum
from typing import Optional

from livekit import rtc, agents

from config import settings
from plugins.camel import SimpleAgent
from plugins.openai import TTS

PROMPT = "You are a helpful assistant.Your name is Warda."

HELLO = "Hi! I am Warda~ I am here to assist you."


class AgentState(Enum):
    WAITING = "waiting"
    THINKING = "thinking"


class WardaAgent:
    @classmethod
    async def create(cls, ctx: agents.JobContext):
        agent = WardaAgent(ctx)
        await agent.start()

    def __init__(self, ctx: agents.JobContext):
        # plugins
        self.tts = TTS()

        self.ctx = ctx
        self.chat = rtc.ChatManager(ctx.room)
        self.chat_agent = SimpleAgent(prompt_content=PROMPT)
        self.prompt: Optional[str] = None
        self.line_out: Optional[rtc.AudioSource] = None

        def process_chat(msg: rtc.ChatMessage):
            self.prompt = msg.message
            logging.info("received chat message: %s", msg.message)

        self.chat.on("message_received", process_chat)

    async def start(self):
        # give a bit of time for the user to fully connect, so they don't miss
        # the welcome message
        await asyncio.sleep(1)

        self.ctx.create_task(self.chat_publish_worker())
        await self.publish_audio()

        self.ctx.create_task(self.send_audio_message(HELLO))

        self.ctx.create_task(self.chat.send_message(HELLO))

        self.update_agent_state(AgentState.WAITING.value)

    def update_agent_state(self, state: str):
        metadata = json.dumps({"agent_state": state})
        self.ctx.create_task(self.ctx.room.local_participant.update_metadata(metadata))

    async def publish_audio(self):
        self.line_out = rtc.AudioSource(24000, 1)
        track = rtc.LocalAudioTrack.create_audio_track("agent-mic", self.line_out)
        options = rtc.TrackPublishOptions()
        options.source = rtc.TrackSource.SOURCE_MICROPHONE
        await self.ctx.room.local_participant.publish_track(track, options)

    async def send_audio_message(self, message: str):
        audio = await self.tts.synthesize(message)
        await self.line_out.capture_frame(audio.data)

    async def chat_publish_worker(self):
        while True:
            prompt, self.prompt = self.prompt, None
            if prompt:
                self.update_agent_state(AgentState.THINKING.value)
                content = self.chat_agent.step(prompt)

                self.ctx.create_task(self.send_audio_message(content))
                self.ctx.create_task(self.chat.send_message(content))

                self.update_agent_state(AgentState.WAITING.value)

            await asyncio.sleep(0.05)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # pydantic_settings.BaseSettings will read from environment variables and .env file
    os.environ["LIVEKIT_URL"] = settings.LIVEKIT_URL
    os.environ["LIVEKIT_API_KEY"] = settings.LIVEKIT_API_KEY
    os.environ["LIVEKIT_API_SECRET"] = settings.LIVEKIT_API_SECRET
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY

    async def job_request_cb(job_request: agents.JobRequest):
        await job_request.accept(
            WardaAgent.create,
            identity="warda_agent",
            name="Warda",
            # disconnect when the last participant leaves
            auto_disconnect=agents.AutoDisconnect.DEFAULT,
        )

    worker = agents.Worker(request_handler=job_request_cb)

    agents.run_app(worker)
