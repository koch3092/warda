from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from utils.utils import generate_random_base62


class ModelConfig(BaseModel):
    temperature: Optional[float] = 1
    max_tokens: Optional[int] = 16
    top_p: Optional[float] = 1


class AgentConfigTable(BaseModel):
    agent_id: str
    agent_name: str
    system_message: Optional[str]
    system_message_limit: Optional[int] = 4000
    llm_model_platform: Optional[str] = Field("OpenAI", alias="model_platform")
    llm_model: Optional[str] = Field(None, alias="model_type")
    llm_model_config: Optional[str] = Field("{}", alias="model_config")
    memory: Optional[str] = ""
    memory_limit: Optional[int] = 5
    created_at: Optional[datetime] = datetime.now()
    updated_at: Optional[datetime] = datetime.now()

    @classmethod
    def model_validate_payload(cls, agent_config_payload: "AgentConfigPayload") -> "AgentConfigTable":
        model_config: ModelConfig = ModelConfig(
            temperature=agent_config_payload.temperature,
            max_tokens=agent_config_payload.max_tokens,
            top_p=agent_config_payload.top_p,
        )

        # If the attribute is configured with alias, the alias must be used for assignment.
        agent_config_table = cls(
            agent_id=agent_config_payload.agent_id,
            agent_name=agent_config_payload.agent_name,
            system_message=agent_config_payload.system_message,
            system_message_limit=agent_config_payload.system_message_limit,
            model_type=agent_config_payload.model,
            model_config=model_config.model_dump_json(),
            memory_limit=agent_config_payload.memory_limit,
        )
        return agent_config_table


class AgentConfigPayload(BaseModel):
    agent_id: str = Field(default_factory=generate_random_base62, alias="agentId")
    agent_name: str = Field(default_factory=generate_random_base62, alias="agentName")
    system_message: Optional[str] = Field(None, alias="systemMessage")
    system_message_limit: Optional[int] = Field(500, alias="systemMessageLimit")
    model: Optional[str] = Field(None, alias="modelType")
    memory_limit: Optional[int] = Field(None, alias="dialogRound")
    temperature: Optional[float] = Field(1)
    max_tokens: Optional[int] = Field(200, alias="outputLimit")
    top_p: Optional[float] = Field(1, alias="topP")

    @classmethod
    def model_validate_table(cls, agent_config_table: AgentConfigTable) -> "AgentConfigPayload":
        model_config: ModelConfig = ModelConfig.model_validate_json(agent_config_table.llm_model_config)
        # If the attribute is configured with alias, the alias must be used for assignment.
        agent_config_payload = cls(
            agentId=agent_config_table.agent_id,
            agentName=agent_config_table.agent_name,
            systemMessage=agent_config_table.system_message,
            systemMessageLimit=agent_config_table.system_message_limit,
            modelType=agent_config_table.llm_model,
            dialogRound=agent_config_table.memory_limit,
            temperature=model_config.temperature,
            outputLimit=model_config.max_tokens,
            topP=model_config.top_p,
        )
        return agent_config_payload
