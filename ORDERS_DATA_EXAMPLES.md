# Smart Pantry Orders - Data Examples

## Firebase Firestore Structure

```
smart-pantry-ai-7881a (Project)
├── Collections
│   ├── users/
│   ├── scans/
│   ├── inventories/
│   ├── predictions/
│   ├── shoppingLists/
│   └── orders/  ← NEW!
│       ├── order_abc123xyz
│       ├── order_def456uvw
│       └── order_ghi789rst
```

## Complete Order Document Example

### Newly Created Order (Placing status)
```json
{
  "id": "IvB8zJK9pQr2sTu3vWx4",
  "userId": "demo_guest_user",
  "items": [
    {
      "name": "Soft Drinks",
      "quantity": 2,
      "price": 3.99,
      "image": null
    },
    {
      "name": "Chips",
      "quantity": 3,
      "price": 2.49,
      "image": null
    },
    {
      "name": "Ice Cream",
      "quantity": 1,
      "price": 5.99,
      "image": null
    }
  ],
  "totalPrice": 20.91,
  "deliveryAddress": "Your location",
  "notes": "",
  "status": "Placing",
  "createdAt": "2026-06-14T10:30:45.123Z",
  "estimatedDeliveryTime": "2026-06-14T10:45:45.123Z",
  "updatedAt": "2026-06-14T10:30:45.123Z"
}
```

### Order in Progress (Out For Delivery status)
```json
{
  "id": "abc123XyZ789pQr2sTu3vWx",
  "userId": "google_mock_abc123",
  "items": [
    {
      "name": "Coffee",
      "quantity": 2,
      "price": 4.99,
      "image": null
    },
    {
      "name": "Energy Drink",
      "quantity": 2,
      "price": 2.99,
      "image": null
    },
    {
      "name": "Instant Noodles",
      "quantity": 3,
      "price": 1.29,
      "image": null
    },
    {
      "name": "Biscuits",
      "quantity": 2,
      "price": 1.99,
      "image": null
    }
  ],
  "totalPrice": 27.84,
  "deliveryAddress": "Apt 4B, 123 Main Street, City",
  "notes": "Please ring doorbell twice",
  "status": "Out For Delivery",
  "createdAt": "2026-06-14T09:00:30.456Z",
  "estimatedDeliveryTime": "2026-06-14T09:20:30.456Z",
  "updatedAt": "2026-06-14T09:15:20.789Z"
}
```

### Delivered Order
```json
{
  "id": "pQr2sTu3vWx4yZaB5cD6eFg",
  "userId": "user_demo123",
  "items": [
    {
      "name": "Eggs (12-pack)",
      "quantity": 1,
      "price": 3.99,
      "image": null
    },
    {
      "name": "White Bread",
      "quantity": 1,
      "price": 2.49,
      "image": null
    },
    {
      "name": "Fresh Milk",
      "quantity": 1,
      "price": 3.29,
      "image": null
    },
    {
      "name": "Orange Juice",
      "quantity": 1,
      "price": 4.49,
      "image": null
    }
  ],
  "totalPrice": 14.26,
  "deliveryAddress": "Home, Downtown",
  "notes": "Breakfast items",
  "status": "Delivered",
  "createdAt": "2026-06-13T07:15:00.000Z",
  "estimatedDeliveryTime": "2026-06-13T07:30:00.000Z",
  "updatedAt": "2026-06-13T07:28:15.234Z"
}
```

### Cancelled Order
```json
{
  "id": "eFg7hIj8kLm9nOp0qRs1tUv",
  "userId": "user_12345",
  "items": [
    {
      "name": "Popcorn",
      "quantity": 2,
      "price": 2.99,
      "image": null
    },
    {
      "name": "Chocolates",
      "quantity": 3,
      "price": 1.99,
      "image": null
    },
    {
      "name": "Soft Drinks",
      "quantity": 2,
      "price": 3.99,
      "image": null
    }
  ],
  "totalPrice": 18.95,
  "deliveryAddress": "Movie Theater",
  "notes": "For movie night",
  "status": "Cancelled",
  "createdAt": "2026-06-14T18:00:00.000Z",
  "estimatedDeliveryTime": "2026-06-14T18:15:00.000Z",
  "updatedAt": "2026-06-14T18:05:30.500Z",
  "cancelledAt": "2026-06-14T18:05:30.500Z"
}
```

