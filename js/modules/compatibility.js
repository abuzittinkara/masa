/**
 * @file compatibility.js
 * @description Browser compatibility module for the Modern Table Designer application.
 * Handles WebGL detection and provides warnings or polyfills for older browsers.
 */

/**
 * Checks if WebGL is available in the current browser.
 * @returns {boolean} True if WebGL is supported, false otherwise.
 */
function isWebGLAvailable() {
    try {
        // Create a temporary canvas element
        const canvas = document.createElement('canvas');
        // Try to get a WebGL rendering context
        return !!(window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        // If an error occurs (e.g., security restrictions), assume WebGL is not available
        return false;
    }
}

/**
 * Displays a warning message in the UI when WebGL is not supported.
 * It appends a styled div to the specified 3D canvas container.
 */
function showWebGLWarning() {
    var container = document.getElementById('table-3d-canvas'); // Target container for the 3D view
    if (!container) {
        console.error("WebGL warning: Container 'table-3d-canvas' not found.");
        return;
    }

    // Prevent adding multiple warnings
    if (container.querySelector('.webgl-warning')) {
        return;
    }

    // Create the warning message element
    var warningEl = document.createElement('div');
    warningEl.className = 'webgl-warning'; // For styling
    warningEl.innerHTML = `
        <div class="webgl-warning-content">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #facc15; margin-bottom: 1rem;"></i>
            <h3>WebGL Desteklenmiyor</h3>
            <p>Tarayıcınız 3D görüntüleme için gerekli olan WebGL teknolojisini desteklemiyor.</p>
            <p>Lütfen modern bir tarayıcı kullanın (örneğin Chrome, Firefox, Edge, Safari güncel sürümleri).</p>
        </div>
    `;
    container.appendChild(warningEl); // Add the warning to the container

    // Dynamically add styles for the warning message to ensure they are applied
    // This is useful if CSS might not be fully loaded or if styles are scoped.
    var style = document.createElement('style');
    style.textContent = `
        .webgl-warning {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(30, 30, 36, 0.9); /* Semi-transparent dark background */
            z-index: 100; /* Ensure it's on top */
            color: #ffffff; /* Default text color for the warning */
        }
        .webgl-warning-content {
            background: #121212; /* Dark background for the content box */
            border: 1px solid #6e56cf; /* Accent border */
            border-radius: 10px;
            padding: 2rem;
            text-align: center;
            max-width: 80%;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .webgl-warning-content h3 {
            margin-bottom: 0.75rem;
        }
        .webgl-warning-content p {
            font-size: 0.9rem;
            line-height: 1.5;
            color: #a0a0a0; /* Lighter text color for paragraphs */
        }
    `;
    document.head.appendChild(style); // Add styles to the document's head
}

/**
 * Checks for basic browser compatibility requirements.
 * Currently focuses on WebGL support and basic ES features like Promise.
 * @returns {object} An object containing compatibility flags (e.g., { webGLSupported: true }).
 */
function checkBrowserCompatibility() {
    // Check for a basic ES6 feature (Promise) as a proxy for modern browser capabilities.
    // Most browsers supporting WebGL will also support Promise.
    if (!window.Promise) {
        alert('Bu tarayıcı modern web teknolojilerini yeterince desteklemiyor. Lütfen Chrome, Firefox, Safari veya Edge tarayıcısının güncel bir sürümünü kullanınız.');
        // Depending on severity, you might want to halt execution or offer a limited experience.
    }

    const webGLSupported = isWebGLAvailable();

    return {
        webGLSupported: webGLSupported
    };
}

// Export the module's public API to the global window object
window.CompatibilityModule = {
    check: checkBrowserCompatibility,
    isWebGLAvailable: isWebGLAvailable, // Expose for direct checking if needed
    showWebGLWarning: showWebGLWarning
};
