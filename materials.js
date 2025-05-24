/**
 * @file materials.js
 * @description Modern Masa Tasarımcısı uygulaması için malzeme yönetimi modülü
 * Sadece renk kodları kullanır, texture kullanmaz
 */

// Renk kodları - malzeme adı yerine doğrudan renk kullanılacak
const MATERIAL_COLORS = {
    'ceviz': 0x654321,    // Koyu kahverengi
    'mogano': 0xB22222,   // Kırmızı (FireBrick)
    'mese': 0xF4A460,     // Açık kahverengi (SandyBrown)
    'hus': 0xFFE4B5,      // Çok açık (Moccasin)
    'ebene': 0x000000,    // Siyah
    'geyik': 0x808080     // Gri
};

// Malzeme isimleri
const MATERIAL_NAMES = {
    'ceviz': 'Ceviz',
    'mogano': 'Maun',
    'mese': 'Meşe',
    'hus': 'Huş',
    'ebene': 'Abanoz',
    'geyik': 'Dişbudak'
};

/**
 * Belirtilen malzeme adı için renk kodunu döndürür.
 * @param {string} materialName - Malzemenin adı (örn: 'ceviz').
 * @returns {number} Hex renk kodu.
 */
function getMaterialColor(materialName) {
    // Geçersiz veya boş parametre kontrolü
    if (!materialName || typeof materialName !== 'string') {
        console.error(`MATERIALS.JS: Geçersiz malzeme adı: "${materialName}". Varsayılan 'ceviz' rengi kullanılıyor.`);
        return MATERIAL_COLORS['ceviz'];
    }

    // Malzeme adını temizle (trim ve lowercase)
    const cleanMaterialName = materialName.trim().toLowerCase();

    if (MATERIAL_COLORS[cleanMaterialName]) {
        return MATERIAL_COLORS[cleanMaterialName];
    }

    console.warn(`MATERIALS.JS: '${materialName}' adlı malzeme bulunamadı. Mevcut malzemeler:`, Object.keys(MATERIAL_COLORS));
    console.warn(`MATERIALS.JS: Varsayılan olarak 'ceviz' rengi kullanılıyor.`);
    return MATERIAL_COLORS['ceviz']; // Varsayılan renk
}

/**
 * Belirtilen malzeme adı için isim döndürür.
 * @param {string} materialName - Malzemenin adı (örn: 'ceviz').
 * @returns {string} Malzeme ismi.
 */
function getMaterialName(materialName) {
    const cleanMaterialName = materialName ? materialName.trim().toLowerCase() : 'ceviz';
    return MATERIAL_NAMES[cleanMaterialName] || MATERIAL_NAMES['ceviz'];
}

/**
 * Belirtilen renk kodu ile Three.js malzemesi oluşturur.
 * @param {string} colorHex - Hex renk kodu (örn: '#654321').
 * @param {string} [colorName] - Renk adı (opsiyonel).
 * @param {object} [options={}] - Ek malzeme seçenekleri.
 * @returns {THREE.MeshStandardMaterial} Oluşturulan malzeme.
 */
function createMaterialFromColor(colorHex, colorName = 'Custom', options = {}) {
    // Hex renk kodunu temizle
    const cleanColor = colorHex.replace('#', '');
    const colorValue = parseInt(cleanColor, 16);

    // Sadece renk kodları kullanarak malzeme oluştur
    const materialSettings = {
        color: new THREE.Color(colorValue), // THREE.Color kullan
        roughness: 0.65,
        metalness: 0.0,
        map: null, // Texture kullanma
        ...options // Ek seçenekleri uygula
    };

    const finalMaterial = new THREE.MeshStandardMaterial(materialSettings);
    finalMaterial.name = colorName.replace(/\s+/g, '') + "_ColorMaterial";

    console.log(`MATERIALS.JS: ${colorName} malzemesi oluşturuldu (renk: ${colorHex}).`);

    return finalMaterial;
}

/**
 * Geriye uyumluluk için eski createMaterial fonksiyonu
 * @param {string} materialName - Oluşturulacak malzemenin adı.
 * @param {object} [options={}] - Ek malzeme seçenekleri.
 * @returns {THREE.MeshStandardMaterial} Oluşturulan malzeme.
 */
function createMaterial(materialName, options = {}) {
    const materialColor = getMaterialColor(materialName);
    const materialDisplayName = getMaterialName(materialName);

    // Sadece renk kodları kullanarak malzeme oluştur
    const materialSettings = {
        color: new THREE.Color(materialColor), // THREE.Color kullan
        roughness: 0.65,
        metalness: 0.0,
        map: null, // Texture kullanma
        ...options // Ek seçenekleri uygula
    };

    const finalMaterial = new THREE.MeshStandardMaterial(materialSettings);
    finalMaterial.name = materialName + "_ColorMaterial";

    console.log(`MATERIALS.JS: ${materialDisplayName} malzemesi oluşturuldu (renk: #${materialColor.toString(16)}).`);

    return finalMaterial;
}

/**
 * Metal ayaklar için standart bir Three.js malzemesi oluşturur.
 * @param {number} [color=0x333333] - Metalin rengi (hexadecimal).
 * @returns {THREE.MeshStandardMaterial} Oluşturulan metal malzeme.
 */
function createMetalMaterial(color = 0x333333) { // Varsayılan koyu gri metal
    const mat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.45, // Metal için biraz daha az pürüzlü
        metalness: 0.85  // Yüksek metaliklik değeri
    });
    mat.name = "MetalLegMaterial";
    return mat;
}

/**
 * Verilen bir rengin daha koyu bir tonunu hesaplar. (Şu an kullanılmıyor olabilir)
 * @param {number} color - Orijinal renk (hexadecimal).
 * @param {number} [factor=0.8] - Koyulaştırma faktörü (0 ile 1 arası).
 * @returns {number} Daha koyu renk (hexadecimal).
 */
function getDarkerShade(color, factor = 0.8) {
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;

    const darkerR = Math.floor(r * factor);
    const darkerG = Math.floor(g * factor);
    const darkerB = Math.floor(b * factor);

    return (darkerR << 16) | (darkerG << 8) | darkerB;
}

// Modülün dışa aktarılan fonksiyonları
window.MaterialsModule = {
    getMaterialColor,
    getMaterialName,
    createMaterial,
    createMaterialFromColor,
    createMetalMaterial,
    getDarkerShade // Bu fonksiyon şu an aktif olarak kullanılmıyor olabilir ama API'de kalabilir.
};