## API Request/Response Examples

### Example 1: Create Order Request
```javascript
// JavaScript/Fetch
const orderData = {
  userId: "demo_guest_user",
  items: [
    { name: "Milk", quantity: 2, price: 3.99, image: null },
    { name: "Eggs", quantity: 1, price: 5.99, image: null }
  ],
  totalPrice: 13.97,
  deliveryAddress: "123 Main St",
  notes: "Please leave at door"
};

fetch("http://localhost:5000/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(orderData)
})
.then(res => res.json())
.then(data => console.log("Order created:", data.orderId));
```

#### Response:
```json
{
  "orderId": "IvB8zJK9pQr2sTu3vWx4",
  "userId": "demo_guest_user",
  "items": [
    { "name": "Milk", "quantity": 2, "price": 3.99, "image": null },
    { "name": "Eggs", "quantity": 1, "price": 5.99, "image": null }
  ],
  "totalPrice": 13.97,
  "deliveryAddress": "123 Main St",
  "notes": "Please leave at door",
  "status": "Placing",
  "createdAt": "2026-06-14T10:30:45.123Z",
  "estimatedDeliveryTime": "2026-06-14T10:45:45.123Z",
  "message": "Order created successfully"
}
```

### Example 2: Get All User Orders
```javascript
fetch("http://localhost:5000/api/orders?userId=demo_guest_user")
  .then(res => res.json())
  .then(data => console.log(`${data.totalOrders} orders found:`, data.orders));
```

#### Response:
```json
{
  "userId": "demo_guest_user",
  "totalOrders": 3,
  "orders": [
    {
      "id": "IvB8zJK9pQr2sTu3vWx4",
      "userId": "demo_guest_user",
      "items": [...],
      "totalPrice": 20.91,
      "status": "Out For Delivery",
      "createdAt": "2026-06-14T10:30:45.123Z",
      "estimatedDeliveryTime": "2026-06-14T10:45:45.123Z"
    },
    {
      "id": "abc123XyZ789pQr2sTu3vWx",
      "userId": "demo_guest_user",
      "items": [...],
      "totalPrice": 27.84,
      "status": "Delivered",
      "createdAt": "2026-06-13T09:00:30.456Z",
      "estimatedDeliveryTime": "2026-06-13T09:20:30.456Z"
    },
    {
      "id": "pQr2sTu3vWx4yZaB5cD6eFg",
      "userId": "demo_guest_user",
      "items": [...],
      "totalPrice": 14.26,
      "status": "Delivered",
      "createdAt": "2026-06-13T07:15:00.000Z",
      "estimatedDeliveryTime": "2026-06-13T07:30:00.000Z"
    }
  ]
}
```

### Example 3: Get Specific Order
```javascript
fetch("http://localhost:5000/api/orders/IvB8zJK9pQr2sTu3vWx4")
  .then(res => res.json())
  .then(data => console.log("Order details:", data));
```

#### Response:
```json
{
  "id": "IvB8zJK9pQr2sTu3vWx4",
  "userId": "demo_guest_user",
  "items": [
    {
      "name": "Soft Drinks",
      "quantity": 2,
      "price": 3.99,
      "image": null
    },
    {
      "name": "Chips",
      "quantity": 3,
      "price": 2.49,
      "image": null
    },
    {
      "name": "Ice Cream",
      "quantity": 1,
      "price": 5.99,
      "image": null
    }
  ],
  "totalPrice": 20.91,
  "deliveryAddress": "Your location",
  "notes": "",
  "status": "Out For Delivery",
  "createdAt": "2026-06-14T10:30:45.123Z",
  "estimatedDeliveryTime": "2026-06-14T10:45:45.123Z",
  "updatedAt": "2026-06-14T10:35:20.456Z"
}
```

