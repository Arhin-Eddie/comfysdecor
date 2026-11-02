/**
 * COMFY'S DECOR ACCESSORIES — CATALOG & REGISTRY APPLICATION
 * Modern home, kitchen and office decorative accessories in Ghana.
 * Official Contact: WhatsApp 059 542 7789 • Snapchat @comfys_decorate
 * 
 * Features:
 * - Real data source of truth with localStorage persistence
 * - Direct WhatsApp ordering flow prefilled with product title & SKU
 * - Transparent inventory and stock management
 * - Responsive 2-column mobile layout and horizontally scrollable category registers
 * - Space-efficient administration registry
 */

(function () {
  'use strict';

  // Storage Keys & Contact Information from Official Flyer
  const STORAGE_KEY_CACHE = 'cda_catalog_cache_v2';
  const WHATSAPP_PHONE_NUMBER = '233595427789'; // 059 542 7789
  const DISPLAY_PHONE = '059 542 7789';
  const SNAPCHAT_HANDLE = 'comfys_decorate';

  // Fast-paint cache helpers (Neon PostgreSQL is the authoritative single source of truth)
  function getCachedProducts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CACHE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return null;
  }

  function setCachedProducts(products) {
    try {
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(products));
    } catch (_) {}
  }

  // App State — Authoritatively fetched and synchronized with Neon PostgreSQL
  const state = {
    records: [],
    storeInfo: {
      whatsappNumber: '233595427789',
      displayPhone: '059 542 7789',
      snapchatHandle: 'comfys_decorate',
      heroEyebrow: 'Do you need a',
      heroSerif: 'decorative accessory',
      heroTarget: 'for your Home, Kitchen or Office?',
      heroSubtext: "Comfy's Decor Accessories has got exactly what you need. Browse our curated sculptures, ambient lighting, vases, and interior styling accents.",
      deliveryNotice: 'Delivery Across Ghana',
      storeLocation: 'Accra, Ghana',
      openingHours: 'Mon - Sat: 8:00 AM - 7:00 PM'
    },
    viewMode: 'public', // 'public' | 'admin'
    isAdminAuthenticated: false,
    adminToken: null,
    filterCategory: 'ALL',
    searchQuery: '',
    inStockOnly: false,
    sortBy: 'featured',
    density: 'grid', // 'grid' | 'dense' | 'list'
    adminStatusFilter: 'ALL',
    adminSearchQuery: '',
    activeArtifact: null
  };

  // DOM Elements Cache
  const els = {
    headerSearchInput: document.getElementById('headerSearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    headerAdminPill: document.getElementById('headerAdminPill'),
    viewStorefrontBtn: document.getElementById('viewStorefrontBtn'),
    adminLogoutBtn: document.getElementById('adminLogoutBtn'),
    // Dynamic Store Info Elements
    headerWaLink: document.getElementById('headerWaLink'),
    headerWaLabel: document.getElementById('headerWaLabel'),
    heroEyebrow: document.getElementById('heroEyebrow'),
    heroSerif: document.getElementById('heroSerif'),
    heroTargetRooms: document.getElementById('heroTargetRooms'),
    heroSubtext: document.getElementById('heroSubtext'),
    heroWaLink: document.getElementById('heroWaLink'),
    heroWaLabel: document.getElementById('heroWaLabel'),
    heroSnapLink: document.getElementById('heroSnapLink'),
    heroSnapLabel: document.getElementById('heroSnapLabel'),
    heroDeliveryLabel: document.getElementById('heroDeliveryLabel'),
    footerWaLink: document.getElementById('footerWaLink'),
    footerWaLabel: document.getElementById('footerWaLabel'),
    footerSnapLink: document.getElementById('footerSnapLink'),
    footerSnapLabel: document.getElementById('footerSnapLabel'),
    footerLocationHours: document.getElementById('footerLocationHours'),
    footerDeliveryText: document.getElementById('footerDeliveryText'),
    // Store Settings Modal Elements
    openSettingsModalBtn: document.getElementById('openSettingsModalBtn'),
    settingsModalBackdrop: document.getElementById('settingsModalBackdrop'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
    cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
    storeSettingsForm: document.getElementById('storeSettingsForm'),
    settingsWhatsapp: document.getElementById('settingsWhatsapp'),
    settingsDisplayPhone: document.getElementById('settingsDisplayPhone'),
    settingsSnapchat: document.getElementById('settingsSnapchat'),
    settingsDelivery: document.getElementById('settingsDelivery'),
    settingsLocation: document.getElementById('settingsLocation'),
    settingsHours: document.getElementById('settingsHours'),
    settingsHeroEyebrow: document.getElementById('settingsHeroEyebrow'),
    settingsHeroSerif: document.getElementById('settingsHeroSerif'),
    settingsHeroTarget: document.getElementById('settingsHeroTarget'),
    settingsHeroSubtext: document.getElementById('settingsHeroSubtext'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    saveSettingsBtnText: document.getElementById('saveSettingsBtnText'),
    // Admin Login Modal Elements
    loginModalBackdrop: document.getElementById('loginModalBackdrop'),
    adminLoginModal: document.getElementById('adminLoginModal'),
    closeLoginModalBtn: document.getElementById('closeLoginModalBtn'),
    cancelLoginBtn: document.getElementById('cancelLoginBtn'),
    adminLoginForm: document.getElementById('adminLoginForm'),
    adminUsername: document.getElementById('adminUsername'),
    adminPasscode: document.getElementById('adminPasscode'),
    togglePasswordBtn: document.getElementById('togglePasswordBtn'),
    togglePasswordIcon: document.getElementById('togglePasswordIcon'),
    rememberAdminCheckbox: document.getElementById('rememberAdminCheckbox'),
    submitLoginBtn: document.getElementById('submitLoginBtn'),
    loginBtnText: document.getElementById('loginBtnText'),
    loginAlertBox: document.getElementById('loginAlertBox'),
    loginAlertText: document.getElementById('loginAlertText'),
    gridDensityBtn: document.getElementById('gridDensityBtn'),
    listDensityBtn: document.getElementById('listDensityBtn'),
    publicSection: document.getElementById('publicStorefrontSection'),
    adminSection: document.getElementById('adminInventorySection'),
    categoryRegister: document.getElementById('categoryRegister'),
    inStockOnlyCheckbox: document.getElementById('inStockOnlyCheckbox'),
    catalogSortSelect: document.getElementById('catalogSortSelect'),
    catalogCounter: document.getElementById('catalogCounter'),
    counterText: document.getElementById('counterText'),
    activeFilterPills: document.getElementById('activeFilterPills'),
    filterPillsList: document.getElementById('filterPillsList'),
    clearAllFiltersBtn: document.getElementById('clearAllFiltersBtn'),
    catalogGrid: document.getElementById('catalogGrid'),
    publicEmptyState: document.getElementById('publicEmptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    emptyResetFilterBtn: document.getElementById('emptyResetFilterBtn'),
    emptyLoadSampleBtn: document.getElementById('emptyLoadSampleBtn'),
    // Admin elements
    exportCatalogBtn: document.getElementById('exportCatalogBtn'),
    importCatalogBtn: document.getElementById('importCatalogBtn'),
    importFileInput: document.getElementById('importFileInput'),
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    statTotalCount: document.getElementById('statTotalCount'),
    statPublishedCount: document.getElementById('statPublishedCount'),
    statDraftCount: document.getElementById('statDraftCount'),
    statValuation: document.getElementById('statValuation'),
    adminSearchInput: document.getElementById('adminSearchInput'),
    adminStatusTabs: document.getElementById('adminStatusTabs'),
    tabCountAll: document.getElementById('tabCountAll'),
    tabCountPub: document.getElementById('tabCountPub'),
    tabCountDraft: document.getElementById('tabCountDraft'),
    tabCountLow: document.getElementById('tabCountLow'),
    inventoryTableBody: document.getElementById('inventoryTableBody'),
    adminEmptyState: document.getElementById('adminEmptyState'),
    // Drawer elements
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    artifactDrawer: document.getElementById('artifactDrawer'),
    closeDrawerBtn: document.getElementById('closeDrawerBtn'),
    drawerSku: document.getElementById('drawerSku'),
    drawerOrigin: document.getElementById('drawerOrigin'),
    drawerMainImage: document.getElementById('drawerMainImage'),
    drawerGalleryCounter: document.getElementById('drawerGalleryCounter'),
    drawerThumbnailsStrip: document.getElementById('drawerThumbnailsStrip'),
    drawerTitle: document.getElementById('drawerTitle'),
    drawerPriceGhs: document.getElementById('drawerPriceGhs'),
    drawerStockIndicator: document.getElementById('drawerStockIndicator'),
    drawerStockText: document.getElementById('drawerStockText'),
    drawerDescription: document.getElementById('drawerDescription'),
    drawerSpecsGrid: document.getElementById('drawerSpecsGrid'),
    drawerSymbolismSection: document.getElementById('drawerSymbolismSection'),
    drawerSymbolism: document.getElementById('drawerSymbolism'),
    drawerInquireLink: document.getElementById('drawerInquireLink'),
    // Modal elements
    modalBackdrop: document.getElementById('modalBackdrop'),
    editorModal: document.getElementById('editorModal'),
    modalHeading: document.getElementById('modalHeading'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    artifactForm: document.getElementById('artifactForm'),
    editArtifactId: document.getElementById('editArtifactId'),
    formTitle: document.getElementById('formTitle'),
    formSku: document.getElementById('formSku'),
    formCategory: document.getElementById('formCategory'),
    formPrice: document.getElementById('formPrice'),
    formStock: document.getElementById('formStock'),
    formOrigin: document.getElementById('formOrigin'),
    formMaterial: document.getElementById('formMaterial'),
    formDimensions: document.getElementById('formDimensions'),
    formWeight: document.getElementById('formWeight'),
    formGuild: document.getElementById('formGuild'),
    formImageUrl: document.getElementById('formImageUrl'),
    formDescription: document.getElementById('formDescription'),
    formSymbolism: document.getElementById('formSymbolism'),
    formPublished: document.getElementById('formPublished'),
    saveBtnText: document.getElementById('saveBtnText'),
    currentYear: document.getElementById('currentYear')
  };

  function checkIsAdminRoute() {
    const path = (window.location.pathname || '').toLowerCase();
    const hash = (window.location.hash || '').toLowerCase();
    const search = (window.location.search || '').toLowerCase();
    return path.startsWith('/admin') || path.startsWith('/login') || hash === '#admin' || search.includes('admin');
  }

  /**
   * INITIALIZATION & PERSISTENCE ENGINE
   */
  async function init() {
    if (els.currentYear) els.currentYear.textContent = new Date().getFullYear();

    // Verify saved admin credentials against Neon
    await initAdminAuth();

    bindEvents();

    // Fetch live store settings & contacts from Neon
    await fetchStoreInfo();

    // 1. Instant paint with local cached records if available for zero render delay
    const cached = getCachedProducts();
    if (cached && cached.length > 0) {
      state.records = cached;
      renderAll();
    }

    // 2. Private Admin Route Handling (/admin, /login, #admin)
    if (checkIsAdminRoute()) {
      if (state.isAdminAuthenticated) {
        setViewMode('admin');
      } else {
        setViewMode('public');
        openLoginModal();
      }
    } else {
      setViewMode('public');
    }

    // 3. Authoritatively fetch live catalog directly from Neon PostgreSQL database
    await fetchLiveProductsFromNeon();
  }

  async function fetchLiveProductsFromNeon() {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          state.records = json.data;
          setCachedProducts(json.data);
          renderAll();
          return;
        }
      }
      console.warn('Neon DB returned non-OK response:', res.status);
    } catch (err) {
      console.warn('Network issue reaching Neon DB:', err);
    }
  }

  /**
   * STORE INFO & CONTACT MANAGEMENT (Synced with Neon PostgreSQL)
   */
  async function fetchStoreInfo() {
    try {
      const res = await fetch('/api/store-info');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          state.storeInfo = { ...state.storeInfo, ...json.data };
          renderStoreInfo();
        }
      }
    } catch (err) {
      console.warn('Could not load store info from Neon:', err);
    }
  }

  function renderStoreInfo() {
    const info = state.storeInfo;
    if (!info) return;

    if (els.headerWaLink) els.headerWaLink.href = `https://wa.me/${info.whatsappNumber}`;
    if (els.headerWaLabel) els.headerWaLabel.textContent = info.displayPhone;

    if (els.heroEyebrow) els.heroEyebrow.textContent = info.heroEyebrow;
    if (els.heroSerif) els.heroSerif.textContent = info.heroSerif;
    if (els.heroTargetRooms) els.heroTargetRooms.textContent = info.heroTarget;
    if (els.heroSubtext) {
      const cleanSub = info.heroSubtext.replace(/^Comfy's Decor Accessories\s*/i, '');
      els.heroSubtext.innerHTML = `<strong class="brand-accent-red">Comfy's Decor Accessories</strong> ${cleanSub}`;
    }

    if (els.heroWaLink) els.heroWaLink.href = `https://wa.me/${info.whatsappNumber}`;
    if (els.heroWaLabel) els.heroWaLabel.textContent = info.displayPhone;

    const snapClean = info.snapchatHandle.replace(/^@/, '');
    if (els.heroSnapLink) els.heroSnapLink.href = `https://www.snapchat.com/add/${snapClean}`;
    if (els.heroSnapLabel) els.heroSnapLabel.textContent = `@${snapClean}`;
    if (els.heroDeliveryLabel) els.heroDeliveryLabel.textContent = info.deliveryNotice;

    if (els.footerWaLink) els.footerWaLink.href = `https://wa.me/${info.whatsappNumber}`;
    if (els.footerWaLabel) els.footerWaLabel.textContent = info.displayPhone;
    if (els.footerSnapLink) els.footerSnapLink.href = `https://www.snapchat.com/add/${snapClean}`;
    if (els.footerSnapLabel) els.footerSnapLabel.textContent = `@${snapClean}`;
    if (els.footerDeliveryText) {
      els.footerDeliveryText.textContent = `All prices are shown in Ghanaian Cedis (GH₵). ${info.deliveryNotice}. Payment arrangements are finalized easily during WhatsApp consultation.`;
    }
    if (els.footerLocationHours) {
      els.footerLocationHours.innerHTML = `<strong>Location:</strong> ${info.storeLocation} • <strong>Hours:</strong> ${info.openingHours}`;
    }
  }

  function openSettingsModal() {
    if (!state.isAdminAuthenticated) {
      openLoginModal('Please log in as admin to modify store settings.');
      return;
    }
    const info = state.storeInfo;
    if (els.settingsWhatsapp) els.settingsWhatsapp.value = info.whatsappNumber || '';
    if (els.settingsDisplayPhone) els.settingsDisplayPhone.value = info.displayPhone || '';
    if (els.settingsSnapchat) els.settingsSnapchat.value = info.snapchatHandle || '';
    if (els.settingsDelivery) els.settingsDelivery.value = info.deliveryNotice || '';
    if (els.settingsLocation) els.settingsLocation.value = info.storeLocation || '';
    if (els.settingsHours) els.settingsHours.value = info.openingHours || '';
    if (els.settingsHeroEyebrow) els.settingsHeroEyebrow.value = info.heroEyebrow || '';
    if (els.settingsHeroSerif) els.settingsHeroSerif.value = info.heroSerif || '';
    if (els.settingsHeroTarget) els.settingsHeroTarget.value = info.heroTarget || '';
    if (els.settingsHeroSubtext) els.settingsHeroSubtext.value = info.heroSubtext || '';

    if (els.settingsModal) els.settingsModal.classList.remove('hidden');
    if (els.settingsModalBackdrop) els.settingsModalBackdrop.classList.remove('hidden');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeSettingsModal() {
    if (els.settingsModal) els.settingsModal.classList.add('hidden');
    if (els.settingsModalBackdrop) els.settingsModalBackdrop.classList.add('hidden');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  async function handleSettingsSubmit(e) {
    e.preventDefault();
    if (!state.isAdminAuthenticated) {
      closeSettingsModal();
      openLoginModal('Please log in as admin to save store settings.');
      return;
    }

    const payload = {
      whatsappNumber: els.settingsWhatsapp.value.trim().replace(/^\+/, ''),
      displayPhone: els.settingsDisplayPhone.value.trim(),
      snapchatHandle: els.settingsSnapchat.value.trim().replace(/^@/, ''),
      deliveryNotice: els.settingsDelivery.value.trim(),
      storeLocation: els.settingsLocation.value.trim(),
      openingHours: els.settingsHours.value.trim(),
      heroEyebrow: els.settingsHeroEyebrow.value.trim(),
      heroSerif: els.settingsHeroSerif.value.trim(),
      heroTarget: els.settingsHeroTarget.value.trim(),
      heroSubtext: els.settingsHeroSubtext.value.trim()
    };

    els.saveSettingsBtn.disabled = true;
    els.saveSettingsBtnText.textContent = 'Saving to Neon DB...';

    try {
      const res = await fetch('/api/store-info', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        handleAuthExpired();
        return;
      }

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        state.storeInfo = data.data;
        renderStoreInfo();
        closeSettingsModal();
        alert('Store settings & contacts successfully updated in Neon PostgreSQL!');
      } else {
        alert('Could not update store settings: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      alert('Error updating store settings: ' + err.message);
    } finally {
      els.saveSettingsBtn.disabled = false;
      els.saveSettingsBtnText.textContent = 'Save Store Settings';
    }
  }

  /**
   * ADMIN AUTHENTICATION
   */
  async function initAdminAuth() {
    const token = localStorage.getItem('cda_admin_token') || sessionStorage.getItem('cda_admin_token');
    if (!token) {
      setAdminAuthState(false, null);
      return;
    }
    try {
      const res = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success && data.valid) {
        setAdminAuthState(true, token);
      } else {
        localStorage.removeItem('cda_admin_token');
        sessionStorage.removeItem('cda_admin_token');
        setAdminAuthState(false, null);
      }
    } catch (_) {
      // Offline fallback: if token exists locally, preserve login
      setAdminAuthState(true, token);
    }
  }

  function setAdminAuthState(isAuthenticated, token) {
    state.isAdminAuthenticated = isAuthenticated;
    state.adminToken = token;

    if (els.headerAdminPill) {
      els.headerAdminPill.classList.toggle('hidden', !isAuthenticated);
    }
  }

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (state.adminToken) {
      headers['Authorization'] = `Bearer ${state.adminToken}`;
    }
    return headers;
  }

  function handleAuthExpired() {
    localStorage.removeItem('cda_admin_token');
    sessionStorage.removeItem('cda_admin_token');
    setAdminAuthState(false, null);
    setViewMode('public');
    openLoginModal('Admin session expired. Please enter credentials to continue.');
  }

  function openLoginModal(errorMessage = '') {
    if (errorMessage) {
      els.loginAlertText.textContent = errorMessage;
      els.loginAlertBox.classList.remove('hidden');
    } else {
      els.loginAlertBox.classList.add('hidden');
    }
    if (els.adminPasscode) els.adminPasscode.value = '';
    if (els.adminLoginModal) els.adminLoginModal.classList.remove('hidden');
    if (els.loginModalBackdrop) els.loginModalBackdrop.classList.remove('hidden');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (els.adminPasscode) els.adminPasscode.focus();
    }, 100);
  }

  function closeLoginModal() {
    if (els.adminLoginModal) els.adminLoginModal.classList.add('hidden');
    if (els.loginModalBackdrop) els.loginModalBackdrop.classList.add('hidden');
    if (els.loginAlertBox) els.loginAlertBox.classList.add('hidden');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    // If closing without logging in while on a private admin path, return to clean public URL
    if (!state.isAdminAuthenticated && checkIsAdminRoute()) {
      if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/login')) {
        history.pushState(null, '', '/');
      } else if (window.location.hash === '#admin') {
        history.pushState(null, '', window.location.pathname);
      }
      setViewMode('public');
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    const username = els.adminUsername ? els.adminUsername.value.trim() : 'admin';
    const password = els.adminPasscode.value.trim();
    if (!password) {
      els.loginAlertText.textContent = 'Please enter your admin password.';
      els.loginAlertBox.classList.remove('hidden');
      return;
    }

    els.submitLoginBtn.disabled = true;
    els.loginBtnText.textContent = 'Authenticating with Neon DB...';

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const remember = els.rememberAdminCheckbox.checked;
        if (remember) {
          localStorage.setItem('cda_admin_token', data.token);
        } else {
          sessionStorage.setItem('cda_admin_token', data.token);
        }
        setAdminAuthState(true, data.token);
        closeLoginModal();
        if (!window.location.pathname.startsWith('/admin')) {
          history.pushState(null, '', '/admin');
        }
        setViewMode('admin');
      } else {
        els.loginAlertText.textContent = data.error || 'Invalid username or password. Access denied.';
        els.loginAlertBox.classList.remove('hidden');
        els.adminPasscode.select();
      }
    } catch (err) {
      els.loginAlertText.textContent = 'Connection error. Check network or server status.';
      els.loginAlertBox.classList.remove('hidden');
    } finally {
      els.submitLoginBtn.disabled = false;
      els.loginBtnText.textContent = 'Log In as Admin';
    }
  }

  function handleAdminLogout() {
    localStorage.removeItem('cda_admin_token');
    sessionStorage.removeItem('cda_admin_token');
    setAdminAuthState(false, null);
    if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/login') || window.location.hash === '#admin') {
      history.pushState(null, '', '/');
    }
    setViewMode('public');
  }

  /**
   * CURRENCY FORMATTER (Ghanaian Cedis)
   */
  function formatGhs(amount) {
    const num = Number(amount) || 0;
    return 'GH₵ ' + num.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  /**
   * SEARCH & FILTER LOGIC
   */
  function getFilteredPublicRecords() {
    let result = state.records.filter(r => r.published);

    // Category filter
    if (state.filterCategory !== 'ALL') {
      result = result.filter(r => r.category === state.filterCategory);
    }

    // In-Stock filter
    if (state.inStockOnly) {
      result = result.filter(r => Number(r.stockQty) > 0);
    }

    // Search query (across title, sku, color/finish, material, room/placement)
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchSku = (item.sku || '').toLowerCase().includes(q);
        const matchOrigin = (item.origin || '').toLowerCase().includes(q);
        const matchMaterial = (item.material || '').toLowerCase().includes(q);
        const matchGuild = (item.guild || '').toLowerCase().includes(q);
        const matchCategory = (item.category || '').toLowerCase().includes(q);
        return matchTitle || matchSku || matchOrigin || matchMaterial || matchGuild || matchCategory;
      });
    }

    // Sort order
    return sortRecords(result, state.sortBy);
  }

  function sortRecords(list, sortKey) {
    const arr = [...list];
    switch (sortKey) {
      case 'price-asc':
        return arr.sort((a, b) => Number(a.priceGhs) - Number(b.priceGhs));
      case 'price-desc':
        return arr.sort((a, b) => Number(b.priceGhs) - Number(a.priceGhs));
      case 'title-asc':
        return arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'featured':
      default:
        return arr; // Preserves curated order
    }
  }

  function getFilteredAdminRecords() {
    let result = [...state.records];

    // Status tabs
    if (state.adminStatusFilter === 'PUBLISHED') {
      result = result.filter(r => r.published);
    } else if (state.adminStatusFilter === 'DRAFT') {
      result = result.filter(r => !r.published);
    } else if (state.adminStatusFilter === 'LOW_STOCK') {
      result = result.filter(r => Number(r.stockQty) <= 2);
    }

    // Admin Search
    if (state.adminSearchQuery.trim() !== '') {
      const q = state.adminSearchQuery.toLowerCase().trim();
      result = result.filter(r => {
        const matchTitle = (r.title || '').toLowerCase().includes(q);
        const matchSku = (r.sku || '').toLowerCase().includes(q);
        const matchCat = (r.category || '').toLowerCase().includes(q);
        return matchTitle || matchSku || matchCat;
      });
    }

    return result;
  }

  /**
   * RENDERERS
   */
  function renderAll() {
    renderPublicCatalog();
    renderAdminRegistry();
  }

  function renderPublicCatalog() {
    const list = getFilteredPublicRecords();
    els.catalogGrid.innerHTML = '';

    // Update Counter
    const publishedTotal = state.records.filter(r => r.published).length;
    els.counterText.textContent = `Showing ${list.length} of ${publishedTotal} accessories`;

    // Render Active Filter Tags
    renderActiveFilterPills();

    // Empty state logic
    if (list.length === 0) {
      els.publicEmptyState.classList.remove('hidden');
      if (state.records.length === 0) {
        els.emptyStateTitle.textContent = 'Catalog is currently empty';
        els.emptyStateDesc.textContent = 'There are no items recorded in the system. Load the sample decor catalog or use the Admin Registry to add new items.';
        els.emptyResetFilterBtn.classList.add('hidden');
        els.emptyLoadSampleBtn.classList.remove('hidden');
      } else {
        els.emptyStateTitle.textContent = 'No accessories match your criteria';
        els.emptyStateDesc.textContent = 'Try adjusting your search terms, selecting "All Items", or unchecking the in-stock filter.';
        els.emptyResetFilterBtn.classList.remove('hidden');
        els.emptyLoadSampleBtn.classList.add('hidden');
      }
      return;
    }

    els.publicEmptyState.classList.add('hidden');

    // Build Product Cards
    const frag = document.createDocumentFragment();
    list.forEach(item => {
      const card = createArtifactCard(item);
      frag.appendChild(card);
    });
    els.catalogGrid.appendChild(frag);
  }

  function createArtifactCard(item) {
    const article = document.createElement('article');
    article.className = 'artifact-card';
    article.setAttribute('tabindex', '0');
    article.setAttribute('role', 'button');
    article.setAttribute('aria-label', `${item.title}, ${formatGhs(item.priceGhs)}`);

    const imgUrl = (item.images && item.images.length > 0)
      ? item.images[0]
      : 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80';

    const stockNum = Number(item.stockQty) || 0;
    let stockClass = '';
    let stockText = `${stockNum} in stock`;

    if (stockNum <= 0) {
      stockClass = 'out';
      stockText = 'Out of Stock';
    } else if (stockNum <= 2) {
      stockClass = 'low';
      stockText = `Only ${stockNum} left`;
    }

    // Badge label: Color / Finish or Category
    const badgeLabel = (item.origin || item.category || 'Décor').split('/')[0].trim();

    article.innerHTML = `
      <div class="card-media-frame">
        <img class="card-img" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" />
        <div class="card-flag-row">
          <span class="card-origin-tag">${escapeHtml(badgeLabel)}</span>
          <span class="card-stock-dot ${stockClass}" title="${stockText}"></span>
        </div>
      </div>
      <div class="card-content">
        <div class="card-meta-line">
          <span class="card-category">${escapeHtml(item.category || 'Accessories')}</span>
          <span class="card-sku">${escapeHtml(item.sku || '')}</span>
        </div>
        <h3 class="card-title">${escapeHtml(item.title)}</h3>
        <div class="card-price-row">
          <div class="price-container">
            <span class="card-price-ghs">${formatGhs(item.priceGhs)}</span>
          </div>
          <span class="card-stock-label ${stockNum <= 0 ? 'text-out' : ''}">${stockText}</span>
        </div>
      </div>
    `;

    // Click & Keyboard Enter to Inspect
    article.addEventListener('click', () => openArtifactDrawer(item));
    article.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openArtifactDrawer(item);
      }
    });

    return article;
  }

  function renderActiveFilterPills() {
    const pills = [];
    if (state.searchQuery.trim() !== '') {
      pills.push({ type: 'search', label: `Search: "${state.searchQuery}"` });
    }
    if (state.filterCategory !== 'ALL') {
      pills.push({ type: 'category', label: `Category: ${state.filterCategory}` });
    }
    if (state.inStockOnly) {
      pills.push({ type: 'stock', label: 'In-Stock Only' });
    }

    if (pills.length === 0) {
      els.activeFilterPills.classList.add('hidden');
      return;
    }

    els.activeFilterPills.classList.remove('hidden');
    els.filterPillsList.innerHTML = pills.map(p => `
      <span class="active-tag">
        <span>${escapeHtml(p.label)}</span>
        <button type="button" data-pill-type="${p.type}" aria-label="Remove filter">
          <span class="material-symbols-outlined" style="font-size:14px;">close</span>
        </button>
      </span>
    `).join('');

    els.filterPillsList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.pillType;
        if (type === 'search') {
          state.searchQuery = '';
          els.headerSearchInput.value = '';
          els.clearSearchBtn.classList.add('hidden');
        } else if (type === 'category') {
          setCategoryFilter('ALL');
        } else if (type === 'stock') {
          state.inStockOnly = false;
          els.inStockOnlyCheckbox.checked = false;
        }
        renderPublicCatalog();
      });
    });
  }

  function renderAdminRegistry() {
    const allRecords = state.records;
    const filtered = getFilteredAdminRecords();

    // Summary Calculations
    const totalCount = allRecords.length;
    const publishedCount = allRecords.filter(r => r.published).length;
    const draftCount = allRecords.filter(r => !r.published).length;
    const lowStockCount = allRecords.filter(r => Number(r.stockQty) <= 2).length;
    const totalValuation = allRecords.reduce((sum, r) => sum + (Number(r.priceGhs) * Number(r.stockQty)), 0);

    els.statTotalCount.textContent = totalCount;
    els.statPublishedCount.textContent = publishedCount;
    els.statDraftCount.textContent = draftCount;
    els.statValuation.textContent = formatGhs(totalValuation);

    // Tab Counts
    els.tabCountAll.textContent = totalCount;
    els.tabCountPub.textContent = publishedCount;
    els.tabCountDraft.textContent = draftCount;
    els.tabCountLow.textContent = lowStockCount;

    // Table Body
    els.inventoryTableBody.innerHTML = '';

    if (filtered.length === 0) {
      els.adminEmptyState.classList.remove('hidden');
      return;
    }

    els.adminEmptyState.classList.add('hidden');

    const frag = document.createDocumentFragment();
    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = `table-row ${!item.published ? 'row-draft' : ''}`;

      const stockNum = Number(item.stockQty) || 0;
      const isLow = stockNum <= 2 && stockNum > 0;
      const isOut = stockNum <= 0;
      const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : '';

      tr.innerHTML = `
        <td class="col-thumb">
          <div class="table-thumb-wrap">
            <img src="${escapeHtml(imgUrl)}" alt="" class="table-thumb" />
          </div>
        </td>
        <td class="col-sku">
          <code class="sku-pill">${escapeHtml(item.sku)}</code>
        </td>
        <td class="col-title">
          <span class="table-item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</span>
          <span class="table-item-origin">${escapeHtml(item.origin || item.guild || 'Modern Décor')}</span>
        </td>
        <td class="col-category">
          <span class="table-category-tag">${escapeHtml(item.category)}</span>
        </td>
        <td class="col-price">
          <span class="table-price">${formatGhs(item.priceGhs)}</span>
        </td>
        <td class="col-stock">
          <div class="stock-control-cluster">
            <button type="button" class="stock-btn dec" data-action="dec" data-id="${item.id}" title="Decrease stock">−</button>
            <span class="stock-count ${isOut ? 'out' : ''} ${isLow ? 'low' : ''}">${stockNum}</span>
            <button type="button" class="stock-btn inc" data-action="inc" data-id="${item.id}" title="Increase stock">+</button>
          </div>
        </td>
        <td class="col-status">
          <button type="button" class="status-toggle-btn ${item.published ? 'status-live' : 'status-draft'}" data-action="toggle-pub" data-id="${item.id}" title="Toggle publish state">
            <span class="status-dot"></span>
            <span>${item.published ? 'Live' : 'Draft'}</span>
          </button>
        </td>
        <td class="col-actions">
          <div class="table-actions-cluster">
            <button type="button" class="action-icon-btn edit" data-action="edit" data-id="${item.id}" title="Edit item specifications">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button type="button" class="action-icon-btn delete" data-action="delete" data-id="${item.id}" title="Delete item">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      `;

      frag.appendChild(tr);
    });

    els.inventoryTableBody.appendChild(frag);

    // Attach Row Action Delegation
    els.inventoryTableBody.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'inc') adjustStock(id, 1);
        else if (action === 'dec') adjustStock(id, -1);
        else if (action === 'toggle-pub') toggleItemPublish(id);
        else if (action === 'edit') {
          const item = state.records.find(r => r.id === id);
          if (item) openEditModal(item);
        } else if (action === 'delete') {
          deleteItem(id);
        }
      });
    });
  }

  /**
   * ARTIFACT INSPECTION DRAWER (Product Detail View)
   */
  function openArtifactDrawer(item) {
    state.activeArtifact = item;

    els.drawerSku.textContent = item.sku;
    els.drawerOrigin.textContent = item.category + (item.origin ? ` • ${item.origin}` : '');
    els.drawerTitle.textContent = item.title;
    els.drawerPriceGhs.textContent = formatGhs(item.priceGhs);
    els.drawerDescription.textContent = item.description || 'Modern decorative accessory designed for interior styling and everyday spaces.';

    // Stock state
    const stock = Number(item.stockQty) || 0;
    if (stock > 2) {
      els.drawerStockIndicator.style.color = 'var(--color-success)';
      els.drawerStockText.textContent = `In Stock (${stock} available)`;
    } else if (stock > 0) {
      els.drawerStockIndicator.style.color = 'var(--color-warning)';
      els.drawerStockText.textContent = `Low Stock — Only ${stock} remaining`;
    } else {
      els.drawerStockIndicator.style.color = 'var(--color-error)';
      els.drawerStockText.textContent = 'Currently Out of Stock (Inquire for restocking)';
    }

    // Styling & Care recommendations
    if (item.symbolism && item.symbolism.trim()) {
      els.drawerSymbolismSection.classList.remove('hidden');
      els.drawerSymbolism.textContent = item.symbolism;
    } else {
      els.drawerSymbolismSection.classList.add('hidden');
    }

    // Specs Grid: Material, Dimensions, Finish, Room / Placement, Weight
    const specsFrag = document.createDocumentFragment();
    const specsData = [
      { key: 'Category', val: item.category },
      { key: 'Color / Finish', val: item.origin },
      { key: 'Material', val: item.material },
      { key: 'Dimensions', val: item.dimensions },
      { key: 'Net Weight', val: item.weight },
      { key: 'Suggested Placement', val: item.guild }
    ];

    specsData.forEach(s => {
      if (s.val && s.val.trim()) {
        const div = document.createElement('div');
        div.className = 'spec-item';
        div.innerHTML = `
          <dt class="spec-key">${escapeHtml(s.key)}</dt>
          <dd class="spec-val">${escapeHtml(s.val)}</dd>
        `;
        specsFrag.appendChild(div);
      }
    });
    els.drawerSpecsGrid.innerHTML = '';
    els.drawerSpecsGrid.appendChild(specsFrag);

    // Gallery Photos
    const images = (item.images && item.images.length > 0)
      ? item.images
      : ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80'];
    setDrawerImage(images[0], 0, images.length);

    els.drawerThumbnailsStrip.innerHTML = '';
    if (images.length > 1) {
      els.drawerThumbnailsStrip.classList.remove('hidden');
      images.forEach((url, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `drawer-thumb-btn ${idx === 0 ? 'active' : ''}`;
        btn.innerHTML = `<img src="${escapeHtml(url)}" alt="" />`;
        btn.addEventListener('click', () => {
          setDrawerImage(url, idx, images.length);
          els.drawerThumbnailsStrip.querySelectorAll('.drawer-thumb-btn').forEach((b, i) => {
            b.classList.toggle('active', i === idx);
          });
        });
        els.drawerThumbnailsStrip.appendChild(btn);
      });
    } else {
      els.drawerThumbnailsStrip.classList.add('hidden');
    }

    // Direct WhatsApp Ordering Link using dynamic store contact
    const waNumber = (state.storeInfo && state.storeInfo.whatsappNumber) ? state.storeInfo.whatsappNumber : WHATSAPP_PHONE_NUMBER;
    const msg = encodeURIComponent(`Hello Comfy's Decor Accessories, I would like to order: "${item.title}" (SKU: ${item.sku}) listed at ${formatGhs(item.priceGhs)}.`);
    els.drawerInquireLink.href = `https://wa.me/${waNumber}?text=${msg}`;

    // Show Drawer & Lock document background scroll
    els.drawerBackdrop.classList.remove('hidden');
    els.artifactDrawer.classList.remove('hidden');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function setDrawerImage(url, index, total) {
    els.drawerMainImage.src = url;
    els.drawerMainImage.alt = state.activeArtifact ? state.activeArtifact.title : 'Product Image';
    els.drawerGalleryCounter.textContent = `${index + 1} / ${total}`;
  }

  function closeArtifactDrawer() {
    els.drawerBackdrop.classList.add('hidden');
    els.artifactDrawer.classList.add('hidden');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    state.activeArtifact = null;
  }

  /**
   * RECORD MUTATIONS (Directly synchronized with Neon PostgreSQL)
   */
  async function adjustStock(id, delta) {
    if (!state.isAdminAuthenticated) {
      openLoginModal('Please log in as admin to adjust inventory stock.');
      return;
    }
    const item = state.records.find(r => r.id === id);
    if (!item) return;

    const current = Number(item.stockQty) || 0;
    const nextVal = Math.max(0, current + delta);

    try {
      const res = await fetch(`/api/products/${id}/stock`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stockQty: nextVal })
      });
      if (res.status === 401) {
        handleAuthExpired();
        return;
      }
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        item.stockQty = data.data.stockQty;
        setCachedProducts(state.records);
        renderAll();
      } else {
        alert('Could not update stock in database: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      alert('Network error connecting to Neon database: ' + err.message);
    }
  }

  async function toggleItemPublish(id) {
    if (!state.isAdminAuthenticated) {
      openLoginModal('Please log in as admin to modify product status.');
      return;
    }
    const item = state.records.find(r => r.id === id);
    if (!item) return;

    try {
      const res = await fetch(`/api/products/${id}/publish`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        handleAuthExpired();
        return;
      }
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        item.published = data.data.published;
        setCachedProducts(state.records);
        renderAll();
      } else {
        alert('Could not update status in database: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      alert('Network error connecting to Neon database: ' + err.message);
    }
  }

  async function deleteItem(id) {
    if (!state.isAdminAuthenticated) {
      openLoginModal('Please log in as admin to delete products.');
      return;
    }
    const item = state.records.find(r => r.id === id);
    if (!item) return;

    const confirmed = window.confirm(`Permanently remove "${item.title}" (SKU: ${item.sku}) from the Neon database?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        handleAuthExpired();
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        state.records = state.records.filter(r => r.id !== id);
        setCachedProducts(state.records);
        renderAll();
      } else {
        alert('Could not delete product from database: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      alert('Network error connecting to Neon database: ' + err.message);
    }
  }

  /**
   * ADD & EDIT MODAL
   */
  function openAddModal() {
    els.artifactForm.reset();
    els.editArtifactId.value = '';
    els.modalHeading.textContent = 'Add New Item';
    els.saveBtnText.textContent = 'Save Item';

    // Auto-generate realistic SKU suggestion
    const nextSeq = state.records.length + 1;
    els.formSku.value = `CDA-ACC-${String(nextSeq).padStart(3, '0')}`;
    els.formPublished.checked = true;

    clearFormErrors();
    els.modalBackdrop.classList.remove('hidden');
    els.editorModal.classList.remove('hidden');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function openEditModal(item) {
    els.artifactForm.reset();
    els.editArtifactId.value = item.id;
    els.modalHeading.textContent = `Edit: ${item.sku}`;
    els.saveBtnText.textContent = 'Save Changes';

    els.formTitle.value = item.title || '';
    els.formSku.value = item.sku || '';
    els.formCategory.value = item.category || 'Living Room Décor';
    els.formPrice.value = item.priceGhs || '';
    els.formStock.value = item.stockQty !== undefined ? item.stockQty : 1;
    els.formOrigin.value = item.origin || '';
    els.formMaterial.value = item.material || '';
    els.formDimensions.value = item.dimensions || '';
    els.formWeight.value = item.weight || '';
    els.formGuild.value = item.guild || '';
    els.formImageUrl.value = (item.images && item.images.length > 0) ? item.images[0] : '';
    els.formDescription.value = item.description || '';
    els.formSymbolism.value = item.symbolism || '';
    els.formPublished.checked = !!item.published;

    clearFormErrors();
    els.modalBackdrop.classList.remove('hidden');
    els.editorModal.classList.remove('hidden');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    els.modalBackdrop.classList.add('hidden');
    els.editorModal.classList.add('hidden');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  function clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.classList.add('hidden'));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    clearFormErrors();

    const title = els.formTitle.value.trim();
    const sku = els.formSku.value.trim().toUpperCase();
    const category = els.formCategory.value;
    const price = parseFloat(els.formPrice.value);
    const stock = parseInt(els.formStock.value, 10);
    const origin = els.formOrigin.value.trim();
    const imageUrl = els.formImageUrl.value.trim();
    const desc = els.formDescription.value.trim();

    let hasError = false;

    if (!title) {
      document.getElementById('errTitle').classList.remove('hidden');
      hasError = true;
    }
    if (!sku) {
      document.getElementById('errSku').classList.remove('hidden');
      hasError = true;
    }
    if (isNaN(price) || price <= 0) {
      document.getElementById('errPrice').classList.remove('hidden');
      hasError = true;
    }
    if (isNaN(stock) || stock < 0) {
      document.getElementById('errStock').classList.remove('hidden');
      hasError = true;
    }
    if (!origin) {
      document.getElementById('errOrigin').classList.remove('hidden');
      hasError = true;
    }
    if (!imageUrl) {
      document.getElementById('errImageUrl').classList.remove('hidden');
      hasError = true;
    }
    if (!desc) {
      document.getElementById('errDesc').classList.remove('hidden');
      hasError = true;
    }

    if (hasError) return;

    if (!state.isAdminAuthenticated) {
      closeModal();
      openLoginModal('Please log in as admin to save items.');
      return;
    }

    const id = els.editArtifactId.value;
    const isEdit = Boolean(id);

    els.saveArtifactBtn.disabled = true;
    els.saveBtnText.textContent = isEdit ? 'Updating Neon DB...' : 'Saving to Neon DB...';

    const payload = {
      ...(isEdit ? { id } : {}),
      title,
      sku,
      category,
      priceGhs: price,
      stockQty: stock,
      origin,
      material: els.formMaterial.value.trim(),
      dimensions: els.formDimensions.value.trim(),
      weight: els.formWeight.value.trim(),
      guild: els.formGuild.value.trim(),
      images: [imageUrl],
      description: desc,
      symbolism: els.formSymbolism.value.trim(),
      published: els.formPublished.checked
    };

    try {
      let res;
      if (isEdit) {
        res = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }

      if (res.status === 401) {
        handleAuthExpired();
        return;
      }

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        if (isEdit) {
          const idx = state.records.findIndex(r => r.id === id);
          if (idx !== -1) state.records[idx] = data.data;
        } else {
          state.records.unshift(data.data);
        }
        setCachedProducts(state.records);
        renderAll();
        closeModal();
      } else {
        alert('Database error: ' + (data.error || 'Failed to save product in Neon.'));
      }
    } catch (err) {
      alert('Network or database connection error: ' + err.message);
    } finally {
      els.saveArtifactBtn.disabled = false;
      els.saveBtnText.textContent = isEdit ? 'Save Changes' : 'Save Item';
    }
  }

  /**
   * BACKUP & IMPORT
   */
  function exportCatalogJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.records, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `comfys_decor_catalog_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handleImportJson(e) {
    if (!state.isAdminAuthenticated) {
      openLoginModal('Please log in as admin to import catalog data.');
      return;
    }
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          const res = await fetch('/api/products/import', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(imported)
          });
          if (res.status === 401) {
            handleAuthExpired();
            return;
          }
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.data)) {
            state.records = data.data;
            setCachedProducts(state.records);
            renderAll();
            alert(`Successfully imported ${data.data.length} items to Neon PostgreSQL database.`);
          } else {
            alert('Database import failed: ' + (data.error || 'Unknown error'));
          }
        } else {
          alert('Invalid file format. Expected a JSON array of items.');
        }
      } catch (err) {
        alert('Could not parse JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  /**
   * RESET TO SIGNATURE FLYER CATALOG IN NEON DB
   */
  async function resetSampleDemo() {
    if (!state.isAdminAuthenticated) {
      openLoginModal('Please log in as admin to reset catalog.');
      return;
    }
    const confirmed = window.confirm('Reset catalog in Neon PostgreSQL to the 12 signature flyer items?');
    if (!confirmed) return;

    try {
      const res = await fetch('/api/products/reset', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        handleAuthExpired();
        return;
      }
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        state.records = data.data;
        setCachedProducts(state.records);
        renderAll();
        alert(`Neon database successfully reset with ${data.data.length} signature flyer items.`);
      } else {
        alert('Could not reset Neon database: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      alert('Error connecting to Neon database: ' + err.message);
    }
  }

  /**
   * CATEGORY & VIEW CONTROLS
   */
  function setCategoryFilter(cat) {
    state.filterCategory = cat;
    els.categoryRegister.querySelectorAll('.cat-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === cat);
    });
    renderPublicCatalog();
  }

  function setViewMode(mode) {
    if (mode === 'admin' && !state.isAdminAuthenticated) {
      openLoginModal('Admin authentication required.');
      return;
    }
    state.viewMode = mode;
    if (mode === 'public') {
      if (els.publicSection) els.publicSection.classList.remove('hidden');
      if (els.adminSection) els.adminSection.classList.add('hidden');
      renderPublicCatalog();
    } else {
      if (els.adminSection) els.adminSection.classList.remove('hidden');
      if (els.publicSection) els.publicSection.classList.add('hidden');
      renderAdminRegistry();
    }
  }

  function setDensity(density) {
    state.density = density;
    els.gridDensityBtn.classList.toggle('active', density === 'grid');
    els.listDensityBtn.classList.toggle('active', density === 'list');

    if (density === 'list') {
      els.catalogGrid.classList.add('list-view');
    } else {
      els.catalogGrid.classList.remove('list-view');
    }
  }

  /**
   * EVENT BINDINGS
   */
  function bindEvents() {
    // Admin header navigation pill (only visible when logged in)
    if (els.headerAdminPill) {
      els.headerAdminPill.addEventListener('click', (e) => {
        e.preventDefault();
        if (!window.location.pathname.startsWith('/admin')) {
          history.pushState(null, '', '/admin');
        }
        setViewMode('admin');
      });
    }

    // View Storefront button inside Admin Topbar
    if (els.viewStorefrontBtn) {
      els.viewStorefrontBtn.addEventListener('click', () => {
        history.pushState(null, '', '/');
        setViewMode('public');
      });
    }

    // History and Hash Navigation (Direct private URL access)
    window.addEventListener('popstate', () => {
      if (checkIsAdminRoute()) {
        if (state.isAdminAuthenticated) {
          setViewMode('admin');
        } else {
          setViewMode('public');
          openLoginModal();
        }
      } else {
        setViewMode('public');
      }
    });

    window.addEventListener('hashchange', () => {
      if (checkIsAdminRoute()) {
        if (state.isAdminAuthenticated) {
          setViewMode('admin');
        } else {
          setViewMode('public');
          openLoginModal();
        }
      } else {
        setViewMode('public');
      }
    });

    // Admin Logout
    if (els.adminLogoutBtn) els.adminLogoutBtn.addEventListener('click', handleAdminLogout);

    // Store Settings Modal Handlers
    if (els.openSettingsModalBtn) els.openSettingsModalBtn.addEventListener('click', openSettingsModal);
    if (els.closeSettingsModalBtn) els.closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    if (els.cancelSettingsBtn) els.cancelSettingsBtn.addEventListener('click', closeSettingsModal);
    if (els.settingsModalBackdrop) els.settingsModalBackdrop.addEventListener('click', closeSettingsModal);
    if (els.storeSettingsForm) els.storeSettingsForm.addEventListener('submit', handleSettingsSubmit);

    // Admin Login Modal Handlers
    if (els.closeLoginModalBtn) els.closeLoginModalBtn.addEventListener('click', closeLoginModal);
    if (els.cancelLoginBtn) els.cancelLoginBtn.addEventListener('click', closeLoginModal);
    if (els.loginModalBackdrop) els.loginModalBackdrop.addEventListener('click', closeLoginModal);
    if (els.adminLoginForm) els.adminLoginForm.addEventListener('submit', handleAdminLogin);
    if (els.togglePasswordBtn) {
      els.togglePasswordBtn.addEventListener('click', () => {
        const isPassword = els.adminPasscode.type === 'password';
        els.adminPasscode.type = isPassword ? 'text' : 'password';
        els.togglePasswordIcon.textContent = isPassword ? 'visibility_off' : 'visibility';
      });
    }

    // Density Switch
    els.gridDensityBtn.addEventListener('click', () => setDensity('grid'));
    els.listDensityBtn.addEventListener('click', () => setDensity('list'));

    // Empty state reload
    if (els.emptyLoadSampleBtn) els.emptyLoadSampleBtn.addEventListener('click', resetSampleDemo);

    // Search Handlers
    let debounceTimer;
    els.headerSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchQuery = e.target.value;
        els.clearSearchBtn.classList.toggle('hidden', state.searchQuery === '');
        renderPublicCatalog();
      }, 150);
    });

    els.clearSearchBtn.addEventListener('click', () => {
      state.searchQuery = '';
      els.headerSearchInput.value = '';
      els.clearSearchBtn.classList.add('hidden');
      renderPublicCatalog();
    });

    // Category Buttons
    els.categoryRegister.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-pill');
      if (!btn) return;
      setCategoryFilter(btn.dataset.category);
    });

    // In-Stock Toggle
    els.inStockOnlyCheckbox.addEventListener('change', (e) => {
      state.inStockOnly = e.target.checked;
      renderPublicCatalog();
    });

    // Sort Selector
    els.catalogSortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderPublicCatalog();
    });

    // Clear All Filters
    els.clearAllFiltersBtn.addEventListener('click', () => {
      state.searchQuery = '';
      els.headerSearchInput.value = '';
      els.clearSearchBtn.classList.add('hidden');
      state.inStockOnly = false;
      els.inStockOnlyCheckbox.checked = false;
      setCategoryFilter('ALL');
    });

    els.emptyResetFilterBtn.addEventListener('click', () => {
      state.searchQuery = '';
      els.headerSearchInput.value = '';
      els.clearSearchBtn.classList.add('hidden');
      state.inStockOnly = false;
      els.inStockOnlyCheckbox.checked = false;
      setCategoryFilter('ALL');
    });

    // Drawer Close Handlers
    els.closeDrawerBtn.addEventListener('click', closeArtifactDrawer);
    els.drawerBackdrop.addEventListener('click', closeArtifactDrawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeArtifactDrawer();
        closeModal();
      }
    });

    // Admin Action Buttons
    els.openAddModalBtn.addEventListener('click', openAddModal);
    els.closeModalBtn.addEventListener('click', closeModal);
    els.cancelModalBtn.addEventListener('click', closeModal);
    els.modalBackdrop.addEventListener('click', closeModal);
    els.artifactForm.addEventListener('submit', handleFormSubmit);

    els.exportCatalogBtn.addEventListener('click', exportCatalogJson);
    els.importCatalogBtn.addEventListener('click', () => els.importFileInput.click());
    els.importFileInput.addEventListener('change', handleImportJson);

    // Admin Status Filter Tabs
    els.adminStatusTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.admin-tab');
      if (!tab) return;
      state.adminStatusFilter = tab.dataset.status;
      els.adminStatusTabs.querySelectorAll('.admin-tab').forEach(t => {
        t.classList.toggle('active', t === tab);
      });
      renderAdminRegistry();
    });

    // Admin Search
    els.adminSearchInput.addEventListener('input', (e) => {
      state.adminSearchQuery = e.target.value;
      renderAdminRegistry();
    });
  }

  // Utilities
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Self Start
  document.addEventListener('DOMContentLoaded', init);

})();
