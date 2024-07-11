from vertexai.generative_models import (
    FunctionDeclaration,
    Tool,
    Part
)
from product import cart, product

get_products = FunctionDeclaration(
    name="get_products",
    description="Get products",
    parameters={
        "type": "object"
    }
)

get_cart = FunctionDeclaration(
    name="get_cart",
    description="Get cart items",
    parameters={
        "type": "object"
    }
)

add_item = FunctionDeclaration(
    name="add_item_to_cart",
    description="Add item to the cart",
    parameters={
        "type": "object",
        "properties": {
            "product_name": {"type": "string", "description": "Product name"}
        }
    }
)

remove_item = FunctionDeclaration(
    name="remove_item_from_cart",
    description="Remove item from the cart",
    parameters={
        "type": "object",
        "properties": {
            "productid": {"type": "string", "description": "Cart item UUID"}
        }
    }
)

change_quantity = FunctionDeclaration(
    name="cart_change_quantity",
    description="Changes cart's item quantity",
    parameters={
        "type": "object",
        "properties": {
            "productid": {"type": "string", "description": "Cart item UUID"},
            "quantity": {"type": "integer", "description": "New quantity"}
        }
    }
)

retail_tool = Tool(
    function_declarations=[
        get_products,
        get_cart,
        add_item,
        remove_item,
        change_quantity
    ]
)

def rag_run_function(part: Part):
    data = {}

    if part.function_call.name == "get_products":
        data = {
            "content": product.items
        }
    elif part.function_call.name == "get_cart":
        data = {
            "content": cart.items
        }
    elif part.function_call.name == "add_item":
        data 

    return Part.from_function_response(part.function_call.name, data)