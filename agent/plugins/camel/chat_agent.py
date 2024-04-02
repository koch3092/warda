from camel.agents import ChatAgent
from camel.messages import BaseMessage
from camel.prompts import PromptTemplateGenerator
from camel.types import TaskType


class SimpleAgent:
    def __init__(self, key: str = 'generate_users', num_roles: int = 50, model=None, system_message: str = ""):
        prompt_template = PromptTemplateGenerator().get_prompt_from_key(TaskType.AI_SOCIETY, key)
        self.prompt = prompt_template.format(num_roles=num_roles)

        self.model = model
        self.agent = None

        self.init_agent(system_message)

    def init_agent(self, system_message: str):
        assistant_sys_msg = BaseMessage.make_assistant_message(role_name="Assistant", content=system_message)
        self.agent = ChatAgent(assistant_sys_msg, model_type=self.model)
        self.agent.reset()

    def step(self, content: str) -> str:
        user_msg = BaseMessage.make_user_message(role_name="User", content=content)
        return self.agent.step(user_msg).msg.content
