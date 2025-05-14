// Initialize cart from localStorage
function initCart() {
    console.log("initCart: Initializing cart...");
    // Step 1: Load and validate cartItems
    let tempCartItems = [];
    const storedCartItems = localStorage.getItem('cartItems');
    console.log("initCart: storedCartItems from localStorage:", storedCartItems);
    if (storedCartItems) {
        try {
            const parsedItems = JSON.parse(storedCartItems);
            if (Array.isArray(parsedItems)) {
                // Filter out any potentially malformed items to prevent errors downstream
                tempCartItems = parsedItems.filter(item => 
                    item && typeof item.productId !== 'undefined' && 
                    typeof item.name !== 'undefined' && // Ensure name exists
                    typeof item.price !== 'undefined' && // Ensure price exists
                    typeof item.quantity !== 'undefined' && !isNaN(parseInt(item.quantity))
                );
                if (tempCartItems.length !== parsedItems.length) {
                    console.warn("initCart: Some cart items from localStorage were malformed and have been filtered out.");
                }
            } else {
                console.warn("initCart: cartItems from localStorage was not an array. Resetting cart.");
                localStorage.removeItem('cartItems'); // Clear invalid item to prevent repeated errors
            }
        } catch (e) {
            console.error("initCart: Error parsing cartItems from localStorage. Resetting cart.", e);
            localStorage.removeItem('cartItems'); // Clear corrupted item
        }
    }
    cartItems = tempCartItems; // Assign to global cartItems
    console.log("initCart: cartItems after loading and validation:", JSON.stringify(cartItems));

    // Step 2: Recalculate cartCount based on the definitive, validated cartItems.
    cartCount = cartItems.reduce((total, currentItem) => {
        const quantity = parseInt(currentItem.quantity);
        // Add quantity if it's a positive number, otherwise add 0
        return total + (isNaN(quantity) || quantity < 0 ? 0 : quantity);
    }, 0);
    console.log("initCart: Recalculated cartCount:", cartCount);

    // Step 3: Persist the corrected cartCount
    // This ensures cartCount in localStorage is always accurate based on cartItems.
    localStorage.setItem('cartCount', cartCount.toString());
    console.log("initCart: cartCount saved to localStorage:", cartCount.toString());

    // Step 4: Update UI elements with the definitive cartCount
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
    
    const itemsCountElements = document.querySelectorAll('.items-count');
    itemsCountElements.forEach(element => {
        element.textContent = cartCount; // Uses the recalculated, non-negative count
    });
    
    // Step 5: Call displayCartItems to render the cart list and update summary details
    // This function has an internal check for the cart items list element, so it's safe to call.
    console.log("initCart: Calling displayCartItems().");
    displayCartItems(); 
    console.log("initCart: Calling updateShippingInfoOnCartPage().");
    updateShippingInfoOnCartPage(); // Update shipping info if on cart page
    console.log("initCart: Cart initialization complete.");
}

// Add product to cart
function addToCart(productName, price) {
    // Remove dollar sign and convert to number
    const cleanPrice = parseFloat(price.replace('$', ''));
    
    const item = {
        name: productName,
        price: cleanPrice,
        id: Date.now(),
        quantity: parseInt(document.getElementById('quantity')?.textContent || '1')
    };
    
    cartItems.push(item);
    cartCount++;
    
    // Update UI if elements exist
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
    
    const itemsCountElements = document.querySelectorAll('.items-count');
    itemsCountElements.forEach(element => {
        element.textContent = cartCount;
    });
    
    // Save to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    localStorage.setItem('cartCount', cartCount.toString());
    
    // Show confirmation message
    showCartNotification(productName);
}

// Core function to add item to cart with all details
function executeAddToCart(productId, productName, price, productImage, quantity, color, size) {
    console.log("executeAddToCart: Attempting to add item:", { productId, productName, price, quantity, color, size });
    // Add this check at the beginning:
    if (!productId || typeof productName === 'undefined' || productName === null || typeof price === 'undefined' || price === null) {
        console.error('executeAddToCart: Attempted to add item with missing critical data.', { productId, productName, price });
        // Optionally, provide user feedback. An alert can be disruptive.
        // alert('Error: Could not add item to cart due to missing product information.');
        return; // Prevent adding a malformed item
    }

    console.log("Adding to cart: ", productId, productName, price, quantity, color, size);
    const cleanPrice = parseFloat(String(price).replace('$', '').replace('PHP', '').trim());

    let validQuantity = parseInt(quantity);
    if (isNaN(validQuantity) || validQuantity <= 0) { // Ensure quantity is at least 1
        validQuantity = 1; 
    }
    
    // Ensure color is in a consistent format
    // This will normalize various RGB representations
    const normalizedColor = color ? color.trim() : '';

    const existingItemIndex = cartItems.findIndex(item =>
        item.productId === productId && item.color === normalizedColor && item.size === size
    );    if (existingItemIndex > -1) {
        let currentItemQuantity = parseInt(cartItems[existingItemIndex].quantity);
        if (isNaN(currentItemQuantity) || currentItemQuantity < 0) { // Handle existing bad data
            currentItemQuantity = 0;
        }
        cartItems[existingItemIndex].quantity = currentItemQuantity + validQuantity;
    } else {
        const newItem = {
            cart_item_id: Date.now(), // Unique ID for this specific entry in the cart
            productId: productId,
            name: productName,
            price: cleanPrice,
            image: productImage,
            quantity: validQuantity, // Use validated positive quantity
            color: normalizedColor,
            size: size
        };
        cartItems.push(newItem);
        console.log("executeAddToCart: Item added to cartItems array:", newItem);
    }

    // Update total cart count (sum of quantities)
    cartCount = cartItems.reduce((total, currentItem) => {
        const itemQty = parseInt(currentItem.quantity);
        // Add itemQty if it's a positive number, otherwise add 0
        return total + (isNaN(itemQty) || itemQty < 0 ? 0 : itemQty); 
    }, 0); 
    console.log("executeAddToCart: Updated cartCount:", cartCount);

    // Update UI
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }

    const itemsCountElements = document.querySelectorAll('.items-count');
    itemsCountElements.forEach(element => {
        element.textContent = cartCount;
    });

    // Save to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    localStorage.setItem('cartCount', cartCount.toString());
    console.log("executeAddToCart: cartItems saved to localStorage:", JSON.stringify(cartItems));
    console.log("executeAddToCart: cartCount saved to localStorage:", cartCount.toString());

    // Show confirmation message with proper color name
    showCartNotification(`${productName} (${size}, ${colorToDisplay(normalizedColor)}) added to cart`);
    console.log("executeAddToCart: Add to cart process complete for item:", productId);
}

