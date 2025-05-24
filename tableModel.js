/**
 * @file tableModel.js
 * @description Table model creation module for the Modern Table Designer application
 * Handles 3D model generation for different table styles
 */

// Module state
let tableModelGroup = null;
let shadowPlane = null;
let isModelCurrentlyLoaded = false;

/**
 * Creates a table model with the specified properties
 * @param {object} config - Configuration object for the table.
 * @param {number} config.width - Width of the table in cm.
 * @param {number} config.length - Length of the table in cm.
 * @param {number} config.height - Height of the table in cm.
 * @param {number} config.thickness - Thickness of the table top in cm.
 * @param {string} config.material - Material name for the table top.
 * @param {string} config.edgeStyle - Edge style for the table top.
 * @param {string} config.legStyle - Leg style for the table.
 * @param {THREE.Scene} scene - The Three.js scene to add the table to.
 * @returns {THREE.Group|null} The created table group or null if creation failed.
 */
function createTable(config, scene) {
    isModelCurrentlyLoaded = false;
    const loadingIndicator = document.querySelector('.model-loading');
    if (loadingIndicator) {
        loadingIndicator.classList.add('active');
        loadingIndicator.querySelector('span').textContent = "Model oluşturuluyor...";
        const overlay = document.querySelector('.canvas-overlay');
        if(overlay) overlay.style.zIndex = '10'; // Ensure loading is on top
    }

    console.log("TABLEMODEL.JS: createTable çağrıldı. Yapılandırma:", config);

    // Dispose of the previous model before creating a new one
    disposeTableModel(scene);

    tableModelGroup = new THREE.Group();
    tableModelGroup.name = "InteractiveTable"; // Name for easy lookup

    // Convert dimensions from cm to meters for Three.js
    const width = config.width / 100;
    const length = config.length / 100;
    const height = config.height / 100;
    const thickness = config.thickness / 100;

    let topMaterial, legMaterial;
    try {
        // Eğer appState'de currentColor varsa onu kullan, yoksa eski sistemi kullan
        if (window.appState && window.appState.currentColor) {
            console.log("TABLEMODEL.JS: Renk tabanlı malzeme oluşturuluyor:", window.appState.currentColor, window.appState.currentColorName);
            topMaterial = window.MaterialsModule.createMaterialFromColor(
                window.appState.currentColor,
                window.appState.currentColorName || 'Custom'
            );
        } else {
            console.log(`TABLEMODEL.JS: MaterialsModule.createMaterial çağrılıyor (Malzeme: ${config.material})`);
            topMaterial = window.MaterialsModule.createMaterial(config.material);
        }

        console.log(`TABLEMODEL.JS: MaterialsModule.createMetalMaterial çağrılıyor`);
        legMaterial = window.MaterialsModule.createMetalMaterial(); // Default metal for legs
    } catch (e) {
        console.error("TABLEMODEL.JS: Malzeme oluşturulurken hata:", e);
        if (loadingIndicator) loadingIndicator.classList.remove('active');
        return null; // Return null if material creation fails
    }

    if (!topMaterial) {
        console.error("TABLEMODEL.JS: Üst malzeme (topMaterial) oluşturulamadı. Varsayılan pembe kullanılıyor.");
        topMaterial = new THREE.MeshStandardMaterial({color: 0xff00ff}); // Bright pink for error
    }
     if (!legMaterial) {
        console.error("TABLEMODEL.JS: Ayak malzemesi (legMaterial) oluşturulamadı. Varsayılan camgöbeği kullanılıyor.");
        legMaterial = new THREE.MeshStandardMaterial({color: 0x00ffff}); // Bright cyan for error
    }
    console.log("TABLEMODEL.JS: Kullanılan Üst Malzeme Adı:", topMaterial.name, "Doku Var mı?", !!topMaterial.map, "Renk:", topMaterial.color.getHexString());
    console.log("TABLEMODEL.JS: Kullanılan Ayak Malzeme Adı:", legMaterial.name);

    createTableWithStyle(width, length, height, thickness, topMaterial, legMaterial, config.edgeStyle, config.legStyle);

    scene.add(tableModelGroup);
    addShadowPlaneToScene(scene);

    // Model hazır - loading indicator'ı kaldır (texture kontrolü artık gerekli değil)
    setTimeout(function() {
        if (loadingIndicator) {
            loadingIndicator.classList.remove('active');
            const overlay = document.querySelector('.canvas-overlay');
            if(overlay) overlay.style.zIndex = '5';
        }
        isModelCurrentlyLoaded = true;
        console.log("TABLEMODEL.JS: Masa modeli başarıyla oluşturuldu ve sahneye eklendi.");
    }, 100); // Kısa gecikme ile loading'i kaldır

    return tableModelGroup;
}

