import json
from langchain.tools import tool
from data import *

@tool
def view_menu() -> str:
    """
    Display the current menu options.

    Returns:
        str: A JSON string containing all menu items.
    """

    screen.set_id("/order")

    return json.dumps(products.items, ensure_ascii=False)


@tool
def view_cart() -> str:
    """
    장바구니에 있는 항목들을 JSON 문자열로 출력합니다.
    
    Returns:
        str: JSON string containing key-value pairs of item names and quantities.
    """

    screen.set_id("/order")

    total = 0

    res = ""
    for k, v in cart.items.items():
        price = 0
        for product in products.items:
            if product['name'] == k:
                price = product['price']
        res += f"{k} {v}개 = {price * v}\n"
        total += price * v
    
    res += f"합계 = {total}"

    return res
    
@tool
def add_item_to_cart(name: str, quantity=1) -> str:
    """
    장바구니에 항목을 추가합니다.

    Args:
        name (str): 장바구니에 추가할 항목의 이름
        quantity (int, optional): 추가할 항목의 개수, 자동으로 1로 설정됨.

    Returns:
        str: 장바구니 목록과 가격 합
    """

    screen.set_id("/order")

    if name not in map(lambda x: x['name'], products.items):
        return f"No such menu named as {name}"

    if name in cart.items:
        cart.items[name] += quantity
    else:
        cart.items[name] = quantity

    total = 0

    res = ""
    res += f"{name} {quantity}개를 장바구니에 추가했습니다.\n"
    res += "장바구니:\n"

    for k, v in cart.items.items():
        price = 0
        for product in products.items:
            if product['name'] == k:
                price = product['price']
        res += f"{k} {v}개 = {price * v}\n"
        total += price * v
    
    res += f"합계 = {total}"

    return res

@tool
def change_quantity_from_cart(name: str, target_quantity: int) -> str:
    """
    장바구니의 한 가지 항목의 수량을 바꿉니다.

    Args:
        name (str): 장바구니에서 수량을 변경할 항목의 이름
        target_quantity (int): 변경할 수량
        
    Returns:
        str: Confirmation message indicating whether the item was successfully changed.
    """

    screen.set_id("/order")

    if name not in map(lambda x: x['name'], products.items):
        return "존재하지 않는 메뉴입니다"
    
    if target_quantity <= 0:
        return f"수량을 0 이하로 바꾸는 것은 지원하지 않습니다. `remove_item_from_cart` 툴을 사용하세요."
    
    if name in cart.items.keys():
        cart.items[name] = target_quantity
        res = ""
        res += f"{name}의 개수를 {target_quantity}로 변경했습니다.\n"
        res += "장바구니:\n"

        total = 0

        for k, v in cart.items.items():
            price = 0
            for product in products.items:
                if product['name'] == k:
                    price = product['price']
            res += f"{k} {v}개 = {price * v}\n"
            total += price * v
        
        res += f"합계 = {total}"
        
        return res
    else:
        return f"장바구니에서 {name}을 찾을 수 없습니다"

@tool
def remove_item_from_cart(name: str) -> str:
    """
    장바구니에서 항목을 제거합니다.
    특정 수량만큼 삭제하려면 `change_quantity_from_cart` 툴을 사용하세요.

    Args:
        name (str): 장바구니에서 제거할 항목의 이름

    Returns:
        str: Confirmation message indecating whether the item was successfully removed.
    """

    screen.set_id("/order")

    if name not in map(lambda x: x['name'], products.items):
        return "존재하지 않는 메뉴입니다"
    
    removed_item = cart.items.pop(name, None)

    if removed_item:
        total = 0
        res = ""
        res += f"{name}를 장바구니에서 제거했습니다.\n"
        res += "장바구니:\n"

        for k, v in cart.items.items():
            price = 0
            for product in products.items:
                if product['name'] == k:
                    price = product['price']
            res += f"{k} {v}개 = {price * v}\n"
            total += price * v
        
        res += f"합계 = {total}"

        return res
    else:
        return f"장바구니에서 {name}을 찾을 수 없습니다"

@tool
def pay_with_cash():
    """
    화면을 현금 결제 화면으로 이동합니다.
    사용자가 현금 결제를 요청했을 때 사용하세요.

    Args:
        None

    Returns:
        str: Confirmation message indecating the screen has changed
    """
    screen.set_id("/payment/cash")

    return "현금 결제 화면으로 변경되었습니다. 현금 결제를 계속할 직원을 호출하였습니다."

@tool
def pay_with_card():
    """
    화면을 카드 결제 화면으로 이동합니다.
    사용자가 카드 결제를 요청했을 때 사용하세요.
    
    Args:
        None

    Returns:
        str: Confirmation message indecating the screen has changed
    """
    screen.set_id("/payment/card")

    return "카드 결제 화면으로 변경되었습니다. \"오른손을 앞으로 뻗으면 있는 점자 위쪽에 카드를 대 주세요.\"를 설명하세요.\n결제를 기다리는 중입니다..."

tools = [
    view_menu,
    view_cart,
    add_item_to_cart,
    change_quantity_from_cart,
    remove_item_from_cart,
    pay_with_cash,
    pay_with_card
]