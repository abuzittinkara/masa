// Modern Table Designer - Interactive Script with Three.js Implementation

// Check for browser compatibility
(function() {
    // Polyfill for older browsers
    if (!window.Promise) {
        alert('Bu tarayıcı modern web teknolojilerini desteklemiyor. Lütfen Chrome, Firefox, Safari veya Edge tarayıcısı kullanınız.');
    }
})();

// Detect WebGL support
function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

// Globals for Three.js
var scene, camera, renderer, controls, tableModel;
var tableWidth = 109; // Default dimensions (cm)
var tableLength = 150;
var tableHeight = 75;
var currentMaterial = 'ceviz';
var edgeStyle = 'straight';
var legStyle = 'standard';
var isModelLoaded = false;
var webGLSupported = isWebGLAvailable();

// Initialize zoom controls
var zoomLevel = 5;

document.addEventListener('DOMContentLoaded', function() {
    // Loading animation
    var loadingScreen = document.querySelector('.loading-screen');
    
    // Show WebGL warning if not supported
    if (!webGLSupported) {
        showWebGLWarning();
        // Still allow UI to load without 3D features
        setTimeout(function() {
            loadingScreen.classList.add('hidden');
            setTimeout(function() {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1000);
        return;
    }
    
    // Simulate loading time for UI elements
    setTimeout(function() {
        loadingScreen.classList.add('hidden');
        setTimeout(function() {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 2000);

    // Initialize Three.js scene
    initThreeJS();
    
    // Control buttons for rotation
    document.querySelectorAll('.control-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            var direction = btn.dataset.rotate;
            
            if (!controls) return;
            
            switch (direction) {
                case 'left':
                    rotateTable(-0.3, 0);
                    break;
                case 'right':
                    rotateTable(0.3, 0);
                    break;
                case 'up':
                    rotateTable(0, -0.2);
                    break;
                case 'down':
                    rotateTable(0, 0.2);
                    break;
                case 'reset':
                    resetTableView();
                    break;
            }
        });
    });
    
    // View buttons
    document.querySelectorAll('.view-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var view = btn.dataset.view;
            
            if (!controls) return;
            
            // Remove active class from all view buttons
            document.querySelectorAll('.view-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active class to clicked button
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
    
    // Material selection
    document.querySelectorAll('.material-item').forEach(function(item) {
        item.addEventListener('click', function() {
            // Remove selected class from all items
            document.querySelectorAll('.material-item').forEach(i => {
                i.classList.remove('selected');
            });
            
            // Add selected class to clicked item
            item.classList.add('selected');
            
            // Get material type from class
            var classes = item.classList;
            for (const className of classes) {
                if (className.startsWith('material-')) {
                    currentMaterial = className.replace('material-', '');
                    break;
                }
            }
            
            // Update table materials - force recreate model with new material
            createTableModel();
            
            // Update pricing
            updatePricing();
        });
    });
    
    // Dimension sliders
    document.querySelectorAll('input[type="range"]').forEach(function(slider) {
        slider.addEventListener('input', function() {
            var dimension = slider.dataset.dimension;
            var value = parseInt(slider.value);
            var valueDisplay = slider.closest('.dimension-row').querySelector('.dimension-value');
            
            // Update the display value
            valueDisplay.textContent = `${value} cm`;
            
            // Update dimensions variable
            switch(dimension) {
                case 'width':
                    tableWidth = value;
                    break;
                case 'length':
                    tableLength = value;
                    break;
                case 'height':
                    tableHeight = value;
                    break;
            }
            
            // Update the dimension label in the preview
            updateDimensionsLabel();
            
            // Update table dimensions in the 3D model
            updateTableDimensions();
            
            // Update pricing
            updatePricing();
        });
    });
    
    function updateDimensionsLabel() {
        document.querySelector('.dimensions-badge').textContent = `${tableWidth}×${tableLength} cm`;
    }
    
    // Style options
    document.querySelectorAll('.style-option').forEach(function(option) {
        option.addEventListener('click', function() {
            // Get the group of options this belongs to
            const group = option.parentElement;
            
            // Remove selected class from all options in this group
            group.querySelectorAll('.style-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Update style variables based on the data attribute
            if (option.hasAttribute('data-edge')) {
                edgeStyle = option.dataset.edge;
            } else if (option.hasAttribute('data-leg')) {
                legStyle = option.dataset.leg;
            }
            
            // Apply style changes to 3D model by directly recreating it
            createTableModel();
            
            // Update pricing
            updatePricing();
        });
    });
    
    // Features checkboxes
    document.querySelectorAll('.feature-checkbox').forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            updatePricing();
        });
    });
    
    function updatePricing() {
        // Base price
        let basePrice = 1500;
        
        // Add material cost
        const selectedMaterial = document.querySelector('.material-item.selected');
        if (selectedMaterial.classList.contains('material-ebene')) {
            basePrice += 300; // Ebony is more expensive
        } else if (selectedMaterial.classList.contains('material-mogano')) {
            basePrice += 200; // Mahogany is more expensive
        }
        
        // Add size cost
        const area = tableWidth * tableLength;
        const standardArea = 109 * 150;
        
        if (area > standardArea) {
            basePrice += Math.round((area - standardArea) * 0.1);
        }
        
        // Calculate features cost
        let featuresPrice = 0;
        document.querySelectorAll('.feature-checkbox:checked').forEach(feature => {
            const priceElement = feature.nextElementSibling.querySelector('.feature-price');
            const price = parseInt(priceElement.textContent.replace(/[^\d]/g, ''));
            featuresPrice += price;
        });
        
        // Update the pricing display
        document.querySelector('.pricing-summary .price-row:nth-child(1) .price-value').textContent = `${basePrice} ₺`;
        document.querySelector('.pricing-summary .price-row:nth-child(2) .price-value').textContent = `${featuresPrice} ₺`;
        document.querySelector('.pricing-summary .price-row.total .price-value').textContent = `${basePrice + featuresPrice} ₺`;
    }
    
    // Throttle function to limit how often event handlers run
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Scroll reveal animation
    var revealElements = document.querySelectorAll('.reveal');
    
    function revealOnScroll() {
        revealElements.forEach(function(element) {
            var elementTop = element.getBoundingClientRect().top;
            var elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('active');
            }
        });
    }
    
    // Apply throttling to scroll events for better performance
    window.addEventListener('scroll', throttle(revealOnScroll, 100));
    
    // Initialize zoom controls
    const zoomSlider = document.getElementById('zoom-slider');
    zoomSlider.addEventListener('input', () => {
        zoomLevel = parseInt(zoomSlider.value);
        updateZoom();
    });
    
    // Zoom buttons
    document.querySelectorAll('.zoom-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var zoomType = btn.dataset.zoom;
            
            if (zoomType === 'in' && zoomLevel < 10) {
                zoomLevel += 1;
            } else if (zoomType === 'out' && zoomLevel > 2) {
                zoomLevel -= 1;
            }
            
            zoomSlider.value = zoomLevel;
            updateZoom();
        });
    });
    
    function updateZoom() {
        if (!camera || !controls) return;
        
        // Set camera distance based on zoom level (inverse - higher value = closer)
        var distance = 12 - zoomLevel;
        var currentDirection = new THREE.Vector3();
        currentDirection.subVectors(camera.position, controls.target).normalize();
        
        camera.position.copy(currentDirection.multiplyScalar(distance));
        controls.update();
    }
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Call functions on load
    updateDimensionsLabel();
    revealOnScroll();
});

