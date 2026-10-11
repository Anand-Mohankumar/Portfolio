// Realistic Linux Boot Sequence
// Starts as soon as the DOM is ready (not on `load`, which would wait for every image
// and iframe on the page). Return visits in the same session get a quicker replay.
document.addEventListener('DOMContentLoaded', () => {
  const bootText = document.getElementById('bootText');
  let repeatVisit = false;
  try { repeatVisit = sessionStorage.getItem('booted') === '1'; sessionStorage.setItem('booted', '1'); } catch (_) { /* storage blocked */ }
  const [stepMin, stepRand, settle] = repeatVisit ? [12, 18, 100] : [40, 70, 200];
  const messages = [
    "[  <span class='log-green'>OK</span>  ] Started Update UTMP about System Runlevel Changes.",
    "[  <span class='log-green'>OK</span>  ] Started Service to check if key is pressed.",
    "[  <span class='log-green'>OK</span>  ] Listening on Load/Save RF Kill Switch Status /dev/rfkill Watch.",
    "[  <span class='log-green'>OK</span>  ] Reached target System Initialization.",
    "[  <span class='log-green'>OK</span>  ] Started CUPS Scheduler.",
    "[  <span class='log-green'>OK</span>  ] Started Network Manager.",
    "[  <span class='log-green'>OK</span>  ] Reached target Network.",
    "[  <span class='log-green'>OK</span>  ] Reached target Host and Network Name Lookups.",
    "[  <span class='log-green'>OK</span>  ] Started GNOME Display Manager.",
    "[  <span class='log-green'>OK</span>  ] Reached target Graphical Interface.",
    "<span class='log-white'>Initializing Desktop Environment...</span>"
  ];

  const desktop = document.querySelector('.desktop');
  desktop.inert = true;
  const finishBoot = () => {
    const boot = document.getElementById('bootScreen');
    boot.classList.add('hidden');
    boot.setAttribute('aria-hidden', 'true');
    boot.inert = true;
    desktop.inert = false;
    const removeBoot = event => {
      if (event.target === boot) {
        boot.style.display = 'none';
        boot.removeEventListener('transitionend', removeBoot);
      }
    };
    boot.addEventListener('transitionend', removeBoot);
    animateDockEntry(() => document.querySelector('.sidebar-item[data-view="home"]')?.classList.add('wiggle'));
    setTimeout(warmLazyImages, 3000);
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finishBoot();
    return;
  }
  let delay = 0;

  messages.forEach((msg, index) => {
    // Randomize delay to simulate processing
    delay += Math.random() * stepRand + stepMin;

    setTimeout(() => {
      // Update text content in place (one line)
      bootText.innerHTML = msg;

      // If last message, close boot screen
      if (index === messages.length - 1) {
        setTimeout(finishBoot, settle);
      }
    }, delay);
  });
});

// Images inside closed windows are `loading="lazy"`, so they are not part of the first
// load. Once the desktop is up, quietly pull them into the cache (low priority, one at
// a time) so windows still open instantly — skipped on data-saver / slow connections.
function warmLazyImages() {
  const conn = navigator.connection;
  if (conn && (conn.saveData || /(^|-)(2g|3g)$/.test(conn.effectiveType || ''))) return;
  if (!conn && window.matchMedia('(pointer: coarse)').matches) return; // unknown mobile link: be frugal
  const srcs = [...document.querySelectorAll('img[loading="lazy"]')].filter((img) => !img.complete).map((img) => img.src);
  const next = () => {
    const src = srcs.shift();
    if (!src) return;
    const img = new Image();
    img.fetchPriority = 'low';
    img.onload = img.onerror = () => setTimeout(next, 100);
    img.src = src;
  };
  next();
}

// Function to animate the dock "Water Drop" entry
function animateDockEntry(onComplete) {
  const dock = document.querySelector('.sidebar');
  if (!dock) return;
  const items = [...dock.querySelectorAll('.sidebar-item')];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dock.classList.remove('dock-hidden');
    items.forEach(item => item.classList.remove('dock-item-hidden'));
    onComplete?.();
    return;
  }
  // One stable surface; no width measurements, forced reflows, or auto-size snap.
  dock.classList.replace('dock-hidden', 'dock-entering');
  items.forEach((item, index) => {
    item.style.transitionDuration = '240ms, 200ms, 250ms, 250ms, 250ms, 250ms';
    item.style.transitionDelay = `${220 + index * 35}ms, ${220 + index * 35}ms, 0ms, 0ms, 0ms, 0ms`;
    item.classList.remove('dock-item-hidden');
  });
  dock.addEventListener('animationend', (event) => {
    if (event.target !== dock || event.animationName !== 'dockReveal') return;
    dock.classList.remove('dock-entering');
    items.forEach(item => {
      item.style.transitionDelay = '';
      item.style.transitionDuration = '';
    });
    onComplete?.();
  }, { once: true });
}

// Clock (Top bar clock removed; replaced by fake system icons)

// View switching
const cards = {
  // UPDATED: 'resources' mapped to the new card ID
  resources: document.getElementById('resourcesCard'),
  labs: document.getElementById('labsCard'), // NEW
  labsContent: document.getElementById('labsContentCard'),
  lectureNotes: document.getElementById('lectureNotesCard'), // NEW: Lecture Notes
  ai: document.getElementById('aiCard'),     // NEW
  infographics: document.getElementById('infographicsCard'), // NEW: Infographics
  aiInfographics: document.getElementById('aiInfographicsCard'), // NEW: AI Infographics Folder
  aiClaude: document.getElementById('aiClaudeCard'), // NEW: AI Claude Folder
  aiFundamentals: document.getElementById('aiFundamentalsCard'), // NEW: AI Fundamentals Folder
  aiAdvanced: document.getElementById('aiAdvancedCard'), // NEW: AI Advanced Folder
  aiPrompts: document.getElementById('aiPromptsCard'),
  aiImageGenPrompts: document.getElementById('aiImageGenPromptsCard'),
  home: document.getElementById('homeCard'),
  projects: document.getElementById('projectsCard'),
  skills: document.getElementById('skillsCard'),
  terminal: document.getElementById('terminalCard'),
  markdownify: document.getElementById('markdownifyCard'),
  newsfeed: document.getElementById('newsfeedCard'),
  iframe: document.getElementById('iframeCard')
};

// Global View Configuration (Unified)
const viewConfig = {
  home: { id: 'home', parent: 'home', title: 'Home', icon: '🏠' },
  projects: { id: 'projects', parent: 'projects', title: 'Projects', icon: '💼' },
  skills: { id: 'skills', parent: 'skills', title: 'Skills', icon: '⚡' },
  terminal: { id: 'terminal', parent: 'terminal', title: 'Terminal', icon: '💻' },

  // UPDATED: 'resources' config replacing 'research'
  resources: { id: 'resources', parent: 'projects', title: 'Resources', icon: '📚' },
  // NEW CONFIGS
  labs: { id: 'labs', parent: 'projects', title: 'Labs & Research', icon: '🔬' },
  labsContent: { id: 'labsContent', parent: 'labs', title: 'Labs', icon: '🧪' },
  lectureNotes: { id: 'lectureNotes', parent: 'projects', title: 'Lecture Notes', icon: '📓' },
  ai: { id: 'ai', parent: 'projects', title: 'AI & Automation', icon: '🧠' },
  infographics: { id: 'infographics', parent: 'projects', title: 'Infographics', icon: '📊' },
  aiInfographics: { id: 'aiInfographics', parent: 'projects', title: 'AI Infographics', icon: '📂' },
  aiClaude: { id: 'aiClaude', parent: 'projects', title: 'Claude', icon: '📁' },
  aiFundamentals: { id: 'aiFundamentals', parent: 'projects', title: 'AI Fundamentals', icon: '📁' },
  aiAdvanced: { id: 'aiAdvanced', parent: 'projects', title: 'AI Advanced', icon: '📂' },
  aiPrompts: { id: 'aiPrompts', parent: 'projects', title: 'Prompts', icon: '💬' },
  aiImageGenPrompts: { id: 'aiImageGenPrompts', parent: 'projects', title: 'Image Gen Prompts', icon: '🖼️' },
  markdownify: { id: 'markdownify', parent: 'markdownify', title: 'Markdownify', icon: '📝' },
  newsfeed: { id: 'newsfeed', parent: 'newsfeed', title: 'Newsfeed', icon: '📰' },

  iframe: { id: 'iframe', parent: 'projects', title: 'Content', icon: '🌐' }
};
let openWindows = []; // START EMPTY: Home opens after boot sequence
let minimizedWindows = new Set(); // Track which windows are minimized (hidden)
let activeWindow = null;
let draggedWindow = null;
let dragOffset = { x: 0, y: 0 };
let isDragging = false;
const windowPositions = new WeakMap(); // Drag anchors are always window centers.
const windowMotion = new WeakMap(); // Cancel obsolete callbacks on every new action.
const closingWindows = new Set();
const windowReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = window.matchMedia('(max-width: 768px)');

