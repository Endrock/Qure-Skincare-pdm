document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form[action$="/cart/add"]').forEach((form) => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            addToCart(formData);
        });
    });

    document.querySelectorAll('form[action$="/cart/change"]').forEach((form) => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            changeCart(formData);
        });
    });
});


document.addEventListener('cart.requestComplete', (e) => {
    const cart = e.detail.cart;
    const source = e.detail.source;
    document.querySelector('.cart-count').textContent = cart.item_count;

    if (source === 'addToCart') {
        reloadCart();
        showCart();
    }

    if (source === 'changeCart') {
        reloadCart();
    } 
});

const reloadCart = () => {
    const targetElement = 'cart-dynamic-content';
    const currentDrawer = document.getElementById(targetElement);
    if (!currentDrawer) return;

    fetch('/?section_id=footer-cart-drawer')
        .then(res => res.text())
        .then(html => {
            const temp = document.createElement('div');
            temp.innerHTML = html;

            const newDrawer = temp.querySelector('#' + targetElement);
            if (!newDrawer) return;

            morphdom(currentDrawer, newDrawer);
        });
};

const showCart = () => {
    const cartDrawer = document.querySelector('.offcanvas-end');
    if (cartDrawer && !cartDrawer.classList.contains('show')) {
        document.getElementById('cartCanvasBtn')?.click();
    }
};

const addToCart = (input) => {
    fetch((window.Shopify?.routes?.root || '/') + 'cart/add.js', {
        method: 'POST',
        body: input
    })
        .then(response => response.json())
        .then((addedItem) => {
            return fetch((window.Shopify?.routes?.root || '/') + 'cart.js')
                .then(res => res.json())
                .then(cart => {
                    const event = new CustomEvent('cart.requestComplete', { detail: { cart: cart, source: 'addToCart' } });
                    document.dispatchEvent(event);
                    console.log('The product was added to the cart:', addedItem);
                });
        })
        .catch((error) => {
            console.error('Error cart adding:', error);
        });
};

const changeCart = (input) => {
    fetch((window.Shopify?.routes?.root || '/') + 'cart/change.js', {
        method: 'POST',
        body: input
    })
    .then(response => response.json())
    .then(updatedCart => {
        const event = new CustomEvent('cart.requestComplete', { detail: { cart: updatedCart, source: 'changeCart' } });
        document.dispatchEvent(event);
        console.log('The cart was changed:', updatedCart);
    })
    .catch((error) => {
        console.error('Error cart updating:', error);
    });
};


const clearCart = () => {
    fetch((window.Shopify?.routes?.root || '/') + 'cart/clear.js', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
        .then(response => response.json())
        .then(cart => {
            const event = new CustomEvent('cart.requestComplete', { detail: { cart: cart, source: 'clearCart' } });
            document.dispatchEvent(event);
            console.log('Cart cleared:', cart);
        })
        .catch(error => {
            console.error('Error clearing cart:', error);
        });
}


const getCartState = () => {
    fetch((window.Shopify?.routes?.root || '/') + 'cart.js')
        .then(response => response.json())
        .then(cart => {
            console.log('Cart state:', cart);
        })
        .catch(error => {
            console.error('Error fetching cart:', error);
        });
}