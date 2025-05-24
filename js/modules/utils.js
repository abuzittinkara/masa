/**
 * @file utils.js
 * @description Utility functions for the Modern Table Designer application
 * Contains helper functions and general utilities like throttling, pricing, etc.
 */

/**
 * Throttle function to limit how often a function is called.
 * Useful for event listeners like scroll or resize.
 * @param {Function} func - The function to throttle.
 * @param {number} limit - The time limit in milliseconds (e.g., 100ms).
 * @returns {Function} A throttled version of the input function.
 */
function throttle(func, limit) {
    var inThrottle; // Flag to track if the function is currently in throttle period
    return function() {
        var args = arguments; // Capture arguments of the original function
        var context = this;   // Capture the context (this) of the original function
        if (!inThrottle) {
            func.apply(context, args); // Execute the function
            inThrottle = true; // Set throttle flag
            setTimeout(function() {
                inThrottle = false; // Reset throttle flag after the limit
            }, limit);
        }
    };
}

/**
 * Debounce function to delay function execution until after wait time has elapsed.
 * Useful for input events where you want to wait for user to stop typing/sliding.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The time to wait in milliseconds (e.g., 300ms).
 * @returns {Function} A debounced version of the input function.
 */
function debounce(func, wait) {
    var timeout;
    return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

/**
 * Updates the price display in the UI based on selected options.
 * This function reads values directly from the DOM.
 */
function updatePricing() {
    // Base price for the table
    var basePrice = 1500; // Example base price

    // Adjust price based on selected material
    var selectedMaterialElement = document.querySelector('.material-item.selected');
    if (selectedMaterialElement) {
        if (selectedMaterialElement.classList.contains('material-ebene')) {
            basePrice += 300; // Ebony is more expensive
        } else if (selectedMaterialElement.classList.contains('material-mogano')) {
            basePrice += 200; // Mahogany is also more expensive
        }
        // Add more material cost adjustments as needed
    }

    // Adjust price based on table size (dimensions)
    var tableWidthInput = document.querySelector('input[data-dimension="width"]');
    var tableLengthInput = document.querySelector('input[data-dimension="length"]');

    if (tableWidthInput && tableLengthInput) {
        var tableWidth = parseFloat(tableWidthInput.value);
        var tableLength = parseFloat(tableLengthInput.value);
        var area = tableWidth * tableLength;
        var standardArea = 109 * 150; // Standard area for base price

        if (area > standardArea) {
            // Add cost for larger sizes, e.g., 0.1 units of currency per cm² over standard
            basePrice += Math.round((area - standardArea) * 0.1);
        }
    }
    // Add price adjustments for height or thickness if needed

    // Calculate cost of selected features
    var featuresPrice = 0;
    document.querySelectorAll('.feature-checkbox:checked').forEach(function(featureCheckbox) {
        var priceElement = featureCheckbox.nextElementSibling.querySelector('.feature-price');
        if (priceElement) {
            // Extract price from text like "+350 ₺"
            var priceText = priceElement.textContent.replace(/[^\d]/g, ''); // Remove non-digits
            featuresPrice += parseInt(priceText) || 0; // Add to features price
        }
    });

    // Update the pricing display in the summary section
    var basePriceDisplay = document.querySelector('.pricing-summary .price-row:nth-child(1) .price-value');
    var featuresPriceDisplay = document.querySelector('.pricing-summary .price-row:nth-child(2) .price-value');
    var totalPriceDisplay = document.querySelector('.pricing-summary .price-row.total .price-value');

    if (basePriceDisplay) basePriceDisplay.textContent = `${basePrice} ₺`;
    if (featuresPriceDisplay) featuresPriceDisplay.textContent = `${featuresPrice} ₺`;
    if (totalPriceDisplay) totalPriceDisplay.textContent = `${basePrice + featuresPrice} ₺`;
}

/**
 * Updates the dimensions label in the UI (e.g., "109×150 cm").
 * @param {number} width - Table width in cm.
 * @param {number} length - Table length in cm.
 */
function updateDimensionsLabel(width, length) {
    var badge = document.querySelector('.dimensions-badge');
    if (badge) {
        badge.textContent = `${width.toFixed(0)}×${length.toFixed(0)} cm`;
    }
}

/**
 * Updates dimension value display with proper units (mm for thickness < 1cm, cm otherwise).
 * @param {string} dimension - The dimension type ('width', 'length', 'height', 'thickness').
 * @param {number} value - The dimension value.
 */
function updateDimensionDisplay(dimension, value) {
    var valueDisplay = document.querySelector(`[data-dimension="${dimension}"] + .dimension-value`);
    if (valueDisplay) {
        if (dimension === 'thickness' && value < 1) {
            valueDisplay.textContent = (value * 10).toFixed(0) + ' mm';
        } else {
            valueDisplay.textContent = value.toFixed(0) + ' cm';
        }
    }
}

/**
 * Initializes scroll reveal animations for elements with the '.reveal' class.
 * Elements become visible as they are scrolled into view.
 */
function initScrollReveal() {
    var revealElements = document.querySelectorAll('.reveal'); // Get all elements to reveal

    function revealOnScroll() {
        revealElements.forEach(function(element) {
            var elementTop = element.getBoundingClientRect().top; // Element's position relative to viewport
            var elementVisibleThreshold = 150; // How much of the element needs to be visible to trigger

            if (elementTop < window.innerHeight - elementVisibleThreshold) {
                element.classList.add('active'); // Add 'active' class to trigger animation
            }
            // Optional: Add logic to remove 'active' class if element scrolls out of view upwards
            // else { element.classList.remove('active'); }
        });
    }

    // Apply throttling to the scroll event handler for better performance
    window.addEventListener('scroll', throttle(revealOnScroll, 100));

    // Call initially to reveal elements already in view on page load
    revealOnScroll();
}

// Export the module's public API to the global window object
window.UtilsModule = {
    throttle,
    debounce,
    updatePricing,
    updateDimensionsLabel,
    updateDimensionDisplay,
    initScrollReveal
};