// Moving a mobile window in the DOM must not replay its finished hero stagger.
cards.home.addEventListener('animationend', event => {
  if (event.animationName === 'heroRise' && event.target.parentElement?.classList.contains('profile-section')) {
    event.target.classList.add('entrance-complete');
  }
});

window.visualViewport?.addEventListener('resize', () => {
  // CSS handles the software keyboard on phones; desktop zoom can change bounds.
  if (!mobileLayout.matches) constrainAllWindows();
});

function cancelWindowMotion(card) {
  const motion = windowMotion.get(card);
  if (motion) clearTimeout(motion.timer);
  windowMotion.delete(card);
  card.style.transition = 'none';
  card.style.clipPath = '';
  card.style.opacity = '';
  card.style.pointerEvents = '';
  card.inert = false;
  card._restoreFocus = false;
}

function afterWindowMotion(card, duration, finish) {
  const motion = { timer: null };
  motion.timer = setTimeout(() => {
    if (windowMotion.get(card) !== motion) return;
    windowMotion.delete(card);
    card.style.transition = '';
    card.style.clipPath = ''; // Release the temporary clip so glass shadows can render.
    finish?.();
  }, duration);
  windowMotion.set(card, motion);
}

function workspaceBounds() {
  const area = document.querySelector('.content-area');
  const rect = area.getBoundingClientRect();
  const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--workspace-top')) || 70;
  // The card's max-height resolves dynamic viewport and safe-area CSS into pixels.
  const reserve = rect.height - top - parseFloat(getComputedStyle(cards.home).maxHeight);
  return { rect, left: 20, right: rect.width - 20, top, bottom: rect.height - reserve };
}

function positionWindow(card, depth = 0) {
  if (mobileLayout.matches) {
    card.style.left = card.style.top = card.style.transform = '';
    return;
  }
  const bounds = workspaceBounds();
  const center = windowPositions.get(card) || {
    x: bounds.rect.width / 2, y: (bounds.top + bounds.bottom) / 2
  };
  const halfWidth = card.offsetWidth / 2;
  const halfHeight = card.offsetHeight / 2;
  const clampX = value => Math.max(bounds.left + halfWidth, Math.min(value, bounds.right - halfWidth));
  const clampY = value => Math.max(bounds.top + halfHeight, Math.min(value, bounds.bottom - halfHeight));
  const x = clampX(center.x);
  const y = clampY(center.y);
  const dx = clampX(x - depth * 18) - x;
  const dy = clampY(y + depth * 18) - y;
  // Centered windows follow viewport changes in CSS, even before resize fires.
  card.style.left = windowPositions.has(card) ? `${x}px` : '50%';
  card.style.top = windowPositions.has(card) ? `${y}px` : 'calc((100% + var(--workspace-top) - var(--workspace-bottom)) / 2)';
  card.style.transform = `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0)`;
}

function selectWindow(viewName, scrollToTop = false) {
  activeWindow = viewName;
  Object.values(cards).forEach(card => card?.classList.toggle('mobile-active', card === cards[viewName]));
  if (mobileLayout.matches && cards[viewName] && scrollToTop) {
    const area = document.querySelector('.content-area');
    if (area.firstElementChild !== cards[viewName]) area.prepend(cards[viewName]);
    area.scrollTop = 0;
  }
  updateSidebar(viewName);
  updateOpenWindowsTabs();
}

// OVERFLOW DETECTION LOGIC
const tabsContainer = document.getElementById('openWindowsTabs');
const overflowIndicatorRight = document.getElementById('tabsOverflowIndicator');
const overflowIndicatorLeft = document.getElementById('tabsOverflowIndicatorLeft');

function checkTabsOverflow() {
  if (!tabsContainer) return;

  const tolerance = 2; // Pixel tolerance

  // Check for overflow (content wider than container)
  const isScrollable = tabsContainer.scrollWidth > tabsContainer.clientWidth;

  // Right Indicator Logic
  if (overflowIndicatorRight) {
    const isScrolledToEnd = Math.abs(tabsContainer.scrollWidth - tabsContainer.clientWidth - tabsContainer.scrollLeft) < tolerance;
    if (isScrollable && !isScrolledToEnd) {
      overflowIndicatorRight.style.display = 'flex';
    } else {
      overflowIndicatorRight.style.display = 'none';
    }
  }

  // Left Indicator Logic
  if (overflowIndicatorLeft) {
    const isScrolledStart = tabsContainer.scrollLeft < tolerance;
    if (isScrollable && !isScrolledStart) {
      overflowIndicatorLeft.style.display = 'flex';
    } else {
      overflowIndicatorLeft.style.display = 'none';
    }
  }
}

// Hook up overflow listeners
if (tabsContainer) {
  tabsContainer.addEventListener('scroll', checkTabsOverflow);
}
window.addEventListener('resize', () => {
  checkTabsOverflow();
  constrainAllWindows(); // Resizing browser window constraints open windows
});

// Allow clicking the indicators to scroll
if (overflowIndicatorRight) {
  overflowIndicatorRight.addEventListener('click', () => {
    if (tabsContainer) {
      tabsContainer.scrollBy({ left: 100, behavior: 'smooth' });
    }
  });
}

if (overflowIndicatorLeft) {
  overflowIndicatorLeft.addEventListener('click', () => {
    if (tabsContainer) {
      tabsContainer.scrollBy({ left: -100, behavior: 'smooth' });
    }
  });
}

// NEW: Window Constraint Logic to handle Resizing
function constrainAllWindows() {
  endWindowDrag();
  Object.values(cards).forEach(card => {
    if (!card || card.style.display === 'none') return;
    cancelWindowMotion(card);
  });
  // Complete pending hides before changing coordinate systems at a breakpoint.
  [...closingWindows].forEach(name => finishHidingWindow(name, false));
  openWindows.filter(name => minimizedWindows.has(name)).forEach(name => finishHidingWindow(name, true));
  repositionStack();
  if (activeWindow) selectWindow(activeWindow, mobileLayout.matches);
}

function updateOpenWindowsTabs() {
  const container = document.getElementById('openWindowsTabs');
  const existing = new Map([...container.children].map(tab => [tab.dataset.view, tab]));
  const focusedView = container.contains(document.activeElement) ? document.activeElement.dataset.view : null;
  existing.forEach((tab, name) => { if (!openWindows.includes(name)) tab.remove(); });

  openWindows.forEach((windowName, index) => {
    const tab = existing.get(windowName) || document.createElement('div');
    if (!existing.has(windowName)) {
      tab.dataset.view = windowName;
      makeKeyboardButton(tab, viewConfig[windowName]?.title || windowName);
    }
    tab.className = 'window-tab';
    tab.setAttribute('aria-pressed', String(windowName === activeWindow));
    if (windowName === activeWindow) {
      tab.classList.add('active-window-tab');
    }

    // Logic to construct "Parent/Child" path using global viewConfig
    let displayTitle = windowName; // fallback
    const config = viewConfig[windowName];

    if (config) {
      if (config.parent && config.parent !== config.id && viewConfig[config.parent]) {
        // It's a child: Show "Parent/Child"
        displayTitle = `${viewConfig[config.parent].title}/${config.title}`;
      } else {
        // It's a root: Show "Title"
        displayTitle = config.title;
      }
    } else {
      // Handle undefined cases gracefully
      displayTitle = windowName.charAt(0).toUpperCase() + windowName.slice(1);
    }

    if (tab.textContent !== displayTitle) tab.textContent = displayTitle;
    tab.onclick = () => showView(windowName);
    if (container.children[index] !== tab) container.insertBefore(tab, container.children[index] || null);
  });
  if (focusedView) container.querySelector(`[data-view="${focusedView}"]`)?.focus({ preventScroll: true });

  // Keep the selected breadcrumb visible without scrolling the mobile workspace.
  requestAnimationFrame(() => {
    checkTabsOverflow();
    const selected = container.querySelector('.active-window-tab');
    if (selected) {
      const bounds = container.getBoundingClientRect();
      const rect = selected.getBoundingClientRect();
      if (rect.right > bounds.right) container.scrollLeft += rect.right - bounds.right;
      else if (rect.left < bounds.left) container.scrollLeft += rect.left - bounds.left;
    }
    checkTabsOverflow();
  });
  updateCloseAllButton();
}

