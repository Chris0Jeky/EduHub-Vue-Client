new Vue({
    el: '#app',
    data: {
        // Core Data
        sitename: "EduHub - After School Lessons",
        products: [],
        cart: [],
        favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
        
        // API Configuration
        baseUrl: 'https://afscle.onrender.com',
        
        // User Input
        name: '',
        phone: '',
        searchQuery: '',
        sortAttribute: 'topic',
        sortOrder: 'asc',
        selectedCategory: 'all',
        
        // UI State
        checkOutArea: false,
        loading: false,
        productsRequestId: 0,
        submitting: false,
        showCart: false,
        showStats: false,
        showToast: false,
        toastTitle: '',
        toastMessage: '',
        
        // Validation
        nameError: '',
        phoneError: '',
        
        // Order State
        orderSubmitted: false,
        confirmationNumber: '',
        
        // Pagination
        currentPage: 1,
        itemsPerPage: 9,
        
        // Statistics
        stats: {
            totalLessons: 20,
            totalInstructors: 15,
            avgRating: 4.8
        }
    },
    
    created() {
        this.fetchProducts();
        this.loadCartFromStorage();
    },
    
    methods: {
        // Helper to construct proper image URL
        getImageUrl(imagePath) {
            if (!imagePath) return this.baseUrl + '/images/default.gif';
            // Remove leading slash if present to avoid double slash
            const cleanPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
            return this.baseUrl + cleanPath;
        },
        // API Methods
        async fetchProducts() {
            const requestId = ++this.productsRequestId;
            this.loading = true;
            const params = new URLSearchParams();
            
            if (this.searchQuery) {
                params.append('search', this.searchQuery);
            }
            if (this.sortAttribute) {
                params.append('sortBy', this.sortAttribute);
                params.append('order', this.sortOrder);
            }
            
            try {
                const response = await fetch(`${this.baseUrl}/api/lessons?${params.toString()}`);
                const result = await response.json();
                if (requestId !== this.productsRequestId) return;
                
                // Check if it's the new API format or old format
                let lessons = [];
                if (result.status === 'success' && result.data) {
                    lessons = result.data.lessons;
                    this.stats.totalLessons = result.data.pagination.total;
                } else if (Array.isArray(result)) {
                    // Old API format - direct array
                    lessons = result;
                } else {
                    throw new Error('Unexpected API response format');
                }
                
                // Normalize data to use 'spaces' field and fix image URLs
                this.products = lessons.map(product => {
                    const imageUrl = product.image ? this.baseUrl + product.image : this.baseUrl + '/images/default.gif';
                    return {
                        ...product,
                        spaces: product.spaces !== undefined ? product.spaces : (product.space || 0),
                        imageUrl: imageUrl,
                        image: product.image || '/images/default.gif'
                    };
                });
                
                console.log('Products loaded:', this.products.length, 'Sample imageUrl:', this.products[0]?.imageUrl);
            } catch (error) {
                if (requestId !== this.productsRequestId) return;
                console.error('Error fetching products:', error);
                this.showNotification('Error', 'Failed to load lessons. Please try again.');
            } finally {
                if (requestId === this.productsRequestId) this.loading = false;
            }
        },
        
        // Cart Management
        addItem(product) {
            if (product.spaces > 0) {
                this.cart.push({ 
                    ...product,
                    imageUrl: product.imageUrl || (this.baseUrl + product.image)
                });
                product.spaces--;
                this.saveCartToStorage();
                this.showNotification('Added to Cart', `${product.topic} has been added to your cart.`);
                
                // Update on server
                this.updateProductSpaces(product._id, product.spaces);
            }
        },
        
        incrementItem(item) {
            const product = this.products.find(p => p._id === item._id);
            if (product && product.spaces > 0) {
                this.cart.push({ 
                    ...product,
                    imageUrl: product.imageUrl || (this.baseUrl + product.image)
                });
                product.spaces--;
                this.saveCartToStorage();
                this.updateProductSpaces(product._id, product.spaces);
            }
        },
        
        decrementItem(item) {
            const index = this.cart.findIndex(cartItem => cartItem._id === item._id);
            if (index !== -1) {
                this.cart.splice(index, 1);
                const product = this.products.find(p => p._id === item._id);
                if (product) {
                    product.spaces++;
                    this.updateProductSpaces(product._id, product.spaces);
                }
                this.saveCartToStorage();
            }
        },
        
        clearCart() {
            this.cart.forEach(cartItem => {
                const product = this.products.find(p => p._id === cartItem._id);
                if (product) {
                    product.spaces++;
                }
            });
            this.cart = [];
            this.saveCartToStorage();
            this.showNotification('Cart Cleared', 'All items have been removed from your cart.');
        },
        
        async updateProductSpaces(productId, spaces) {
            try {
                // Use 'space' field for backward compatibility
                await fetch(`${this.baseUrl}/api/lessons/${productId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ space: spaces })
                });
            } catch (error) {
                console.error('Error updating product spaces:', error);
            }
        },
        
        // Order Management
        async submitOrder() {
            if (!this.isCheckoutEnabled || this.submitting) return;
            
            this.submitting = true;
            const lessons = this.groupedCart.map(item => ({
                lessonId: item._id,
                quantity: item.quantity
            }));
            
            const orderData = {
                name: this.name.trim(),
                phone: this.phone.trim(),
                lessons: lessons
            };
            
            try {
                const response = await fetch(`${this.baseUrl}/api/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || 'Failed to submit order');
                }
                
                // Success
                this.confirmationNumber = result.data.confirmationNumber;
                this.orderSubmitted = true;
                this.showSuccessModal();
                
                // Clear form
                this.cart = [];
                this.name = '';
                this.phone = '';
                this.saveCartToStorage();
                
                // Refresh products
                await this.fetchProducts();
                
            } catch (error) {
                console.error('Error submitting order:', error);
                this.showNotification('Error', error.message || 'Failed to submit order. Please try again.');
            } finally {
                this.submitting = false;
            }
        },
        
        // UI Methods
        toggleCart() {
            this.showCart = !this.showCart;
        },
        
        proceedToCheckout() {
            if (this.cart.length === 0) {
                this.showNotification('Cart Empty', 'Please add items to your cart before checkout.');
                return;
            }
            this.showCart = false;
            this.checkOutArea = true;
        },
        
        backToLessons() {
            this.checkOutArea = false;
            this.orderSubmitted = false;
        },
        
        showSuccessModal() {
            // Bootstrap modal would be shown here
            setTimeout(() => {
                const modal = new bootstrap.Modal(document.getElementById('successModal'));
                modal.show();
            }, 100);
        },
        
        resetAfterOrder() {
            this.orderSubmitted = false;
            this.checkOutArea = false;
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('successModal'));
            if (modal) modal.hide();
        },
        
        showNotification(title, message) {
            this.toastTitle = title;
            this.toastMessage = message;
            this.showToast = true;
            setTimeout(() => {
                this.showToast = false;
            }, 3000);
        },
        
        // Favorites
        toggleFavorite(productId) {
            const index = this.favorites.indexOf(productId);
            if (index > -1) {
                this.favorites.splice(index, 1);
            } else {
                this.favorites.push(productId);
            }
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
        },
        
        isFavorite(productId) {
            return this.favorites.includes(productId);
        },
        
        // Category Methods
        getCategoryLabel(topic) {
            const topicLower = topic.toLowerCase();
            if (topicLower.includes('math') || topicLower.includes('science') || topicLower.includes('technology')) {
                return 'STEM';
            } else if (topicLower.includes('art') || topicLower.includes('music') || topicLower.includes('drama')) {
                return 'Arts';
            } else if (topicLower.includes('sport') || topicLower.includes('football') || topicLower.includes('tennis')) {
                return 'Sports';
            } else if (topicLower.includes('english') || topicLower.includes('spanish') || topicLower.includes('french')) {
                return 'Languages';
            }
            return 'General';
        },
        
        getCategoryClass(topic) {
            const category = this.getCategoryLabel(topic);
            return `badge-${category.toLowerCase()}`;
        },
        
        // Validation
        validateName() {
            const nameRegex = /^[a-zA-Z\s'-]+$/;
            if (!this.name.trim()) {
                this.nameError = 'Name is required';
                return false;
            } else if (!nameRegex.test(this.name)) {
                this.nameError = 'Please enter a valid name';
                return false;
            }
            this.nameError = '';
            return true;
        },
        
        validatePhone() {
            const phoneRegex = /^[0-9]{10,11}$/;
            if (!this.phone.trim()) {
                this.phoneError = 'Phone number is required';
                return false;
            } else if (!phoneRegex.test(this.phone.replace(/\s/g, ''))) {
                this.phoneError = 'Please enter a valid UK phone number';
                return false;
            }
            this.phoneError = '';
            return true;
        },
        
        // Storage
        saveCartToStorage() {
            localStorage.setItem('cart', JSON.stringify(this.cart));
        },
        
        loadCartFromStorage() {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart).map(item => ({
                    ...item,
                    imageUrl: item.imageUrl || (this.baseUrl + (item.image || '/images/default.gif'))
                }));
            }
        },
        
        // Helper Methods
        canAddMore(item) {
            const product = this.products.find(p => p._id === item._id);
            return product && product.spaces > 0;
        },
        
        sortProducts() {
            this.currentPage = 1;
            this.fetchProducts();
        }
    },
    
    computed: {
        // Cart Computed Properties
        groupedCart() {
            const grouped = {};
            this.cart.forEach(product => {
                if (!grouped[product._id]) {
                    grouped[product._id] = { ...product, quantity: 0 };
                }
                grouped[product._id].quantity++;
            });
            return Object.values(grouped);
        },
        
        totalCartItems() {
            return this.cart.length;
        },
        
        cartTotal() {
            return this.cart.reduce((total, item) => total + item.price, 0);
        },
        
        // Products Computed Properties
        filteredProducts() {
            let filtered = this.products;
            
            // Category filter
            if (this.selectedCategory !== 'all') {
                filtered = filtered.filter(product => {
                    const category = this.getCategoryLabel(product.topic).toLowerCase();
                    return category === this.selectedCategory;
                });
            }
            
            return filtered;
        },
        
        paginatedLessons() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.filteredProducts.slice(start, end);
        },
        
        totalPages() {
            return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        },
        
        // Stats Computed Properties
        totalSpaces() {
            return this.products.reduce((total, product) => total + product.spaces, 0);
        },
        
        avgPrice() {
            if (this.products.length === 0) return '£0';
            const avg = this.products.reduce((sum, product) => sum + product.price, 0) / this.products.length;
            return `£${avg.toFixed(2)}`;
        },
        
        // Validation Computed Properties
        isCheckoutEnabled() {
            return this.cart.length > 0 && this.validateName() && this.validatePhone();
        }
    },
    
    watch: {
        searchQuery: {
            handler() {
                this.currentPage = 1;
                this.fetchProducts();
            },
            immediate: false
        },
        
        selectedCategory() {
            this.currentPage = 1;
        },
        
        name() {
            if (this.name) this.validateName();
        },
        
        phone() {
            if (this.phone) this.validatePhone();
        }
    }
});