### Example 4: Update Order Status
```javascript
const updateData = {
  status: "Delivered",
  notes: "Order delivered to front door"
};

fetch("http://localhost:5000/api/orders/IvB8zJK9pQr2sTu3vWx4", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(updateData)
})
.then(res => res.json())
.then(data => console.log("Order updated:", data));
```

#### Response:
```json
{
  "id": "IvB8zJK9pQr2sTu3vWx4",
  "userId": "demo_guest_user",
  "items": [...],
  "totalPrice": 20.91,
  "status": "Delivered",
  "createdAt": "2026-06-14T10:30:45.123Z",
  "estimatedDeliveryTime": "2026-06-14T10:45:45.123Z",
  "updatedAt": "2026-06-14T10:40:00.000Z",
  "notes": "Order delivered to front door",
  "message": "Order updated successfully"
}
```

### Example 5: Cancel Order
```javascript
fetch("http://localhost:5000/api/orders/IvB8zJK9pQr2sTu3vWx4", {
  method: "DELETE"
})
.then(res => res.json())
.then(data => console.log("Order cancelled:", data));
```

#### Response:
```json
{
  "id": "IvB8zJK9pQr2sTu3vWx4",
  "message": "Order cancelled successfully"
}
```

## Data Type Reference

| Field | Type | Max Length | Example |
|-------|------|-----------|---------|
| userId | string | - | "demo_guest_user" |
| items[].name | string | 255 | "Soft Drinks" |
| items[].quantity | number | - | 2 |
| items[].price | number | - | 3.99 |
| items[].image | string \| null | 2000 | "https://..." or null |
| totalPrice | number | - | 20.91 |
| deliveryAddress | string | 500 | "123 Main St, City" |
| notes | string | 500 | "Please ring twice" |
| status | string | - | "Placing", "Preparing", "Packing", "Out For Delivery", "Delivered", "Cancelled" |
| createdAt | ISO 8601 | - | "2026-06-14T10:30:45.123Z" |
| estimatedDeliveryTime | ISO 8601 | - | "2026-06-14T10:45:45.123Z" |
| updatedAt | ISO 8601 | - | "2026-06-14T10:35:20.456Z" |
| cancelledAt | ISO 8601 | - | "2026-06-14T18:05:30.500Z" |

## Common Queries in Firebase

### Get all orders for a user ordered by date (newest first)
```javascript
// Firestore query
db.collection('orders')
  .where('userId', '==', 'demo_guest_user')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();
```

### Get all pending orders (Placing, Preparing, Packing, Out For Delivery)
```javascript
// Multiple filters
const statuses = ['Placing', 'Preparing', 'Packing', 'Out For Delivery'];
// Note: This requires multiple queries or a Firestore index

statuses.forEach(status => {
  db.collection('orders')
    .where('userId', '==', 'demo_guest_user')
    .where('status', '==', status)
    .get();
});
```

### Get delivered orders from last 30 days
```javascript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

db.collection('orders')
  .where('userId', '==', 'demo_guest_user')
  .where('status', '==', 'Delivered')
  .where('createdAt', '>=', thirtyDaysAgo)
  .orderBy('createdAt', 'desc')
  .get();
```

## Total Order Value Calculation

When viewing user orders, you can calculate:

```javascript
// From orders list response
const totalSpent = data.orders.reduce((sum, order) => sum + order.totalPrice, 0);
const averageOrder = totalSpent / data.orders.length;
const lastOrder = data.orders[0]; // Most recent due to desc sort

console.log(`Total spent: $${totalSpent.toFixed(2)}`);
console.log(`Average order: $${averageOrder.toFixed(2)}`);
console.log(`Last order: ${lastOrder.createdAt}`);
```