// NEW: Centralized Sidebar Update Logic with 3-Dot Menu (Projects only)
function updateSidebar(viewName) {
  // Close any open popups first
  document.querySelectorAll('.sidebar-popup-grid').forEach(grid => grid.classList.remove('visible'));

  document.querySelectorAll('.sidebar-item').forEach(item => {
    // 1. Reset
    item.classList.remove('active');
    item.setAttribute('aria-pressed', 'false');
    const oldTrigger = item.querySelector('.sidebar-menu-trigger');
    if (oldTrigger) oldTrigger.remove();
    const oldGrid = item.querySelector('.sidebar-popup-grid');
    if (oldGrid) oldGrid.remove();

    // 2. Determine Active State based on current view
    const currentConfig = viewConfig[viewName];
    const category = item.dataset.view; // e.g., 'projects'

    if (currentConfig && currentConfig.parent === category) {
      item.classList.add('active');
      item.setAttribute('aria-pressed', 'true');
    }

    // 3. Only add 3-dot menu for the 'projects' dock item
    if (category !== 'projects') return;

    // 4. Scan for OPEN (non-minimized) windows belonging to this category
    const categoryOpenWindows = openWindows.filter(win => {
      return viewConfig[win] && viewConfig[win].parent === category;
    });

    // 5. If open windows exist for projects, add the 3-dots Menu
    if (categoryOpenWindows.length > 0) {
      // Create Trigger (3 Dots)
      const trigger = document.createElement('div');
      trigger.className = 'sidebar-menu-trigger';
      makeKeyboardButton(trigger, 'Open project windows');
      // Simple SVG dots icon
      trigger.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`;

      // Create Grid Container
      const grid = document.createElement('div');
      grid.className = 'sidebar-popup-grid';

      // Populate Grid
      categoryOpenWindows.forEach(win => {
        const winConfig = viewConfig[win];
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        makeKeyboardButton(gridItem, winConfig.title);
        if (win === viewName) gridItem.classList.add('active-item');
        gridItem.innerHTML = winConfig.icon || '📄';
        gridItem.title = winConfig.title; // Tooltip

        gridItem.onclick = (e) => {
          e.stopPropagation();
          showView(win);
          grid.classList.remove('visible'); // Close on select
        };
        grid.appendChild(gridItem);
      });

      // Trigger Click Handler
      trigger.onclick = (e) => {
        e.stopPropagation();
        // Toggle this grid
        const wasVisible = grid.classList.contains('visible');
        // Close all others
        document.querySelectorAll('.sidebar-popup-grid').forEach(g => g.classList.remove('visible'));

        if (!wasVisible) {
          grid.classList.add('visible');
        }
      };

      item.appendChild(trigger);
      item.appendChild(grid);
    }
  });
}

// Close popups when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.sidebar-item')) {
    document.querySelectorAll('.sidebar-popup-grid').forEach(g => g.classList.remove('visible'));
  }
});

// Helper: Get Icon Position for Genie Effect
function getIconPosition(viewName) {
  // Find configuration to know parent
  const config = viewConfig[viewName];
  let parentKey = config ? config.parent : viewName;

  // Find the icon element
  const icon = document.querySelector(`.sidebar-item[data-view="${parentKey}"]`);

  if (icon) {
    const rect = icon.getBoundingClientRect();
    // Return center of icon
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  // Fallback center screen
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function showView(viewName) {
  const card = cards[viewName];
  if (!card) return;
  if (viewName === 'markdownify') loadMarkdownLibs().catch(() => {});
  const needsReveal = !openWindows.includes(viewName) || minimizedWindows.has(viewName) || closingWindows.has(viewName);
  cancelWindowMotion(card);
  closingWindows.delete(viewName);
  minimizedWindows.delete(viewName);
  if (!openWindows.includes(viewName)) openWindows.push(viewName);
  card.style.display = 'flex';
  bringToFront(card);
  selectWindow(viewName, true);

  if (needsReveal && !mobileLayout.matches && !windowReducedMotion.matches) {
    const rect = card.getBoundingClientRect();
    const icon = getIconPosition(viewName);
    const dx = icon.x - (rect.left + rect.width / 2);
    const dy = icon.y - (rect.top + rect.height / 2);
    card.style.clipPath = 'inset(50% 50% 50% 50% round 50%)';
    card.style.transform = `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0)`;
    void card.offsetHeight;
    card.style.transition = 'transform 0.32s cubic-bezier(0.19, 1, 0.22, 1), clip-path 0.32s cubic-bezier(0.19, 1, 0.22, 1)';
    card.style.transform = 'translate3d(-50%, -50%, 0)';
    card.style.clipPath = 'inset(0 round 16px)';
    afterWindowMotion(card, 320, repositionStack);
  } else {
    card.style.transition = '';
  }

  // Touch devices keep control of when the software keyboard opens.
  if (viewName === 'terminal' && !window.matchMedia('(pointer: coarse)').matches) {
    document.getElementById('termInput')?.focus({ preventScroll: true });
  }
}

function bringToFront(winEl) {
  // Find this window's name so we can reorder openWindows
  const viewName = Object.keys(cards).find(key => cards[key] === winEl);

  // Promote to top of openWindows stack (move to end = foreground)
  if (viewName && openWindows.includes(viewName)) {
    openWindows = openWindows.filter(w => w !== viewName);
    openWindows.push(viewName);
  }

  // Assign z-indices based on stack order
  const BASE_Z = 1000;
  openWindows.forEach((name, i) => {
    const c = cards[name];
    if (c) c.style.zIndex = BASE_Z + i;
  });

  // Mark active / clear old active
  document.querySelectorAll('.window-card').forEach(w => {
    w.classList.remove('active-window');
  });
  winEl.classList.add('active-window');

  // Physically reposition all background windows
  repositionStack();
}

/**
 * Repositions every open window so that background windows appear
 * shifted to the left and downward relative to the foreground window,
 * creating a real depth-of-stack illusion.
 *
 * openWindows order: [bottommost, ..., foreground]
 * depth 0 = foreground (last), depth 1 = one behind, etc.
 */
function repositionStack() {
  const visible = openWindows.filter(name => !minimizedWindows.has(name) && !closingWindows.has(name));
  visible.forEach((name, index) => {
    const card = cards[name];
    if (!card || card.style.display === 'none' || windowMotion.has(card)) return;
    positionWindow(card, visible.length - 1 - index);
  });
}

// Draggable windows
function initDraggable() {
  document.querySelectorAll('.window-card').forEach(card => {
    card.querySelector('.card-header').addEventListener('pointerdown', (event) => {
      if (mobileLayout.matches || card.classList.contains('full-width') || event.button !== 0 ||
          event.target.closest('button, .control-btn, input, select, a')) return;
      cancelWindowMotion(card);
      card.classList.add('dragging');
      const rect = card.getBoundingClientRect();
      const area = document.querySelector('.content-area').getBoundingClientRect();
      windowPositions.set(card, { x: rect.left - area.left + rect.width / 2, y: rect.top - area.top + rect.height / 2 });
      isDragging = true;
      draggedWindow = card;
      dragOffset = { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 };
      card.setPointerCapture(event.pointerId);
      bringToFront(card);
      selectWindow(Object.keys(cards).find(name => cards[name] === card));
      event.preventDefault();
    });
  });
}

let dragFrame = null;
document.addEventListener('pointermove', (event) => {
  if (!isDragging || !draggedWindow) return;
  const area = document.querySelector('.content-area').getBoundingClientRect();
  windowPositions.set(draggedWindow, { x: event.clientX - area.left - dragOffset.x, y: event.clientY - area.top - dragOffset.y });
  if (dragFrame !== null) return;
  dragFrame = requestAnimationFrame(() => {
    dragFrame = null;
    if (draggedWindow) positionWindow(draggedWindow);
  });
});

function endWindowDrag() {
  if (dragFrame !== null) cancelAnimationFrame(dragFrame);
  dragFrame = null;
  if (draggedWindow) {
    positionWindow(draggedWindow);
    // Save the clamped center, so later stacking starts at the position on screen.
    windowPositions.set(draggedWindow, { x: parseFloat(draggedWindow.style.left), y: parseFloat(draggedWindow.style.top) });
    draggedWindow.classList.remove('dragging');
    draggedWindow.style.transition = '';
  }
  isDragging = false;
  draggedWindow = null;
}
document.addEventListener('pointerup', endWindowDrag);
document.addEventListener('pointercancel', endWindowDrag);
window.addEventListener('blur', endWindowDrag);
initDraggable();

function closeAllWindows() {
  // Create a copy of openWindows because it gets modified during iteration
  const windowsToClose = [...openWindows];
  windowsToClose.forEach(win => {
    closeWindow(win);
  });
}

function updateCloseAllButton() {
  const existingBtn = document.querySelector('.global-close-all-btn');

  // Only show the button if more than 1 window is open
  if (openWindows.length > 1) {
    const activeView = openWindows[openWindows.length - 1];
    const activeCard = cards[activeView];
    
    // Make sure we have a valid DOM element and it's not minimized
    if (activeCard && !minimizedWindows.has(activeView)) {
      
      // If the button is already attached to this active window, do nothing!
      if (existingBtn && existingBtn.parentNode === activeCard.querySelector('.card-controls')) {
        return;
      }
      
      if (existingBtn) existingBtn.remove();

      const btn = document.createElement('button');
      btn.className = 'global-close-all-btn';
      btn.innerText = 'Close all';
      
      // Stop propagation on all press events so it doesn't trigger window focus/drag
      btn.onmousedown = (e) => e.stopPropagation();
      btn.ontouchstart = (e) => e.stopPropagation();
      btn.onpointerdown = (e) => e.stopPropagation();
      
      btn.onclick = (e) => {
        e.stopPropagation();
        closeAllWindows();
      };
      
      // Append inside the active window's card controls (statusbar)
      const controls = activeCard.querySelector('.card-controls');
      if (controls) {
        controls.appendChild(btn);
      } else {
        activeCard.appendChild(btn);
      }
    } else {
      if (existingBtn) existingBtn.remove();
    }
  } else {
    if (existingBtn) existingBtn.remove();
  }
}

function finishHidingWindow(viewName, minimize) {
  const card = cards[viewName];
  const restoreFocus = card.contains(document.activeElement) || (card._restoreFocus && document.activeElement === document.body);
  card._restoreFocus = false;
  cancelWindowMotion(card);
  card.style.display = 'none';
  card.classList.remove('active-window', 'mobile-active');
  if (!minimize) {
    openWindows = openWindows.filter(name => name !== viewName);
    minimizedWindows.delete(viewName);
    closingWindows.delete(viewName);
    windowPositions.delete(card);
    if (viewName === 'iframe') document.getElementById('contentIframe').removeAttribute('src');
  }
  if (activeWindow === viewName) {
    const next = openWindows.slice().reverse().find(name => !minimizedWindows.has(name) && !closingWindows.has(name));
    if (next) {
      bringToFront(cards[next]);
      selectWindow(next, true);
    } else {
      selectWindow(null);
      if (!openWindows.length) document.querySelector('.sidebar-item[data-view="home"]')?.classList.add('wiggle');
    }
  } else {
    updateOpenWindowsTabs();
    updateSidebar(activeWindow);
  }
  repositionStack();
  // Focus only needs repair when it was in the window being hidden.
  if (restoreFocus) {
    const target = activeWindow ? cards[activeWindow].querySelector('.btn-close') : document.querySelector('.sidebar-item[data-view="home"]');
    target?.focus({ preventScroll: true });
  }
}

function hideWindow(viewName, minimize) {
  const card = cards[viewName];
  if (!card || !openWindows.includes(viewName) || closingWindows.has(viewName)) return;
  if (minimize && minimizedWindows.has(viewName)) return;
  cancelWindowMotion(card);
  if (minimize) minimizedWindows.add(viewName);
  else closingWindows.add(viewName);
  if (mobileLayout.matches || windowReducedMotion.matches || card.style.display === 'none') {
    finishHidingWindow(viewName, minimize);
    return;
  }
  const rect = card.getBoundingClientRect();
  const icon = getIconPosition(viewName);
  const dx = icon.x - (rect.left + rect.width / 2);
  const dy = icon.y - (rect.top + rect.height / 2);
  card._restoreFocus = card.contains(document.activeElement);
  card.style.pointerEvents = 'none';
  card.inert = true;
  card.style.transition = 'transform 0.24s ease-in, clip-path 0.24s ease-in';
  card.style.transform = `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0)`;
  card.style.clipPath = 'inset(50% 50% 50% 50% round 50%)';
  afterWindowMotion(card, 240, () => finishHidingWindow(viewName, minimize));
}

function closeWindow(viewName) { hideWindow(viewName, false); }
function minimizeWindow(viewName) { hideWindow(viewName, true); }

// Dock activation uses the same lifecycle for new, visible, and minimized windows.
document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', () => {
    item.classList.remove('wiggle');
    showView(item.dataset.view);
  });
});


// Topbar navigation (Logo and Home Tab)
document.querySelector('.app-logo').addEventListener('click', () => showView('home'));
document.querySelector('.nav-tab[data-tab="home"]').addEventListener('click', () => showView('home'));

// Window control buttons
document.querySelectorAll('.control-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = btn.closest('.window-card');
    const viewName = Object.keys(cards).find(key => cards[key] === card);

    if (btn.classList.contains('btn-close')) {
      closeWindow(viewName);
    } else if (btn.classList.contains('btn-minimize')) {
      minimizeWindow(viewName);
    } else if (btn.classList.contains('btn-maximize')) {
      cancelWindowMotion(card);
      card.classList.toggle('full-width');
      positionWindow(card);
      card.style.transition = '';
      btn.setAttribute('aria-label', card.classList.contains('full-width') ? 'Restore window size' : 'Maximize');
    }
  });
});

// Raising a window must not rebuild controls during the press that activates them.
document.querySelectorAll('.window-card').forEach(card => {
  card.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.card-header') || closingWindows.has(Object.keys(cards).find(name => cards[name] === card))) return;
    const name = Object.keys(cards).find(name => cards[name] === card);
    if (name && activeWindow !== name) {
      bringToFront(card);
      selectWindow(name);
    }
  });
});

// Iframe functions
function openInIframe(url, title, icon) {
  document.getElementById('contentIframe').src = url;
  document.getElementById('iframeTitle').textContent = title;

  // Update the global config dynamically for the iframe window
  if (viewConfig.iframe) {
    viewConfig.iframe.title = title;
    viewConfig.iframe.icon = icon || '🌐';
  }

  showView('iframe');

}

function closeIframe() { closeWindow('iframe'); }

// NEW: TERMINAL LOGIC
const termInput = document.getElementById('termInput');
const termOutput = document.getElementById('terminalOutput');

if (termInput) {
  termInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const command = this.value.trim();

      // Create a history line in the DOM
      const newLine = document.createElement('div');
      newLine.className = 'terminal-line';
      // Sanitize input slightly to prevent HTML injection if displayed
      const sanitizedCommand = command.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      newLine.innerHTML = `<span class="terminal-prompt">anand@cyberamo:~$</span> ${sanitizedCommand}`;

      // Insert before the input line
      const inputLine = document.getElementById('terminalInputLine');
      termOutput.insertBefore(newLine, inputLine);

      // Command Logic
      if (command === 'n8n') {
        window.open('https://n8n.cyberamo.work/', '_blank');
        const resLine = document.createElement('div');
        resLine.className = 'terminal-line';
        resLine.innerText = "Opening n8n in a new tab...";
        termOutput.insertBefore(resLine, inputLine);
      }
      else if (command === 'clear') {
        const lines = termOutput.querySelectorAll('.terminal-line:not(#terminalInputLine)');
        lines.forEach(line => line.remove());
      }
      else if (command === 'help') {
        const helpLine = document.createElement('div');
        helpLine.className = 'terminal-line';
        helpLine.innerHTML = "Available commands:<br> - n8n: Access Automation Cloud<br> - clear: Clear terminal<br> - whoami: Display user info<br> - help: Show this message";
        termOutput.insertBefore(helpLine, inputLine);
      }
      else if (command === 'whoami') {
        const whoLine = document.createElement('div');
        whoLine.className = 'terminal-line';
        whoLine.innerText = "GRC & AI Enablement Specialist | Customer Assurance | Security Operations Background";
        termOutput.insertBefore(whoLine, inputLine);
      }
      else if (window.CareerBG && window.CareerBG.has(command.toLowerCase())) {
        // Hidden commands: replay the background easter eggs
        const eggOk = window.CareerBG.trigger(command.toLowerCase());
        const eggLine = document.createElement('div');
        eggLine.className = 'terminal-line';
        eggLine.innerText = eggOk ? `[bg] ${command.toLowerCase()} → look behind this window` : `[bg] animations are paused (reduced motion)`;
        termOutput.insertBefore(eggLine, inputLine);
      }
      else if (command !== "") {
        const errLine = document.createElement('div');
        errLine.className = 'terminal-line';
        errLine.innerText = `Command not found: ${sanitizedCommand}. Type 'help' for available commands.`;
        termOutput.insertBefore(errLine, inputLine);
      }

      // Reset and Scroll
      this.value = '';
      termOutput.scrollTop = termOutput.scrollHeight;
    }
  });

  // Click anywhere in terminal to focus input
  document.getElementById('terminalCard').addEventListener('click', (event) => {
    if (!event?.target?.closest('.card-header')) termInput.focus({ preventScroll: true });
  });
}


/* Animated background now lives in career-bg.js ("Assurance Graph").
   reducedMotion is still shared with the profile-avatar code below. */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Rotating Gradient Button Hover Tracking
const hoverBtns = document.querySelectorAll('.hover-btn');
hoverBtns.forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    btn.style.setProperty('--mouseX', `${x}px`);
    btn.style.setProperty('--mouseY', `${y}px`);
  });
});

// --- NEWSFEED LOGIC ---
const newsfeedToggleAI = document.getElementById('newsfeed-toggle-ai');
const newsfeedToggleInfosec = document.getElementById('newsfeed-toggle-infosec');
const newsfeedIframe = document.getElementById('newsfeedIframe');

if (newsfeedToggleAI && newsfeedToggleInfosec && newsfeedIframe) {
  newsfeedToggleAI.addEventListener('click', () => {
    newsfeedToggleAI.classList.add('active');
    newsfeedToggleInfosec.classList.remove('active');
    newsfeedIframe.src = 'https://www.inoreader.com/stream/user/1005486907/tag/AI/view/html?t=AI%20Daily&l=https%3A%2F%2Fgithub.com%2FAnand-Mohankumar%2FAnand-Mohankumar%2Fblob%2Fmain%2FApp%2520Logo.png&lw=5&cs=m&c=0xe0e0e0&bc=0x0a141a&lh=5&lc=0xe56a40';
  });

  newsfeedToggleInfosec.addEventListener('click', () => {
    newsfeedToggleInfosec.classList.add('active');
    newsfeedToggleAI.classList.remove('active');
    newsfeedIframe.src = 'https://www.inoreader.com/stream/user/1005486907/tag/Infosec%20News/view/html?t=InfoSec%20Daily&l=https%3A%2F%2Fgithub.com%2FAnand-Mohankumar%2FAnand-Mohankumar%2Fblob%2Fmain%2FApp%2520Logo.png&lw=5&cs=m&c=0xe0e0e0&bc=0x0a141a&lh=5&lc=0xe56a40';
  });
}

// --- MARKDOWNIFY LOGIC ---
const mdfyEditor = document.getElementById('mdfy-editor');
const mdfySource = document.getElementById('mdfy-source');
const mdfyToggleVisual = document.getElementById('mdfy-toggle-visual');
const mdfyToggleSource = document.getElementById('mdfy-toggle-source');
const mdfyBtnDownload = document.getElementById('mdfy-btn-download');
const mdfyBtnCopy = document.getElementById('mdfy-btn-copy');

// The HTML<->Markdown converters are only needed inside Markdownify, so they are loaded
// on first open (pinned versions, downloaded in parallel, executed in order) instead of
// blocking every page load.
const MD_LIBS = [
  'https://cdn.jsdelivr.net/npm/turndown@7.2.4/dist/turndown.js',
  'https://cdn.jsdelivr.net/npm/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js',
  'https://cdn.jsdelivr.net/npm/marked@15.0.12/marked.min.js' // the build the old unversioned URL served
];
let mdLibsPromise = null;
function loadMarkdownLibs() {
  if (!mdLibsPromise) {
    mdLibsPromise = Promise.all(MD_LIBS.map((src) => new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    }))).catch((err) => { mdLibsPromise = null; throw err; });
  }
  return mdLibsPromise;
}
const withMarkdownLibs = (fn) => loadMarkdownLibs().then(fn, (err) => console.warn('[markdownify]', err));

let turndownService = null;
function initTurndown() {
  if (!turndownService && window.TurndownService) {
    turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    if (window.turndownPluginGfm) {
      turndownService.use(window.turndownPluginGfm.gfm);
    }
  }
}

function getMarkdown() {
  initTurndown();
  if (turndownService && mdfyEditor) {
    return turndownService.turndown(mdfyEditor.innerHTML);
  }
  return '';
}

if (mdfyToggleVisual && mdfyToggleSource) {
  const mdfyWorkspace = document.querySelector('.markdownify-workspace');

  mdfyToggleVisual.addEventListener('click', () => {
    mdfyToggleVisual.classList.add('active');
    mdfyToggleSource.classList.remove('active');
    
    mdfyWorkspace.classList.remove('split-view');
    mdfySource.style.display = 'none';
    
    // Parse markdown back to visual if typing in source
    withMarkdownLibs(() => {
      if (mdfySource.value !== getMarkdown()) {
        mdfyEditor.innerHTML = marked.parse(mdfySource.value);
        saveHistoryState();
      }
    });
    
    mdfyEditor.style.display = 'block';
    mdfyEditor.contentEditable = 'true'; // Enable typing in Visual mode
    
    // Show toolbar
    const toolbar = document.querySelector('.markdownify-toolbar');
    if (toolbar) toolbar.style.display = 'flex';
  });

  mdfyToggleSource.addEventListener('click', () => {
    mdfyToggleSource.classList.add('active');
    mdfyToggleVisual.classList.remove('active');
    
    mdfyWorkspace.classList.add('split-view');
    mdfyEditor.style.display = 'block';
    mdfyEditor.contentEditable = 'false'; // Make preview read-only in Markdown mode
    mdfySource.style.display = 'block';
    withMarkdownLibs(() => { mdfySource.value = getMarkdown(); });
    
    // Hide toolbar
    const toolbar = document.querySelector('.markdownify-toolbar');
    if (toolbar) toolbar.style.display = 'none';
  });

  // Live preview logic from Source to Editor
  mdfySource.addEventListener('input', () => {
    withMarkdownLibs(() => { mdfyEditor.innerHTML = marked.parse(mdfySource.value); });
  });
}

// --- UNDO/REDO HISTORY LOGIC ---
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 3;
let isUndoRedoAction = false;

function saveHistoryState() {
  if (isUndoRedoAction) return;
  const content = mdfyEditor.innerHTML;
  if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== content) {
    undoStack.push(content);
    if (undoStack.length > MAX_HISTORY + 1) { // Keep current state + up to 3 previous
      undoStack.shift();
    }
    redoStack = [];
  }
}

// Save initial state
saveHistoryState();

// Save state when typing (debounced)
let historyTimeout;
mdfyEditor.addEventListener('input', () => {
  clearTimeout(historyTimeout);
  historyTimeout = setTimeout(() => saveHistoryState(), 500);
});

if (mdfyBtnCopy) {
  mdfyBtnCopy.addEventListener('click', () => withMarkdownLibs(() => {
    const md = mdfySource.style.display === 'block' ? mdfySource.value : getMarkdown();
    navigator.clipboard.writeText(md).then(() => {
      const originalTitle = mdfyBtnCopy.getAttribute('title');
      mdfyBtnCopy.setAttribute('title', 'Copied!');
      setTimeout(() => mdfyBtnCopy.setAttribute('title', originalTitle), 2000);
    });
  }));
}

if (mdfyBtnDownload) {
  mdfyBtnDownload.addEventListener('click', () => withMarkdownLibs(() => {
    const md = mdfySource.style.display === 'block' ? mdfySource.value : getMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article.md';
    a.click();
    URL.revokeObjectURL(url);
  }));
}

// Toolbar state sync
const toolbarBtns = document.querySelectorAll('.markdownify-toolbar .toolbar-btn');

function syncToolbarState() {
  toolbarBtns.forEach(btn => {
    const cmd = btn.getAttribute('data-command');
    const val = btn.getAttribute('data-value');
    let isActive = false;
    
    if (cmd === 'formatBlock') {
      const block = document.queryCommandValue(cmd);
      if (block && block.toLowerCase() === val.toLowerCase()) {
        isActive = true;
      }
    } else if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') {
       try { isActive = document.queryCommandState(cmd); } catch(e) {}
    } else if (cmd === 'formatBlockquote') {
       const block = document.queryCommandValue('formatBlock');
       if (block && block.toLowerCase() === 'blockquote') isActive = true;
    } else if (cmd === 'inlineCode') {
       const selection = window.getSelection();
       if (selection && selection.anchorNode) {
         let parent = selection.anchorNode;
         while (parent && parent !== mdfyEditor && parent !== document.body) {
           if (parent.nodeName === 'CODE') {
             isActive = true;
             break;
           }
           parent = parent.parentNode;
         }
       }
    } else {
      try {
        isActive = document.queryCommandState(cmd);
      } catch(e) {}
    }
    
    if (isActive) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

mdfyEditor.addEventListener('keyup', syncToolbarState);
mdfyEditor.addEventListener('mouseup', syncToolbarState);
mdfyEditor.addEventListener('click', syncToolbarState);

// Markdownify Toolbar Logic
toolbarBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (mdfySource.style.display === 'block') return; // disabled in source mode
    
    mdfyEditor.focus();
    const command = btn.getAttribute('data-command');
    const value = btn.getAttribute('data-value') || null;

    if (command !== 'undo' && command !== 'redo') {
      saveHistoryState();
    }

    if (command === 'createLink' || command === 'insertImage') {
      // Save the selection: the dialog steals focus and would collapse it
      const sel = window.getSelection();
      const savedRange = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
      const isLink = command === 'createLink';
      glassDialog({
        title: isLink ? 'Insert Link' : 'Insert Image',
        input: true,
        placeholder: isLink ? 'https://example.com' : 'https://example.com/image.png'
      }).then(url => {
        if (!url) return;
        mdfyEditor.focus();
        if (savedRange) {
          const s = window.getSelection();
          s.removeAllRanges();
          s.addRange(savedRange);
        }
        document.execCommand(command, false, url);
        setTimeout(saveHistoryState, 10);
        syncToolbarState();
      });
    } else if (command === 'inlineCode') {
      const selection = window.getSelection();
      let isCode = false;
      let codeNode = null;
      if (selection && selection.anchorNode) {
        let parent = selection.anchorNode;
        while (parent && parent !== mdfyEditor && parent !== document.body) {
          if (parent.nodeName === 'CODE') {
            isCode = true;
            codeNode = parent;
            break;
          }
          parent = parent.parentNode;
        }
      }
      
      if (isCode && codeNode) {
        const text = codeNode.innerHTML;
        codeNode.outerHTML = text;
      } else if (selection && !selection.isCollapsed) {
        const text = selection.toString();
        document.execCommand('insertHTML', false, `<code>${text}</code>`);
      }
    } else if (command === 'insertCodeBlock') {
      document.execCommand('insertHTML', false, `<pre><code>// code here\n</code></pre><p><br></p>`);
    } else if (command === 'insertTable') {
      const tableHTML = `
        <table border="1">
          <thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead>
          <tbody>
            <tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr>
            <tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr>
          </tbody>
        </table><p><br></p>`;
      document.execCommand('insertHTML', false, tableHTML);
    } else if (command === 'insertTaskList') {
      const listHTML = `<ul class="task-list"><li><input type="checkbox"> Task</li></ul><p><br></p>`;
      document.execCommand('insertHTML', false, listHTML);
    } else if (command === 'formatBlock' || command === 'formatBlockquote') {
      // Toggle logic for blocks
      const currentBlock = document.queryCommandValue('formatBlock');
      const targetBlock = command === 'formatBlockquote' ? 'blockquote' : value;
      if (currentBlock && currentBlock.toLowerCase() === targetBlock.toLowerCase()) {
        document.execCommand('formatBlock', false, 'p');
      } else {
        document.execCommand('formatBlock', false, targetBlock);
      }
    } else if (command === 'undo') {
      if (undoStack.length > 1) {
        isUndoRedoAction = true;
        redoStack.push(undoStack.pop());
        mdfyEditor.innerHTML = undoStack[undoStack.length - 1];
        isUndoRedoAction = false;
      }
    } else if (command === 'redo') {
      if (redoStack.length > 0) {
        isUndoRedoAction = true;
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        mdfyEditor.innerHTML = nextState;
        isUndoRedoAction = false;
      }
    } else {
      document.execCommand(command, false, value);
    }
    
    if (command !== 'undo' && command !== 'redo') {
      setTimeout(saveHistoryState, 10);
    }
    
    syncToolbarState();
  });
});