function disposeTableModel(scene) {
    if (tableModelGroup) {
        tableModelGroup.traverse(function(object) {
            if (object.isMesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => {
                            // Dispose all texture types
                            if (material.map) material.map.dispose();
                            if (material.normalMap) material.normalMap.dispose();
                            if (material.roughnessMap) material.roughnessMap.dispose();
                            if (material.metalnessMap) material.metalnessMap.dispose();
                            if (material.envMap) material.envMap.dispose();
                            if (material.aoMap) material.aoMap.dispose();
                            if (material.emissiveMap) material.emissiveMap.dispose();
                            material.dispose();
                        });
                    } else {
                        // Dispose all texture types for single material
                        if (object.material.map) object.material.map.dispose();
                        if (object.material.normalMap) object.material.normalMap.dispose();
                        if (object.material.roughnessMap) object.material.roughnessMap.dispose();
                        if (object.material.metalnessMap) object.material.metalnessMap.dispose();
                        if (object.material.envMap) object.material.envMap.dispose();
                        if (object.material.aoMap) object.material.aoMap.dispose();
                        if (object.material.emissiveMap) object.material.emissiveMap.dispose();
                        object.material.dispose();
                    }
                }
            }
        });
        scene.remove(tableModelGroup);
        tableModelGroup = null;
    }
    if (shadowPlane) {
        if (shadowPlane.geometry) shadowPlane.geometry.dispose();
        if (shadowPlane.material) shadowPlane.material.dispose();
        scene.remove(shadowPlane);
        shadowPlane = null;
    }
    isModelCurrentlyLoaded = false;
}

/**
 * Kenar stiline göre masa yüzeyi oluşturur
 * @param {number} width - Masa genişliği
 * @param {number} length - Masa uzunluğu
 * @param {number} thickness - Masa kalınlığı
 * @param {THREE.Material} topMaterial - Masa yüzeyi malzemesi
 * @param {string} edgeStyle - Kenar stili ('straight', 'beveled', 'rounded')
 * @returns {THREE.Mesh} Masa yüzeyi mesh'i
 */
function createTableTopWithEdgeStyle(width, length, thickness, topMaterial, edgeStyle) {
    let tableTopMesh;
    if (edgeStyle === 'beveled') {
        tableTopMesh = createBeveledTableTopGeometry(width, length, thickness, topMaterial);
    } else if (edgeStyle === 'rounded') {
        tableTopMesh = createRoundedTableTopGeometry(width, length, thickness, topMaterial);
    } else {
        const topGeom = new THREE.BoxGeometry(width, thickness, length);
        tableTopMesh = new THREE.Mesh(topGeom, topMaterial);
    }
    tableTopMesh.castShadow = true;
    tableTopMesh.receiveShadow = true;
    return tableTopMesh;
}

