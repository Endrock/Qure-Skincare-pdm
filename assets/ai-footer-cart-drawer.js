// Constants
const CART_ACTIONS = {
    ADD: 'cart/add.js',
    CHANGE: 'cart/change.js',
    UPDATE: 'cart/update.js',
    CLEAR: 'cart/clear.js',
    STATE: 'cart.js'
};

const CART_EVENTS = {
    REQUEST_COMPLETE: 'cart.requestComplete'
};

const CART_SOURCES = {
    ADD_TO_CART: 'addToCart',
    CHANGE_CART: 'changeCart',
    UPDATE_CART: 'updateCart',
    CLEAR_CART: 'clearCart'
};

const SELECTORS = {
    CART_FORMS: 'form[action$="/cart/add"]',
    CHANGE_FORMS: 'form[action$="/cart/change"]',
    INSURANCE_CHECKBOX: 'input[type="checkbox"]#insurance',
    INSURANCE_FORMS: 'form[action$="/cart/add"]:has(input[type="checkbox"]#insurance)',
    GIFT_FORMS: 'form.footer-cart-drawer-gift[action$="/cart/add"]',
    CART_DRAWER: '.offcanvas-end',
    CART_BTN: '#cartCanvasBtn',
    CART_COUNT: '.cart-count',
    CART_DYNAMIC_CONTENT: '#cart-dynamic-content',
    MAIN_CART_DYNAMIC_CONTENT: '#main-cart-dynamic-content',
    INSURANCE_ID: '#insurance_id'
};

// Utility functions
const getShopifyRoot = () => window.Shopify?.routes?.root || '/';

const createFormData = (data = {}) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        formData.set(key, value);
    });
    return formData;
};

const dispatchCartEvent = (source, detail = {}) => {
    const event = new CustomEvent(CART_EVENTS.REQUEST_COMPLETE, {
        detail: { source, ...detail }
    });
    document.dispatchEvent(event);
};

const handleApiError = (error, operation) => {
    console.error(`Error during ${operation}:`, error);
    return null;
};

// DOM manipulation utilities
const rebindForm = (form) => {
    if (form.getAttribute('data-static') === 'true') return;
    form.replaceWith(form.cloneNode(true));
};

const rebindAllForms = (selector) => {
    document.querySelectorAll(selector).forEach(rebindForm);
};

// Cart API functions
const fetchCartApi = async (endpoint, options = {}) => {
    try {
        const response = await fetch(getShopifyRoot() + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        return handleApiError(error, endpoint);
    }
};

const getCartState = async () => {
    try {
        const response = await fetch(getShopifyRoot() + CART_ACTIONS.STATE);
        const cart = await response.json();
        console.log('Cart state:', cart);
        return cart;
    } catch (error) {
        return handleApiError(error, 'fetching cart state');
    }
};

const addToCart = async (input, isGift = false) => {
    const result = await fetchCartApi(CART_ACTIONS.ADD, { body: input });
    
    if (result && !isGift) {
        await toggleGift();
    }
    
    return result;
};

const changeCart = async (input, isGift = false) => {
    const result = await fetchCartApi(CART_ACTIONS.CHANGE, { body: input });
    
    if (result && !isGift) {
        await toggleGift();
    }
    
    return result;
};

const updateCart = async (input) => {
    return await fetchCartApi(CART_ACTIONS.UPDATE, { body: input });
};

const clearCart = async () => {
    const result = await fetchCartApi(CART_ACTIONS.CLEAR);
    if (result) {
        dispatchCartEvent(CART_SOURCES.CLEAR_CART);
    }
    return result;
};

// Section update functionality
const updateSection = async (sectionId, targetElementId) => {
    const currentElement = document.getElementById(targetElementId);
    if (!currentElement) return;

    try {
        const response = await fetch(`/?section_id=${sectionId}`);
        const html = await response.text();
        
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        const newElement = temp.querySelector(`#${targetElementId}`);
        if (!newElement) return;

        morphdom(currentElement, newElement);
        
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    requestAnimationFrame(() => resolve());
                }, 0);
            });
        });
    } catch (error) {
        return handleApiError(error, 'updating section');
    }
};

