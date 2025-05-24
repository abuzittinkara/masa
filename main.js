/**
 * @file main.js
 * @description Modern Masa Tasarımcısı uygulamasının ana giriş noktası
 * Tüm modülleri başlatır ve uygulama durumunu yönetir
 */

// Uygulama durumu (Global state object for the application)
var appState = {
    tableWidth: 109, // Varsayılan boyutlar (cm) (Default dimensions in cm)
    tableLength: 150,
    tableHeight: 75,
    tableThickness: 3, // Varsayılan kalınlık (cm) (Default thickness in cm)
    currentMaterial: 'ceviz', // Mevcut malzeme (Current material) - geriye uyumluluk için
    currentColor: '#654321', // Mevcut renk (Current color)
    currentColorName: 'Koyu Kahverengi', // Mevcut renk adı (Current color name)
    currentMaterialInfo: 'ceviz', // Seçili malzeme bilgisi (sadece info için)
    currentMaterialName: 'Ceviz', // Seçili malzeme adı (sadece info için)
    edgeStyle: 'straight', // Kenar stili (Edge style)
    legStyle: 'standard', // Ayak stili ('standard', 'u-shape', 'x-shape', 'l-shape' olabilir) (Leg style)
    scene: null, // Three.js sahnesi (Three.js scene)
    renderer: null, // Three.js renderer
    camera: null, // Three.js kamera (Three.js camera)
    controls: null, // Three.js OrbitControls
    isAutoRotating: false, // Otomatik döndürme durumu
    autoRotateSpeed: 0.01 // Döndürme hızı
};

/**
 * Three.js sahnesini ve ilgili tüm bileşenleri başlatır
 * Initializes the Three.js scene and all related components
 */
