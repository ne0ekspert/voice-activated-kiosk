import uuid

class Product:
    def __init__(self):
        self.items: list[dict] = [
            {'name': '라면', 'price': 2500, 'image': ''},
            {'name': '치즈라면', 'price': 3000, 'image': ''},
            {'name': '만두라면', 'price': 3500, 'image': ''},
            {'name': '고기라면', 'price': 4000, 'image': ''},
            {'name': '김밥', 'price': 1500, 'image': ''},
            {'name': '돈까스김밥', 'price': 3000, 'image': ''},
            {'name': '참치김밥', 'price': 2500, 'image': ''},
            {'name': '스팸김밥', 'price': 3500, 'image': ''},
        ]

class Cart:
    def __init__(self):
        self.items: list[dict] = []

    def add(self, name, qty):
        if name not in map(lambda x: x['name'], product.items):
            raise ValueError("Name not in product list")
        self.items.append({
            'id': uuid.uuid1(),
            'name': name,
            'quantity': 'qty'
        })

product = Product()
cart = Cart()