// Function to handle placing an order
function placeOrderAndClearCart() {
    if (cartItems.length === 0) {
        alert("Your cart is empty. Please add items before placing an order.");
        return;
    }

    const selectedPaymentMethodInput = document.querySelector('input[name="payment"]:checked');
    const paymentMethod = selectedPaymentMethodInput ? selectedPaymentMethodInput.value.toUpperCase() : 'GCASH'; // Default to GCASH

    const orders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    const newOrder = {
        orderId: 'AEV-' + Date.now(), // Simple unique order ID
        orderDate: new Date().toISOString(),
        items: [...cartItems], // Copy current cart items
        totalAmount: cartItems.reduce((total, item) => {
            const product = products[item.productId] || { price: item.price }; // Get price from products or item itself
            return total + (parseFloat(product.price) * parseInt(item.quantity));
        }, 0),
        paymentMethod: paymentMethod, // Add payment method to order
        status: 'Processing' // Default status
    };

    orders.push(newOrder);
    localStorage.setItem('userOrders', JSON.stringify(orders));

    // Clear cart
    cartItems = [];
    cartCount = 0;
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    localStorage.setItem('cartCount', cartCount.toString());

    // Update UI for cart count immediately (though user is redirecting)
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
    const itemsCountElements = document.querySelectorAll('.items-count');
    itemsCountElements.forEach(element => {
        element.textContent = cartCount;
    });
    displayCartItems(); // Refresh cart display on current page if needed before redirect

    // Redirect to thank you page
    alert('Order placed successfully! Thank you for your purchase.\nOrder ID: ' + newOrder.orderId + '\nPayment Method: ' + paymentMethod);
    // window.location.href = 'thank-you.html'; // Uncomment to redirect
}

// New function to clear all user orders from localStorage
function clearAllUserOrders() {
    if (confirm("Are you sure you want to remove ALL order history? This action cannot be undone.")) {
        localStorage.removeItem('userOrders');
        alert("All order history has been removed.");

        // If currently on the orders page (orders.html), refresh the display
        // Check for a unique element on orders.html, like the order-list container
        if (document.querySelector('.orders-content .order-list')) {
            loadOrders(); // loadOrders will display "You have no current orders."
        }
    } else {
        alert("Order history removal cancelled.");
    }
}

