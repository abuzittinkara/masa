/**
 * @file controls.js
 * @description Camera and UI controls module for the Modern Table Designer application
 * Handles all user interactions with the 3D view
 */

// Module state
let camera, controls; // These will be initialized by initControls
let zoomLevel = 5; // Default zoom level

/**
 * Initializes the camera controls (OrbitControls).
 * @param {THREE.Camera} sceneCamera - The Three.js camera to control.
 * @param {THREE.Renderer} renderer - The Three.js renderer (its DOM element is used by OrbitControls).
 * @returns {THREE.OrbitControls} The created OrbitControls instance.
 */
function initControls(sceneCamera, renderer) {
    camera = sceneCamera; // Store camera reference

    // Create and configure OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooths out camera movement
    controls.dampingFactor = 0.1; // How much damping
    controls.rotateSpeed = 0.5; // Speed of rotation
    controls.minDistance = 2; // Minimum zoom distance
    controls.maxDistance = 10; // Maximum zoom distance
    controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below the ground plane
    controls.autoRotate = true; // Enable auto-rotation
    controls.autoRotateSpeed = 0.5; // Speed of auto-rotation (slow showcase)

    // Initialize UI control elements (buttons, sliders)
    initUIControls();

    return controls; // Return the controls instance
}

/**
 * Updates the controls on each animation frame.
 * Required if enableDamping or autoRotate is used.
 */
function update() {
    if (controls) {
        controls.update(); // Update OrbitControls
    }
}

/**
 * Initializes all UI control elements by attaching event listeners.
 * @private
 */
function initUIControls() {
    initRotationControls();
    initViewControls();
    initZoomControls();
}

/**
 * Initializes the rotation control buttons (only reset button now).
 * @private
 */
function initRotationControls() {
    document.querySelectorAll('.control-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            var direction = btn.dataset.rotate; // Get rotation direction from data attribute

            if (!controls) return; // Ensure controls are initialized

            switch (direction) {
                case 'reset':
                    resetTableView(); // Reset to default view
                    break;
                // Removed left, right, up, down cases - arrow buttons removed from UI
            }
        });
    });
}

/**
 * Initializes the view control buttons (perspective, top, side).
 * @private
 */
function initViewControls() {
    document.querySelectorAll('.view-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var view = btn.dataset.view; // Get view type from data attribute

            if (!controls) return;

            // Remove 'active' class from all view buttons
            document.querySelectorAll('.view-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            // Add 'active' class to the clicked button
            btn.classList.add('active');

            switch(view) {
                case 'perspective':
                    setPerspectiveView();
                    break;
                case 'top':
                    setTopView();
                    break;
                case 'side':
                    setSideView();
                    break;
            }
        });
    });
}

/**
 * Initializes the zoom control slider and buttons.
 * @private
 */
function initZoomControls() {
    const zoomSlider = document.getElementById('zoom-slider');

    if (zoomSlider) {
        zoomSlider.addEventListener('input', function() {
            zoomLevel = parseInt(zoomSlider.value); // Update zoom level from slider
            updateZoom(); // Apply zoom
        });
    }

    document.querySelectorAll('.zoom-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var zoomType = btn.dataset.zoom; // 'in' or 'out'

            if (zoomType === 'in' && zoomLevel < 10) {
                zoomLevel += 1; // Zoom in
            } else if (zoomType === 'out' && zoomLevel > 2) {
                zoomLevel -= 1; // Zoom out
            }

            if (zoomSlider) {
                zoomSlider.value = zoomLevel; // Update slider position
            }
            updateZoom(); // Apply zoom
        });
    });
}

/**
 * Updates the camera zoom based on the current zoomLevel.
 * This implementation adjusts the camera's distance from the target.
 * @private
 */
function updateZoom() {
    if (!camera || !controls) return;

    // Set camera distance based on zoom level.
    // Higher zoomLevel means closer view (smaller distance).
    var distance = 12 - zoomLevel; // Adjust this formula as needed for desired zoom range
    var currentDirection = new THREE.Vector3();
    // Get the current direction from target to camera
    currentDirection.subVectors(camera.position, controls.target).normalize();

    // Set new camera position along the current direction at the new distance
    camera.position.copy(controls.target).addScaledVector(currentDirection, distance);
    controls.update(); // Important to apply changes
}


// rotateTable function removed - arrow buttons no longer exist in UI

/**
 * Resets the table view to the default perspective.
 */
function resetTableView() {
    if (!camera || !controls) return;

    // Default camera position for a good perspective view
    camera.position.set(3, 2.8, 3);
    controls.target.set(0, 0, 0); // Ensure target is at the origin
    camera.lookAt(0, 0, 0); // Make camera look at the origin

    controls.update();
}

/**
 * Sets the view to a standard perspective angle.
 */
function setPerspectiveView() {
    resetTableView(); // Uses the same settings as reset
}

/**
 * Sets the view to a top-down (orthographic-like) perspective.
 */
function setTopView() {
    if (!camera || !controls) return;

    camera.position.set(0, 5, 0.01); // Position directly above, slight Z offset to avoid gimbal lock issues with lookAt
    controls.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);

    controls.update();
}

/**
 * Sets the view to a side perspective.
 */
function setSideView() {
    if (!camera || !controls) return;

    camera.position.set(4, 0.5, 0); // Position from the side, slightly elevated
    controls.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);

    controls.update();
}

/**
 * Handles window resize events to adjust camera aspect ratio.
 * This function is typically called from main.js's onWindowResize.
 * @param {Element} container - The container element whose dimensions are used.
 */
function handleResize(container) {
    if (!camera || !container) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix(); // Essential after changing aspect ratio
}

// Export the module's public API
window.ControlsModule = {
    init: initControls,
    update,
    // Individual control functions are mostly internal, managed by UI event listeners.
    // Expose specific view functions if they need to be called from elsewhere.
    resetTableView,
    setPerspectiveView,
    setTopView,
    setSideView,
    handleResize // Expose if main.js needs to call this directly
};
