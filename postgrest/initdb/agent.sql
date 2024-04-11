CREATE TABLE agent (
    agent_id VARCHAR(36) PRIMARY KEY NOT NULL,
    agent_name VARCHAR NOT NULL,
    system_message TEXT,
    system_message_limit INT DEFAULT 500,
    model_platform VARCHAR(50) NOT NULL DEFAULT 'OpenAI',
    model_type VARCHAR(50) NOT NULL DEFAULT 'gpt-4',
    model_config TEXT NOT NULL DEFAULT '{}',
    memory TEXT,
    memory_limit INT DEFAULT 5,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO agent (agent_id, agent_name) VALUES ('d116449784ce732b', 'Warda');