function createTableWithStyle(width, length, height, thickness, topMaterial, legMaterial, edgeStyle, legStyle) {
    if (legStyle === 'l-shape') {
         createLShapeTable(width, length, height, thickness, topMaterial, legMaterial, edgeStyle);
         return;
    } else if (legStyle === 'v-shape') {
         createVShapeTable(width, length, height, thickness, topMaterial, legMaterial, edgeStyle);
         return;
    } else if (legStyle === 'a-shape') {
         createAShapeTable(width, length, height, thickness, topMaterial, legMaterial, edgeStyle);
         return;
    } else {
        const tableTopMesh = createTableTopWithEdgeStyle(width, length, thickness, topMaterial, edgeStyle);
        tableTopMesh.name = "TableTop";
        tableTopMesh.position.y = height - (thickness / 2);
        tableModelGroup.add(tableTopMesh);
    }

    if (legStyle === 'u-shape') {
        createUShapeLegsGeometry(width, length, height, thickness, legMaterial);
    } else if (legStyle === 'x-shape') {
        createXShapeLegsGeometry(width, length, height, thickness, legMaterial);
    } else {
        createStandardLegsGeometry(width, length, height, thickness, legMaterial);
    }
}

function createBeveledTableTopGeometry(width, length, thickness, material) {
    const shape = new THREE.Shape();
    const R = 0.02;
    shape.moveTo(-width / 2 + R, -length / 2);
    shape.lineTo(width / 2 - R, -length / 2);
    shape.absarc(width / 2 - R, -length / 2 + R, R, -Math.PI / 2, 0, false);
    shape.lineTo(width / 2, length / 2 - R);
    shape.absarc(width / 2 - R, length / 2 - R, R, 0, Math.PI / 2, false);
    shape.lineTo(-width / 2 + R, length / 2);
    shape.absarc(-width / 2 + R, length / 2 - R, R, Math.PI / 2, Math.PI, false);
    shape.lineTo(-width / 2, -length / 2 + R);
    shape.absarc(-width / 2 + R, -length / 2 + R, R, Math.PI, Math.PI * 3 / 2, false);
    const extrudeSettings = {
        steps: 1, depth: thickness, bevelEnabled: true,
        bevelThickness: thickness * 0.15, bevelSize: thickness * 0.1,
        bevelOffset: -thickness * 0.05, bevelSegments: 3
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center(); geometry.rotateX(Math.PI / 2);
    return new THREE.Mesh(geometry, material);
}

function createRoundedTableTopGeometry(width, length, thickness, material) {
    const R = Math.min(width, length) * 0.08;
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2 + R, -length / 2);
    shape.lineTo(width / 2 - R, -length / 2);
    shape.quadraticCurveTo(width / 2, -length / 2, width / 2, -length / 2 + R);
    shape.lineTo(width / 2, length / 2 - R);
    shape.quadraticCurveTo(width / 2, length / 2, width / 2 - R, length / 2);
    shape.lineTo(-width / 2 + R, length / 2);
    shape.quadraticCurveTo(-width / 2, length / 2, -width / 2, length / 2 - R);
    shape.lineTo(-width / 2, -length / 2 + R);
    shape.quadraticCurveTo(-width / 2, -length / 2, -width / 2 + R, -length / 2);
    const extrudeSettings = {
        steps: 1, depth: thickness, bevelEnabled: true,
        bevelThickness: thickness * 0.1, bevelSize: thickness * 0.08,
        bevelOffset: 0, bevelSegments: 5
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center(); geometry.rotateX(Math.PI / 2);
    return new THREE.Mesh(geometry, material);
}

function createStandardLegsGeometry(width, length, height, thickness, legMaterial) {
    const legSize = Math.max(0.04, Math.min(width, length) * 0.05);
    const legHeight = height - thickness;
    const inset = Math.max(0.05, Math.min(width, length) * 0.1);
    const legPositions = [
        new THREE.Vector3(width / 2 - inset, legHeight / 2, length / 2 - inset),
        new THREE.Vector3(-width / 2 + inset, legHeight / 2, length / 2 - inset),
        new THREE.Vector3(width / 2 - inset, legHeight / 2, -length / 2 + inset),
        new THREE.Vector3(-width / 2 + inset, legHeight / 2, -length / 2 + inset)
    ];
    legPositions.forEach((pos, index) => {
        const legGeom = new THREE.BoxGeometry(legSize, legHeight, legSize);
        const legMesh = new THREE.Mesh(legGeom, legMaterial);
        legMesh.name = "StandardLeg_" + index;
        legMesh.position.copy(pos); legMesh.castShadow = true; legMesh.receiveShadow = true;
        tableModelGroup.add(legMesh);
    });
}

function createUShapeLegsGeometry(width, length, height, thickness, legMaterial) {
    const legBarThickness = Math.max(0.03, Math.min(width, length) * 0.04);
    const legHeight = height - thickness;
    const legInset = Math.max(0.08, Math.min(width, length) * 0.08);
    [-1, 1].forEach((sideMultiplier, sideIndex) => {
        const zPos = sideMultiplier * (length / 2 - legInset);
        const verticalBarGeom = new THREE.BoxGeometry(legBarThickness, legHeight, legBarThickness);
        const leg1 = new THREE.Mesh(verticalBarGeom, legMaterial);
        leg1.position.set(width / 2 - legInset, legHeight / 2, zPos); leg1.castShadow = true;
        tableModelGroup.add(leg1);
        const leg2 = new THREE.Mesh(verticalBarGeom, legMaterial);
        leg2.position.set(-width / 2 + legInset, legHeight / 2, zPos); leg2.castShadow = true;
        tableModelGroup.add(leg2);
        const connectorWidth = width - 2 * legInset + legBarThickness;
        const horizontalBarGeom = new THREE.BoxGeometry(connectorWidth, legBarThickness, legBarThickness);
        const connector = new THREE.Mesh(horizontalBarGeom, legMaterial);
        connector.position.set(0, height - thickness - legBarThickness / 2 - 0.05, zPos); connector.castShadow = true;
        tableModelGroup.add(connector);
    });
}

function createXShapeLegsGeometry(width, length, height, thickness, legMaterial) {
    const legBarThickness = Math.max(0.05, Math.min(width, length) * 0.06);
    const legHeight = height - thickness;

    // X ayakları masa uzunluğu boyunca (ön ve arka kenarlar) konumlandırılacak
    const zPositions = [-length / 2 + length * 0.2, length / 2 - length * 0.2]; // Ön ve arka

    zPositions.forEach((zPos, index) => {
        // X çerçevesi için grup oluştur
        const xFrameGroup = new THREE.Group();
        xFrameGroup.position.set(0, 0, zPos);

        // X'in genişliği (masa genişliğinin büyük kısmını kaplar)
        const xSpan = width * 0.8; // Masa genişliğinin %80'i

        // Diagonal uzunluk ve açı hesaplama
        const diagonalLength = Math.sqrt(Math.pow(xSpan, 2) + Math.pow(legHeight, 2));
        const angle = Math.atan2(legHeight, xSpan);

        // İlk diagonal bar (sol üstten sağ alta)
        const barGeom1 = new THREE.BoxGeometry(diagonalLength, legBarThickness, legBarThickness);
        const bar1 = new THREE.Mesh(barGeom1, legMaterial);
        bar1.position.set(0, legHeight / 2, 0);
        bar1.rotation.z = angle; // Z ekseni etrafında döndür
        bar1.castShadow = true;
        bar1.receiveShadow = true;
        bar1.name = `XLeg_Bar1_Side${index}`;
        xFrameGroup.add(bar1);

        // İkinci diagonal bar (sağ üstten sol alta)
        const barGeom2 = new THREE.BoxGeometry(diagonalLength, legBarThickness, legBarThickness);
        const bar2 = new THREE.Mesh(barGeom2, legMaterial);
        bar2.position.set(0, legHeight / 2, 0);
        bar2.rotation.z = -angle; // Ters açı
        bar2.castShadow = true;
        bar2.receiveShadow = true;
        bar2.name = `XLeg_Bar2_Side${index}`;
        xFrameGroup.add(bar2);

        // Üst bağlantı - masa yüzeyine sabitlenir
        const topConnectorGeom = new THREE.BoxGeometry(xSpan * 0.3, legBarThickness * 0.8, legBarThickness * 2);
        const topConnector = new THREE.Mesh(topConnectorGeom, legMaterial);
        topConnector.position.set(0, legHeight - legBarThickness / 2, 0);
        topConnector.castShadow = true;
        topConnector.receiveShadow = true;
        topConnector.name = `XLeg_TopConnector_Side${index}`;
        xFrameGroup.add(topConnector);

        tableModelGroup.add(xFrameGroup);
    });

    console.log(`TABLEMODEL.JS: X-Ayak oluşturuldu (Resim tarzı) - Masa boyutları: ${width.toFixed(2)}x${length.toFixed(2)}m`);
}

function createVShapeTable(width, length, height, thickness, topMaterial, legMaterial, edgeStyle) {
    // V-shape ayak stili - Her ayak V harfi gibi açılıyor

    // Masa yüzeyi - kenar stili ile
    const topMesh = createTableTopWithEdgeStyle(width, length, thickness, topMaterial, edgeStyle);
    topMesh.position.set(0, height - thickness / 2, 0);
    topMesh.name = "VTableTop";
    tableModelGroup.add(topMesh);

    // V ayak parametreleri
    const legBarThickness = Math.max(0.03, Math.min(width, length) * 0.025);
    const legHeight = height - thickness;
    const vSpread = width * 0.6; // V'nin alt kısmındaki açıklık (daha geniş)
    const vTopWidth = width * 0.12; // V'nin üst kısmındaki genişlik (biraz daha dar)

    // V ayaklarının konumları (masa uzunluğu boyunca)
    const vPositions = [
        length * 0.3,   // Ön V ayak
        -length * 0.3   // Arka V ayak
    ];

    vPositions.forEach((zPos, index) => {
        const vFrameGroup = new THREE.Group();
        vFrameGroup.position.set(0, 0, zPos);
        vFrameGroup.name = `VFrame_${index}`;

        // V'nin diagonal barlarının uzunluğu ve açısı
        const diagonalLength = Math.sqrt(Math.pow(legHeight, 2) + Math.pow((vSpread - vTopWidth) / 2, 2));
        const angle = Math.atan2((vSpread - vTopWidth) / 2, legHeight);

        // Sol diagonal bar (üstten sol alta)
        const leftBarGeom = new THREE.BoxGeometry(legBarThickness, diagonalLength, legBarThickness);
        const leftBar = new THREE.Mesh(leftBarGeom, legMaterial);
        leftBar.position.set(-vTopWidth / 2, legHeight / 2, 0);
        leftBar.rotation.z = angle; // Sola açılma
        leftBar.castShadow = true;
        leftBar.receiveShadow = true;
        leftBar.name = `VLeg_LeftBar_${index}`;
        vFrameGroup.add(leftBar);

        // Sağ diagonal bar (üstten sağa alta)
        const rightBarGeom = new THREE.BoxGeometry(legBarThickness, diagonalLength, legBarThickness);
        const rightBar = new THREE.Mesh(rightBarGeom, legMaterial);
        rightBar.position.set(vTopWidth / 2, legHeight / 2, 0);
        rightBar.rotation.z = -angle; // Sağa açılma
        rightBar.castShadow = true;
        rightBar.receiveShadow = true;
        rightBar.name = `VLeg_RightBar_${index}`;
        vFrameGroup.add(rightBar);

        // Üst bağlantı parçası - V'nin üst kısmını birleştirir
        const topConnectorGeom = new THREE.BoxGeometry(vTopWidth, legBarThickness * 0.8, legBarThickness * 2);
        const topConnector = new THREE.Mesh(topConnectorGeom, legMaterial);
        topConnector.position.set(0, legHeight - legBarThickness / 2, 0);
        topConnector.castShadow = true;
        topConnector.receiveShadow = true;
        topConnector.name = `VLeg_TopConnector_${index}`;
        vFrameGroup.add(topConnector);

        // Alt bağlantı parçası - V'nin alt kısmında stabilite için
        const bottomConnectorGeom = new THREE.BoxGeometry(vSpread * 0.8, legBarThickness * 0.6, legBarThickness);
        const bottomConnector = new THREE.Mesh(bottomConnectorGeom, legMaterial);
        bottomConnector.position.set(0, legBarThickness / 2, 0);
        bottomConnector.castShadow = true;
        bottomConnector.receiveShadow = true;
        bottomConnector.name = `VLeg_BottomConnector_${index}`;
        vFrameGroup.add(bottomConnector);

        tableModelGroup.add(vFrameGroup);
    });

    console.log(`TABLEMODEL.JS: V-Ayak oluşturuldu - Masa boyutları: ${width.toFixed(2)}x${length.toFixed(2)}m`);
}

function createAShapeTable(width, length, height, thickness, topMaterial, legMaterial, edgeStyle) {
    // A-shape ayak stili - Her ayak A harfi gibi üstte birleşen, altta açılan

    // Masa yüzeyi - kenar stili ile
    const topMesh = createTableTopWithEdgeStyle(width, length, thickness, topMaterial, edgeStyle);
    topMesh.position.set(0, height - thickness / 2, 0);
    topMesh.name = "ATableTop";
    tableModelGroup.add(topMesh);

    // A ayak parametreleri
    const legBarThickness = Math.max(0.03, Math.min(width, length) * 0.03);
    const legHeight = height - thickness;
    const aSpread = width * 0.7; // A'nın alt kısmındaki açıklık (daha geniş)
    const aTopWidth = width * 0.05; // A'nın üst kısmındaki genişlik (daha dar)
    const crossBarHeight = legHeight * 0.45; // Çapraz barın yüksekliği (A'nın ortası)

    // A ayaklarının konumları (masa uzunluğu boyunca)
    const aPositions = [
        length * 0.35,   // Ön A ayak
        -length * 0.35   // Arka A ayak
    ];

    aPositions.forEach((zPos, index) => {
        const aFrameGroup = new THREE.Group();
        aFrameGroup.position.set(0, 0, zPos);
        aFrameGroup.name = `AFrame_${index}`;

        // A'nın diagonal barlarının uzunluğu ve açısı
        const diagonalLength = Math.sqrt(Math.pow(legHeight, 2) + Math.pow((aSpread - aTopWidth) / 2, 2));
        const angle = Math.atan2((aSpread - aTopWidth) / 2, legHeight);

        // Sol diagonal bar (üstten sol alta)
        const leftBarGeom = new THREE.BoxGeometry(legBarThickness, diagonalLength, legBarThickness);
        const leftBar = new THREE.Mesh(leftBarGeom, legMaterial);
        leftBar.position.set(-aTopWidth / 2, legHeight / 2, 0);
        leftBar.rotation.z = -angle; // Sola açılma (A şekli için ters açı)
        leftBar.castShadow = true;
        leftBar.receiveShadow = true;
        leftBar.name = `ALeg_LeftBar_${index}`;
        aFrameGroup.add(leftBar);

        // Sağ diagonal bar (üstten sağa alta)
        const rightBarGeom = new THREE.BoxGeometry(legBarThickness, diagonalLength, legBarThickness);
        const rightBar = new THREE.Mesh(rightBarGeom, legMaterial);
        rightBar.position.set(aTopWidth / 2, legHeight / 2, 0);
        rightBar.rotation.z = angle; // Sağa açılma (A şekli için ters açı)
        rightBar.castShadow = true;
        rightBar.receiveShadow = true;
        rightBar.name = `ALeg_RightBar_${index}`;
        aFrameGroup.add(rightBar);

        // Çapraz destek barı - A'nın ortasındaki yatay çizgi
        const crossBarWidth = aSpread * 0.8; // A'nın ortasındaki genişlik (daha geniş)
        const crossBarGeom = new THREE.BoxGeometry(crossBarWidth, legBarThickness * 0.8, legBarThickness);
        const crossBar = new THREE.Mesh(crossBarGeom, legMaterial);
        crossBar.position.set(0, crossBarHeight, 0);
        crossBar.castShadow = true;
        crossBar.receiveShadow = true;
        crossBar.name = `ALeg_CrossBar_${index}`;
        aFrameGroup.add(crossBar);

        tableModelGroup.add(aFrameGroup);
    });

    console.log(`TABLEMODEL.JS: A-Ayak oluşturuldu - Masa boyutları: ${width.toFixed(2)}x${length.toFixed(2)}m`);
}

function createLShapeTable(width, length, height, thickness, topMaterial, legMaterial, edgeStyle) {
    const mainArmWidth = width;
    const mainArmLength = length * 0.6;
    const sideArmWidth = width * 0.4;
    const sideArmLength = length;

    // Ana kol - kenar stili ile
    const mainArmMesh = createTableTopWithEdgeStyle(mainArmWidth, mainArmLength, thickness, topMaterial, edgeStyle);
    mainArmMesh.position.set(0, height - thickness / 2, (length / 2) - (mainArmLength / 2) );
    mainArmMesh.name = "LTableMainArm";
    tableModelGroup.add(mainArmMesh);

    // Yan kol - kenar stili ile
    const sideArmMesh = createTableTopWithEdgeStyle(sideArmWidth, sideArmLength, thickness, topMaterial, edgeStyle);
    sideArmMesh.position.set(-(width/2) + (sideArmWidth/2) , height - thickness / 2, 0);
    sideArmMesh.name = "LTableSideArm";
    tableModelGroup.add(sideArmMesh);

    const legSize = Math.max(0.04, Math.min(width, length) * 0.05);
    const legHeight = height - thickness;
    const inset = 0.1;
    const legPositions = [
        // Ana kol ayakları (arka)
        new THREE.Vector3(mainArmWidth / 2 - inset, legHeight / 2, length / 2 - inset),
        new THREE.Vector3(-mainArmWidth / 2 + inset, legHeight / 2, length / 2 - inset),
        // Ana kol ayakları (ön)
        new THREE.Vector3(mainArmWidth / 2 - inset, legHeight / 2, (length / 2) - mainArmLength + inset),
        new THREE.Vector3(-mainArmWidth / 2 + inset, legHeight / 2, (length / 2) - mainArmLength + inset),
        // Yan kol ayakları
        new THREE.Vector3(-(width/2) + sideArmWidth - inset, legHeight / 2, -length/2 + inset),
        new THREE.Vector3(-(width/2) + inset, legHeight / 2, -length/2 + inset)
    ];
     legPositions.forEach((pos, index) => {
        const legGeom = new THREE.BoxGeometry(legSize, legHeight, legSize);
        const legMesh = new THREE.Mesh(legGeom, legMaterial);
        legMesh.name = "LLeg_" + index;
        legMesh.position.copy(pos); legMesh.castShadow = true; legMesh.receiveShadow = true;
        tableModelGroup.add(legMesh);
    });
}

function addShadowPlaneToScene(scene) {
    if (shadowPlane) {
        if (shadowPlane.geometry) shadowPlane.geometry.dispose();
        if (shadowPlane.material) shadowPlane.material.dispose();
        scene.remove(shadowPlane); shadowPlane = null;
    }
    const planeSize = 10;
    const groundGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.35, side: THREE.DoubleSide });
    shadowPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.001;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
}

function updateModelHeader(currentMaterial, edgeStyle) {
    const edgeLabel = edgeStyle.charAt(0).toUpperCase() + edgeStyle.slice(1);

    // Renk adını kullan, yoksa malzeme adını kullan
    let materialLabel;
    if (window.appState && window.appState.currentColorName) {
        materialLabel = window.appState.currentColorName;
    } else {
        materialLabel = window.MaterialsModule.getMaterialName(currentMaterial);
    }

    const headerElement = document.querySelector('.preview-header h3');
    if (headerElement) {
        headerElement.innerHTML =
            `Masa Önizleme <span class="material-indicator">${materialLabel}</span> <span class="edge-indicator">${edgeLabel} Kenar</span>`;
    }
}

window.TableModelModule = {
    createTable,
    disposeTableModel,
    updateModelHeader,
    get isLoaded() { return isModelCurrentlyLoaded; }
};
