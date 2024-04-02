from .service import Service
from .agent_config.service import AgentService

__all__ = [
    "AgentService",
]

import sys
current_module = sys.modules[__name__]

for _module_name in __all__:
    _module_class = getattr(current_module, _module_name)
    if _module_class and issubclass(_module_class, Service):
        _module_class()
