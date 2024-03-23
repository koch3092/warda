# Copyright 2023 LiveKit, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import io

from typing import Optional

from livekit import rtc, plugins as livekit_plugins
import openai
from livekit.agents import tts
from livekit.plugins.openai import TTSModels, TTSVoices
from pydub import AudioSegment


class TTS(livekit_plugins.openai.TTS):
    def __init__(self, api_key: Optional[str] = None) -> None:
        super().__init__(api_key)
        api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY must be set")

        self._client = openai.AsyncOpenAI(api_key=api_key)

    async def synthesize(
        self, text: str, model: TTSModels = "tts-1", voice: TTSVoices = "shimmer"
    ) -> tts.SynthesizedAudio:
        speech_res = await self._client.audio.speech.create(
            model=model,
            voice=voice,
            response_format="mp3",
            input=text,
        )

        data = await speech_res.aread()
        tensor = AudioSegment.from_mp3(io.BytesIO(data))

        sample_rate = tensor.frame_rate
        num_channels = tensor.channels
        samples_per_channel = len(tensor.raw_data) // 2

        frame = rtc.AudioFrame(
            data=tensor.raw_data,
            sample_rate=sample_rate,
            num_channels=num_channels,
            samples_per_channel=samples_per_channel,
        )

        return tts.SynthesizedAudio(text=text, data=frame)
