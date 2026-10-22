# EduHub Frontend

Modern, responsive web application for discovering and booking after-school lessons, built with Vue.js 2.

## 🎨 Features

### User Experience
- **Hero Section** with engaging call-to-action
- **Smart Search** with real-time filtering
- **Category Filters** (STEM, Arts, Sports, Languages)
- **Shopping Cart** with slide-out panel
- **Favorites System** with localStorage persistence
- **Responsive Design** for all devices
- **Smooth Animations** with AOS library

### Technical Features
- **Vue.js 2.7.8** reactive framework
- **LocalStorage** for cart persistence
- **Real-time Updates** for availability
- **Form Validation** with helpful errors
- **Toast Notifications** for user feedback
- **Pagination** for performance

## 🚀 Quick Start

### Prerequisites
- Modern web browser
- HTTP server (for local development)
- Backend API running

### Installation

1. Clone the repository
2. Update API URL in `src/App.js`:
```javascript
baseUrl: 'https://your-backend-url.com'
```

3. Serve the files:
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server

# VS Code
Live Server extension
```

## 📁 Project Structure

```
CST3144-Coursework-FullstackDev-FrontEnd/
├── index.html           # Main application file
├── src/
│   ├── App.js          # Vue.js application logic
│   ├── style.css       # Custom styling
│   └── favicon.svg     # Site favicon
└── images/             # Static assets
```

## 🎯 Key Components

### Vue.js Application
- **Reactive Data** for real-time updates
- **Computed Properties** for efficient calculations
- **Watchers** for search and filter updates
- **Methods** for user interactions
- **LocalStorage** integration

### UI Components
- **Navigation Bar** with cart badge
- **Hero Section** with statistics
- **Search & Filters** with category chips
- **Lesson Cards** with hover effects
- **Cart Sidebar** with quantity controls
- **Checkout Form** with validation
- **Success Modal** for confirmations

## 🎨 Design System

### Colors
```css
--primary-color: #4f46e5;
--secondary-color: #ec4899;
--success-color: #10b981;
--danger-color: #ef4444;
```

### Typography
- **Headings**: Poppins
- **Body**: Inter
- **Icons**: Font Awesome

### Components
- Cards with hover animations
- Gradient backgrounds
- Shadow effects
- Smooth transitions

## 🔧 Configuration

### API Integration
Update `baseUrl` in `src/App.js`:
```javascript
data: {
    baseUrl: 'https://afscle.onrender.com'
}
```

### Pagination
Adjust items per page:
```javascript
itemsPerPage: 9  // Change as needed
```

## 📱 Responsive Design

- **Desktop**: Full layout with sidebar
- **Tablet**: Adjusted grid layout
- **Mobile**: Single column, full-width cart

## 🚀 Deployment

### GitHub Pages
1. Create `gh-pages` branch
2. Copy files to root
3. Update `baseUrl` to backend URL
4. Enable GitHub Pages in settings

### Custom Domain
1. Add CNAME file
2. Configure DNS settings
3. Update CORS on backend

## 🛠️ Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📊 Performance

- Lazy loading for images
- Debounced search
- LocalStorage caching
- Optimized animations

## 🐛 Troubleshooting

### Regression tests

Run `node --test test/*.test.js` with Node.js 18 or later. The tests exercise the
application's lesson loading methods with controlled HTTP completion order;
only the most recent search or sort request may update results and loading UI.

### Cart not persisting?
- Check browser localStorage support
- Clear browser cache

### API errors?
- Verify backend URL
- Check CORS configuration
- Inspect browser console

## 📝 License status

No repository-wide open-source licence has been granted. This is coursework
with contributor rights still to be confirmed, so reuse requires permission
from the relevant rights holders.

### Inventory and checkout retries

Cart add/remove/clear operations are local and never PUT lesson inventory. The
remaining count shown on cards subtracts this browser's cart quantities from
freshly fetched server availability. Reloading retains the cart without reserving
places. Only the API's confirmed order transaction decrements stock; another
shopper can buy a place while it is in your cart. After a checkout rejection the
client refreshes availability and keeps the cart so you can remove unavailable
items and retry.

Checkout sends a random `Idempotency-Key` supported by the matching API change.
An unresolved attempt and its exact cart/contact signature are saved in
`localStorage.pendingCheckout`. A network failure or reload retains that key;
resubmitting the unchanged cart and contact information retrieves the original
confirmation if the server already committed it. Contact fields must be re-entered
after reload. Changing the payload starts a new attempt. Confirmation clears the
saved attempt; do not clear browser storage during an uncertain checkout. Pending
signatures contain contact details in this browser's local storage. This is a guest
checkout retry mechanism, not authentication or a payment workflow. Deploy the
matching API retry support first; older APIs ignore this header and cannot prevent
duplicate retries.

Catalogue loading follows server pages of 100 records before local category
filtering and nine-card pagination. The load is bounded to 101 server pages
(the API's maximum offset); larger result sets display an error asking for a
narrower search. A failed or superseded later page never replaces the catalogue
with a partial result. Legacy direct-array responses remain supported. Independent
HTTP pages are not a database snapshot if records change during loading.

Run all client regressions with `node --test test/*.test.js`. There is no package
manager build step; the application runs directly from static files with Vue 2.
