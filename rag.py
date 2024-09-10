import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.tools import tool
from langchain.agents import initialize_agent, AgentType
from langchain.schema import SystemMessage
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

load_dotenv()

cart = {}

@tool
def view_cart() -> str:
    """
    장바구니에 있는 항목들을 JSON 문자열로 출력합니다.
    
    Returns:
        str: JSON string containing key-value pairs of item names and quantities.
    """
    return json.dumps(cart)
    
@tool
def add_item(name: str, quantity=1):
    """
    장바구니에 항목을 추가합니다.

    Args:
        name (str): Name of the item to add.
        quantity (int, optional): Quantity of the item to add. Defaults to 1.

    Returns:
        str: Confirmation message indicating how many of the item were added.
    """

    if name not in map(lambda x: x['name'], products):
        return f"No such menu named as {name}"

    if name in cart:
        cart[name] += quantity
    else:
        cart[name] = quantity

    return f"{name} {quantity}개를 장바구니에 추가했습니다"

@tool
def remove_item(name: str):
    """
    장바구니에서 항목을 하나 제거합니다.

    Args:
        name (str): Name of the item to remove from the cart.

    Returns:
        str: Confirmation message indicating whether the item was successfully removed.
    """
    removed_item = cart.pop(name, None)

    if removed_item:
        return f"{name}를 장바구니에서 제거했습니다"
    else:
        return f"장바구니에서 {name}을 찾을 수 없습니다"

products = [
    {'name': '라면', 'price': 2500},
    {'name': '치즈라면', 'price': 3000},
    {'name': '만두라면', 'price': 3500},
    {'name': '고기라면', 'price': 4000},
    {'name': '김밥', 'price': 1500},
    {'name': '돈까스김밥', 'price': 3000},
    {'name': '참치김밥', 'price': 2500},
    {'name': '스팸김밥', 'price': 3500},
]

store = {}

def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]

@tool
def view_menu() -> str:
    """
    Display the current menu options.

    This function generates a JSON string representing the available menu items.
    Each item is displayed with its name, price, and a brief description.

    Returns:
        str: A JSON string containing all menu items.
    """
    
    return json.dumps(products)

tools = [
    view_menu,
    view_cart,
    add_item,
    remove_item,
]

system_message = SystemMessage(
    content="너는 음성인식 기능이 있는 키오스크야. 한국어로 대답해야 해. 메뉴를 물어보면 자세한 정보를 제공해. 음성을 출력하므로 툴을 사용할 때만 마크다운 허용, 최대 3문장까지 생성할 수 있어."
)

llm = ChatOpenAI(model="gpt-4-0125-preview")
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    agent_kwargs={
        "system_message": system_message
    }
)
conversation = RunnableWithMessageHistory(
    agent,
    get_session_history
)
config = {"configurable": {"session_id": "test-session"}}

while True:
    request = input('>')
    try:
        response = conversation.invoke(
            {'input': request},
            config=config
        )
        print(response)
    except Exception as e:
        print(e)