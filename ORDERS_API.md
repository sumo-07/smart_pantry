# Smart Pantry Orders API Documentation

## Overview
The Orders API allows users to place and manage orders in the Smart Pantry application. All orders are stored in Firebase Firestore database and can be tracked through their lifecycle.

## Database Schema

### Orders Collection
```javascript
{
  userId: string,                    // User's unique ID
  items: [
    {
      name: string,                  // Item name
      quantity: number,              // Quantity ordered
      price: number,                 // Price per unit
      image: string | null           // Product image URL (optional)
    }
  ],
  totalPrice: number,                // Total order amount
  deliveryAddress: string,           // Delivery address
  notes: string,                     // Special notes/instructions
  status: string,                    // Order status
  createdAt: string,                 // ISO timestamp when order was created
  estimatedDeliveryTime: string,     // ISO timestamp for estimated delivery
  updatedAt: string,                 // ISO timestamp when order was last updated
  cancelledAt: string (optional)     // ISO timestamp when order was cancelled
}
```

## Order Status Flow
1. **Placing** → Order is being created and verified
2. **Preparing** → Order is being prepared in the warehouse
3. **Packing** → Items are being packed for delivery
4. **Out For Delivery** → Order is on its way to the customer
5. **Delivered** → Order has been delivered
6. **Cancelled** (optional) → Order was cancelled by user or system

## API Endpoints

### 1. Create Order (Place a New Order)
**POST** `/api/orders`

#### Request Body
```json
{
  "userId": "user_123",
  "items": [
    {
      "name": "Milk",
      "quantity": 2,
      "price": 3.99,
      "image": "https://example.com/milk.jpg"
    },
    {
      "name": "Bread",
      "quantity": 1,
      "price": 2.49,
      "image": null
    }
  ],
  "totalPrice": 9.97,
  "deliveryAddress": "123 Main St, Apt 4B",
  "notes": "Please ring doorbell twice"
}
```

#### Response
```json
{
  "orderId": "abc123def456",
  "userId": "user_123",
  "items": [...],
  "totalPrice": 9.97,
  "deliveryAddress": "123 Main St, Apt 4B",
  "notes": "Please ring doorbell twice",
  "status": "Placing",
  "createdAt": "2026-06-14T10:30:00Z",
  "estimatedDeliveryTime": "2026-06-14T10:45:00Z",
  "message": "Order created successfully"
}
```

#### Status Codes
- **201** Created - Order created successfully
- **400** Bad Request - Missing required fields
- **500** Server Error - Failed to create order

---

### 2. Get All Orders for a User
**GET** `/api/orders?userId=user_123`

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | The user's unique ID |

#### Response
```json
{
  "userId": "user_123",
  "totalOrders": 3,
  "orders": [
    {
      "id": "order_id_1",
      "userId": "user_123",
      "items": [...],
      "totalPrice": 9.97,
      "status": "Delivered",
      "createdAt": "2026-06-14T10:30:00Z",
      "estimatedDeliveryTime": "2026-06-14T10:45:00Z"
    },
    {
      "id": "order_id_2",
      "userId": "user_123",
      "items": [...],
      "totalPrice": 15.49,
      "status": "Out For Delivery",
      "createdAt": "2026-06-14T09:00:00Z",
      "estimatedDeliveryTime": "2026-06-14T09:20:00Z"
    }
  ]
}
```

#### Status Codes
- **200** OK - Orders retrieved successfully
- **400** Bad Request - Missing userId parameter
- **500** Server Error - Failed to fetch orders

---

### 3. Get Specific Order
**GET** `/api/orders/:orderId`

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderId | string | Yes | The order's unique ID |

#### Response
```json
{
  "id": "abc123def456",
  "userId": "user_123",
  "items": [...],
  "totalPrice": 9.97,
  "deliveryAddress": "123 Main St, Apt 4B",
  "notes": "Please ring doorbell twice",
  "status": "Out For Delivery",
  "createdAt": "2026-06-14T10:30:00Z",
  "estimatedDeliveryTime": "2026-06-14T10:45:00Z",
  "updatedAt": "2026-06-14T10:40:00Z"
}
```

#### Status Codes
- **200** OK - Order retrieved successfully
- **404** Not Found - Order not found
- **500** Server Error - Failed to fetch order

---

### 4. Update Order
**PUT** `/api/orders/:orderId`

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderId | string | Yes | The order's unique ID |

#### Request Body
```json
{
  "status": "Out For Delivery",
  "estimatedDeliveryTime": "2026-06-14T10:45:00Z",
  "notes": "Driver called, will arrive in 5 minutes"
}
```

