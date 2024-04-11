from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    AGENT_ID: str
    AGENT_NAME: str

    LIVEKIT_URL: str
    LIVEKIT_API_KEY: str
    LIVEKIT_API_SECRET: str
    OPENAI_API_KEY: str

    POSTGREST_URL: str = "http://localhost:3030"

    model_config = SettingsConfigDict(
        # `.env.prod` takes priority over `.env`
        env_file=('.env', '.env.prod'),
        env_file_encoding='utf-8'
    )


settings = Settings()
