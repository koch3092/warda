from postgrest import AsyncPostgrestClient

from config import settings

postgrest_client = AsyncPostgrestClient(settings.POSTGREST_URL)
