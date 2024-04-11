import logging

from .database import update_agent_config, get_agent_config
from ..service import ServiceMessage, Service, TypedQueue
from .model import AgentConfigPayload


class AgentService(Service):
    def __init__(self):
        super().__init__("agent-config-topic")
        self._queue: TypedQueue[AgentConfigPayload] = TypedQueue()

        self.on("service_attached", self.service_attached)

    def close(self):
        super().close()
        self.off("service_attached", self.service_attached)

    def service_attached(self):
        self._ctx.create_task(self.agent_config_worker())

    def service_received(self, msg: "ServiceMessage"):
        self._queue.put_nowait(msg.message)

    async def send_agent_config(self):
        agent_config: AgentConfigPayload = await get_agent_config(agent_name=self._lp.name)
        await self.send_message(agent_config.model_dump_json(by_alias=True))

    async def agent_config_worker(self):
        while True:
            msg_message: str = await self._queue.get()
            agent_config_req: AgentConfigPayload = AgentConfigPayload.model_validate_json(msg_message)
            try:
                # save the agent config and return the updated agent config.
                updated_agent_config = await update_agent_config(agent_config_req.agent_id, agent_config_req)

                if agent_config_req.system_message:
                    self._chat_agent.init_agent(agent_config_req.system_message)
                await self.send_message(updated_agent_config.model_dump_json(by_alias=True))
            except Exception as e:
                logging.error("Failed to process agent config: %s", e, exc_info=e)
            finally:
                self._queue.task_done()