// Internal Floating Dock actions
const dockNew = document.getElementById('mdfy-dock-new');
if (dockNew) dockNew.addEventListener('click', () => {
  glassDialog({
    title: 'New Document',
    message: 'Start a new document? Any unsaved changes will be lost.',
    confirm: true
  }).then(ok => {
    if (!ok) return;
    mdfyEditor.innerHTML = '<h1>Untitled Document</h1><p>Start writing here...</p>';
    if (mdfySource.style.display === 'block') mdfyToggleVisual.click();
  });
});

// --- Dynamic Auto-Sorting Logic ---
function sortContainer(container, itemSelector, titleSelector) {
  const original = Array.from(container.children).filter(item => item.matches(itemSelector));
  const items = [...original];
  if (items.length <= 1) return;
  
  items.sort((a, b) => {
    let textA = titleSelector ? (a.querySelector(titleSelector)?.textContent || '') : a.textContent;
    let textB = titleSelector ? (b.querySelector(titleSelector)?.textContent || '') : b.textContent;
    
    return textA.trim().toLowerCase().localeCompare(textB.trim().toLowerCase());
  });
  
  if (items.every((item, index) => item === original[index])) return;
  items.forEach(item => container.appendChild(item));
}

function autoSortAll() {
  const config = [
    { containerClass: '.project-grid', itemClass: '.project-item', titleClass: '.project-title' },
    { containerClass: '.resource-hero-grid', itemClass: '.resource-hero-card', titleClass: '.res-title' },
    { containerClass: '.article-list', itemClass: '.article-item', titleClass: '.art-title' },
    { containerClass: '.infographic-grid', itemClass: '.infographic-item', titleClass: '.infographic-caption' },
    { containerClass: '.skill-tags', itemClass: '.skill-tag', titleClass: null }
  ];

  config.forEach(({ containerClass, itemClass, titleClass }) => {
    document.querySelectorAll(containerClass).forEach(container => {
      sortContainer(container, itemClass, titleClass);
    });
  });
}

