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
