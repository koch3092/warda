# Warda
**Warda** is a chatbot example project that includes two parts: **Agent** and **Playground**.

**Agent** is built base on **[CAMEL-AI](https://www.camel-ai.org/)**, **Livekit [Server](https://livekit.io/)** & 
**[Agents](https://livekit.io/product/agents)**, and **OpenAI TTS**.

**Playground** is based on **Livekit [agents-playground](https://github.com/livekit/agents-playground)** and can be used for debugging **Warda**.

<picture>
  <img style="width:100%;" alt="Warda Playground." src="https://raw.githubusercontent.com/koch3092/warda/main/.github/warda-playground.png">
</picture>

## Clone the Repo
```bash
git clone https://github.com/koch3092/warda.git
```
## Running Agent
**Working Directory**: `agent`

The capabilities of **Agent** are based on [livekit/agents](https://github.com/livekit/agents). Below are some 
**Concepts** from the official documentation, for more detailed instructions, refer to the official repository.

>**Agent**: A function that defines the workflow of a programmable, server-side participant. This is your application code.
>
>**Worker**: A container process responsible for managing job queuing with LiveKit server. Each worker is capable of running multiple agents simultaneously.
>
>**Plugin**: A library class that performs a specific task, like speech-to-text, from a specific provider. An agent can compose multiple plugins together to perform more complex tasks.

### Install Dependencies
**Warda** uses [Poetry](https://python-poetry.org/) for dependency management. Run the following command to install dependencies:
```bash
poetry install
```
### Configure Environment Variables
Configure the following variables in the `.env` file or as environment variables:
```dotenv
LIVEKIT_URL=wss://<your server URL>
LIVEKIT_API_KEY=<your API KEY>
LIVEKIT_API_SECRET=<your API Secret>
OPENAI_API_KEY=<your OpenAI API Key>
```
### Running Worker
```bash
python main.py start
```
Once successfully running, when a user connects to a **Livekit Room** in the **Playground**, **Agent** will also join the room.

## Running Playground
**Working Directory**: `playground`

### Install Dependencies
```bash
npm install
```
### Configure Environment Variables
Configure the following variables in the `.env` file or as environment variables:

```dotenv
LIVEKIT_API_KEY=<your API KEY>
LIVEKIT_API_SECRET=<your API Secret>
NEXT_PUBLIC_LIVEKIT_URL=wss://<your server URL>
```
Running in Development Environment
```bash
npm run dev
```
Open `http://localhost:3000` in a browser to start debugging **Warda**.

## Notes
In **Playground**, make sure the **Agent** is already running before clicking the **Connect** button to enter the room.
