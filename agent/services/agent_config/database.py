from typing import Optional

from postgrest import APIResponse

from plugins.postgrest import postgrest_client
from services.agent_config.model import AgentConfigTable, AgentConfigPayload

_TABLE = "agent"


async def get_agent_config(agent_id: Optional[str] = None, agent_name: Optional[str] = None) -> AgentConfigPayload:
    if not agent_id and not agent_name:
        raise ValueError("Either agent_id or agent_name must be provided")

    result = {}

    if agent_id:
        r: APIResponse = await postgrest_client.from_(_TABLE).select("*").eq("agent_id", agent_id).execute()
        result = r.data[0] if r.data else {}
    elif agent_name:
        r: APIResponse = await postgrest_client.from_(_TABLE).select("*").eq("agent_name", agent_name).execute()
        result = r.data[0] if r.data else {}

    agent_config_table: AgentConfigTable = AgentConfigTable.model_validate(result)
    return AgentConfigPayload.model_validate_table(agent_config_table)


async def update_agent_config(agent_id: str, agent_config_payload: AgentConfigPayload) -> AgentConfigPayload:
    old_agent_config_payload: AgentConfigPayload = await get_agent_config(agent_id=agent_id)
    data_dict: dict = agent_config_payload.model_dump(exclude_unset=True, exclude_none=True)
    updated_agent_config_payload: AgentConfigPayload = old_agent_config_payload.copy(update=data_dict)

    agent_config_table: AgentConfigTable = AgentConfigTable.model_validate_payload(updated_agent_config_payload)
    data = agent_config_table.model_dump(by_alias=True, exclude_unset=True, exclude_none=True)

    r: APIResponse = await postgrest_client.from_(_TABLE).update(data).eq("agent_id", agent_id).execute()
    result = r.data[0] if r.data else {}

    agent_config_table: AgentConfigTable = AgentConfigTable.model_validate(result)
    return AgentConfigPayload.model_validate_table(agent_config_table)
