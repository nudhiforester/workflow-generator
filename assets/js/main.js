/**
 * Workflow Generator - Main Application Script
 * Mengelola Autentikasi, Interaksi Canvas GoJS, Animasi Garis, dan Penyimpanan Project
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Inisialisasi State & Konfigurasi Global
  // =========================================================================
  const CONFIG = {
    API_URL: 'api/projects.php',
    AUTO_SAVE_INTERVAL: 6000, // Simpan otomatis setiap 6 detik jika ada perubahan
    DEFAULT_COLOR: '#22C55E',
    COLOR_PRESETS: ['#22C55E', '#EF4444', '#000000', '#3B82F6', '#FFCC00', '#A855F7'],
    ICON_PRESETS: ['📥', '⚙️', '🔌', '🗄️', '🚀', '🔔', '👤', '📊', '📄', '🔒', '🛒', '🌐', '📦', '💡', '🏷️', '🎯', '✨', '⚡']
  };

  const state = {
    currentUser: null,
    currentProject: null,
    isModified: false,
    autoSaveTimer: null,
    flowAnimationId: null,
    diagram: null,
    theme: 'light',
    selectedPart: null // Node atau Link yang sedang aktif
  };

  // Buat modal secara aman agar pustaka Bootstrap yang gagal dimuat tidak
  // menghentikan pemasangan handler login dan toggle password.
  function createModal(elementId) {
    const modalElement = document.getElementById(elementId);
    if (!modalElement) throw new Error(`Elemen modal "${elementId}" tidak ditemukan.`);
    if (window.bootstrap && window.bootstrap.Modal) {
      return new window.bootstrap.Modal(modalElement);
    }

    return {
      show() {
        modalElement.hidden = false;
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-modal', 'true');
      },
      hide() {
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.hidden = true;
        modalElement.removeAttribute('aria-modal');
      }
    };
  }

  // =========================================================================
  // 2. DOM Elements Selection
  // =========================================================================
  const el = {
    // Views
    loginView: document.getElementById('loginView'),
    mainAppView: document.getElementById('mainAppView'),

    // Login Form
    loginForm: document.getElementById('loginForm'),
    loginSubmit: document.getElementById('btnLoginSubmit'),
    emailInput: document.getElementById('loginEmail'),
    passwordInput: document.getElementById('loginPassword'),
    btnTogglePwd: document.getElementById('btnTogglePwd'),
    loginAlert: document.getElementById('loginAlert'),

    // Header & User
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    headerUserAvatar: document.getElementById('headerUserAvatar'),
    headerUserName: document.getElementById('headerUserName'),
    userMenuButton: document.getElementById('userMenuDropdown'),
    userProfileMenu: document.getElementById('userProfileMenu'),
    menuViewProfile: document.getElementById('menuViewProfile'),
    menuEditProfile: document.getElementById('menuEditProfile'),
    menuLogout: document.getElementById('menuLogout'),

    // Sidebar & Projects
    btnCreateProject: document.getElementById('btnCreateProject'),
    popoverCreateProject: document.getElementById('popoverCreateProject'),
    formCreateProjectPopover: document.getElementById('formCreateProjectPopover'),
    inputPopoverProjectName: document.getElementById('inputPopoverProjectName'),
    btnCloseCreatePopover: document.getElementById('btnCloseCreatePopover'),
    btnCancelCreatePopover: document.getElementById('btnCancelCreatePopover'),
    projectList: document.getElementById('projectList'),

    // Canvas Floating Controls
    inputProjectName: document.getElementById('inputProjectName'),
    btnSaveProject: document.getElementById('btnSaveProject'),
    saveStatusText: document.getElementById('saveStatusText'),
    btnAddShape: document.getElementById('btnAddShape'),
    btnDownload: document.getElementById('btnDownload'),
    downloadMenu: document.getElementById('downloadMenu'),

    // Inspectors
    nodeInspector: document.getElementById('nodeInspector'),
    nodeTitleInput: document.getElementById('nodeTitleInput'),
    nodeSubtitleInput: document.getElementById('nodeSubtitleInput'),
    nodeColorPresets: document.getElementById('nodeColorPresets'),
    btnOpenIconPicker: document.getElementById('btnOpenIconPicker'),
    btnSaveNodeInspector: document.getElementById('btnSaveNodeInspector'),
    btnDeleteNode: document.getElementById('btnDeleteNode'),
    btnCloseNodeInspector: document.getElementById('btnCloseNodeInspector'),

    linkInspector: document.getElementById('linkInspector'),
    linkColorPresets: document.getElementById('linkColorPresets'),
    linkAnimToggle: document.getElementById('linkAnimToggle'),
    linkRouteStyle: document.getElementById('linkRouteStyle'),
    btnDeleteLink: document.getElementById('btnDeleteLink'),
    btnCloseLinkInspector: document.getElementById('btnCloseLinkInspector'),

    // Modals
    modalProfileView: createModal('modalProfileView'),
    profileViewName: document.getElementById('profileViewName'),
    profileViewEmail: document.getElementById('profileViewEmail'),
    profileViewContact: document.getElementById('profileViewContact'),

    modalProfileEdit: createModal('modalProfileEdit'),
    formProfileEdit: document.getElementById('formProfileEdit'),
    editProfileName: document.getElementById('editProfileName'),
    editProfileContact: document.getElementById('editProfileContact'),
    editProfilePassword: document.getElementById('editProfilePassword'),

    modalIconPicker: createModal('modalIconPicker'),
    iconGridContainer: document.getElementById('iconGridContainer'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // =========================================================================
  // 3. Helper & Toast Notification
  // =========================================================================
  function showToast(message, type = 'info') {
    const iconClass = type === 'success' ? 'bi-check-circle-fill text-success' :
                      type === 'error' ? 'bi-exclamation-triangle-fill text-danger' :
                      'bi-info-circle-fill text-warning';

    const toast = document.createElement('div');
    toast.className = 'toast-custom';
    toast.innerHTML = `<i class="bi ${iconClass} fs-5"></i> <span>${message}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Tampilkan pesan kesalahan sebagai alert yang mudah ditemukan dan dibaca.
  function showLoginAlert(message, type = 'error') {
    if (!el.loginAlert) {
      window.alert(message);
      return;
    }
    el.loginAlert.textContent = message;
    el.loginAlert.className = `login-alert ${type === 'success' ? 'login-alert-success' : 'login-alert-error'}`;
    el.loginAlert.hidden = false;
  }

  // Laporkan error runtime yang tidak tertangani, bukan membiarkannya hilang.
  window.addEventListener('error', function (event) {
    console.error('Kesalahan aplikasi:', event.error || event.message);
    const message = event.error && event.error.message ? event.error.message : 'Terjadi kesalahan pada aplikasi.';
    if (el.loginView && el.loginView.style.display !== 'none') showLoginAlert(message);
    else showToast(message, 'error');
  });

  window.addEventListener('unhandledrejection', function (event) {
    console.error('Permintaan aplikasi gagal:', event.reason);
    const message = event.reason && event.reason.message ? event.reason.message : 'Permintaan gagal diproses.';
    if (el.loginView && el.loginView.style.display !== 'none') showLoginAlert(message);
    else showToast(message, 'error');
  });

  // =========================================================================
  // 4. Manajemen Autentikasi Pengguna
  // =========================================================================
  function checkAuthState() {
    // Sesi hanya hidup di memori tab; tidak menulis cookie atau penyimpanan browser.
    state.currentUser = null;
    resetLoginForm();
    showLoginView();
  }

  // Kosongkan kredensial saat halaman dibuka atau dipulihkan dari riwayat browser.
  function resetLoginForm() {
    if (!el.loginForm || state.currentUser) return;
    el.loginForm.reset();
    el.emailInput.value = '';
    el.passwordInput.value = '';
    el.passwordInput.type = 'password';
    el.btnTogglePwd.setAttribute('aria-pressed', 'false');
    el.btnTogglePwd.setAttribute('aria-label', 'Tampilkan password');
    el.btnTogglePwd.title = 'Tampilkan password';
    const icon = el.btnTogglePwd.querySelector('i');
    if (icon) icon.className = 'bi bi-eye';
    if (el.loginAlert) el.loginAlert.hidden = true;
  }

  window.addEventListener('pageshow', resetLoginForm);

  function setupUserInterface() {
    if (!state.currentUser) return;
    el.headerUserName.textContent = state.currentUser.username || 'User';
    el.profileViewName.textContent = state.currentUser.username || '-';
    el.profileViewEmail.textContent = state.currentUser.email || '-';
    el.profileViewContact.textContent = state.currentUser.contact || '-';

    el.editProfileName.value = state.currentUser.username || '';
    el.editProfileContact.value = state.currentUser.contact || '';
  }

  function showLoginView() {
    el.loginView.style.display = 'flex';
    el.mainAppView.style.display = 'none';
    if (state.autoSaveTimer) {
      clearInterval(state.autoSaveTimer);
      state.autoSaveTimer = null;
    }
  }

  function showMainApp() {
    el.loginView.style.display = 'none';
    el.mainAppView.style.display = 'flex';
    try {
      initDiagramOnce();
      // Pastikan tampilan awal lembar kerja bersih & kosong
      if (state.diagram) {
        state.diagram.model = new go.GraphLinksModel({ nodeDataArray: [], linkDataArray: [] });
      }
      state.currentProject = null;
      if (el.inputProjectName) el.inputProjectName.value = '';
      if (el.saveStatusText) el.saveStatusText.textContent = 'Lembar kerja kosong';
    } catch (diagramErr) {
      console.error('Error saat inisialisasi diagram GoJS:', diagramErr);
    }
    loadProjectList();
    startAutoSaveWatcher();
  }

  // Submit Login
  el.loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    el.loginAlert.hidden = true;
    const email = el.emailInput.value.trim();
    // Passwords are opaque credentials: do not trim or otherwise transform them.
    const password = el.passwordInput.value;

    if (!el.loginForm.checkValidity()) {
      if (!email) showLoginAlert('Email wajib diisi.');
      else if (!el.emailInput.validity.valid) showLoginAlert('Format alamat email tidak valid.');
      else if (!password) showLoginAlert('Password wajib diisi.');
      else showLoginAlert('Periksa kembali data login.');
      return;
    }

    if (el.loginSubmit.disabled) return;
    el.loginSubmit.disabled = true;
    el.loginSubmit.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(`${CONFIG.API_URL}?action=login`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Server login mengirim respons yang tidak valid (HTTP ${response.status}). Pastikan Apache dan PHP berjalan.`);
      }

      if (response.ok && data.success && data.user && data.user.email) {
        state.currentUser = data.user;
        setupUserInterface();
        showMainApp();
        showToast(`Selamat datang kembali, ${data.user.username}!`, 'success');
      } else {
        showLoginAlert(data.message || (response.status === 401 ? 'Email atau password salah.' : `Login gagal (HTTP ${response.status}).`));
      }
    } catch (err) {
      console.warn('Login API tidak dapat dihubungi:', err);
      const message = err instanceof TypeError
        ? 'Tidak dapat menghubungi API login. Buka aplikasi melalui Apache/WAMP, bukan file HTML langsung, lalu pastikan PHP aktif.'
        : (err.message || 'Login gagal. Silakan coba lagi.');
      showLoginAlert(message);
    } finally {
      el.loginSubmit.disabled = false;
      el.loginSubmit.removeAttribute('aria-busy');
    }
  });

  // Toggle Password Visibility
  el.btnTogglePwd.addEventListener('click', function () {
    const isPassword = el.passwordInput.type === 'password';
    el.passwordInput.type = isPassword ? 'text' : 'password';
    const icon = el.btnTogglePwd.querySelector('i');
    el.btnTogglePwd.setAttribute('aria-pressed', String(isPassword));
    el.btnTogglePwd.setAttribute('aria-label', isPassword ? 'Sembunyikan password' : 'Tampilkan password');
    el.btnTogglePwd.title = isPassword ? 'Sembunyikan password' : 'Tampilkan password';
    if (icon) {
      icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
    }
  });

  // Logout
  el.menuLogout.addEventListener('click', function (e) {
    e.preventDefault();
    hideProfileMenu();
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      state.currentUser = null;
      state.currentProject = null;
      resetLoginForm();
      showLoginView();
      showToast('Anda telah logout.', 'info');
    }
  });

  // View Profile Modal
  el.menuViewProfile.addEventListener('click', function (e) {
    e.preventDefault();
    hideProfileMenu();
    el.modalProfileView.show();
  });

  // Edit Profile Modal
  el.menuEditProfile.addEventListener('click', function (e) {
    e.preventDefault();
    hideProfileMenu();
    el.modalProfileEdit.show();
  });

  // Toggle profile menu explicitly so it stays closed until requested.
  function hideProfileMenu() {
    el.userProfileMenu.hidden = true;
    el.userMenuButton.setAttribute('aria-expanded', 'false');
  }

  el.userMenuButton.addEventListener('click', function (e) {
    e.stopPropagation();
    const willOpen = el.userProfileMenu.hidden;
    el.userProfileMenu.hidden = !willOpen;
    el.userMenuButton.setAttribute('aria-expanded', String(willOpen));
  });

  // Save Edit Profile
  el.formProfileEdit.addEventListener('submit', async function (e) {
    e.preventDefault();
    const updatedUser = {
      username: el.editProfileName.value.trim(),
      email: state.currentUser.email,
      contact: el.editProfileContact.value.trim(),
      password: el.editProfilePassword.value.trim()
    };

    try {
      const response = await fetch(`${CONFIG.API_URL}?action=profile_update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: updatedUser })
      });
      const data = await response.json();
      if (data.success && data.user) {
        state.currentUser = Object.assign(state.currentUser, data.user);
        setupUserInterface();
        el.modalProfileEdit.hide();
        showToast('Profil berhasil diperbarui.', 'success');
      } else {
        showToast(data.message || 'Gagal memperbarui profil.', 'error');
      }
    } catch (err) {
      showToast(`Profil gagal disimpan: ${err.message || 'server tidak dapat dihubungi.'}`, 'error');
    }
  });

  // =========================================================================
  // 5. Inisialisasi Tema (Dark / Light Mode)
  // =========================================================================
  function initTheme() {
    // Development mode uses a clean light theme on every page load.
    setTheme('light');
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      el.themeIcon.className = 'bi bi-moon-stars-fill';
      if (state.diagram) {
        state.diagram.div.style.backgroundColor = '#0B1220';
        updateNodesTheme(true);
      }
    } else {
      el.themeIcon.className = 'bi bi-sun-fill';
      if (state.diagram) {
        state.diagram.div.style.backgroundColor = '#FFFFFF';
        updateNodesTheme(false);
      }
    }
  }

  function updateNodesTheme(isDark) {
    if (!state.diagram) return;
    state.diagram.commit(d => {
      d.nodes.each(node => {
        const shape = node.findObject('SHAPE');
        if (shape) {
          shape.fill = isDark ? '#1E293B' : '#FFFFFF';
        }
        const titleText = node.findObject('TITLE');
        if (titleText) {
          titleText.stroke = isDark ? '#F8FAFC' : '#000000';
        }
        const subtitleText = node.findObject('SUBTITLE');
        if (subtitleText) {
          subtitleText.stroke = isDark ? '#94A3B8' : '#6B7280';
        }
      });
    }, 'themeChange');
  }

  el.btnThemeToggle.addEventListener('click', function () {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  });

  // =========================================================================
  // 6. GoJS Diagram Setup & Templates
  // =========================================================================
  function initDiagramOnce() {
    if (state.diagram) return;

    const $ = go.GraphObject.make;

    const diagram = $(go.Diagram, 'workflowDiagramDiv', {
      'undoManager.isEnabled': true,
      'linkingTool.isEnabled': true,
      'relinkingTool.isEnabled': true,
      'grid.visible': false,
      allowDrop: true,
      // Saat diagram diubah, catat perubahan untuk auto-save
      'ModelChanged': function (e) {
        if (e.isTransactionFinished) {
          state.isModified = true;
          el.saveStatusText.textContent = 'Ada perubahan belum disimpan';
        }
      }
    });

    state.diagram = diagram;

    // Helper membuat Port titik koneksi pada 4 sisi node (Terlihat jelas agar user tahu tempat klik garis)
    function makePort(name, spot, output, input) {
      return $(go.Shape, 'Circle', {
        name: 'PORT_' + name,
        fill: state.theme === 'dark' ? '#1E293B' : '#FFFFFF',
        stroke: '#000000',
        strokeWidth: 2,
        desiredSize: new go.Size(12, 12),
        alignment: spot,
        alignmentFocus: spot,
        portId: name,
        fromSpot: spot,
        toSpot: spot,
        fromLinkable: output,
        toLinkable: input,
        cursor: 'crosshair',
        // Visual feedback saat cursor hover di atas port titik koneksi
        mouseEnter: (e, port) => {
          port.fill = '#FFCC00';
          port.scale = 1.35;
        },
        mouseLeave: (e, port) => {
          port.fill = state.theme === 'dark' ? '#1E293B' : '#FFFFFF';
          port.scale = 1.0;
        }
      });
    }

    // Node Template
    diagram.nodeTemplate = $(
      go.Node, 'Spot',
      {
        locationSpot: go.Spot.Center,
        // Body node tidak menjadi linkable agar drag-and-drop berfungsi lancar untuk menggeser node
        fromLinkable: false,
        toLinkable: false,
        movable: true,
        cursor: 'move',
        selectionAdornmentTemplate: $(
          go.Adornment, 'Auto',
          $(go.Shape, 'RoundedRectangle', {
            parameter1: 14,
            fill: null,
            stroke: '#FFCC00',
            strokeWidth: 3,
            strokeDashArray: [4, 4]
          }),
          $(go.Placeholder)
        )
      },
      new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),

      // Panel Body Node (Kartu Persegi Panjang Rounded)
      $(
        go.Panel, 'Auto',
        { desiredSize: new go.Size(160, 90) },
        $(
          go.Shape, 'RoundedRectangle',
          {
            name: 'SHAPE',
            parameter1: 12,
            fill: state.theme === 'dark' ? '#1E293B' : '#FFFFFF',
            strokeWidth: 2.5
          },
          new go.Binding('stroke', 'color', c => c || CONFIG.DEFAULT_COLOR)
        ),
        $(
          go.Panel, 'Vertical',
          { alignment: go.Spot.Center },
          // Icon Node
          $(
            go.TextBlock,
            {
              name: 'ICON',
              font: '22px sans-serif',
              textAlign: 'center',
              margin: new go.Margin(0, 0, 2, 0)
            },
            new go.Binding('text', 'icon', i => i || '📥')
          ),
          // Title
          $(
            go.TextBlock,
            {
              name: 'TITLE',
              font: 'bold 13px sans-serif',
              stroke: state.theme === 'dark' ? '#F8FAFC' : '#000000',
              textAlign: 'center',
              margin: new go.Margin(0, 0, 2, 0),
              maxLines: 1,
              overflow: go.TextOverflow.Ellipsis
            },
            new go.Binding('text', 'title', t => t || 'Title')
          ),
          // Subtitle
          $(
            go.TextBlock,
            {
              name: 'SUBTITLE',
              font: '11px sans-serif',
              stroke: state.theme === 'dark' ? '#94A3B8' : '#6B7280',
              textAlign: 'center',
              maxLines: 1,
              overflow: go.TextOverflow.Ellipsis
            },
            new go.Binding('text', 'subtitle', s => s || 'Subtitle')
          )
        )
      ),

      // 4 Port Titik Penghubung Terlihat Jelas (Top, Bottom, Left, Right)
      makePort('T', go.Spot.Top, true, true),
      makePort('B', go.Spot.Bottom, true, true),
      makePort('L', go.Spot.Left, true, true),
      makePort('R', go.Spot.Right, true, true)
    );

    // Link Template (Garis Interaktif & Animasi Aliran Air/Cahaya)
    diagram.linkTemplate = $(
      go.Link,
      {
        routing: go.Routing.Normal,
        curve: go.Curve.Bezier,
        corner: 12,
        toShortLength: 4,
        relinkableFrom: true,
        relinkableTo: true,
        selectionAdornmentTemplate: $(
          go.Adornment,
          $(go.Shape, { isPanelMain: true, stroke: '#FFCC00', strokeWidth: 5, strokeDashArray: [4, 4] })
        )
      },
      new go.Binding('routing', 'routeStyle', style => style === 'elbowed' ? go.Routing.Orthogonal : go.Routing.Normal),
      new go.Binding('curve', 'routeStyle', style => !style || style === 'curved' ? go.Curve.Bezier : go.Curve.None),
      // Jalur Garis Utama (Base Line)
      $(
        go.Shape,
        { isPanelMain: true, strokeWidth: 3.5 },
        new go.Binding('stroke', 'color', c => c || CONFIG.DEFAULT_COLOR)
      ),
      // Jalur Animasi Cahaya / Air Mengalir (Pipe)
      $(
        go.Shape,
        {
          name: 'PIPE',
          isPanelMain: true,
          strokeWidth: 3,
          stroke: '#FFFFFF',
          strokeDashArray: [10, 10],
          strokeCap: 'round',
          visible: false
        },
        new go.Binding('visible', 'animated', a => !!a),
        new go.Binding('stroke', 'animColor', c => c || '#FFFFFF')
      ),
      // Ujung Panah (Arrowhead)
      $(
        go.Shape,
        { toArrow: 'Standard', strokeWidth: 0, scale: 1.4 },
        new go.Binding('fill', 'color', c => c || CONFIG.DEFAULT_COLOR)
      )
    );

    // Event Listener Seleksi Node / Link
    diagram.addDiagramListener('ChangedSelection', function () {
      const selected = diagram.selection.first();
      state.selectedPart = selected;

      if (!selected) {
        hideInspectors();
        return;
      }

      if (selected instanceof go.Node) {
        showNodeInspector(selected);
        el.linkInspector.style.display = 'none';
      } else if (selected instanceof go.Link) {
        showLinkInspector(selected);
        el.nodeInspector.style.display = 'none';
      } else {
        hideInspectors();
      }
    });

    // Event Listener klik background lembar kerja menutup inspector
    diagram.addDiagramListener('BackgroundSingleClicked', function () {
      hideInspectors();
    });

    // Event Listener saat garis baru dibuat / dihubungkan
    diagram.addDiagramListener('LinkDrawn', function (e) {
      const link = e.subject;
      if (link && link.data) {
        diagram.model.commit(m => {
          m.set(link.data, 'animated', true);
          if (!link.data.routeStyle) m.set(link.data, 'routeStyle', 'curved');
          if (!link.data.color) {
            m.set(link.data, 'color', '#3B82F6');
          }
        }, 'initLinkData');
      }
      updateFlowAnimation();
    });
    diagram.addDiagramListener('LinkRelinked', function () {
      updateFlowAnimation();
    });
    diagram.addDiagramListener('SelectionDeleted', function () {
      updateFlowAnimation();
    });

    // Inisialisasi animasi aliran cahaya/air
    updateFlowAnimation();
  }

  // Animasi Aliran Cahaya / Air pada Garis menggunakan go.Animation loop
  let flowAnimation = null;
  function updateFlowAnimation() {
    if (flowAnimation) {
      flowAnimation.stop();
      flowAnimation = null;
    }
    if (!state.diagram) return;

    const anim = new go.Animation();
    anim.easing = go.Animation.EaseLinear;
    anim.runCount = Infinity; // Berjalan berulang terus-menerus
    anim.duration = 1000;

    let hasAnimated = false;
    state.diagram.links.each(link => {
      if (link.data && link.data.animated) {
        const pipe = link.findObject('PIPE');
        if (pipe) {
          anim.add(pipe, 'strokeDashOffset', 20, 0);
          hasAnimated = true;
        }
      }
    });

    if (hasAnimated) {
      anim.start();
      flowAnimation = anim;
    }
  }

  function hideInspectors() {
    el.nodeInspector.style.display = 'none';
    el.linkInspector.style.display = 'none';
  }

  // =========================================================================
  // 7. Node Inspector Logic
  // =========================================================================
  function renderColorPresets(container, currentColor, onSelect) {
    container.innerHTML = '';
    CONFIG.COLOR_PRESETS.forEach(color => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-swatch-btn' + (color.toLowerCase() === (currentColor || '').toLowerCase() ? ' selected' : '');
      btn.style.backgroundColor = color;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        onSelect(color);
      });
      container.appendChild(btn);
    });
  }

  function showNodeInspector(node) {
    const data = node.data;
    el.nodeTitleInput.value = data.title || '';
    el.nodeSubtitleInput.value = data.subtitle || '';
    el.btnOpenIconPicker.innerHTML = `<span>Ikon: ${data.icon || '📥'}</span> <i class="bi bi-chevron-right"></i>`;

    renderColorPresets(el.nodeColorPresets, data.color || CONFIG.DEFAULT_COLOR, (newColor) => {
      state.diagram.commit(d => {
        d.model.set(node.data, 'color', newColor);
      }, 'changeNodeColor');
    });

    // Posisikan inspector melayang di dekat node
    const viewPt = state.diagram.transformDocToView(node.location);
    const canvasRect = el.diagramCanvas ? el.diagramCanvas.getBoundingClientRect() : { left: 250, top: 64 };
    
    let leftPos = viewPt.x + 100;
    let topPos = viewPt.y - 40;

    // Batasi agar tetap di dalam layar
    if (leftPos < 20) leftPos = 20;
    if (leftPos > window.innerWidth - 460) leftPos = window.innerWidth - 460;
    if (topPos < 30) topPos = 30;

    el.nodeInspector.style.left = `${leftPos}px`;
    el.nodeInspector.style.top = `${topPos}px`;
    el.nodeInspector.style.display = 'flex';
  }

  // Save Node Inspector Button
  el.btnSaveNodeInspector.addEventListener('click', function () {
    if (!state.selectedPart || !(state.selectedPart instanceof go.Node)) return;
    const node = state.selectedPart;
    state.diagram.commit(d => {
      d.model.set(node.data, 'title', el.nodeTitleInput.value.trim() || 'Title');
      d.model.set(node.data, 'subtitle', el.nodeSubtitleInput.value.trim() || 'Subtitle');
    }, 'updateNodeInfo');
    hideInspectors();
    state.diagram.clearSelection();
    showToast('Detail shape disimpan.', 'success');
  });

  // Realtime input binding untuk node title & subtitle
  el.nodeTitleInput.addEventListener('input', function () {
    if (!state.selectedPart || !(state.selectedPart instanceof go.Node)) return;
    state.diagram.commit(d => {
      d.model.set(state.selectedPart.data, 'title', el.nodeTitleInput.value);
    }, 'inputTitle');
  });

  el.nodeSubtitleInput.addEventListener('input', function () {
    if (!state.selectedPart || !(state.selectedPart instanceof go.Node)) return;
    state.diagram.commit(d => {
      d.model.set(state.selectedPart.data, 'subtitle', el.nodeSubtitleInput.value);
    }, 'inputSubtitle');
  });

  // Delete Node Button
  el.btnDeleteNode.addEventListener('click', function () {
    if (!state.selectedPart || !(state.selectedPart instanceof go.Node)) return;
    state.diagram.commit(d => {
      d.remove(state.selectedPart);
    }, 'deleteNode');
    hideInspectors();
    showToast('Shape dihapus.', 'info');
  });

  el.btnCloseNodeInspector.addEventListener('click', hideInspectors);

  // Icon Picker Modal
  function buildIconGrid() {
    el.iconGridContainer.innerHTML = '';
    CONFIG.ICON_PRESETS.forEach(icon => {
      const item = document.createElement('div');
      item.className = 'icon-grid-item';
      item.textContent = icon;
      item.addEventListener('click', function () {
        if (state.selectedPart && state.selectedPart instanceof go.Node) {
          state.diagram.commit(d => {
            d.model.set(state.selectedPart.data, 'icon', icon);
          }, 'changeIcon');
          el.btnOpenIconPicker.innerHTML = `<span>Ikon: ${icon}</span> <i class="bi bi-chevron-right"></i>`;
        }
        el.modalIconPicker.hide();
      });
      el.iconGridContainer.appendChild(item);
    });
  }
  buildIconGrid();

  el.btnOpenIconPicker.addEventListener('click', function () {
    el.modalIconPicker.show();
  });

  // =========================================================================
  // 8. Link Inspector Logic
  // =========================================================================
  function showLinkInspector(link) {
    const data = link.data;
    el.linkAnimToggle.checked = !!data.animated;
    el.linkRouteStyle.value = data.routeStyle || 'curved';

    renderColorPresets(el.linkColorPresets, data.color || CONFIG.DEFAULT_COLOR, (newColor) => {
      state.diagram.commit(d => {
        d.model.set(link.data, 'color', newColor);
      }, 'changeLinkColor');
    });

    const midPt = link.midPoint;
    const viewPt = state.diagram.transformDocToView(midPt);

    let leftPos = viewPt.x + 30;
    let topPos = viewPt.y - 30;
    if (leftPos > window.innerWidth - 440) leftPos = window.innerWidth - 440;
    if (topPos < 30) topPos = 30;

    el.linkInspector.style.left = `${leftPos}px`;
    el.linkInspector.style.top = `${topPos}px`;
    el.linkInspector.style.display = 'flex';
  }

  // Toggle Animasi Garis
  el.linkAnimToggle.addEventListener('change', function () {
    if (!state.selectedPart || !(state.selectedPart instanceof go.Link)) return;
    const isAnim = el.linkAnimToggle.checked;
    state.diagram.commit(d => {
      d.model.set(state.selectedPart.data, 'animated', isAnim);
    }, 'toggleLinkAnimation');
    updateFlowAnimation();
    showToast(isAnim ? 'Animasi air/cahaya aktif.' : 'Animasi garis dinonaktifkan.', 'info');
  });

  // Simpan pilihan bentuk garis pada model agar ikut tersimpan di file project.
  el.linkRouteStyle.addEventListener('change', function () {
    if (!state.selectedPart || !(state.selectedPart instanceof go.Link)) return;
    const link = state.selectedPart;
    state.diagram.commit(d => {
      d.model.set(link.data, 'routeStyle', el.linkRouteStyle.value);
    }, 'changeLinkRouteStyle');
    showToast('Bentuk garis diperbarui.', 'info');
  });

  // Delete Link Button
  el.btnDeleteLink.addEventListener('click', function () {
    if (!state.selectedPart || !(state.selectedPart instanceof go.Link)) return;
    state.diagram.commit(d => {
      d.remove(state.selectedPart);
    }, 'deleteLink');
    hideInspectors();
    updateFlowAnimation();
    showToast('Garis penghubung dihapus.', 'info');
  });

  el.btnCloseLinkInspector.addEventListener('click', hideInspectors);

  // =========================================================================
  // 9. Floating Toolbar (Add Shape & Download)
  // =========================================================================
  // Add Shape (+)
  el.btnAddShape.addEventListener('click', function () {
    if (!state.diagram) return;

    if (!state.currentProject) {
      state.currentProject = {
        filename: null,
        project_name: (el.inputProjectName && el.inputProjectName.value.trim()) || 'Project Workflow'
      };
      if (el.inputProjectName) el.inputProjectName.value = state.currentProject.project_name;
      if (el.saveStatusText) el.saveStatusText.textContent = 'Ada perubahan belum disimpan';
    }

    // Hitung posisi offset yang rapi
    const count = state.diagram.nodes.count;
    const locX = 140 + (count % 4) * 180;
    const locY = 120 + Math.floor(count / 4) * 140;

    const colors = CONFIG.COLOR_PRESETS;
    const color = colors[count % colors.length];

    state.diagram.commit(d => {
      const newNodeData = {
        key: Date.now(),
        title: `Tahap ${count + 1}`,
        subtitle: 'Deskripsi alur',
        color: color,
        icon: CONFIG.ICON_PRESETS[count % CONFIG.ICON_PRESETS.length],
        loc: `${locX} ${locY}`
      };
      d.model.addNodeData(newNodeData);
      const newNode = d.findNodeForData(newNodeData);
      if (newNode) {
        d.select(newNode);
      }
    }, 'addShape');

    showToast('Shape baru berhasil ditambahkan.', 'success');
  });

  // Download Trigger
  el.btnDownload.addEventListener('click', function (e) {
    e.stopPropagation();
    const isVisible = el.downloadMenu.style.display === 'block';
    el.downloadMenu.style.display = isVisible ? 'none' : 'block';
  });

  document.addEventListener('click', function () {
    el.downloadMenu.style.display = 'none';
  });

  // Download Action Handlers
  document.querySelectorAll('[data-download-format]').forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      const format = this.getAttribute('data-download-format');
      handleDownload(format);
    });
  });

  function handleDownload(format) {
    if (!state.diagram) return;
    const projectName = (el.inputProjectName.value.trim() || 'workflow').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const isDark = state.theme === 'dark';
    const bgColor = isDark ? '#0B1220' : '#FFFFFF';

    if (format === 'png') {
      const imgData = state.diagram.makeImageData({
        scale: 2,
        background: bgColor,
        type: 'image/png'
      });
      downloadURI(imgData, `${projectName}.png`);
      showToast('Berhasil download format PNG.', 'success');
    } else if (format === 'jpg') {
      const imgData = state.diagram.makeImageData({
        scale: 2,
        background: bgColor,
        type: 'image/jpeg'
      });
      downloadURI(imgData, `${projectName}.jpg`);
      showToast('Berhasil download format JPG.', 'success');
    } else if (format === 'json') {
      const jsonContent = state.diagram.model.toJson();
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      downloadURI(url, `${projectName}.json`);
      URL.revokeObjectURL(url);
      showToast('Berhasil export format JSON.', 'success');
    } else if (format === 'svg') {
      const svg = state.diagram.makeSvg({ scale: 1, background: bgColor });
      const svgStr = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      downloadURI(url, `${projectName}.svg`);
      URL.revokeObjectURL(url);
      showToast('Berhasil export format SVG.', 'success');
    }
  }

  function downloadURI(uri, name) {
    const link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // =========================================================================
  // 10. Manajemen Project (Load, Save, Create, Auto-save)
  // =========================================================================
  async function loadProjectList() {
    if (!state.currentUser) return;
    try {
      const res = await fetch(`${CONFIG.API_URL}?action=list&user=${encodeURIComponent(state.currentUser.email)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        renderProjectList(data.projects);
      }
    } catch (err) {
      console.warn('Gagal memuat list project via API, menggunakan data lokal:', err);
      renderProjectList([]);
    }
  }

  function renderProjectList(projects) {
    el.projectList.innerHTML = '';
    if (!projects || projects.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'text-muted small px-2 py-1';
      emptyLi.textContent = 'Belum ada project';
      el.projectList.appendChild(emptyLi);
      return;
    }

    projects.forEach(p => {
      const li = document.createElement('li');
      li.className = 'project-item' + (state.currentProject && state.currentProject.filename === p.filename ? ' active' : '');
      li.innerHTML = `
        <span class="project-bullet">•</span>
        <span class="project-title-text" title="${p.name}">${p.name}</span>
        <button type="button" class="project-delete-btn" title="Hapus Project">
          <i class="bi bi-trash"></i>
        </button>
      `;

      // Klik judul project untuk membuka
      li.querySelector('.project-title-text').addEventListener('click', () => {
        openProject(p.filename);
      });

      // Hapus project
      li.querySelector('.project-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Apakah Anda yakin ingin menghapus "${p.name}"?`)) {
          deleteProject(p.filename);
        }
      });

      el.projectList.appendChild(li);
    });
  }

  async function openProject(filename) {
    try {
      const res = await fetch(`${CONFIG.API_URL}?action=get&file=${encodeURIComponent(filename)}`);
      if (!res.ok) throw new Error('File tidak ditemukan');
      const projectData = await res.json();

      state.currentProject = projectData;
      el.inputProjectName.value = projectData.project_name || 'Untitled Workflow';
      el.saveStatusText.textContent = `Dibuka (${projectData.filename})`;

      // Render model GoJS
      const workflow = projectData.workflow || {};
      const nodeDataArray = workflow.nodeDataArray || [];
      const linkDataArray = workflow.linkDataArray || [];

      state.diagram.model = new go.GraphLinksModel({
        nodeDataArray: nodeDataArray,
        linkDataArray: linkDataArray
      });

      state.isModified = false;
      loadProjectList(); // refresh active class
      updateFlowAnimation();
      showToast(`Project "${projectData.project_name}" dimuat.`, 'info');
    } catch (err) {
      showToast('Gagal memuat project: ' + err.message, 'error');
    }
  }

  // Toggle Popover Form Tambah Project Baru
  if (el.btnCreateProject) {
    el.btnCreateProject.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!el.popoverCreateProject) return;
      const willOpen = el.popoverCreateProject.hidden;
      el.popoverCreateProject.hidden = !willOpen;
      if (willOpen) {
        if (el.inputPopoverProjectName) {
          el.inputPopoverProjectName.value = `Project Workflow ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
          setTimeout(() => el.inputPopoverProjectName.focus(), 60);
        }
      }
    });
  }

  // Hilangkan form tambah project saat user klik di luar form
  document.addEventListener('click', function (e) {
    if (el.popoverCreateProject && !el.popoverCreateProject.hidden) {
      if (!el.popoverCreateProject.contains(e.target) && (!el.btnCreateProject || !el.btnCreateProject.contains(e.target))) {
        el.popoverCreateProject.hidden = true;
      }
    }

    if (el.userProfileMenu && !el.userProfileMenu.hidden && !el.userMenuButton.contains(e.target)) {
      hideProfileMenu();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (el.popoverCreateProject) el.popoverCreateProject.hidden = true;
      hideProfileMenu();
    }
  });

  if (el.btnCloseCreatePopover) {
    el.btnCloseCreatePopover.addEventListener('click', function () {
      el.popoverCreateProject.hidden = true;
    });
  }

  if (el.btnCancelCreatePopover) {
    el.btnCancelCreatePopover.addEventListener('click', function () {
      el.popoverCreateProject.hidden = true;
    });
  }

  if (el.formCreateProjectPopover) {
    el.formCreateProjectPopover.addEventListener('submit', function (e) {
      e.preventDefault();
      const title = el.inputPopoverProjectName.value.trim() || 'Workflow Baru';
      el.popoverCreateProject.hidden = true;
      createNewProject(title);
    });
  }

  async function createNewProject(projectName) {
    // Buat lembar kerja baru kosong
    state.diagram.model = new go.GraphLinksModel({
      nodeDataArray: [],
      linkDataArray: []
    });

    state.currentProject = {
      filename: null,
      project_name: projectName
    };
    el.inputProjectName.value = projectName;
    el.saveStatusText.textContent = 'Project baru dibuat';

    // Simpan langsung ke backend
    await saveCurrentProject(false);
    await loadProjectList();
    showToast(`Project "${projectName}" berhasil dibuat. Silakan tambahkan shape.`, 'success');
  }

  function initDefaultWorkflow(projectName) {
    const starterNodes = [
      { key: 1, title: 'Data Input', subtitle: 'Menunggu data', color: '#22C55E', icon: '📥', loc: '120 160' },
      { key: 2, title: 'Processing', subtitle: 'Siap diproses', color: '#EF4444', icon: '⚙️', loc: '360 160' }
    ];
    const starterLinks = [
      { from: 1, to: 2, animated: true, color: '#22C55E' }
    ];

    state.diagram.model = new go.GraphLinksModel({
      nodeDataArray: starterNodes,
      linkDataArray: starterLinks
    });

    el.inputProjectName.value = projectName;
  }

  // Save Project
  async function saveCurrentProject(isAuto = false) {
    if (!state.currentUser || !state.diagram) return;

    const projectName = el.inputProjectName.value.trim() || 'Untitled Workflow';
    const model = state.diagram.model;
    const workflow = {
      nodeDataArray: model.nodeDataArray,
      linkDataArray: model.linkDataArray
    };

    const payload = {
      action: 'save',
      filename: state.currentProject ? state.currentProject.filename : null,
      project_name: projectName,
      user: {
        username: state.currentUser.username,
        email: state.currentUser.email
      },
      workflow: workflow
    };

    el.saveStatusText.textContent = isAuto ? 'Menyimpan otomatis...' : 'Menyimpan...';

    try {
      const res = await fetch(`${CONFIG.API_URL}?action=save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.project) {
        state.currentProject = data.project;
        state.isModified = false;
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        el.saveStatusText.textContent = `Tersimpan ${timeStr}`;
        if (!isAuto) {
          showToast('Project berhasil disimpan.', 'success');
          loadProjectList();
        }
      } else {
        el.saveStatusText.textContent = 'Gagal menyimpan';
      }
    } catch (err) {
      el.saveStatusText.textContent = 'Mode Offline (Tersimpan Lokal)';
      state.isModified = false;
      if (!isAuto) showToast('Tersimpan di browser lokal.', 'info');
    }
  }

  // Manual Save Click
  el.btnSaveProject.addEventListener('click', function () {
    saveCurrentProject(false);
  });

  // Project Name Change
  el.inputProjectName.addEventListener('change', function () {
    state.isModified = true;
    saveCurrentProject(false);
  });

  // Delete Project
  async function deleteProject(filename) {
    try {
      const res = await fetch(`${CONFIG.API_URL}?action=delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: filename,
          user: { email: state.currentUser.email }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Project dihapus.', 'info');
        if (state.currentProject && state.currentProject.filename === filename) {
          state.currentProject = null;
        }
        loadProjectList();
      }
    } catch (err) {
      showToast('Gagal menghapus project.', 'error');
    }
  }

  // Auto-Save Interval Watcher (sesuai ketentuan: tidak realtime, interval beberapa detik sekali)
  function startAutoSaveWatcher() {
    if (state.autoSaveTimer) clearInterval(state.autoSaveTimer);

    state.autoSaveTimer = setInterval(() => {
      if (state.isModified && state.currentProject) {
        saveCurrentProject(true);
      }
    }, CONFIG.AUTO_SAVE_INTERVAL);
  }

  // =========================================================================
  // 11. Bootstrapping Aplikasi
  // =========================================================================
  function initApp() {
    initTheme();
    checkAuthState();
  }

  // Jalankan saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
