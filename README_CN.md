# Warda
**Warda**是一个聊天机器人示例项目，包含**Agent**和**Playground**两部分。

 - **Agent** 集成了  [CAMEL-AI](https://www.camel-ai.org/)、Livekit [Server](https://livekit.io/) & [Agents](https://livekit.io/product/agents) 和 OpenAI TTS 等技术。

 - **Playground** 基于 Livekit [agents-playground](https://github.com/livekit/agents-playground)，可以用于调试 Warda。

<picture>
  <img style="width:100%;" alt="Warda Playground." src="https://raw.githubusercontent.com/koch3092/warda/main/.github/warda-playground.png">
</picture>

## 克隆仓库
```bash
git clone https://github.com/koch3092/warda.git
```

## 运行 PostgREST
**工作目录**：`postgrest`

Warda 的持久化数据存储使用`PostgreSQL`，通过[PostgREST](https://postgrest.org/en/v12/)提供API接口。

使用`docker compose`来运行`PostgREST`服务：
```bash
docker compose up -d
```
部署后的`PostgREST`地址为：`http://localhost:3030`。

部署完成后，可以通过`http://localhost:8080`访问`swagger-ui`来查看API接口。

## 运行 Agent
**工作目录**：`agent`

Agent 的能力基于 [livekit/agents](https://github.com/livekit/agents)，以下为官方的一些概念，详细的文档说明可以参考官方仓库。

> **Agent**: A function that defines the workflow of a programmable, server-side participant. This is your application code.
>
> **Worker**: A container process responsible for managing job queuing with LiveKit server. Each worker is capable of running multiple agents simultaneously.
> 
> **Plugin**: A library class that performs a specific task, like speech-to-text, from a specific provider. An agent can compose multiple plugins together to perform more complex tasks.

### 安装依赖
Warda 使用[Poetry](https://python-poetry.org/)进行依赖管理。运行以下命令安装依赖：
```bash
poetry install
```
### 配置环境变量
在`.env`文件或环境变量中配置以下变量：
```dotenv
LIVEKIT_URL=wss://<your server URL>
LIVEKIT_API_KEY=<your API KEY>
LIVEKIT_API_SECRET=<your API Secret>
OPENAI_API_KEY=<your OpenAI API Key>
```
### 运行 Worker
```bash
python main.py start
```
运行成功后，当 Playground 的用户连接到 Livekit 房间，Agent 也会加入到房间中。

## 运行 Playground
**工作目录**：`playground`

### 安装依赖
```bash
npm install
```
### 配置环境变量
在`.env`文件或环境变量中配置以下变量：
```dotenv
LIVEKIT_API_KEY=<your API KEY>
LIVEKIT_API_SECRET=<your API Secret>
NEXT_PUBLIC_LIVEKIT_URL=wss://<your server URL>
```
### 运行开发环境
```bash
npm run dev
```

在浏览器中打开`http://localhost:3000`，即可开始调试 Warda。

## 注意事项
在**Playground**中，点击**Connect**按钮进入房间前，确保**Agent**已经启动。