function initThreeJS() {
    // Önce tarayıcı uyumluluğunu kontrol et (First, check browser compatibility)
    var compatibility = window.CompatibilityModule.check();
    var loadingScreen = document.querySelector('.loading-screen'); // Yükleme ekranı referansı (Loading screen reference)

    if (!compatibility.webGLSupported) {
        window.CompatibilityModule.showWebGLWarning(); // WebGL uyarı mesajını göster (Show WebGL warning message)
        // 3D özellikleri olmasa bile UI'nin yüklenmesine izin ver (Allow UI to load even without 3D features)
        if (loadingScreen) {
            setTimeout(function() {
                loadingScreen.classList.add('hidden');
                setTimeout(function() {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000); // Yükleme ekranını biraz gecikmeyle gizle (Hide loading screen with a slight delay)
        }
        return; // WebGL yoksa 3D başlatmayı sonlandır (End 3D initialization if WebGL is not available)
    }

    // Konteyneri al (Get the container element)
    var container = document.getElementById('table-3d-canvas');
    if (!container) {
        console.error("3D canvas konteyneri ('table-3d-canvas') bulunamadı!");
        if (loadingScreen) loadingScreen.style.display = 'none'; // Hata durumunda yükleme ekranını gizle
        return;
    }

    // Sahne oluştur (Create the scene)
    appState.scene = new THREE.Scene();
    appState.scene.background = new THREE.Color(0x1e1e24); // Koyu arka plan rengi (Dark background color)

    // Kamera oluştur (Create the camera)
    appState.camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
    appState.camera.position.set(3, 2.8, 3); // Tam masa görünümü için kamera pozisyonu (Camera position for full table view)
    appState.camera.lookAt(0, 0, 0); // Kameranın masanın merkezine bakmasını sağla (Make the camera look at the center of the table)

    // Hata yönetimi ile renderer oluştur (Create the renderer with error handling)
    try {
        appState.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Kenar yumuşatma ve alfa (şeffaflık) etkin (Antialiasing and alpha (transparency) enabled)
        appState.renderer.setSize(container.clientWidth, container.clientHeight);
        appState.renderer.shadowMap.enabled = true; // Gölgeleri etkinleştir (Enable shadows)
        appState.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Daha yumuşak gölgeler (Softer shadows)
        container.appendChild(appState.renderer.domElement);
    } catch (e) {
        console.error("WebGL renderer oluşturulurken hata:", e);
        window.CompatibilityModule.showWebGLWarning(); // Hata durumunda WebGL uyarısını göster
        if (loadingScreen) loadingScreen.style.display = 'none';
        return; // Renderer başarısız olursa başlatmayı sonlandır
    }

    // Işıkları ekle (Add lights to the scene)
    addLights();

    // Kontrolleri başlat (Initialize controls)
    appState.controls = window.ControlsModule.init(appState.camera, appState.renderer);

    // Yükleme animasyonunu göster (Show loading animation for the model)
    var modelLoadingIndicator = document.querySelector('.model-loading');
    if (modelLoadingIndicator) {
        modelLoadingIndicator.classList.add('active');
    }

    // Varsayılan masa modelini oluştur (Create the default table model)
    updateTableModel(); // Bu fonksiyon içinde model yükleme göstergesi yönetilecek

    // Animasyon döngüsünü başlat (Start the animation loop)
    animate();

    // Pencere yeniden boyutlandırmayı işle (Handle window resize events)
    window.addEventListener('resize', onWindowResize, false);
}

/**
 * Sahneye ışıklar oluşturur ve ekler
 * Creates and adds lights to the scene
 */
function addLights() {
    if (!appState.scene) return;

    // Ortam ışığı (Ambient light for overall illumination)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    appState.scene.add(ambientLight);

    // Ana yönlü ışık (Main directional light for shadows and highlights)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7.5); // Işık pozisyonu (Light position)
    directionalLight.castShadow = true; // Bu ışığın gölge oluşturmasını sağla (Enable shadow casting for this light)
    directionalLight.shadow.mapSize.width = 2048; // Gölge haritası çözünürlüğü (Shadow map resolution for better quality)
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5; // Gölge kamerası için yakın kırpma düzlemi (Near clipping plane for shadow camera)
    directionalLight.shadow.camera.far = 50; // Gölge kamerası için uzak kırpma düzlemi (Far clipping plane for shadow camera)
    directionalLight.shadow.bias = -0.0005; // Gölge artefaktlarını (shadow acne) azaltmak için bias ayarı (Bias setting to reduce shadow artifacts)
    appState.scene.add(directionalLight);

    // Dolgu ışığı (Fill light to soften shadows from the opposite side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 5, -7.5);
    appState.scene.add(fillLight);

    // Ön ışık (Front light to better illuminate the front of the table)
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.4);
    frontLight.position.set(0, 3, 5);
    appState.scene.add(frontLight);
}



/**
 * Pencere yeniden boyutlandırma olaylarını işler
 * Handles window resize events
 */
function onWindowResize() {
    const container = document.getElementById('table-3d-canvas');
    if (appState.camera && appState.renderer && container) {
        // Kamera en boy oranını güncelle (Update camera aspect ratio)
        appState.camera.aspect = container.clientWidth / container.clientHeight;
        appState.camera.updateProjectionMatrix(); // Kamera projeksiyon matrisini güncelle (Update camera projection matrix)

        // Renderer boyutunu güncelle (Update renderer size)
        appState.renderer.setSize(container.clientWidth, container.clientHeight);

        // ControlsModule'deki handleResize çağrılabilir (eğer varsa ve ek mantık içeriyorsa)
        // if (window.ControlsModule && typeof window.ControlsModule.handleResize === 'function') {
        //     window.ControlsModule.handleResize(container);
        // }
    }
}


/**
 * 3D masa modelini mevcut ayarlarla günceller
 * Updates the 3D table model with current settings
 */
function updateTableModel() {
    var modelLoadingIndicator = document.querySelector('.model-loading');
    if (modelLoadingIndicator) {
        modelLoadingIndicator.classList.add('active'); // Model yüklenirken göstergeyi aktif et
        modelLoadingIndicator.querySelector('span').textContent = "Model yükleniyor...";
    }

    // Yapılandırma nesnesi oluştur (Create configuration object)
    var config = {
        width: appState.tableWidth,
        length: appState.tableLength,
        height: appState.tableHeight,
        thickness: appState.tableThickness,
        material: appState.currentMaterial,
        edgeStyle: appState.edgeStyle,
        legStyle: appState.legStyle
    };

    console.log("Masa modeli güncelleniyor, malzeme:", appState.currentMaterial, "Ayak Stili:", appState.legStyle);

    // Mevcut yapılandırma ile masa oluştur (Create table with current configuration)
    if (window.TableModelModule && appState.scene) {
        try {
            // Önce eski modeli sil (Dispose old model first)
            window.TableModelModule.disposeTableModel(appState.scene);

            // Modeli oluşturmadan önce kısa bir gecikme ekleyerek yükleme göstergesinin görünmesini sağla
            setTimeout(function() {
                const tableGroup = window.TableModelModule.createTable(config, appState.scene);
                // Model başlığını güncelle (Update model header)
                window.TableModelModule.updateModelHeader(appState.currentMaterial, appState.edgeStyle);

                // Model başarıyla oluşturuldu - texture kontrolü artık gerekli değil (renkler kullanıyoruz)
                console.log("MAIN.JS: Masa modeli başarıyla oluşturuldu ve sahneye eklendi.");

            }, 50); // 50ms gecikme

        } catch (e) {
            console.error("Masa modeli oluşturulurken hata:", e);
            if (modelLoadingIndicator) {
                modelLoadingIndicator.classList.remove('active'); // Hata durumunda da göstergeyi kaldır
                modelLoadingIndicator.querySelector('span').textContent = "Model yüklenemedi!";
            }
        }
    }

    // Boyut etiketini güncelle (Update dimensions label)
    if (window.UtilsModule) {
        window.UtilsModule.updateDimensionsLabel(appState.tableWidth, appState.tableLength);
    }
}

/**
 * Otomatik döndürme fonksiyonu
 */
function toggleAutoRotate() {
    appState.isAutoRotating = !appState.isAutoRotating;

    const playBtn = document.getElementById('playPauseBtn');
    const icon = playBtn.querySelector('i');

    if (appState.isAutoRotating) {
        playBtn.classList.add('active');
        icon.className = 'fas fa-pause';
        playBtn.title = 'Döndürmeyi Durdur';
        console.log('MAIN.JS: Otomatik döndürme başlatıldı');
    } else {
        playBtn.classList.remove('active');
        icon.className = 'fas fa-play';
        playBtn.title = 'Otomatik Döndürme';
        console.log('MAIN.JS: Otomatik döndürme durduruldu');
    }
}

/**
 * Anlık indirme fonksiyonu
 */
function downloadScreenshot() {
    if (!appState.renderer) {
        console.error('MAIN.JS: Renderer bulunamadı, indirme yapılamıyor');
        return;
    }

    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.classList.add('downloading');

    try {
        // Render'ı güncelle
        appState.renderer.render(appState.scene, appState.camera);

        // Canvas'tan veri URL'si al
        const canvas = appState.renderer.domElement;
        const dataURL = canvas.toDataURL('image/png');

        // İndirme linki oluştur
        const link = document.createElement('a');
        link.download = `masa-tasarim-${Date.now()}.png`;
        link.href = dataURL;

        // İndirmeyi başlat
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('MAIN.JS: Ekran görüntüsü indirildi');

        // Butonu normale döndür
        setTimeout(() => {
            downloadBtn.classList.remove('downloading');
        }, 1000);

    } catch (error) {
        console.error('MAIN.JS: İndirme hatası:', error);
        downloadBtn.classList.remove('downloading');
    }
}

/**
 * Animasyon döngüsü
 */
function animate() {
    requestAnimationFrame(animate);

    // Otomatik döndürme
    if (appState.isAutoRotating && appState.controls) {
        appState.controls.autoRotate = true;
        appState.controls.autoRotateSpeed = appState.autoRotateSpeed * 100; // OrbitControls için uygun hız
    } else if (appState.controls) {
        appState.controls.autoRotate = false;
    }

    // Kontrolleri güncelle
    if (appState.controls) {
        appState.controls.update();
    }

    // Sahneyi render et
    if (appState.renderer && appState.scene && appState.camera) {
        appState.renderer.render(appState.scene, appState.camera);
    }
}

/**
 * Tüm UI olay dinleyicilerini başlatır
 * Initializes all UI event listeners
 */
function initEventListeners() {
    // Renk seçimi (Color selection) - Event delegation kullanarak
    const colorBar = document.querySelector('.color-bar');
    if (colorBar) {
        colorBar.addEventListener('click', function(event) {
            // Tıklanan element'i veya en yakın .color-item'ı bul
            let clickedItem = event.target.closest('.color-item');

            if (!clickedItem) {
                return;
            }

            // Önceki seçimi kaldır (Remove previous selection)
            document.querySelectorAll('.color-item').forEach(function(i) {
                i.classList.remove('selected');
                i.setAttribute('aria-checked', 'false');
                i.setAttribute('tabindex', '-1');
            });

            // Yeni öğeyi seç (Select the new item)
            clickedItem.classList.add('selected');
            clickedItem.setAttribute('aria-checked', 'true');
            clickedItem.setAttribute('tabindex', '0');

            // Seçilen rengi al
            const selectedColor = clickedItem.getAttribute('data-color');
            const colorName = clickedItem.getAttribute('data-name');

            if (selectedColor) {
                // appState'e renk bilgisini kaydet
                appState.currentColor = selectedColor;
                appState.currentColorName = colorName;

                console.log("MAIN.JS: ✅ Renk seçildi:", colorName, "->", selectedColor);

                // Masa modelini güncelle
                updateTableModel();
                if (window.UtilsModule) window.UtilsModule.updatePricing();
            }
        });
    }

    // Malzeme bilgi seçimi (Material info selection) - Sadece bilgi amaçlı
    const materialGrid = document.querySelector('.material-grid');
    if (materialGrid) {
        materialGrid.addEventListener('click', function(event) {
            // Tıklanan element'i veya en yakın .material-info-item'ı bul
            let clickedItem = event.target.closest('.material-info-item');

            if (!clickedItem) {
                return;
            }

            // Önceki seçimi kaldır (Remove previous selection)
            document.querySelectorAll('.material-info-item').forEach(function(i) {
                i.classList.remove('selected');
                i.setAttribute('aria-checked', 'false');
                i.setAttribute('tabindex', '-1');
            });

            // Yeni öğeyi seç (Select the new item)
            clickedItem.classList.add('selected');
            clickedItem.setAttribute('aria-checked', 'true');
            clickedItem.setAttribute('tabindex', '0');

            // Seçilen malzeme bilgisini al
            const selectedMaterial = clickedItem.getAttribute('data-material');
            const materialName = clickedItem.querySelector('.material-name').textContent;

            if (selectedMaterial) {
                // appState'e malzeme bilgisini kaydet (sadece bilgi amaçlı)
                appState.currentMaterialInfo = selectedMaterial;
                appState.currentMaterialName = materialName;

                console.log("MAIN.JS: ℹ️ Malzeme bilgisi seçildi:", materialName, "->", selectedMaterial);

                // Not: Masa modelini güncelleme - sadece bilgi amaçlı
                // updateTableModel(); // Bu satır kapalı - sadece bilgi gösterimi
            }
        });
    }

    // Boyut kaydırıcıları (Dimension sliders)
    document.querySelectorAll('input[type="range"]').forEach(function(slider) {
        // Throttled function for immediate model updates during sliding
        var throttledModelUpdate = window.UtilsModule.throttle(function() {
            updateTableModel();
        }, 100); // Update every 100ms while sliding

        // Debounced function for final model update when sliding stops
        var debouncedModelUpdate = window.UtilsModule.debounce(function() {
            updateTableModel();
        }, 50); // Very short delay for final update

        // Debounced function for pricing updates
        var debouncedPricingUpdate = window.UtilsModule.debounce(function() {
            if (window.UtilsModule) window.UtilsModule.updatePricing();
        }, 300);

        // Function to handle dimension updates
        function handleDimensionUpdate() {
            var dimension = slider.dataset.dimension;
            var value = parseFloat(slider.value);

            // Input validation
            if (isNaN(value)) {
                console.warn(`Invalid value for ${dimension}: ${slider.value}`);
                return;
            }

            // Dimension-specific validation
            var isValid = true;
            var errorMessage = '';

            switch(dimension) {
                case 'width':
                    if (value < 80 || value > 180) {
                        isValid = false;
                        errorMessage = 'Genişlik 80-180 cm arasında olmalıdır';
                    }
                    break;
                case 'length':
                    if (value < 100 || value > 240) {
                        isValid = false;
                        errorMessage = 'Uzunluk 100-240 cm arasında olmalıdır';
                    }
                    break;
                case 'height':
                    if (value < 65 || value > 85) {
                        isValid = false;
                        errorMessage = 'Yükseklik 65-85 cm arasında olmalıdır';
                    }
                    break;
                case 'thickness':
                    if (value < 0.3 || value > 5) {
                        isValid = false;
                        errorMessage = 'Kalınlık 0.3-5 cm arasında olmalıdır';
                    }
                    break;
            }

            if (!isValid) {
                console.warn(`Validation failed for ${dimension}: ${errorMessage}`);
                return;
            }

            // Update UI immediately (no debouncing for UI updates)
            var valueDisplay = slider.closest('.dimension-row').querySelector('.dimension-value');
            if (valueDisplay) {
                if (dimension === 'thickness' && value < 1) {
                    valueDisplay.textContent = (value * 10).toFixed(0) + ' mm';
                } else {
                    valueDisplay.textContent = value.toFixed(0) + ' cm';
                }
            }

            // Update app state immediately
            switch(dimension) {
                case 'width': appState.tableWidth = value; break;
                case 'length': appState.tableLength = value; break;
                case 'height': appState.tableHeight = value; break;
                case 'thickness': appState.tableThickness = value; break;
            }

            // Update dimensions badge immediately
            if (window.UtilsModule && (dimension === 'width' || dimension === 'length')) {
                window.UtilsModule.updateDimensionsLabel(appState.tableWidth, appState.tableLength);
            }

            // Use both throttled (immediate) and debounced (final) updates
            throttledModelUpdate(); // Immediate response while sliding
            debouncedModelUpdate(); // Final update when sliding stops
            debouncedPricingUpdate();
        }

        // Add both input and change event listeners for immediate response
        slider.addEventListener('input', handleDimensionUpdate);
        slider.addEventListener('change', handleDimensionUpdate);
    });

    // Stil seçenekleri (Edge and Leg style options)
    document.querySelectorAll('.style-option').forEach(function(option) {
        option.addEventListener('click', function() {
            var group = option.parentElement;
            if (group) { // Grup içindeki diğer seçeneklerden seçimi kaldır
                group.querySelectorAll('.style-option').forEach(function(opt) {
                    opt.classList.remove('selected');
                });
            }
            option.classList.add('selected'); // Tıklananı seç

            // Uygulama durumundaki stili güncelle
            if (option.hasAttribute('data-edge')) {
                appState.edgeStyle = option.dataset.edge;
            } else if (option.hasAttribute('data-leg')) {
                appState.legStyle = option.dataset.leg;
            }
            updateTableModel();
            if (window.UtilsModule) window.UtilsModule.updatePricing();
        });
    });

    // Özellikler onay kutuları (Features checkboxes)
    document.querySelectorAll('.feature-checkbox').forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            if (window.UtilsModule) window.UtilsModule.updatePricing(); // Sadece fiyatı güncelle
        });
    });

    // "Siparişi Tamamla" butonu (Complete Order button)
    const completeOrderBtn = document.getElementById('completeOrderBtn');
    const orderMessageDiv = document.getElementById('orderMessage');

    if (completeOrderBtn && orderMessageDiv) {
        completeOrderBtn.addEventListener('click', function() {
            // Seçilen yapılandırmayı topla (Gather selected configuration)
            const selectedConfiguration = {
                width: appState.tableWidth,
                length: appState.tableLength,
                height: appState.tableHeight,
                thickness: appState.tableThickness,
                material: appState.currentMaterial,
                edgeStyle: appState.edgeStyle,
                legStyle: appState.legStyle,
                features: []
            };

            document.querySelectorAll('.feature-checkbox:checked').forEach(function(checkbox) {
                const label = checkbox.nextElementSibling; // Etiketi al (Get the label)
                if (label && label.childNodes && label.childNodes.length > 0) {
                    // Etiketin ilk metin düğümünü al (fiyat bilgisini hariç tutmak için)
                    // Get the first text node of the label (to exclude price info)
                    selectedConfiguration.features.push(label.childNodes[0].textContent.trim());
                }
            });

            const totalPriceElement = document.querySelector('.pricing-summary .price-row.total .price-value');
            const totalPrice = totalPriceElement ? totalPriceElement.textContent : 'Hesaplanamadı';

            // Mesajı göster (Display the message)
            let featureText = selectedConfiguration.features.length > 0 ? ` Ek Özellikler: ${selectedConfiguration.features.join(', ')}.` : '';
            orderMessageDiv.textContent = `Siparişiniz alındı! ${totalPrice} tutarındaki ${selectedConfiguration.material} masanız (${selectedConfiguration.width}x${selectedConfiguration.length}cm, ${selectedConfiguration.edgeStyle} kenar, ${selectedConfiguration.legStyle} ayak)${featureText} Yakında hazırlanacaktır.`;

            console.log("Sipariş Tamamlandı:", selectedConfiguration);
            console.log("Toplam Fiyat:", totalPrice);

            // Birkaç saniye sonra mesajı temizle (isteğe bağlı) (Clear message after a few seconds (optional))
            setTimeout(function() {
                orderMessageDiv.textContent = '';
            }, 10000); // 10 saniye sonra mesajı sil (Clear message after 10 seconds)
        });
    }

    // Play/Pause butonu
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', toggleAutoRotate);
    }

    // İndirme butonu
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadScreenshot);
    }
}

