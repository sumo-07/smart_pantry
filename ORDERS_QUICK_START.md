# Smart Pantry Orders - Quick Start Guide

## 🚀 Getting Started with Orders

आपके Smart Pantry app में अब Firebase में orders को store करने की functionality तैयार है!

## ✅ What's New

### Backend Changes (`backend/index.js`)
5 नए API endpoints add किए गए हैं:
```
POST   /api/orders             - नया order create करना
GET    /api/orders             - सभी user orders देखना  
GET    /api/orders/:orderId    - specific order details
PUT    /api/orders/:orderId    - order status update करना
DELETE /api/orders/:orderId    - order cancel करना
```

### Frontend Changes (`frontend/src/pages/Cart.jsx`)
- Order को Firebase में save करता है जब user "Place Order" click करे
- Loading spinner दिखाता है जब order process हो रहा हो
- Error message दिखाता है अगर कोई problem आए
- Order ID display करता है confirmation में

## 🛠️ Setup & Testing

### Step 1: Backend शुरू करो
```bash
cd backend
npm run dev
```
Output should show: `Smart Pantry Backend running on http://localhost:5000`

### Step 2: Health Check करो
```bash
curl http://localhost:5000/api/health
```
Response:
```json
{"status": "ok", "geminiEnabled": true/false}
```

### Step 3: Frontend चलाओ
```bash
cd frontend  
npm run dev
```

### Step 4: Test करो
1. Frontend खोलो (http://localhost:5173)
2. Login/Register करो
3. Products या Amazon Now से items add करो cart में
4. "Your Shopping Cart" page जाओ
5. कुछ items add करो
6. "Place Order" button पर click करो
7. Order confirmation animation देखो
8. Firebase Console में "orders" collection check करो

## 📊 Firebase में Orders देखना

1. Firebase Console खोलो: https://console.firebase.google.com/
2. अपनी project select करो
3. Firestore Database में जाओ
4. "orders" collection देखो
5. नया order document देखेगा

### Order Document Example:
```json
{
  "userId": "user_123",
  "items": [
    {
      "name": "Milk",
      "quantity": 2,
      "price": 3.99,
      "image": null
    }
  ],
  "totalPrice": 7.98,
  "deliveryAddress": "Your location",
  "notes": "",
  "status": "Placing",
  "createdAt": "2026-06-14T10:30:00Z",
  "estimatedDeliveryTime": "2026-06-14T10:45:00Z"
}
```

## 🔧 API Testing with Postman/cURL

### Create Order (Manual Test)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "items": [
      {
        "name": "Milk",
        "quantity": 2,
        "price": 3.99,
        "image": null
      }
    ],
    "totalPrice": 7.98,
    "deliveryAddress": "123 Main St",
    "notes": "Please leave at door"
  }'
```

### Get User Orders
```bash
curl http://localhost:5000/api/orders?userId=test_user
```

### Get Specific Order
```bash
curl http://localhost:5000/api/orders/{orderId}
```

### Update Order Status
```bash
curl -X PUT http://localhost:5000/api/orders/{orderId} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Out For Delivery",
    "notes": "Driver arrived"
  }'
```

### Cancel Order
```bash
curl -X DELETE http://localhost:5000/api/orders/{orderId}
```

## 📱 Frontend Features

### Order Tracking UI
- ✅ Real-time status updates: Placing → Preparing → Packing → Out For Delivery → Delivered
- ✅ Order ID display
- ✅ Estimated delivery time (15 mins default)
- ✅ Total cost display
- ✅ Error handling with user feedback

### Cart to Order Flow
```
User adds items → Cart page → Click "Place Order" → 
Order saves to Firebase → Confirmation animation → 
Can track status
```

## 🎯 Next Features (Optional)

अगर और features चाहिए तो:

1. **Order History Page** - सभी past orders देखना
2. **Real-time Tracking** - WebSocket से live status updates
3. **Order Details Modal** - पूरे order info को देखना
4. **Email Notifications** - order status के लिए emails
5. **Rating System** - delivered orders को rate करना
6. **Admin Dashboard** - सभी orders manage करना

## 🐛 Troubleshooting

### Problem: "Failed to place order"
**Solution:**
- Backend चल रहा है? Check: `npm run dev` in backend folder
- Port 5000 available है? 
- Check browser console (F12) for exact error

### Problem: Order नहीं दिख रहा Firebase में
**Solution:**
- Firebase project ID सही है?
- Firestore database enabled है?
- Security rules block नहीं कर रहे?
- Orders collection auto-create हो जाता है first order पर

### Problem: CORS Error
**Solution:**
- Backend में CORS already enabled है
- Frontend और backend different ports पर चलते हैं जो normal है
- Error persist करे तो backend logs check करो

## 📝 Environment Variables

### Frontend (.env या .env.local में)
```
VITE_BACKEND_URL=http://localhost:5000
```

### Backend (.env में)
```
PORT=5000
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
...
```

## 📚 Documentation

- Full API docs: देखो `ORDERS_API.md` file
- Database schema details वहाँ मिलेंगे
- Error codes और responses
- Security rules setup

## 🎉 Summary

Orders feature अब **fully functional** है!

- ✅ Backend: 5 complete API endpoints
- ✅ Frontend: Cart से order place कर सकते हो
- ✅ Database: Firebase में orders save होते हैं
- ✅ UI: Confirmation animation और order tracking
- ✅ Documentation: Complete API docs available

**अगला step:** अपना cart में items add करके order place करो और Firebase में देख! 🚀
