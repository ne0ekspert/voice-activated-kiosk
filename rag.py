import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from langchain.agents import initialize_agent, AgentType
from langchain.schema import SystemMessage

load_dotenv()

class BaseItems:
    def __init__(self):
        self.items = {}

    def view_items(self, *kwargs) -> str:
        return json.dumps(self.items)
    
    def add_item(self, name: str, quantity=1):
        if name in self.items:
            self.items[name] += quantity
        else:
            self.items[name] = quantity

        data = json.dumps(self.items)

        return f"{quantity} of {name} added to the cart"

    def remove_item(self, name: str):
        removed_item = self.items.pop(name, None)

        if removed_item:
            return f"Removed {name} from the cart"
        else:
            return f"There's no such item in the cart"

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
cart = BaseItems()

def view_menu(*args) -> str:
    return json.dumps(products)

tools = [
    Tool(
        name="View Menu",
        func=view_menu,
        description="메뉴에서 모든 목록 가져오기",
    ),
    Tool(
        name="View Cart",
        func=cart.view_items,
        description="장바구니에 추가된 목록 가져오기",
    ),
    Tool(
        name="Add Item to Cart",
        func=cart.add_item,
        description="장바구니에 추가하기"
    ),
    Tool(
        name="Remove Item from Cart",
        func=cart.remove_item,
        description="장바구니에서 항목 하나 삭제하기"
    )
]

system_message = SystemMessage(
    content="You are a helpful assistant for a voice-activated kiosk. Be polite and friendly. When asked about menu items, provide detailed descriptions."
)

llm = ChatOpenAI(model="gpt-4-0125-preview")
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    agent_kwargs={
        "system_message": system_message
    }
)
config = {"configurable": {"session_id": "AB322"}}

while True:
    request = input('>')
    try:
        response = agent.run(request, config=config)
        print(response)
    except:
        pass