// Initial sorting
document.addEventListener('DOMContentLoaded', autoSortAll);

// Observer to auto-sort when elements are added
const sortingObserver = new MutationObserver((mutations) => {
  let shouldSort = false;
  for (let mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      const addedElements = Array.from(mutation.addedNodes).filter(n => n.nodeType === Node.ELEMENT_NODE);
      
      // Ignore UI elements that are dynamically added during user interaction (like the close-all button)
      // to prevent DOM detachment from cancelling in-flight click events.
      const hasSortable = addedElements.some(el => {
        if (el.classList && el.classList.contains('global-close-all-btn')) return false;
        if (Object.values(cards).includes(el)) return false; // A known window was only promoted.
        
        const selectors = ['.project-item', '.resource-hero-card', '.article-item', '.infographic-item', '.skill-tag'];
        return selectors.some(sel => el.matches && el.matches(sel) || (el.querySelector && el.querySelector(sel)));
      });

      if (hasSortable) {
        shouldSort = true;
        break;
      }
    }
  }
  
  if (shouldSort) {
    sortingObserver.disconnect();
    autoSortAll();
    observeMutations();
  }
});

function observeMutations() {
  const contentArea = document.querySelector('.content-area');
  if (contentArea) {
    sortingObserver.observe(contentArea, { childList: true, subtree: true });
  }
}