// Three.js Functions

// Display WebGL not supported warning
function showWebGLWarning() {
    var container = document.getElementById('table-3d-canvas');
    if (!container) return;
    
    // Create warning message element
    var warningEl = document.createElement('div');
    warningEl.className = 'webgl-warning';
    warningEl.innerHTML = `
        <div class="webgl-warning-content">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #facc15; margin-bottom: 1rem;"></i>
            <h3>WebGL Desteklenmiyor</h3>
            <p>Tarayıcınız 3D görüntüleme için gerekli olan WebGL teknolojisini desteklemiyor.</p>
            <p>Lütfen modern bir tarayıcı kullanın (Chrome, Firefox, Edge, Safari).</p>
        </div>
    `;
    container.appendChild(warningEl);
    
    // Add styles for warning
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
            background: rgba(30, 30, 36, 0.9);
            z-index: 100;
        }
        .webgl-warning-content {
            background: var(--bg-primary);
            border: 1px solid var(--accent-primary);
            border-radius: 10px;
            padding: 2rem;
            text-align: center;
            max-width: 80%;
        }
    `;
    document.head.appendChild(style);
}

function initThreeJS() {
    // Get container
    var container = document.getElementById('table-3d-canvas');
    
    // Check if WebGL is supported
    if (!webGLSupported) {
        showWebGLWarning();
        return;
    }
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e24);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(3, 2.8, 3); // Better position for full table view
    camera.lookAt(0, 0, 0); // Look at center of table
    
    // Create renderer with error handling
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
    } catch (e) {
        console.error("WebGL rendering error:", e);
        showWebGLWarning();
        return; // Exit initialization if renderer fails
    }
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Increased intensity
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // Increased intensity
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Add a soft fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4); // Increased intensity
    fillLight.position.set(-5, 3, -7.5);
    scene.add(fillLight);
    
    // Add additional light to better show the table
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.3);
    frontLight.position.set(0, 2, 5);
    scene.add(frontLight);
    
    // OrbitControls for interaction
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5; // Slow autorotation to showcase the table
    
    // Show loading animation
    document.querySelector('.model-loading').classList.add('active');
    
    // Create default table model
    createTableModel();
    
    // Start animation loop
    animate();
}

function createTableModel() {
    // Make sure loading indicator is visible during model creation
    const loadingIndicator = document.querySelector('.model-loading');
    loadingIndicator.classList.add('active');
    
    // Ensure the loading indicator is visible
    document.querySelector('.canvas-overlay').style.zIndex = '10';
    
    // Clear any existing model and properly dispose resources
    if (tableModel) {
        // Dispose geometries and materials to prevent memory leaks
        tableModel.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        scene.remove(tableModel);
        tableModel = null;
    }
    
    // Create table group to hold all parts
    tableModel = new THREE.Group();
    
    // Table dimensions in meters (scaled down from cm)
    const width = tableWidth / 100;
    const length = tableLength / 100;
    const height = tableHeight / 100;
    const thickness = 0.03; // 3cm thick top
    
    // Get the selected wood material properties
    const materialProps = getMaterialProperties();
    
    // Materials for table
    var topMaterial;
    
    // Create material with texture if available
    if (materialProps.textureUrl) {
        var textureLoader = new THREE.TextureLoader();
        var woodTexture = textureLoader.load(materialProps.textureUrl);
        
        // Set texture wrapping and repeat
        woodTexture.wrapS = THREE.RepeatWrapping;
        woodTexture.wrapT = THREE.RepeatWrapping;
        woodTexture.repeat.set(1, 1);
        
        // Wood material for the top with texture and color
        topMaterial = new THREE.MeshPhysicalMaterial({ 
            map: woodTexture,
            color: materialProps.color,
            roughness: 0.4,
            metalness: 0.1,
            reflectivity: 0.3,
            clearcoat: 0.2,
            clearcoatRoughness: 0.3
        });
    } else {
        // Fallback to color-only material
        topMaterial = new THREE.MeshPhysicalMaterial({ 
            color: materialProps.color,
            roughness: 0.4,
            metalness: 0.1,
            reflectivity: 0.3,
            clearcoat: 0.2,
            clearcoatRoughness: 0.3
        });
    }
    
    // Black metal material for legs
    const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222, // Black metal
        roughness: 0.5,
        metalness: 0.8
    });
    
    // Standard rectangular table (default)
    createRectangularTable(width, length, height, thickness, topMaterial, legMaterial);
    
    // Add model to scene
    scene.add(tableModel);
    
    // Position the table group - center in the scene
    tableModel.position.set(0, 0, 0);
    
    // Add a plane for shadow beneath table
    const groundGeometry = new THREE.PlaneGeometry(15, 15);
    const groundMaterial = new THREE.ShadowMaterial({
        opacity: 0.3
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Reset the camera view
    resetTableView();
    
    // Hide loading indicator with a slight delay to ensure model is fully rendered
    setTimeout(() => {
        document.querySelector('.model-loading').classList.remove('active');
        isModelLoaded = true;
    }, 300);
    
    // Update header to show current material and edge style
    const edgeLabel = edgeStyle.charAt(0).toUpperCase() + edgeStyle.slice(1);
    const materialLabel = currentMaterial.charAt(0).toUpperCase() + currentMaterial.slice(1);
    document.querySelector('.preview-header h3').innerHTML = 
        `Masa Önizleme <span class="material-indicator">${materialLabel}</span> 
        <span class="edge-indicator">${edgeLabel} Kenar</span>`;
}

// Create a rectangular desk
function createRectangularTable(width, length, height, thickness, topMaterial, legMaterial) {
    // Create rectangular table top with proper edge style
    let tableTop;
    
    // Apply different edge styles
    if (edgeStyle === 'beveled') {
        // Create beveled edge table top
        tableTop = createBeveledTableTop(width, length, thickness, topMaterial);
    } else if (edgeStyle === 'rounded') {
        // Create rounded edge table top
        tableTop = createRoundedTableTop(width, length, thickness, topMaterial);
    } else {
        // Create straight edge table top (default)
        const topGeometry = new THREE.BoxGeometry(width, thickness, length);
        tableTop = new THREE.Mesh(topGeometry, topMaterial);
    }
    
    tableTop.position.y = height - thickness / 2;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableModel.add(tableTop);
    
    // Create legs based on selected leg style
    if (legStyle === 'tapered') {
        createTaperedLegs(width, length, height, thickness, legMaterial);
    } else if (legStyle === 'x-style') {
        createXStyleLegs(width, length, height, thickness, legMaterial);
    } else {
        // Standard legs
        createStandardLegs(width, length, height, thickness, legMaterial);
    }
}

// Create rectangular table functions - removed round and L-shaped table functions

// Add functions to create tables with different edge styles
function createBeveledTableTop(width, length, thickness, material) {
    // Create a shape for the beveled table top
    const shape = new THREE.Shape();
    const bevelSize = 0.02; // 2cm bevel
    
    // Define the shape with beveled corners
    shape.moveTo(-width/2 + bevelSize, -length/2);
    shape.lineTo(width/2 - bevelSize, -length/2);
    shape.lineTo(width/2, -length/2 + bevelSize);
    shape.lineTo(width/2, length/2 - bevelSize);
    shape.lineTo(width/2 - bevelSize, length/2);
    shape.lineTo(-width/2 + bevelSize, length/2);
    shape.lineTo(-width/2, length/2 - bevelSize);
    shape.lineTo(-width/2, -length/2 + bevelSize);
    shape.lineTo(-width/2 + bevelSize, -length/2);
    
    // Extrude settings
    const extrudeSettings = {
        steps: 1,
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: thickness * 0.2,
        bevelSize: thickness * 0.1,
        bevelOffset: 0,
        bevelSegments: 3
    };
    
    // Create geometry and mesh
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(Math.PI / 2); // rotate to correct orientation
    
    return new THREE.Mesh(geometry, material);
}

function createRoundedTableTop(width, length, thickness, material) {
    // Create a shape for rounded edges
    const shape = new THREE.Shape();
    const radius = 0.05; // 5cm corner radius
    
    // Define the shape with rounded corners
    shape.moveTo(-width/2 + radius, -length/2);
    shape.lineTo(width/2 - radius, -length/2);
    shape.quadraticCurveTo(width/2, -length/2, width/2, -length/2 + radius);
    shape.lineTo(width/2, length/2 - radius);
    shape.quadraticCurveTo(width/2, length/2, width/2 - radius, length/2);
    shape.lineTo(-width/2 + radius, length/2);
    shape.quadraticCurveTo(-width/2, length/2, -width/2, length/2 - radius);
    shape.lineTo(-width/2, -length/2 + radius);
    shape.quadraticCurveTo(-width/2, -length/2, -width/2 + radius, -length/2);
    
    // Extrude settings
    const extrudeSettings = {
        steps: 1,
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: thickness * 0.15,
        bevelSize: thickness * 0.1,
        bevelOffset: 0,
        bevelSegments: 5
    };
    
    // Create geometry and mesh
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(Math.PI / 2); // rotate to correct orientation
    
    return new THREE.Mesh(geometry, material);
}

// Create standard legs for rectangular table
function createStandardLegs(width, length, height, thickness, legMaterial) {
    const legWidth = 0.05;
    const legDepth = 0.05;
    const legHeight = height - thickness;
    const legInset = 0.2;
    
    // Create 4 legs at the corners
    for (let i = 0; i < 4; i++) {
        const xPos = (i % 2 === 0 ? -1 : 1) * (width / 2 - legInset);
        const zPos = (i < 2 ? 1 : -1) * (length / 2 - legInset);
        
        const legGeometry = new THREE.BoxGeometry(legWidth, legHeight, legDepth);
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(xPos, legHeight / 2, zPos);
        leg.castShadow = true;
        tableModel.add(leg);
    }
}

// Create tapered legs for rectangular table
function createTaperedLegs(width, length, height, thickness, legMaterial) {
    const legWidth = 0.05;
    const legDepth = 0.05;
    const legHeight = height - thickness;
    const legInset = 0.2;
    
    // Create 4 tapered legs at the corners
    for (let i = 0; i < 4; i++) {
        const xPos = (i % 2 === 0 ? -1 : 1) * (width / 2 - legInset);
        const zPos = (i < 2 ? 1 : -1) * (length / 2 - legInset);
        
        const legGeometry = createTaperedLegGeometry(legWidth, legDepth, legHeight);
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(xPos, legHeight / 2, zPos);
        leg.castShadow = true;
        tableModel.add(leg);
    }
}

// Create X-style legs for rectangular table
function createXStyleLegs(width, length, height, thickness, legMaterial) {
    const legWidth = 0.05;
    const legDepth = 0.05;
    const legHeight = height - thickness;
    
    // Create cross legs (X-style)
    const xLegLength = Math.sqrt(Math.pow(width, 2) + Math.pow(length, 2));
    const xLegGeometry = new THREE.BoxGeometry(legWidth, xLegLength, legDepth);
    
    // First X piece (front-left to back-right)
    const xLeg1 = new THREE.Mesh(xLegGeometry, legMaterial);
    xLeg1.position.set(0, legHeight / 2, 0);
    xLeg1.rotation.y = Math.atan2(length, width);
    xLeg1.rotation.x = Math.PI / 2 - Math.atan2(legHeight, xLegLength);
    xLeg1.castShadow = true;
    tableModel.add(xLeg1);
    
    // Second X piece (front-right to back-left)
    const xLeg2 = new THREE.Mesh(xLegGeometry, legMaterial);
    xLeg2.position.set(0, legHeight / 2, 0);
    xLeg2.rotation.y = -Math.atan2(length, width);
    xLeg2.rotation.x = Math.PI / 2 - Math.atan2(legHeight, xLegLength);
    xLeg2.castShadow = true;
    tableModel.add(xLeg2);
}

// Removed L-shaped desk legs function

// Helper function to create a metal bar element
function createMetalBar(width, height, depth, x, y, z, material, rotation = 0) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const bar = new THREE.Mesh(geometry, material);
    bar.position.set(x, y, z);
    if (rotation !== 0) {
        bar.rotation.y = rotation;
    }
    bar.castShadow = true;
    tableModel.add(bar);
    return bar;
}

function createTaperedLegGeometry(topWidth, topDepth, height) {
    // Create a tapered leg (narrower at bottom)
    const points = [];
    points.push(new THREE.Vector3(-topWidth/2, 0, -topDepth/2));
    points.push(new THREE.Vector3(topWidth/2, 0, -topDepth/2));
    points.push(new THREE.Vector3(topWidth/2, 0, topDepth/2));
    points.push(new THREE.Vector3(-topWidth/2, 0, topDepth/2));
    
    const bottomWidth = topWidth * 0.7;
    const bottomDepth = topDepth * 0.7;
    
    points.push(new THREE.Vector3(-bottomWidth/2, -height, -bottomDepth/2));
    points.push(new THREE.Vector3(bottomWidth/2, -height, -bottomDepth/2));
    points.push(new THREE.Vector3(bottomWidth/2, -height, bottomDepth/2));
    points.push(new THREE.Vector3(-bottomWidth/2, -height, bottomDepth/2));
    
    // Create faces from points
    const indices = [
        2, 1, 0,
        0, 3, 2,
        0, 1, 5,
        5, 4, 0,
        1, 2, 6,
        6, 5, 1,
        2, 3, 7,
        7, 6, 2,
        3, 0, 4,
        4, 7, 3,
        5, 6, 7,
        7, 4, 5
    ];
    
    const geometry = new THREE.BufferGeometry();
    
    // Convert points to buffer attributes
    const vertices = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
        vertices[i * 3] = points[i].x;
        vertices[i * 3 + 1] = points[i].y;
        vertices[i * 3 + 2] = points[i].z;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
}

function getMaterialColor() {
    // Return the color based on current material selection
    switch (currentMaterial) {
        case 'ceviz': return 0xD7954B;
        case 'mogano': return 0x8B4513;
        case 'mese': return 0xDEB887;
        case 'huş': return 0xF5DEB3;
        case 'ebene': return 0x3D2B1F;
        case 'geyik': return 0xc4ac90;
        default: return 0xD7954B;
    }
}

function getMaterialProperties() {
    // Return both color and texture URL based on material selection
    let properties = {
        color: 0xD7954B,
        textureUrl: null
    };
    
    switch (currentMaterial) {
        case 'ceviz':
            properties.color = 0xD7954B;
            properties.textureUrl = 'https://cdn.pixabay.com/photo/2017/02/07/09/02/wood-2045379_640.jpg';
            break;
        case 'mogano':
            properties.color = 0x8B4513;
            properties.textureUrl = 'https://cdn.pixabay.com/photo/2016/11/21/17/57/wood-1846849_640.jpg';
            break;
        case 'mese':
            properties.color = 0xDEB887;
            properties.textureUrl = 'https://cdn.pixabay.com/photo/2016/11/23/15/04/wood-1853403_640.jpg';
            break;
        case 'huş':
            properties.color = 0xF5DEB3;
            properties.textureUrl = 'https://cdn.pixabay.com/photo/2017/02/14/09/02/wood-2065366_640.jpg';
            break;
        case 'ebene':
            properties.color = 0x3D2B1F;
            properties.textureUrl = 'https://cdn.pixabay.com/photo/2016/11/21/18/14/wall-1846965_640.jpg';
            break;
        case 'geyik':
            properties.color = 0xc4ac90;
            properties.textureUrl = 'https://cdn.pixabay.com/photo/2017/02/07/09/02/wood-2045380_640.jpg';
            break;
        default:
            properties.color = 0xD7954B;
            properties.textureUrl = 'https://cdn.pixabay.com/photo/2017/02/07/09/02/wood-2045379_640.jpg';
    }
    
    return properties;
}

function getDarkerShade(color) {
    // Convert hex to RGB, reduce brightness by 20%
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;
    
    const darkerR = Math.floor(r * 0.8);
    const darkerG = Math.floor(g * 0.8);
    const darkerB = Math.floor(b * 0.8);
    
    // Convert back to hex
    return (darkerR << 16) | (darkerG << 8) | darkerB;
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('table-3d-canvas');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function updateTableMaterial() {
    if (!isModelLoaded || !tableModel) return;

    // Instead of updating materials directly, recreate the model with the new material
    createTableModel();
}

function updateTableDimensions() {
    // Re-create the table with new dimensions
    createTableModel();
}

function updateTableStyle() {
    // Re-create the table with new style
    createTableModel();
}

function rotateTable(deltaY, deltaX) {
    if (!controls) return;
    
    controls.rotateLeft(deltaY);
    controls.rotateUp(deltaX);
    controls.update();
}

function resetTableView() {
    if (!camera || !controls) return;
    
    // Set camera position for rectangular table
    camera.position.set(3, 2.8, 3);
    camera.lookAt(0, 0, 0);
    
    // Fix table orientation
    if (tableModel) {
        tableModel.rotation.set(0, 0, 0);
    }
    
    controls.update();
}

function setPerspectiveView() {
    if (!camera || !controls) return;
    
    // Set camera position for rectangular table
    camera.position.set(3, 2.8, 3);
    camera.lookAt(0, 0, 0);
    
    // Ensure table is properly oriented
    if (tableModel) {
        tableModel.rotation.set(0, 0, 0);
    }
    
    controls.update();
}

function setTopView() {
    if (!camera || !controls) return;
    
    // Set top view for rectangular table
    camera.position.set(0, 5, 0);
    camera.lookAt(0, 0, 0);
    
    controls.update();
}

function setSideView() {
    if (!camera || !controls) return;
    
    // Set side view for rectangular table
    camera.position.set(4, 0.5, 0);
    camera.lookAt(0, 0, 0);
    
    controls.update();
}