#### Response
```json
{
  "id": "abc123def456",
  "userId": "user_123",
  "items": [...],
  "totalPrice": 9.97,
  "status": "Out For Delivery",
  "createdAt": "2026-06-14T10:30:00Z",
  "estimatedDeliveryTime": "2026-06-14T10:45:00Z",
  "updatedAt": "2026-06-14T10:40:00Z",
  "notes": "Driver called, will arrive in 5 minutes",
  "message": "Order updated successfully"
}
```

#### Status Codes
- **200** OK - Order updated successfully
- **404** Not Found - Order not found
- **500** Server Error - Failed to update order

---

### 5. Cancel Order
**DELETE** `/api/orders/:orderId`

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderId | string | Yes | The order's unique ID |

#### Response
```json
{
  "id": "abc123def456",
  "message": "Order cancelled successfully"
}
```

#### Status Codes
- **200** OK - Order cancelled successfully
- **404** Not Found - Order not found
- **500** Server Error - Failed to cancel order

---

## Frontend Integration

### Cart Component Integration
The Cart component automatically saves orders to Firebase when a user clicks "Place Order":

```javascript
import { useAuth } from "../context/AuthContext";

const { user } = useAuth();

const handlePlaceOrder = async () => {
  const orderData = {
    userId: user?.uid || "demo_user",
    items: cart.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image || null
    })),
    totalPrice: estimatedTotalCost,
    deliveryAddress: "Your location",
    notes: ""
  };

  const response = await fetch(`${BACKEND_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();
  console.log("Order created:", result.orderId);
};
```

### Retrieve User Orders
```javascript
const fetchUserOrders = async (userId) => {
  const response = await fetch(
    `${BACKEND_URL}/api/orders?userId=${userId}`
  );
  const data = await response.json();
  console.log("User orders:", data.orders);
};
```

---

## Environment Variables

### Backend (.env)
```
PORT=5000
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Frontend (.env)
```
VITE_BACKEND_URL=http://localhost:5000
```

---

## Firebase Firestore Rules

To secure the orders collection, add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      // Users can only read/write their own orders
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## Example Usage Flow

### 1. User Places an Order
```javascript
// User adds items to cart and clicks "Place Order"
POST /api/orders
{
  "userId": "user_123",
  "items": [
    { "name": "Milk", "quantity": 2, "price": 3.99, "image": null },
    { "name": "Eggs", "quantity": 1, "price": 5.99, "image": null }
  ],
  "totalPrice": 13.97,
  "deliveryAddress": "Home",
  "notes": ""
}

Response: { orderId: "order_abc123", status: "Placing", ... }
```

### 2. Check Order Status
```javascript
// Later, user wants to track their order
GET /api/orders/order_abc123

Response: { 
  status: "Out For Delivery",
  estimatedDeliveryTime: "2026-06-14T10:45:00Z",
  ...
}
```

### 3. View All User Orders
```javascript
// User views order history
GET /api/orders?userId=user_123

Response: { 
  orders: [
    { id: "order_abc123", status: "Out For Delivery", ... },
    { id: "order_xyz789", status: "Delivered", ... }
  ],
  totalOrders: 2
}
```

---

## Error Handling

### Common Errors

| Error | Status | Description |
|-------|--------|-------------|
| Missing userId | 400 | userId is required in request body |
| Missing items | 400 | items array is required and cannot be empty |
| Invalid items format | 400 | items must be an array of objects |
| Order not found | 404 | The orderId does not exist in database |
| Server error | 500 | Internal server error, check backend logs |

### Error Response Format
```json
{
  "error": "Missing userId in request."
}
```

---

## Best Practices

1. **Always include userId** - Each order must be associated with a user
2. **Validate before sending** - Check that items array is not empty
3. **Handle async operations** - Use try-catch or .catch() for API calls
4. **Show user feedback** - Display loading states and error messages
5. **Store order IDs** - Keep order IDs for tracking and support queries

---

## Troubleshooting

### Order not being saved
- Check that backend is running on correct port (default: 5000)
- Verify Firebase credentials in .env file
- Check browser console for network errors
- Ensure userId is provided in request

### CORS errors
- Backend has CORS enabled for all origins
- If you still get errors, check that frontend URL matches backend CORS configuration

### Orders not appearing in Firestore
- Verify Firebase project ID is correct
- Check that Firestore database is enabled
- Review Firebase security rules to ensure data is not blocked

---

## Support

For issues or questions, check:
1. Backend logs: `npm run dev` in backend folder
2. Browser console: Open DevTools (F12) → Console tab
3. Firebase console: Check Firestore data directly
4. Order IDs: Use GET `/api/orders/:orderId` to verify order details