/**
 * DOM yüklendiğinde ana başlatma fonksiyonu çağrılır
 * Main initialization function called when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    var loadingScreen = document.querySelector('.loading-screen');

    // Modüllerin yüklenip yüklenmediğini kontrol et (Check if modules are loaded)
    if (!window.CompatibilityModule || !window.MaterialsModule || !window.TableModelModule || !window.ControlsModule || !window.UtilsModule) {
        console.error("Bir veya daha fazla kritik modül yüklenemedi. Uygulama başlatılamıyor.");
        if (loadingScreen) loadingScreen.style.display = 'none';
        const body = document.querySelector('body');
        if (body) body.innerHTML = "<div style='text-align:center; padding: 20px; font-family: sans-serif; color: white; background-color: #121212; height: 100vh; display: flex; justify-content: center; align-items: center;'>Uygulama başlatılırken kritik bir sorun oluştu. Lütfen geliştirici konsolunu kontrol edin.</div>";
        return;
    }

    // UI elemanları için yükleme süresini simüle et (Simulate loading time for UI elements)
    // Bu, initThreeJS içindeki WebGL kontrolünden sonra daha mantıklı olabilir.
    if (loadingScreen) { // WebGL kontrolünden bağımsız olarak yükleme ekranını yönet
        setTimeout(function() {
            loadingScreen.classList.add('hidden');
            setTimeout(function() {
                loadingScreen.style.display = 'none';
            }, 500); // Gizlendikten sonra DOM'dan kaldır
        }, 1500); // Simülasyon süresi (Simulation duration)
    }

    // Three.js sahnesini başlat (Initialize Three.js scene)
    // initThreeJS kendi içinde WebGL kontrolünü ve ilgili yükleme ekranı yönetimini yapacak.
    initThreeJS();

    // Tüm olay dinleyicilerini başlat (Initialize all event listeners)
    initEventListeners();

    // Kaydırma ortaya çıkarma animasyonlarını ve fiyatlandırmayı başlat (Initialize scroll reveal animations and pricing)
    window.UtilsModule.initScrollReveal();
    window.UtilsModule.updatePricing();
});
