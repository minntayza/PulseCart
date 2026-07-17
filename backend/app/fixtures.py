from decimal import Decimal
from .models.schemas import Product


PRODUCTS = [
    Product(id="1", name="ROG Strix G16 Gaming Laptop", category="laptops", price=Decimal("1299.99"), description='16" QHD 240Hz | RTX 4070 | 16GB RAM', rating=4.8, reviews=234, badge="trending"),
    Product(id="2", name="Secretlab TITAN Evo Chair", category="chairs", price=Decimal("499.00"), description="Premium gaming chair with lumbar support", rating=4.7, reviews=189, badge="match"),
    Product(id="3", name="Sony WH-1000XM5 Headphones", category="headphones", price=Decimal("349.99"), description="Industry-leading noise cancellation", rating=4.9, reviews=567, badge="trending"),
    Product(id="4", name="Logitech G Pro X Superlight", category="accessories", price=Decimal("79.99"), description="Ultra-lightweight wireless gaming mouse", rating=4.6, reviews=891),
    Product(id="5", name="Razer BlackWidow V4 Keyboard", category="accessories", price=Decimal("169.99"), description="Mechanical gaming keyboard with RGB", rating=4.5, reviews=123),
    Product(id="6", name='ASUS ROG Swift 27" Monitor', category="accessories", price=Decimal("799.99"), description='27" QHD 240Hz gaming monitor', rating=4.8, reviews=67, badge="agent"),
    Product(id="7", name="Herman Miller Aeron Chair", category="chairs", price=Decimal("1395.00"), description="Ergonomic office chair, size B", rating=4.9, reviews=432),
    Product(id="8", name="Corsair K100 RGB Keyboard", category="accessories", price=Decimal("229.99"), description="Mechanical gaming keyboard with iCUE", rating=4.4, reviews=98),
    Product(id="9", name="SteelSeries Arctis Nova Pro", category="headphones", price=Decimal("349.99"), description="Wireless gaming headset with ANC", rating=4.7, reviews=211, badge="match"),
    Product(id="10", name="MSI Raider GE78 HX", category="laptops", price=Decimal("2499.99"), description='17" QHD 240Hz | RTX 4080 | 32GB RAM', rating=4.6, reviews=45, badge="agent"),
    Product(id="11", name="Logitech MX Master 3S", category="accessories", price=Decimal("99.99"), description="Wireless productivity mouse", rating=4.8, reviews=1023),
    Product(id="12", name="Noblechairs Hero Series", category="chairs", price=Decimal("549.00"), description="Premium office/gaming chair", rating=4.5, reviews=156),
]