// Function to load and display orders on orders.html
function loadOrders() {
    const orderListDiv = document.querySelector('.orders-content .order-list');
    if (!orderListDiv) {
        // Not on the orders page or the specific div isn't found
        return;
    }

    const orders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    orderListDiv.innerHTML = ''; // Clear previous content

    if (orders.length === 0) {
        orderListDiv.innerHTML = '<p>You have no current orders.</p>';
        return;
    }

    orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)); // Show newest orders first

    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-item'; // Use existing .order-item class if styled
        
        let itemsHtml = '<div class="order-items-summary">';
        order.items.forEach(item => {
            const imageUrl = item.image && item.image !== '#' ? item.image : 'https://via.placeholder.com/50x50.png?text=No+Img';
            itemsHtml += `
                <div class="order-item-summary-entry">
                    <img src="${imageUrl}" alt="${item.name}" style="width:50px; height:50px; object-fit:cover; margin-right:10px;">
                    <span>${item.name} (Qty: ${item.quantity}, Size: ${item.size}, Color: ${colorToDisplay(item.color)}) - $${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        });
        itemsHtml += '</div>';

        orderElement.innerHTML = `
            <div class="order-header">
                <h3>Order ID: ${order.orderId}</h3>
                <p>Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            ${itemsHtml}
            <div class="order-footer">
                <p>Total: $${order.totalAmount.toFixed(2)}</p>
                <p class="order-status">Status: <strong>${order.status}</strong></p>
            </div>
        `;
        orderListDiv.appendChild(orderElement);
    });
}

// Display cart notification
function showCartNotification(messageText, isRemoval = false) {
    const existingNotifications = document.querySelectorAll('.cart-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const message = document.createElement('div');
    message.className = 'cart-notification';
    message.textContent = messageText;
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.backgroundColor = isRemoval ? '#d32f2f' : '#000000'; // Red for removal, black for adding
    message.style.color = '#ffffff';
    message.style.padding = '15px 20px';
    message.style.borderRadius = '4px';
    message.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    message.style.zIndex = '1000';
    message.style.transition = 'opacity 0.3s ease';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

// Display cart items in the cart page
function displayCartItems() {
    console.log("displayCartItems: Attempting to display cart items.");
    const cartItemsList = document.getElementById('cartItemsList');
    if (!cartItemsList) {
        console.log("displayCartItems: cartItemsList element not found. Not on cart page or element missing.");
        return;
    }

    cartItemsList.innerHTML = ''; // Clear previous items
    console.log("displayCartItems: Cleared cartItemsList content.");

    if (!cartItems || cartItems.length === 0) {
        console.log("displayCartItems: cartItems is empty or null. Displaying 'Your cart is empty.'");
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-cart-message';
        emptyMessage.textContent = 'Your cart is empty.';
        cartItemsList.appendChild(emptyMessage);
        updateCartSummaryDetails(0, 0); // Update summary for empty cart
        return;
    }

    console.log("displayCartItems: Rendering cart items. Current cartItems:", JSON.stringify(cartItems));

    let totalAmount = 0;
    let totalItemsCount = 0; 

    cartItems.forEach((item, index) => {
        console.log(`displayCartItems: Processing item at index ${index}:`, JSON.stringify(item));
        // Defensive check for each item's structure
        if (!item || typeof item.productId === 'undefined' ||
            typeof item.name === 'undefined' || item.name === null ||
            typeof item.price === 'undefined' || item.price === null ||
            typeof item.quantity === 'undefined') {
            console.warn(`displayCartItems: Skipping malformed cart item at index ${index}:`, item);
            return; // Skips this iteration of forEach
        }

        // Use product details from the global 'products' object, with a fallback to item's own data
        const productInfo = products[item.productId] || { name: item.name, price: item.price, image: item.image };
        
        let itemPrice = parseFloat(String(productInfo.price).replace(/[^0-9.-]+/g, '')); // More robust parsing for price
        let itemQuantity = parseInt(item.quantity);

        if (isNaN(itemPrice) || itemPrice < 0) {
            console.warn(`displayCartItems: Invalid price for item at index ${index}:`, item, `ProductInfo price: ${productInfo.price}, Parsed price: ${itemPrice}`);
            itemPrice = 0; // Default to 0 to avoid NaN in totalAmount
        }
        if (isNaN(itemQuantity) || itemQuantity <= 0) {
            console.warn(`displayCartItems: Invalid quantity for item at index ${index}:`, item, `Parsed quantity: ${itemQuantity}`);
            return; // Do not display items with zero or invalid quantity
        }

        const itemTotal = itemPrice * itemQuantity;
        totalAmount += itemTotal;
        totalItemsCount += itemQuantity;

        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item-row';
        const cartItemId = item.cart_item_id || `temp_id_${Date.now()}_${index}`; // Ensure unique ID for DOM operations
        cartItemElement.dataset.cartItemId = cartItemId;

        const imageUrl = productInfo.image || item.image || 'https://via.placeholder.com/80x80.png?text=No+Image';
        const productName = productInfo.name || 'Unknown Product';
        
        let colorDisplay = item.color ? colorToDisplay(item.color) : '';
        let sizeDisplay = item.size || '';
        let variantDisplay = '';
        if (colorDisplay && sizeDisplay) {
            variantDisplay = `<p class="cart-item-variant">${colorDisplay}, ${sizeDisplay}</p>`;
        } else if (colorDisplay) {
            variantDisplay = `<p class="cart-item-variant">${colorDisplay}</p>`;
        } else if (sizeDisplay) {
            variantDisplay = `<p class="cart-item-variant">${sizeDisplay}</p>`;
        }

        cartItemElement.innerHTML = `
            <div class="cart-item-image-container">
                <img src="${imageUrl}" alt="${productName}" class="cart-item-image">
            </div>
            <div class="cart-item-info">
                <p class="cart-item-name">${productName}</p>
                ${variantDisplay}
            </div>
            <div class="cart-item-quantity-controls">
                <button class="quantity-btn" onclick="updateCartItemQuantity('${cartItemId}', 'decrease')">-</button>
                <span class="cart-item-quantity">${itemQuantity}</span>
                <button class="quantity-btn" onclick="updateCartItemQuantity('${cartItemId}', 'increase')">+</button>
            </div>
            <div class="cart-item-price">PHP ${itemPrice.toFixed(2)}</div>
            <div class="cart-item-total">PHP ${itemTotal.toFixed(2)}</div>
            <div class="cart-item-remove">
                <button class="remove-btn" onclick="removeFromCart('${cartItemId}')">✕</button>
            </div>
        `;
        cartItemsList.appendChild(cartItemElement);
        console.log(`displayCartItems: Appended item ${item.productId} to cartItemsList.`);
    });

    updateCartSummaryDetails(totalItemsCount, totalAmount);
    console.log("displayCartItems: Finished displaying cart items. Total items:", totalItemsCount, "Total amount:", totalAmount);
}

function updateCartItemQuantity(cartItemId, action) {
    const itemIndex = cartItems.findIndex(item => String(item.cart_item_id) === String(cartItemId));
    if (itemIndex === -1) return;

    let currentQuantity = parseInt(cartItems[itemIndex].quantity);
    if (isNaN(currentQuantity) || currentQuantity < 0) currentQuantity = 0; // Sanitize

    if (action === 'increase') {
        currentQuantity++;
    } else if (action === 'decrease') {
        currentQuantity = Math.max(0, currentQuantity - 1); // Prevent negative quantity
    }

    if (currentQuantity === 0) {
        // If quantity becomes 0, remove the item
        cartItems.splice(itemIndex, 1);
    } else {
        cartItems[itemIndex].quantity = currentQuantity;
    }
    
    // Recalculate total cart count (sum of quantities of all unique items)
    cartCount = cartItems.reduce((total, currentItem) => {
        const itemQty = parseInt(currentItem.quantity);
        return total + (isNaN(itemQty) || itemQty < 0 ? 0 : itemQty);
    }, 0);

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    localStorage.setItem('cartCount', cartCount.toString());

    // Update UI elements for overall cart count
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
    const itemsCountElements = document.querySelectorAll('.items-count');
    itemsCountElements.forEach(element => {
        element.textContent = cartCount;
    });

    displayCartItems(); // Refresh the entire cart display including summary
}

function updateCartSummaryDetails(totalItems, totalAmount) {
    const itemsCountElements = document.querySelectorAll('.items-count');
    itemsCountElements.forEach(element => {
        element.textContent = totalItems;
    });

    // Update the total amount in the order summary
    const orderSummaryTotalElement = document.getElementById('orderSummaryTotalAmount');
    if (orderSummaryTotalElement) {
        orderSummaryTotalElement.textContent = `PHP ${totalAmount.toFixed(2)}`;
    }
}

// Remove item from cart
function removeFromCart(cartItemId) { // Changed parameter to cart_item_id for consistency
    const itemIndex = cartItems.findIndex(item => String(item.cart_item_id) === String(cartItemId));
    
    if (itemIndex !== -1) {
        const removedItem = cartItems.splice(itemIndex, 1)[0];
        // cartCount was already updated by summing quantities in updateCartItemQuantity
        // If called directly, we need to ensure cartCount is correctly decremented by the item's quantity
        const removedQuantity = parseInt(removedItem.quantity);
        if (!isNaN(removedQuantity) && removedQuantity > 0) {
            cartCount -= removedQuantity;
        } else {
            // Fallback if quantity was bad, assume 1 if not specified or invalid
            cartCount -=1; 
        }
        cartCount = Math.max(0, cartCount); // Ensure cartCount doesn't go negative


        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        localStorage.setItem('cartCount', cartCount.toString());
        
        // Update UI
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
        }
        
        const itemsCountElements = document.querySelectorAll('.items-count');
        itemsCountElements.forEach(element => {
            element.textContent = cartCount;
        });
        
        displayCartItems(); // Refresh cart display
        
        // Show removal notification (optional, can be styled better)
        showCartNotification(`${removedItem.name} removed from cart`, true); // Pass true for removal style
    }
}

function handleFormSubmit(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Store form data
    localStorage.setItem(`form_${formId}`, JSON.stringify(data));
    
    // Clear form
    form.reset();
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'form-success';
    successMessage.textContent = 'Form submitted successfully';
    form.appendChild(successMessage);
    
    setTimeout(() => successMessage.remove(), 3000);
    
    return false;
}

function changeColor(element, color) {
    element.style.color = color;
}

function validateContactForm() {
    const form = document.getElementById('contactForm');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    
    const errors = [];
    
    if (!name) errors.push('Name is required');
    if (!email) errors.push('Email is required');
    if (!message) errors.push('Message is required');
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (errors.length > 0) {
        const errorList = errors.join('\n');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = errorList;
        form.insertBefore(errorDiv, form.firstChild);
        
        setTimeout(() => errorDiv.remove(), 5000);
        return false;
    }
    
    // Process the form
    const formData = {
        name,
        email,
        message,
        timestamp: new Date().toISOString()
    };
    
    // Store in localStorage for demo purposes
    const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    messages.push(formData);
    localStorage.setItem('contactMessages', JSON.stringify(messages));
    
    // Clear form
    form.reset();
    
    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = 'Message sent successfully!';
    form.insertBefore(successDiv, form.firstChild);
    
    setTimeout(() => successDiv.remove(), 3000);
    
    return false;
}

// Cart state management
let cartItems = [];
let cartCount = 0;

// Sample product data (replace with actual data source/API call)
const products = {
    'top1': { name: 'BOXY FIT OVERSHIRT', price: '2400.00', image: 'https://static.zara.net/assets/public/666d/fe28/a07e4c6eaa07/96361fd1525a/07484553800-e3/07484553800-e3.jpg?ts=1737714778103&w=563', description: 'AIRism Cotton Crew Neck Striped T-Shirt' },
    'top2': { name: 'PAINT SPLATTER JACKET', price: '6000.00', image: 'https://static.zara.net/assets/public/3be3/e7bf/2b2841588187/c85895629b1d/08527207400-e3/08527207400-e3.jpg?ts=1738916404274&w=563', description: 'Description for Top 2.' },
    'top3': { name: 'TOPSTITCHED DENIM JACKET', price: '6000.00', image: 'https://static.zara.net/assets/public/bd22/141c/b39741d3b33c/d373ee6f72e4/04048491405-e3/04048491405-e3.jpg?ts=1737707200899&w=563", alt="Knitted Short Sleeve Polo Sweater', description: 'Description for Top 3.' },
    'top4': { name: 'TEXTURED JACQUARD T-SHIRT', price: '1490.00', image: 'https://static.zara.net/assets/public/1688/bf9a/9a0c4c039de2/4d44ba679c9f/04087400502-e3/04087400502-e3.jpg?ts=1737028986697&w=563', description: 'Description for Top 4.' },
    'top5': { name: 'BASIC HEAVY WEIGHT T-SHIRT', price: '1990.00', image: 'https://static.zara.net/assets/public/6442/27f8/67e64e7e889b/da6bb996d855/01887455807-e3/01887455807-e3.jpg?ts=1739197162850&w=563', description: 'Description for Top 5.' },
    'top6': { name: 'Basic Line T-Shirt', price: '1990.00', image: 'https://static.zara.net/assets/public/c5fd/816f/0baf4c8f8c34/3101d1699c61/00761412251-e3/00761412251-e3.jpg?ts=1737452357782&w=563', description: 'Description for Top 6.' },
    'bottom1': { name: 'Wide Straight Jeans', price: '1990.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/470542/sub/goods_470542_sub14_3x4.jpg?width=423', description: 'Wide Straight Jeans.' },
    'bottom2': { name: 'Geard Pants', price: '1990.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/463981/sub/goods_463981_sub14_3x4.jpg?width=423', description: 'Geard Pants.' },
    'bottom3': { name: 'Sweat Wide Pants', price: '1990.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/461420/sub/goods_461420_sub14_3x4.jpg?width=369', description: 'Sweat Wide Pants.' },
    'bottom4': { name: 'OVERSIZED FIT DENIM BERMUDA SHORTS', price: '790.00', image: 'https://static.zara.net/assets/public/34f9/10c0/127049eb868c/ce1861c913c1/04806425406-e3/04806425406-e3.jpg?ts=1744625964753&w=563', description: 'Wide Fit Chino Pants.' },
    'bottom5': { name: 'Denim Work Shorts', price: '1290.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/477206/sub/goods_477206_sub14_3x4.jpg?width=423', description: 'Denim Work Shorts.' },
    'bottom6': { name: 'Geard Shorts', price: '1290.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/477165/sub/goods_477165_sub14_3x4.jpg?width=423', description: 'Geard Shorts.' },
    'shoe1': { name: 'Suede Combination Sneakers', price: '1490.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/475346/item/goods_09_475346_3x4.jpg?width=423', description: 'Suede Combination Sneakers.' },
    'shoe2': { name: 'Slide Sandals', price: '1490.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/475513/item/goods_57_475513_3x4.jpg?width=423', description: 'Slide Sandals.' },
    'accessory1': { name: 'Metal Oval Sunglasses', price: '990.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/477068/item/goods_05_477068_3x4.jpg?width=423', description: 'Metal Oval Sunglasses.' },
    'accessory2': { name: 'Double Bridge Sunglasses', price: '990.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/476535/item/goods_34_476535_3x4.jpg?width=423', description: 'Double Bridge Sunglasses.' },
    'accessory3': { name: 'Crown Panto Sunglasses', price: '990.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/475139/item/goods_09_475139_3x4.jpg?width=423', description: 'Crown Panto Sunglasses.' },
    'accessory4': { name: 'Boston Combination Sunglasses', price: '990.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/475133/item/goods_07_475133_3x4.jpg?width=423', description: 'Boston Combination Sunglasses.' },
    'accessory5': { name: 'Adjustable UV Protection Wide Brim Hat', price: '1490.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/475178/item/goods_34_475178_3x4.jpg?width=423', description: 'Adjustable UV Protection Wide Brim Hat.' },
    'accessory6': { name: 'UV Protection Cap Twill', price: '990.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/470010/item/goods_31_470010_3x4.jpg?width=423', description: 'UV Protection Cap Twill.' },
    'bag1': { name: 'Multi Pocket Shoulder Bag', price: '1490.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/476764/item/goods_57_476764_3x4.jpg?width=423', description: 'Multi Pocket Shoulder Bag.' },
    'bag2': { name: 'Crossbody Bag', price: '990.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/476641/item/goods_56_476641_3x4.jpg?width=423', description: 'Crossbody Bag.' },
    'bag3': { name: 'Soft Puffy Shoulder Bag', price: '1490.00', image: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/475638/item/goods_15_475638_3x4.jpg?width=423', description: 'Soft Puffy Shoulder Bag.' },
};

function selectProduct(buttonElement, size) {
    // Get all size buttons within the same parent container
    const buttons = buttonElement.parentNode.querySelectorAll('button');
    // Remove 'selected' style/class from all buttons
    buttons.forEach(btn => {
        btn.classList.remove('selected'); // Remove class for style consistency
        btn.style.border = '1px solid #ccc'; // Reset border to default
    });

    // Add 'selected' style/class to the clicked button
    buttonElement.classList.add('selected'); // Add class for style consistency
    buttonElement.style.border = '2px solid black'; // Highlight border

    // Optional: Store selected size if needed elsewhere (e.g., for adding to cart)
    console.log("Selected size:", size); // Simple feedback
}

let selectedColor = null; // Variable to store the selected color

function selectColor(element) {
    // Remove selected class from all color swatches
    const colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
        swatch.classList.remove('selected');
        // Reset border for white/silver swatch if it was selected, to its specific default
        if (swatch.style.backgroundColor === 'white') {
            swatch.style.border = '1px solid #ccc';
        } else if (swatch.style.backgroundColor === 'silver') {
            swatch.style.border = '1px solid #666666'; // Assuming silver also needs a specific default if not #666
        } else {
            swatch.style.border = '1px solid #666666'; // Default border for others
        }
    });

    // Add selected class to the clicked swatch
    element.classList.add('selected');
    // Ensure selected swatch gets a prominent border
    element.style.border = '2px solid #000000'; // Standard selected border for all

    // Get the color in the most reliable format
    selectedColor = element.style.backgroundColor;
    
    // For debugging
    console.log("Selected color:", selectedColor);
    console.log("Display color:", colorToDisplay(selectedColor));
    
    // Update product details or cart data with selectedColor
}

function updateQuantity(action) {
    const quantityElement = document.getElementById('quantity');
    let currentQuantity = parseInt(quantityElement.textContent);
    const maxQuantity = parseInt(quantityElement.dataset.max || '99');
    
    if (action === 'increase' && currentQuantity < maxQuantity) {
        currentQuantity++;
    } else if (action === 'decrease' && currentQuantity > 1) {
        currentQuantity--;
    }
    
    quantityElement.textContent = currentQuantity;
    
    // Update price if needed
    const pricePerUnit = parseFloat(quantityElement.dataset.price || '0');
    const totalPrice = (pricePerUnit * currentQuantity).toFixed(2);
    const totalPriceElement = document.getElementById('totalPrice');
    if (totalPriceElement) {
        totalPriceElement.textContent = `$${totalPrice}`;
    }
}

function submitReview() {
    const username = document.getElementById('username').value.trim();
    const reviewText = document.getElementById('review').value.trim();
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    
    const errors = [];
    
    if (!username) errors.push('Name is required');
    if (!reviewText) errors.push('Review text is required');
    if (!rating) errors.push('Please select a rating');
    
    if (errors.length > 0) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'review-error';
        errorDiv.textContent = errors.join('\n');
        const form = document.getElementById('reviewForm');
        form.insertBefore(errorDiv, form.firstChild);
        
        setTimeout(() => errorDiv.remove(), 5000);
        return false;
    }
    
    const review = {
        username,
        review: reviewText,
        rating: parseInt(rating),
        date: new Date().toISOString()
    };
    
    // Store review
    const reviews = JSON.parse(localStorage.getItem('productReviews') || '[]');
    reviews.push(review);
    localStorage.setItem('productReviews', JSON.stringify(reviews));
    
    // Clear form
    document.getElementById('reviewForm').reset();
    
    // Add review to page
    const reviewsList = document.getElementById('reviewsList');
    if (reviewsList) {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'review-item';
        reviewElement.innerHTML = `
            <div class="review-header">
                <span class="review-author">${username}</span>
                <span class="review-rating">${'★'.repeat(parseInt(rating))}</span>
            </div>
            <div class="review-content">${reviewText}</div>
            <div class="review-date">${new Date().toLocaleDateString()}</div>
        `;
        reviewsList.insertBefore(reviewElement, reviewsList.firstChild);
    }
    
    return false;
}

function toggleElement(clickedLinkElement, targetSectionId) {
    // Select all product sections within .product-grid that have a data-category attribute
    const productSections = document.querySelectorAll('.product-grid > div[data-category]');
    const navLinks = document.querySelectorAll('.category-nav a');

    // Hide all product sections first
    productSections.forEach(section => {
        section.classList.add('category-hidden');
    });

    // Show the target product section
    const targetSection = document.getElementById(targetSectionId);
    if (targetSection) {
        targetSection.classList.remove('category-hidden');
    } else {
        // Log an error if the target section ID doesn't exist in the HTML
        console.error(`Product section with ID '${targetSectionId}' not found.`);
    }

    // Update active class on navigation links
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    if (clickedLinkElement) {
        clickedLinkElement.classList.add('active');
    }
}

// Load product details on product.html
function loadProductDetails() {
    // Check if we are on the product page
    if (!document.body.classList.contains('product-page-body')) {
        // Add a class to the body in product.html to identify it
        const productDetailElement = document.querySelector('.product-detail');
        if (!productDetailElement) {
            return; // Not the product page
        }
        document.body.classList.add('product-page-body');
    }

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id') || 'top1'; // Default to top1 if no ID provided

    if (!productId || !products[productId]) {
        // Handle product not found - display a message or redirect
        const productInfo = document.querySelector('.product-info');
        if (productInfo) {
            productInfo.innerHTML = '<h1>Product not found</h1><p>Sorry, the product you are looking for does not exist.</p><a href="shop.html">Back to Shop</a>';
        }
        const productImage = document.querySelector('.product-image-large');
        if (productImage) {
            productImage.innerHTML = ''; // Clear image area
        }
        return;
    }

    const product = products[productId];

    // Update product image
    const imgElement = document.querySelector('.product-image-large .product-img');
    if (imgElement) {
        imgElement.src = product.image;
        imgElement.alt = product.name;
    }

    // Update product name
    const nameElement = document.querySelector('.product-info .product-name');
    if (nameElement) {
        nameElement.textContent = product.name;
    }

    // Update product price
    const priceElement = document.querySelector('.product-info .product-price');
    if (priceElement) {
        // Changed to PHP currency format
        priceElement.textContent = `PHP ${parseFloat(product.price).toFixed(2)}`;
    }    // Show/hide color and size options based on product type
    const colorOptionsDiv = document.querySelector('.product-detail .product-options .color-options');
    const sizeOptionsDiv = document.querySelector('.product-detail .product-options .size-options');

    if (productId.startsWith('accessory')) {
        if (colorOptionsDiv) colorOptionsDiv.style.display = 'none';
        if (sizeOptionsDiv) sizeOptionsDiv.style.display = 'none';
    } else {
        if (colorOptionsDiv) colorOptionsDiv.style.display = ''; // Reset to default (visible)
        if (sizeOptionsDiv) sizeOptionsDiv.style.display = ''; // Reset to default (visible)
        
        // Special handling for shoe sizes
        if (productId.startsWith('shoe') && sizeOptionsDiv) {
            // Update size buttons for shoes
            const sizeButtonsContainer = sizeOptionsDiv.querySelector('.size-buttons');
            if (sizeButtonsContainer) {
                sizeButtonsContainer.innerHTML = `
                    <button class="size-button" data-size="36" onclick="selectProduct(this, '36')">36</button>
                    <button class="size-button" data-size="37" onclick="selectProduct(this, '37')">37</button>
                    <button class="size-button" data-size="38" onclick="selectProduct(this, '38')">38</button>
                    <button class="size-button" data-size="39" onclick="selectProduct(this, '39')">39</button>
                    <button class="size-button" data-size="40" onclick="selectProduct(this, '40')">40</button>
                    <button class="size-button" data-size="41" onclick="selectProduct(this, '41')">41</button>
                    <button class="size-button" data-size="42" onclick="selectProduct(this, '42')">42</button>
                    <button class="size-button" data-size="43" onclick="selectProduct(this, '43')">43</button>
                `;
            }
        }
        
        // Auto-select first color option if available
        if (colorOptionsDiv) {
            const firstColorSwatch = colorOptionsDiv.querySelector('.color-swatch');
            if (firstColorSwatch) {
                selectColor(firstColorSwatch);
            }
        }
        
        // Auto-select first size option if available
        if (sizeOptionsDiv) {
            const firstSizeButton = sizeOptionsDiv.querySelector('.size-button');
            if (firstSizeButton) {
                selectProduct(firstSizeButton, firstSizeButton.getAttribute('data-size'));
            }
        }
    }

    // Update Add to Cart and Buy Now buttons
    const addToCartButton = document.querySelector('.product-actions .add-to-cart');
    if (addToCartButton) {
        addToCartButton.onclick = function() {
            // Get selected size and color or use default if not applicable
            const selectedSizeBtn = document.querySelector('.size-button.selected');
            const selectedColorSwatch = document.querySelector('.color-swatch.selected');
            
            const size = selectedSizeBtn ? selectedSizeBtn.getAttribute('data-size') : '';
            const color = selectedColorSwatch ? selectedColorSwatch.style.backgroundColor : '';
            
            // Get quantity from the quantity element or default to 1
            const quantityElement = document.getElementById('quantity');
            const quantity = quantityElement ? quantityElement.textContent : 1;
            
            executeAddToCart(productId, product.name, product.price, product.image, quantity, color, size);
            alert('Item added to cart!');
        };
    }

    const buyNowButton = document.querySelector('.product-actions .buy-now');
    if (buyNowButton) {
        buyNowButton.onclick = function() {
            // Get selected size and color or use default if not applicable
            const selectedSizeBtn = document.querySelector('.size-button.selected');
            const selectedColorSwatch = document.querySelector('.color-swatch.selected');
            
            const size = selectedSizeBtn ? selectedSizeBtn.getAttribute('data-size') : '';
            const color = selectedColorSwatch ? selectedColorSwatch.style.backgroundColor : '';
            
            // Get quantity from the quantity element or default to 1
            const quantityElement = document.getElementById('quantity');
            const quantity = quantityElement ? quantityElement.textContent : 1;
            
            executeAddToCart(productId, product.name, product.price, product.image, quantity, color, size);
            window.location.href = 'cart.html';
        };
    }

    // Optional: Update page title
    document.title = `${product.name} - Aevera E-commerce`;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded, initializing cart...");
    initCart(); // This will also call displayCartItems

    // ... (rest of your DOMContentLoaded, e.g., loadProductDetails, loadOrders, etc.)
    if (document.body.classList.contains('product-page-body') || window.location.pathname.includes('product.html')) {
        console.log("Loading product details...");
        loadProductDetails();
    }
    if (document.querySelector('.orders-content .order-list')) {
        loadOrders();
    }
    if (document.getElementById('loginForm') && document.getElementById('signupForm')) {
        initAuthForms();
    }
    if (document.getElementById('accountDetails') && document.getElementById('noProfileMessage')) {
        loadUserProfile();
    }
    // updateShippingInfo is more generic, updateShippingInfoOnCartPage is specific for cart.html static info
    // If a general dynamic update is needed on other pages, that can be called separately.
    // Example: if (document.querySelector('.some-other-page-shipping-info')) updateShippingInfo();
});

// Authentication Forms Functionality
function initAuthForms() {
    // Check if we're on the auth page
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (!loginForm || !signupForm) return;
    
    // Toggle between login and signup forms
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');
    
    showSignupLink.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });
    
    showLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
      // Handle login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');
        
        // Reset error message
        errorElement.textContent = '';
        errorElement.classList.remove('active');
        
        // Basic validation
        const errors = [];
        
        if (!email) {
            errors.push('Email address is required');
        } else if (!isValidEmail(email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!password) {
            errors.push('Password is required');
        }
        
        if (errors.length > 0) {
            errorElement.textContent = errors.join('\n');
            errorElement.classList.add('active');
            return;
        }
          // For frontend demo only - simulate successful login
        alert('Login successful (Frontend Demo)');
        loginForm.reset();
        
        // Redirect to account page after successful login
        window.location.href = 'account.html';
    });
    
    // Handle signup form submission
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const phone = document.getElementById('signup-phone').value.trim();
        const street = document.getElementById('signup-street').value.trim();
        const city = document.getElementById('signup-city').value.trim();
        const state = document.getElementById('signup-state').value.trim();
        const postalCode = document.getElementById('signup-postal').value.trim();
        const country = document.getElementById('signup-country').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const errorElement = document.getElementById('signup-error');
        
        // Reset error message
        errorElement.textContent = '';
        errorElement.classList.remove('active');
        
        // Basic validation
        const errors = [];
        
        if (!name) errors.push('Full name is required');
        
        if (!email) {
            errors.push('Email address is required');
        } else if (!isValidEmail(email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!phone) {
            errors.push('Phone number is required');
        }
        
        if (!street) errors.push('Street address is required');
        if (!city) errors.push('City is required');
        if (!state) errors.push('State/Province is required');
        if (!postalCode) errors.push('Postal code is required');
        if (!country) errors.push('Country is required');
        
        if (!password) {
            errors.push('Password is required');
        } else if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        if (password !== confirmPassword) {
            errors.push('Passwords do not match');
        }
          if (errors.length > 0) {
            errorElement.textContent = errors.join('\n');
            errorElement.classList.add('active');
            return;
        }
        
        // Store user information in localStorage
        const userProfile = {
            name: name,
            email: email,
            phone: phone,
            address: {
                street: street,
                city: city,
                state: state,
                postalCode: postalCode,
                country: country
            },
            registrationDate: new Date().toISOString()
        };
        
        // Save user profile to localStorage
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        // For frontend demo only - simulate successful registration
        alert('Account created successfully! (Frontend Demo)');
        signupForm.reset();
        
        // Redirect to account page after successful registration
        window.location.href = 'account.html';
    });
}

// Load and display user profile information on account page
function loadUserProfile() {
    // Check if we're on the account page
    const accountDetails = document.getElementById('accountDetails');
    const noProfileMessage = document.getElementById('noProfileMessage');
    
    if (!accountDetails || !noProfileMessage) return;
    
    // Get user profile from localStorage
    const storedProfile = localStorage.getItem('userProfile');
    
    if (storedProfile) {
        // User profile exists, display it
        const profile = JSON.parse(storedProfile);
        
        // Update the DOM with profile information
        document.getElementById('profileName').textContent = profile.name || 'Not available';
        document.getElementById('profileEmail').textContent = profile.email || 'Not available';
        document.getElementById('profileStreet').textContent = profile.address?.street || 'Not available';
        document.getElementById('profileCity').textContent = profile.address?.city || 'Not available';
        document.getElementById('profileState').textContent = profile.address?.state || 'Not available';
        document.getElementById('profilePostal').textContent = profile.address?.postalCode || 'Not available';
        document.getElementById('profileCountry').textContent = profile.address?.country || 'Not available';
        
        // Show account details and hide no profile message
        accountDetails.style.display = 'block';
        noProfileMessage.style.display = 'none';
        
        // Set up logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to log out?')) {
                    // Remove the profile from localStorage
                    localStorage.removeItem('userProfile');
                    alert('Logged out successfully');
                    window.location.href = 'index.html';
                }
            });
        }
    } else {
        // No user profile found, show message
        accountDetails.style.display = 'none';
        noProfileMessage.style.display = 'block';
    }
}

// Helper function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Update shipping information on cart and order pages
function updateShippingInfo() {
    // Check if we're on a page with shipping information
    const addressInfo = document.querySelector('.address-info');
    
    if (!addressInfo) return;
    
    // Get user profile from localStorage
    const storedProfile = localStorage.getItem('userProfile');
    
    if (storedProfile) {
        // User profile exists, display shipping information
        const profile = JSON.parse(storedProfile);
        
        // Create formatted address
        const formattedAddress = `
            <p><strong>${profile.name}</strong></p>
            <p>${profile.address?.street || ''}</p>
            <p>${profile.address?.city || ''}, ${profile.address?.state || ''} ${profile.address?.postalCode || ''}</p>
            <p>${profile.address?.country || ''}</p>
        `;
        
        // Create contact information
        const contactInfo = `
            <p><strong>Email:</strong> ${profile.email || ''}</p>
        `;
        
        // Update the address-info container
        addressInfo.innerHTML = formattedAddress + contactInfo;
    } else {
        // No user profile found, show default message
        addressInfo.innerHTML = `
            <p>No shipping information available.</p>
            <p>Please <a href="auth.html">login or create an account</a> to continue.</p>
        `;
    }
}

function updatePaymentMethodDisplay(method) {
    const paymentMethodDisplayElement = document.getElementById('paymentMethodDisplay');
    if (paymentMethodDisplayElement) {
        paymentMethodDisplayElement.textContent = method;
    }
}

// Helper function to get displayable color name (e.g., from 'rgb(0, 0, 0)' to 'Black')
function colorToDisplay(colorValue) {
    if (!colorValue) return '';
    
    // Expanded mapping for colors including RGB values and hex codes
    const colorMap = {
        // Basic colors
        'black': 'Black',
        'rgb(0, 0, 0)': 'Black',
        '#000000': 'Black',
        'rgb(0,0,0)': 'Black',
        
        'white': 'White',
        'rgb(255, 255, 255)': 'White',
        '#ffffff': 'White',
        '#fff': 'White',
        'rgb(255,255,255)': 'White',
        
        // Off-whites and creams
        'rgb(253, 255, 250)': 'Off-White',
        'rgb(253,255,250)': 'Off-White',
        '#fdfffa': 'Off-White',
        'rgb(250, 249, 246)': 'Cream',
        'rgb(255, 253, 208)': 'Ivory',
        'rgb(245, 245, 220)': 'Beige',
        
        // Light colors from our product page
        '#eef1e8': 'Light Gray',
        'rgb(238, 241, 232)': 'Light Gray',
        
        // Blue colors from our product page
        '#0799d3': 'Blue',
        'rgb(7, 153, 211)': 'Blue',
        
        // Other colors that might be used
        'rgb(255, 255, 0)': 'Yellow',
        '#ffff00': 'Yellow',
        'yellow': 'Yellow',
        'rgb(255, 192, 203)': 'Pink',
        '#ffc0cb': 'Pink',
        'pink': 'Pink',
        'rgb(128, 0, 128)': 'Purple',
        '#800080': 'Purple',
        'purple': 'Purple',
        'rgb(255, 165, 0)': 'Orange',
        '#ffa500': 'Orange',
        'orange': 'Orange',
        'rgb(0, 255, 255)': 'Cyan',
        'rgb(255, 0, 255)': 'Magenta',
        'rgb(75, 0, 130)': 'Indigo',
        'rgb(238, 130, 238)': 'Violet'
    };
    
    // If input is null or undefined
    if (!colorValue) return '';
    
    // Convert to lowercase string
    const normalizedColor = colorValue.toString().toLowerCase().trim();
    
    // Try direct lookup first
    if (colorMap[normalizedColor]) {
        return colorMap[normalizedColor];
    }
    
    // For RGB values not in the map, try to find closest named color
    if (normalizedColor.startsWith('rgb(')) {
        try {
            // Extract RGB values - handle both rgb(0, 0, 0) and rgb(0,0,0) formats
            const rgbMatch = normalizedColor.match(/rgb\((\d+),?\s*(\d+),?\s*(\d+)\)/i);
            if (rgbMatch) {
                // Try different RGB formats
                const formats = [
                    `rgb(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]})`,
                    `rgb(${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]})`
                ];
                
                for (const format of formats) {
                    if (colorMap[format]) {
                        return colorMap[format];
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing RGB value:", e);
        }
    }
    
    // For hex values, try some normalization
    if (normalizedColor.startsWith('#')) {
        const hexLower = normalizedColor.toLowerCase();
        if (colorMap[hexLower]) {
            return colorMap[hexLower];
        }
    }
    
    // If we couldn't find a match, return a more user-friendly display
    if (normalizedColor.startsWith('rgb(')) {
        return 'Custom Color';
    } else if (normalizedColor.startsWith('#')) {
        return 'Custom Color';
    }
    
    return colorValue; // Return original value if no match found
}

function updateShippingInfoOnCartPage() {
    const userInfoSection = document.querySelector('.cart-content .user-info');
    const addressDetailsDiv = document.querySelector('.cart-content .user-info .address-details');
    
    if (!userInfoSection || !addressDetailsDiv) return;
    
    // Get user profile from localStorage
    const storedProfile = localStorage.getItem('userProfile');
    
    if (storedProfile) {
        // User profile exists, display shipping information
        const profile = JSON.parse(storedProfile);
        
        // Show simplified shipping info based on the image provided
        addressDetailsDiv.innerHTML = `
            <p><strong>${profile.name || 'AMELIA Salvador'}</strong></p>
            <p>${profile.phone || '+639560456878'}</p>
            <p>${profile.address?.street || '123, Mabuhay Street'}, ${profile.address?.city || 'Barangay Commonwealth'}, ${profile.address?.state || 'Quezon City'}, ${profile.address?.country || 'Metro Manila, Philippines'}, ${profile.address?.postalCode || '112'}</p>
        `;
        
        userInfoSection.style.display = 'block'; // Make sure it's visible
    } else {
        // No user profile found, show a prompt to create an account
        userInfoSection.innerHTML = `
            <h2>Shipping Information</h2>
            <div class="no-shipping-info">
                <p>Please <a href="auth.html">create an account</a> or <a href="auth.html">log in</a> to provide shipping information.</p>
            </div>
        `;
    }
}

// Product description display
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the shop page
    const isShopPage = window.location.pathname.includes('shop.html');
    
    if (isShopPage) {
        // Get all product items
        const productItems = document.querySelectorAll('.product-item');
        
        // Add functionality to each product item
        productItems.forEach(item => {
            const description = item.querySelector('.product-description');
            if (!description) return;
            
            // Initially hide descriptions for cleaner look
            description.style.display = 'none';
            
            // Show on hover
            item.addEventListener('mouseenter', function() {
                description.style.display = 'block';
            });
            
            // Hide when not hovering
            item.addEventListener('mouseleave', function() {
                description.style.display = 'none';
            });
            
            // Prevent description click from navigating
            description.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded, initializing cart...");
    initCart(); // This will also call displayCartItems

    // ... (rest of your DOMContentLoaded, e.g., loadProductDetails, loadOrders, etc.)
    if (document.body.classList.contains('product-page-body') || window.location.pathname.includes('product.html')) {
        console.log("Loading product details...");
        loadProductDetails();
    }
    if (document.querySelector('.orders-content .order-list')) {
        loadOrders();
    }
    if (document.getElementById('loginForm') && document.getElementById('signupForm')) {
        initAuthForms();
    }
    if (document.getElementById('accountDetails') && document.getElementById('noProfileMessage')) {
        loadUserProfile();
    }
});