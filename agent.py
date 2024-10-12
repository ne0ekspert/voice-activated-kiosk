from langchain_openai import ChatOpenAI
from langchain.agents import initialize_agent, AgentType
from langchain.schema import SystemMessage, AIMessage
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from tools import tools

system_message = SystemMessage(
    content=open('prompts/context.txt', 'r').read(),
)
welcome_message = AIMessage(
    content=open('prompts/welcome.txt', 'r').read()
)

store: dict[str, InMemoryChatMessageHistory] = {}
def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
        store[session_id].add_message(system_message)
        store[session_id].add_message(welcome_message)
    elif store[session_id].messages[0] != system_message:
        store[session_id] = InMemoryChatMessageHistory()
        store[session_id].add_message(system_message)
        store[session_id].add_message(welcome_message)

    return store[session_id]

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.4)
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
)
conversation = RunnableWithMessageHistory(
    agent,
    get_session_history
)