// Cart drawer functionality
const showCart = () => {
    if (footer_cart_drawer_template !== 'cart') {
        const cartDrawer = document.querySelector(SELECTORS.CART_DRAWER);
        if (cartDrawer && !cartDrawer.classList.contains('show')) {
            document.querySelector(SELECTORS.CART_BTN)?.click();
        }
    }
};

const updateCartCount = async () => {
    const cart = await getCartState();
    if (cart) {
        const countElement = document.querySelector(SELECTORS.CART_COUNT);
        if (countElement) {
            countElement.textContent = cart.item_count;
        }
    }
};

const reloadCarousel = () => {
    document.querySelectorAll('slide-carousel').forEach(el => {
        el.QureSlideCarousel();
    });
};

// Insurance functionality
const handleInsuranceToggle = async (checkbox) => {
    const cart = await getCartState();
    if (!cart) return;

    const insuranceItem = cart.items.find(item => 
        item.title.includes('Shipping Insurance')
    );

    if (insuranceItem) {
        const removeData = createFormData({
            id: insuranceItem.id,
            quantity: 0
        });

        await changeCart(removeData, true);
        
        if (checkbox.checked) {
            const form = checkbox.closest('form');
            const formData = new FormData(form);
            await addToCart(formData, true);
        }
    } else if (checkbox.checked) {
        const form = checkbox.closest('form');
        const formData = new FormData(form);
        await addToCart(formData, true);
    }
};

const bindInsuranceForms = () => {
    document.querySelectorAll(SELECTORS.INSURANCE_FORMS).forEach(form => {
        const checkbox = form.querySelector(SELECTORS.INSURANCE_CHECKBOX);
        if (!checkbox) return;

        checkbox.addEventListener('change', () => {
            handleInsuranceToggle(checkbox);
        });
    });
};

// Gift functionality
const toggleGift = async () => {
    const cart = await getCartState();
    if (!cart) return;

    const forms = document.querySelectorAll(SELECTORS.GIFT_FORMS);
    if (forms.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return;
    }

    for (const form of forms) {
        const formData = new FormData(form);
        const priceLimit = formData.get('properties[_price_limit]');
        const itemId = formData.get('id');

        const giftItem = cart.items.find(item => 
            item.id === +itemId && 
            item.properties?.['_required_validation']
        );

        if (!giftItem && cart.total_price >= priceLimit) {
            await addToCart(formData, true);
        } else if (giftItem && cart.total_price < priceLimit) {
            formData.set('quantity', 0);
            await changeCart(formData, true);
        }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
};

// Form binding
const bindCartForms = () => {
    // Clear and rebind add to cart forms
    rebindAllForms(SELECTORS.CART_FORMS);
    
    document.querySelectorAll(SELECTORS.CART_FORMS).forEach(form => {
        if (form.getAttribute('data-static') === 'true') return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            await addToCart(formData);
        });
    });

    // Clear and rebind change cart forms
    rebindAllForms(SELECTORS.CHANGE_FORMS);
    
    document.querySelectorAll(SELECTORS.CHANGE_FORMS).forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            await changeCart(formData);
        });
    });
};

const bindForms = () => {
    bindCartForms();
    bindInsuranceForms();
};

// Main cart reload functionality
const reloadDrawer = async (event) => {
    const { source, input } = event.detail;

    try {
        await updateSection('footer-cart-drawer', 'cart-dynamic-content');
        
        if (source === CART_SOURCES.ADD_TO_CART) {
            showCart();
        }

        if (source === CART_SOURCES.CHANGE_CART && typeof syncCart === 'function') {
            syncCart(input);
        }

        await updateCartCount();
        bindForms();
        reloadCarousel();
        
    } catch (error) {
        handleApiError(error, 'reloading drawer');
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', bindForms);

document.addEventListener(CART_EVENTS.REQUEST_COMPLETE, async (event) => {
    if (footer_cart_drawer_template === 'cart') {
        try {
            await updateSection('cart', 'main-cart-dynamic-content');
            await reloadDrawer(event);
        } catch (error) {
            handleApiError(error, 'updating cart section');
        }
    } else {
        await reloadDrawer(event);
    }
});

// Export functions for global access
window.CartDrawer = {
    addToCart,
    changeCart,
    updateCart,
    clearCart,
    getCartState,
    showCart,
    toggleGift
};