document.addEventListener('DOMContentLoaded', observeMutations);

// --- Home profile character: paper-cut portrait that follows the cursor ---
// Layers live in #profileCharacter
// (index.html) and share one 1254px canvas; layout is in styles.css (.avatar-* / .av-*).
//   - eyes follow the cursor / finger (clamped, eased)
//   - head and hair lean toward the cursor; the hair is a spring, so it overshoots
//   - random blinks, sometimes a double blink
//   - idle: breathing, slow sway and random glances while the cursor is still
//   - click / tap: a quick nod plus a double blink
//   - the frame leans in (zooms) while the cursor is near the face
//   - prefers-reduced-motion: eyes still track, no idle motion or lean
// The frame loop only runs while the Home window is on screen and the tab is visible.
(function initProfileCharacter() {
  const character = document.getElementById('profileCharacter');
  if (!character) return;
  const stage = character.querySelector('.avatar-stage');
  const head = character.querySelector('.av-head');
  const hair = character.querySelector('.av-hair');
  const body = character.querySelector('.av-body');
  if (!stage || !head || !hair || !body) return;

  const CANVAS = 1254; // px: the coordinate space every layer shares
  const o = {
    // how far the cursor can pull each layer (px in canvas space). Body, head and hair are
    // kept very small and close to each other so the layering is barely perceptible;
    // the eyes carry the interaction.
    body: { x: 1.5, y: 0.8 },
    head: { x: 6, y: 3, rot: 0.6 },
    hair: { x: 7, y: 3.5, rot: 0.7 },
    eyes: { x: 20, y: 9 },
    reach: 320,              // screen px from the eyes for full deflection
    easeEyes: 0.14,
    easeHead: 0.07,
    hairSpring: { stiffness: 0.045, damping: 0.78 },
    blinkMin: 2.4, blinkMax: 6.0,      // seconds between blinks
    blinkClose: 0.11, blinkOpen: 0.14, // seconds
    doubleBlinkChance: 0.18,
    idleAfter: 2.2,                    // seconds without cursor movement before idle glances
    glanceEvery: [1.6, 4.5],
    glanceHold: [0.6, 1.4],
    zoomMax: 1.45,                     // frame scale when the cursor is over the face
    zoomNear: 2.6                      // frame radii over which the zoom eases in
  };

  const frame = character.closest('.profile-avatar-frame');
  const pupils = character.querySelectorAll('.av-pupil');
  const lids = character.querySelectorAll('.av-lid');
  const lashes = character.querySelectorAll('.av-lash');
  const lidlines = character.querySelectorAll('.av-lidline');

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  // ---- state ---------------------------------------------------------------
  const target = { x: 0, y: 0 };   // where the cursor wants us to look (-1..1)
  const gaze = { x: 0, y: 0 };     // eased eye gaze
  const lean = { x: 0, y: 0 };     // eased head lean
  const hairV = { x: 0, y: 0 };    // hair spring velocity
  const hairP = { x: 0, y: 0 };    // hair spring position
  let blink = 0;                   // 0 open .. 1 closed
  let blinkTimer = rand(o.blinkMin, o.blinkMax);
  let blinkPhase = null;           // null | {t, dur, from, to, again} | {pending}
  let lastMove = performance.now() / 1000;
  let glance = null;               // {until}
  let nextGlance = rand(o.glanceEvery[0], o.glanceEvery[1]);
  let nod = 0;                     // click reaction, 1 -> 0
  let zoom = 1;                    // last frame zoom written
  let pointer = null;              // latest cursor position on screen
  let scale = 0;                   // css px per canvas px
  let last = performance.now();
  let raf = 0;
  let visible = false;

  function measure() { scale = stage.clientWidth / CANVAS; }

  // ---- input ---------------------------------------------------------------
  function point(cx, cy) {
    pointer = { x: cx, y: cy };
    lastMove = performance.now() / 1000;
    glance = null;
  }
  // The stage may be hidden or resized (Home window closed, mobile layout), so the
  // cursor is measured against the live rect each frame rather than on the event.
  function aim() {
    if (!pointer) return;
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    // the eyes sit at ~(47%, 42%) of the canvas
    const ox = r.left + r.width * 0.47, oy = r.top + r.height * 0.42;
    target.x = clamp((pointer.x - ox) / o.reach, -1, 1);
    target.y = clamp((pointer.y - oy) / o.reach, -1, 1);
  }
  document.addEventListener('pointermove', e => point(e.clientX, e.clientY), { passive: true });
  document.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) point(t.clientX, t.clientY); }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { pointer = null; target.x = 0; target.y = 0; });
  character.addEventListener('pointerdown', () => { nod = 1; scheduleBlink(0, true); });

  // ---- blinking ------------------------------------------------------------
  function scheduleBlink(delay, twice) {
    blinkTimer = delay;
    blinkPhase = twice ? { pending: 'double' } : null;
  }
  function stepBlink(dt) {
    if (blinkPhase && blinkPhase.dur) {
      blinkPhase.t += dt;
      let k = clamp(blinkPhase.t / blinkPhase.dur, 0, 1);
      k = blinkPhase.to > blinkPhase.from ? k * k : 1 - (1 - k) * (1 - k);
      blink = blinkPhase.from + (blinkPhase.to - blinkPhase.from) * k;
      if (blinkPhase.t >= blinkPhase.dur) {
        if (blinkPhase.to === 1) {
          blinkPhase = { t: 0, dur: o.blinkOpen, from: 1, to: 0, again: blinkPhase.again };
        } else {
          const again = blinkPhase.again;
          blinkPhase = again ? { pending: 'single' } : null;
          blinkTimer = again ? 0.12 : rand(o.blinkMin, o.blinkMax);
        }
      }
      return;
    }
    blinkTimer -= dt;
    if (blinkTimer <= 0) {
      const twice = blinkPhase && blinkPhase.pending === 'double' ? true
        : blinkPhase && blinkPhase.pending === 'single' ? false
        : Math.random() < o.doubleBlinkChance;
      blinkPhase = { t: 0, dur: o.blinkClose, from: 0, to: 1, again: twice };
    }
  }

  // ---- idle glances --------------------------------------------------------
  function stepIdle(now, dt) {
    if (reducedMotion) return;
    if (now - lastMove < o.idleAfter) return;
    if (glance) {
      if (now > glance.until) {
        glance = null;
        nextGlance = rand(o.glanceEvery[0], o.glanceEvery[1]);
        target.x = 0; target.y = 0;
      }
      return;
    }
    nextGlance -= dt;
    if (nextGlance <= 0) {
      glance = { until: now + rand(o.glanceHold[0], o.glanceHold[1]) };
      target.x = rand(-0.9, 0.9);
      target.y = rand(-0.5, 0.6);
    }
  }

  // ---- lean-in zoom: 1 far away, zoomMax with the cursor over the face -----
  function stepZoom() {
    if (!frame) return;
    let z = 1;
    if (pointer && !reducedMotion) {
      const r = frame.getBoundingClientRect();
      if (r.width) {
        const radius = (r.width / zoom) / 2; // un-zoomed radius
        const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2)) / radius;
        if (d <= 1) z = o.zoomMax;
        else if (d < o.zoomNear) {
          const t = (o.zoomNear - d) / (o.zoomNear - 1);
          z = 1 + (o.zoomMax - 1) * t * t * (3 - 2 * t);
        }
      }
    }
    if (Math.abs(z - zoom) > 0.004) {
      zoom = z;
      frame.style.setProperty('--avatar-zoom', z.toFixed(3));
    }
  }

  // ---- frame ---------------------------------------------------------------
  function tick(ts) {
    raf = visible ? requestAnimationFrame(tick) : 0;
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    const now = ts / 1000;
    if (!scale) measure();
    if (!scale) return;

    if (!glance) aim();
    stepBlink(dt);
    stepIdle(now, dt);
    stepZoom();

    gaze.x += (target.x - gaze.x) * o.easeEyes;
    gaze.y += (target.y - gaze.y) * o.easeEyes;
    const leanTarget = glance ? { x: target.x * 0.35, y: target.y * 0.25 } : target;
    lean.x += (leanTarget.x - lean.x) * o.easeHead;
    lean.y += (leanTarget.y - lean.y) * o.easeHead;

    // hair spring chases the head with overshoot
    hairV.x = (hairV.x + (lean.x - hairP.x) * o.hairSpring.stiffness) * o.hairSpring.damping;
    hairV.y = (hairV.y + (lean.y - hairP.y) * o.hairSpring.stiffness) * o.hairSpring.damping;
    hairP.x += hairV.x; hairP.y += hairV.y;

    // idle breathing / sway (amplitudes in canvas px, kept tiny)
    let br = 0, sw = 0, bob = 0;
    if (!reducedMotion) {
      br = Math.sin(now * 2 * Math.PI / 4.6);        // breath cycle ~4.6s
      sw = Math.sin(now * 2 * Math.PI / 7.3) * 0.6;  // slow sway
      bob = Math.sin(now * 2 * Math.PI / 4.6 + 0.6);
    }
    if (nod > 0) nod = Math.max(0, nod - dt * 2.2);
    const nodY = Math.sin(nod * Math.PI) * 5;

    const s = scale, hm = reducedMotion ? 0 : 1;
    body.style.transform = 'translate(' + (lean.x * o.body.x * s * hm) + 'px,' + ((lean.y * o.body.y + br * 0.8) * s * hm) + 'px)';
    head.style.transform = 'translate(' + ((lean.x * o.head.x + sw * 0.8) * s * hm) + 'px,' + ((lean.y * o.head.y + bob * 0.9 + nodY) * s * hm) + 'px) rotate(' + ((lean.x * o.head.rot + sw * 0.15) * hm) + 'deg)';
    hair.style.transform = 'translate(' + ((hairP.x * o.hair.x + sw * 0.9) * s * hm) + 'px,' + ((hairP.y * o.hair.y + bob * 1.0 + nodY * 1.05) * s * hm) + 'px) rotate(' + ((hairP.x * o.hair.rot + sw * 0.17) * hm) + 'deg)';

    const px = gaze.x * o.eyes.x, py = gaze.y * o.eyes.y - nodY * 0.2;
    for (let i = 0; i < pupils.length; i++) pupils[i].setAttribute('transform', 'translate(' + px.toFixed(2) + ' ' + py.toFixed(2) + ')');
    for (let j = 0; j < lids.length; j++) {
      const h = +lids[j].getAttribute('data-h');
      lids[j].setAttribute('transform', 'translate(0 ' + (blink * h).toFixed(2) + ')');
      // the open-eye lash fades into the closed-eye crease as the lid comes down
      lashes[j].style.opacity = (1 - 0.4 * blink * blink).toFixed(3);
      lidlines[j].style.opacity = (blink * blink).toFixed(3);
    }
  }

  // ---- run only while on screen ---------------------------------------------
  function setVisible(v) {
    visible = v && !document.hidden;
    if (visible && !raf) { last = performance.now(); measure(); raf = requestAnimationFrame(tick); }
  }
  let onScreen = true;
  if ('IntersectionObserver' in window) {
    onScreen = false;
    // bringToFront()/showView() re-insert the Home card in the DOM, which delivers a
    // "left, re-entered" pair in one batch: only the latest entry counts.
    new IntersectionObserver(entries => {
      onScreen = entries[entries.length - 1].isIntersecting;
      setVisible(onScreen);
    }).observe(character);
  }
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stage);
  else window.addEventListener('resize', measure);
  document.addEventListener('visibilitychange', () => setVisible(onScreen));
  setVisible(onScreen);
})();
// --- Glass Dialog (themed replacement for alert/confirm/prompt) ---
// Resolves: alert -> true; confirm -> true/false; input -> string or null
function glassDialog({ title = '', message = '', input = false, confirm = false, placeholder = '' } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'glass-dialog-overlay';
    overlay.innerHTML = `
      <div class="glass-dialog" role="dialog" aria-modal="true">
        ${title ? '<h3></h3>' : ''}
        ${message ? '<p></p>' : ''}
        ${input ? '<input type="text">' : ''}
        <div class="glass-dialog-actions">
          ${(input || confirm) ? '<button class="glass-dialog-btn" data-act="cancel">Cancel</button>' : ''}
          <button class="glass-dialog-btn primary" data-act="ok">OK</button>
        </div>
      </div>`;
    if (title) overlay.querySelector('h3').textContent = title;
    if (message) overlay.querySelector('p').textContent = message;
    const field = overlay.querySelector('input');
    if (field) field.placeholder = placeholder;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const close = (val) => {
      document.removeEventListener('keydown', onKey, true);
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 200);
      resolve(val);
    };
    const ok = () => close(input ? (field.value.trim() || null) : true);
    const cancel = () => close(input ? null : (confirm ? false : true));
    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); ok(); }
      else if (e.key === 'Escape') { e.stopPropagation(); cancel(); }
    };

    overlay.querySelector('[data-act="ok"]').addEventListener('click', ok);
    const cancelBtn = overlay.querySelector('[data-act="cancel"]');
    if (cancelBtn) cancelBtn.addEventListener('click', cancel);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cancel(); });
    document.addEventListener('keydown', onKey, true);
    (field || overlay.querySelector('[data-act="ok"]')).focus();
  });
}

function copyPromptText(elementId, btn) {
  const text = document.getElementById(elementId).innerText;
  navigator.clipboard.writeText(text).then(() => {
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>`;
    setTimeout(() => {
      btn.innerHTML = originalHtml;
    }, 2000);
  });
}

// --- Desktop Clock Widget ---
function updateDesktopClock() {
  const timeEl = document.getElementById('clockTime');
  const ampmEl = document.getElementById('clockAmPm');
  const dateEl = document.getElementById('clockDate');
  if (!timeEl || !ampmEl || !dateEl) return;

  const now = new Date();
  
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  minutes = minutes < 10 ? '0' + minutes : minutes;
  const strHours = hours < 10 ? '0' + hours : hours;
  
  const clockText = `${strHours}:${minutes}`;
  if (timeEl.textContent !== clockText) timeEl.textContent = clockText;
  if (ampmEl.textContent !== ampm) ampmEl.textContent = ampm;

  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  const dateText = now.toLocaleDateString('en-US', options);
  if (dateEl.textContent !== dateText) dateEl.textContent = dateText;
}

// Initialize clock
updateDesktopClock();
setInterval(updateDesktopClock, 1000);


function makeKeyboardButton(element, label) {
  element.setAttribute('role', 'button');
  element.tabIndex = 0;
  element.setAttribute('aria-label', label);
  element.addEventListener('keydown', event => {
    if (event.target !== element || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) element.click();
  });
}
document.querySelectorAll('.sidebar-item, .control-btn, .app-logo, .nav-tab, .tabs-overflow-indicator, .resource-hero-card, .project-item, .article-item, .infographic-item').forEach(element => {
  if (element.tagName === 'BUTTON' || element.tagName === 'A') return;
  const label = element.title || element.querySelector('.res-title, .project-title, .art-title, .infographic-caption')?.textContent.trim() || element.textContent.trim() || 'Home';
  makeKeyboardButton(element, label);
});
document.querySelectorAll('.card-title').forEach(title => title.title = title.textContent);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('.sidebar-popup-grid.visible').forEach(grid => grid.classList.remove('visible'));
});

// Touch browsers do not have a dependable hover state. Make prompt disclosure
// explicit while keeping the existing image and overlay appearance.
document.querySelectorAll('.prompt-image-container').forEach(container => {
  const image = container.querySelector('.prompt-image');
  makeKeyboardButton(image, 'Show image generation prompt');
  image.setAttribute('aria-expanded', 'false');
  image.addEventListener('click', () => {
    const open = container.classList.toggle('prompt-open');
    container.classList.toggle('prompt-dismissed', !open);
    image.setAttribute('aria-expanded', String(open));
  });
  container.addEventListener('pointerleave', () => container.classList.remove('prompt-dismissed'));
  container.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    container.classList.remove('prompt-open');
    container.classList.add('prompt-dismissed');
    image.setAttribute('aria-expanded', 'false');
    if (container.contains(document.activeElement)) document.activeElement.blur();
  });
  container.addEventListener('click', event => {
    if (event.target.closest('button, .prompt-text') || event.target === image) return;
    container.classList.remove('prompt-open');
    container.classList.add('prompt-dismissed');
    image.setAttribute('aria-expanded', 'false');
    if (container.contains(document.activeElement)) document.activeElement.blur();
  });
});
