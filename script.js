// Realistic Linux Boot Sequence
window.addEventListener('load', () => {
  const bootText = document.getElementById('bootText');
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

  let delay = 0;

  messages.forEach((msg, index) => {
    // Randomize delay to simulate processing
    delay += Math.random() * 300 + 100;

    setTimeout(() => {
      // Update text content in place (one line)
      bootText.innerHTML = msg;

      // If last message, close boot screen
      if (index === messages.length - 1) {
        setTimeout(() => {
          document.getElementById('bootScreen').classList.add('hidden');

          // Trigger Dock Animation, then wiggle Home button
          animateDockEntry(() => {
            const homeBtn = document.querySelector('.sidebar-item[data-view="home"]');
            if (homeBtn) {
              homeBtn.classList.add('wiggle');
            }
          });
        }, 800);
      }
    }, delay);
  });
});

// Function to animate the dock "Water Drop" entry
function animateDockEntry(onComplete) {
  const dock = document.querySelector('.sidebar');
  const items = document.querySelectorAll('.sidebar-item');

  if (!dock) return;

  // 1. Reveal Drop
  dock.classList.remove('dock-hidden');
  dock.classList.add('dock-drop');

  // 2. Expand to "Splash" pill after 400ms
  setTimeout(() => {
    dock.classList.remove('dock-drop');
    dock.classList.add('dock-splash');

    // 3. Expand fully and reveal icons sequentially after another 300ms
    setTimeout(() => {
      dock.classList.remove('dock-splash');

      // Reveal items one by one
      items.forEach((item, index) => {
        setTimeout(() => {
          item.classList.remove('dock-item-hidden');
          // Check if this is the last item to trigger completion
          if (index === items.length - 1 && onComplete) {
            setTimeout(onComplete, 400); // Wait for last icon to pop
          }
        }, index * 100); // 100ms stagger between icons
      });

    }, 300);

  }, 400);
}

// Clock (Top bar clock removed; replaced by fake system icons)

// View switching
const cards = {
  // UPDATED: 'resources' mapped to the new card ID
  resources: document.getElementById('resourcesCard'),
  labs: document.getElementById('labsCard'), // NEW
  labsContent: document.getElementById('labsContentCard'),
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
  const contentArea = document.querySelector('.content-area');
  if (!contentArea) return;
  const bounds = contentArea.getBoundingClientRect();

  document.querySelectorAll('.window-card').forEach(win => {
    if (win.style.display === 'none') return;

    // If on mobile (flex mode), constraints are handled by CSS flex/order
    // Only constrain absolute windows (Desktop view)
    if (window.getComputedStyle(win).position === 'absolute') {
      const rect = win.getBoundingClientRect();

      // Horizontal Check
      if (rect.right > window.innerWidth) {
        // Too far right, snap back
        win.style.left = (window.innerWidth - rect.width / 2 - 20) + 'px';
        // Updated to 3D Transform
        win.style.transform = 'translate3d(-50%, -50%, 0)';
      }

      // Vertical Check
      // 80px buffer for bottom dock
      if (rect.bottom > window.innerHeight - 80) {
        win.style.top = (window.innerHeight - 80 - rect.height / 2) + 'px';
      }

      // Top Check (Don't go under topbar)
      if (rect.top < 60) {
        win.style.top = (60 + rect.height / 2) + 'px';
      }
    }
  });
}

function updateOpenWindowsTabs() {
  const container = document.getElementById('openWindowsTabs');
  container.innerHTML = '';

  openWindows.forEach(windowName => {
    const tab = document.createElement('div');
    tab.className = 'window-tab';
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

    tab.textContent = displayTitle;
    tab.onclick = () => showView(windowName);
    container.appendChild(tab);
  });

  // Check for overflow after DOM update
  setTimeout(checkTabsOverflow, 50);
  updateCloseAllButton();
}

// NEW: Centralized Sidebar Update Logic with 3-Dot Menu (Projects only)
function updateSidebar(viewName) {
  // Close any open popups first
  document.querySelectorAll('.sidebar-popup-grid').forEach(grid => grid.classList.remove('visible'));

  document.querySelectorAll('.sidebar-item').forEach(item => {
    // 1. Reset
    item.classList.remove('active');
    const oldTrigger = item.querySelector('.sidebar-menu-trigger');
    if (oldTrigger) oldTrigger.remove();
    const oldGrid = item.querySelector('.sidebar-popup-grid');
    if (oldGrid) oldGrid.remove();

    // 2. Determine Active State based on current view
    const currentConfig = viewConfig[viewName];
    const category = item.dataset.view; // e.g., 'projects'

    if (currentConfig && currentConfig.parent === category) {
      item.classList.add('active');
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

  const isAlreadyOpen = openWindows.includes(viewName);
  const isMinimized = minimizedWindows.has(viewName);

  // If the window was minimized, restore it
  if (isMinimized) {
    minimizedWindows.delete(viewName);

    // Reset position to centered % (in case it was dragged to pixel coords)
    card.style.left = '50%';
    card.style.top = '50%';
    card.style.borderRadius = '16px';
    card.style.display = 'flex';
    card.style.opacity = '0';

    // Start from icon position (tiny scale)
    const iconPos = getIconPosition(viewName);
    const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const deltaX = iconPos.x - screenCenter.x;
    const deltaY = iconPos.y - screenCenter.y;

    // Disable transition for initial setup
    card.style.transition = 'none';
    card.style.transform = `translate3d(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px), 0) scale(0.1)`;
    card.offsetHeight; // Force reflow

    // Animate to center
    card.style.transition = 'transform 0.45s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.4s ease';
    card.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
    card.style.opacity = '1';

    bringToFront(card);
    activeWindow = viewName;
    updateSidebar(viewName);
    updateOpenWindowsTabs();
    return;
  }

  // Make sure it's visible in DOM to calculate styles
  card.style.display = 'flex';

  // If opening for the first time or re-opening, Ensure Center Origin
  if (!isAlreadyOpen) {
    // RESET POSITION TO CENTER so animation calculates correctly
    card.style.left = '50%';
    card.style.top = '50%';

    const iconPos = getIconPosition(viewName);
    const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // Calculate delta. 
    // Note: Cards are centered by translate(-50%, -50%). 
    // To move to icon, we add the difference between icon and screen center.
    const deltaX = iconPos.x - screenCenter.x;
    const deltaY = iconPos.y - screenCenter.y;

    // Initial State (At Icon)
    card.style.transition = 'none'; // Disable transition for setup
    // Updated to 3D Transform
    card.style.transform = `translate3d(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px), 0) scale(0.1)`;
    card.style.opacity = '0';
    card.style.borderRadius = '50%'; // Circle drop

    // Trigger Reflow
    card.offsetHeight;

    // Final State (Center Screen)
    card.style.transition = 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.5s ease, border-radius 0.5s ease';
    // Updated to 3D Transform
    card.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
    card.style.opacity = '1';
    card.style.borderRadius = '16px';

    // Add to open windows list
    openWindows.push(viewName);
  }

  // Always bring to front regardless (bringToFront also calls repositionStack)
  bringToFront(card);

  // --- MOBILE OPTIMIZATION: Handle stacking order ---
  // 1. Remove "mobile-active" from ALL cards so they drop to order: 2
  Object.values(cards).forEach(c => {
    if (c) c.classList.remove('mobile-active');
  });

  // 2. Add "mobile-active" to CURRENT card so it jumps to order: 1 (top)
  card.classList.add('mobile-active');

  // 3. PHYSICAL DOM REORDERING (The Pro Fix)
  const contentArea = document.querySelector('.content-area');
  if (window.innerWidth <= 768) {
    contentArea.insertBefore(card, contentArea.firstChild);
    contentArea.scrollTop = 0;
  }

  activeWindow = viewName;

  // Update UI components
  updateSidebar(viewName);
  updateOpenWindowsTabs();

  // NEW: Auto-focus terminal input if terminal is opened
  if (viewName === 'terminal') {
    setTimeout(() => {
      const input = document.getElementById('termInput');
      if (input) input.focus();
    }, 500); // Wait for animation
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
  const STEP_X = -18;  // px shift left per depth level
  const STEP_Y =  18;  // px shift down per depth level

  const n = openWindows.length;

  openWindows.forEach((name, i) => {
    const c = cards[name];
    if (!c || c.style.display === 'none') return;

    const depth = n - 1 - i; // 0 = foreground, 1 = one behind, ...

    if (depth === 0) {
      // Foreground window: restore centred position
      // Only reset if it's still using the transform-based centering
      // (don't override if the user has manually dragged it)
      const currentTransform = c.style.transform || '';
      const hasPixelPos = c.style.left && !c.style.left.includes('%');
      if (!hasPixelPos) {
        c.style.transform = 'translate3d(-50%, -50%, 0)';
      }
    } else {
      // Background windows: offset proportionally to depth
      const offsetX = STEP_X * depth;
      const offsetY = STEP_Y * depth;

      const hasPixelPos = c.style.left && !c.style.left.includes('%');
      if (hasPixelPos) {
        // Window was dragged: grab its current pixel position and nudge it
        // We store _baseLeft/_baseTop as the "foreground" position anchor
        // and shift from there.
        // For simplicity, just shift from its current absolute position.
        // (Dragged windows keep their pixel coords; we only add the depth nudge
        //  via a CSS custom-property transform so we don't corrupt left/top.)
        c.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      } else {
        // Still using the centred % transform
        c.style.transform = `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), 0)`;
      }
    }
  });
}

// Draggable windows
function initDraggable() {
  const allWindows = document.querySelectorAll('.window-card');

  allWindows.forEach(windowCard => {
    const header = windowCard.querySelector('.card-header');

    header.addEventListener('mousedown', (e) => {
      // Don't drag if clicking on control buttons
      if (e.target.closest('.control-btn')) return;

      isDragging = true;
      draggedWindow = windowCard;

      // Apply dragging class first to disable transitions
      windowCard.classList.add('dragging');

      // [FIX] Force Reflow: Ensure transition disable applies before moving
      void windowCard.offsetWidth;

      // Calculate current position relative to container to freeze it
      const contentArea = document.querySelector('.content-area');
      const contentRect = contentArea.getBoundingClientRect();
      const rect = windowCard.getBoundingClientRect();

      // Calculate exact position relative to content area
      const relativeLeft = rect.left - contentRect.left;
      const relativeTop = rect.top - contentRect.top;

      // Swap from % centering to fixed pixel positioning without visual jump
      windowCard.style.left = relativeLeft + 'px';
      windowCard.style.top = relativeTop + 'px';
      windowCard.style.transform = 'none';

      // Set drag offsets
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      bringToFront(windowCard);

      e.preventDefault();
    });
  });
}

document.addEventListener('mousemove', (e) => {
  if (!isDragging || !draggedWindow) return;

  const contentArea = document.querySelector('.content-area');
  const contentRect = contentArea.getBoundingClientRect();

  let newX = e.clientX - contentRect.left - dragOffset.x;
  let newY = e.clientY - contentRect.top - dragOffset.y;

  // Constrain to content area
  const windowRect = draggedWindow.getBoundingClientRect();

  // Strict constraints: Window must remain fully inside contentArea
  const minX = 0;
  const maxX = contentRect.width - windowRect.width;
  const minY = 0;
  const maxY = contentRect.height - windowRect.height;

  // Apply strict clamping to prevent overflow
  newX = Math.max(minX, Math.min(newX, maxX));
  newY = Math.max(minY, Math.min(newY, maxY));

  draggedWindow.style.left = newX + 'px';
  draggedWindow.style.top = newY + 'px';
  draggedWindow.style.transform = 'none';
});

document.addEventListener('mouseup', () => {
  if (draggedWindow) {
    draggedWindow.classList.remove('dragging');
  }
  isDragging = false;
  draggedWindow = null;
});

// Initialize draggable after DOM is ready
setTimeout(() => {
  initDraggable();
}, 100);

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
      if (existingBtn && existingBtn.parentNode === activeCard) {
        return;
      }
      
      if (existingBtn) existingBtn.remove();

      const btn = document.createElement('button');
      btn.className = 'global-close-all-btn';
      btn.innerText = 'Close All';
      
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

function closeWindow(viewName) {
  const card = cards[viewName];
  if (!card) return;

  // Calculate position to shrink back to
  const iconPos = getIconPosition(viewName);
  const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const deltaX = iconPos.x - screenCenter.x;
  const deltaY = iconPos.y - screenCenter.y;

  // Apply Closing Animation
  card.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease, border-radius 0.4s ease';
  // Updated to 3D Transform
  card.style.transform = `translate3d(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px), 0) scale(0.1)`;
  card.style.opacity = '0';
  card.style.borderRadius = '50%';

  // After animation, hide and cleanup
  setTimeout(() => {
    card.style.display = 'none';

    // CRITICAL FIX: Reset styles to default centered state for next open
    // This prevents the window from "jumping" if it was previously dragged to a specific pixel location
    card.style.left = '50%';
    card.style.top = '50%';
    // Updated to 3D Transform
    card.style.transform = 'translate3d(-50%, -50%, 0)';
    card.style.borderRadius = '16px';

    openWindows = openWindows.filter(w => w !== viewName);
    minimizedWindows.delete(viewName); // Also clean up from minimized set if it was there

    if (viewName === 'home') {
      const homeBtn = document.querySelector('.sidebar-item[data-view="home"]');
      if (homeBtn) {
        homeBtn.classList.add('wiggle');
      }
    }

    // Show home if closing active window
    if (activeWindow === viewName) {
      // Find a non-minimized window to switch to
      const nextVisibleWindow = openWindows.slice().reverse().find(w => !minimizedWindows.has(w));
      if (nextVisibleWindow) {
        showView(nextVisibleWindow);
      } else {
        activeWindow = null;
        updateOpenWindowsTabs();
        updateSidebar(null);
      }
    } else {
      updateOpenWindowsTabs();
      // Update sidebar to reflect the new active window (usually home)
      if (openWindows.length === 0) {
        updateSidebar(null);
      } else if (activeWindow) {
        updateSidebar(activeWindow);
      }
      // Reposition remaining windows now that the stack has changed
      repositionStack();
    }
  }, 400); // Match transition duration
}

// Sidebar navigation
document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', () => {
    item.classList.remove('wiggle');
    const view = item.dataset.view;

    // If the window is minimized, restore it
    if (minimizedWindows.has(view)) {
      showView(view);
      return;
    }

    // If window is already open and visible, just bring to front
    if (openWindows.includes(view) && cards[view] && cards[view].style.display === 'flex') {
      bringToFront(cards[view]);
      activeWindow = view;
      updateOpenWindowsTabs();
      updateSidebar(view); // Ensure sidebar updates even if just bringing to front

      // Added logic for Mobile click on already open window: Scroll to top AND Move to DOM top
      const contentArea = document.querySelector('.content-area');
      if (window.innerWidth <= 768) {
        Object.values(cards).forEach(card => card && card.classList.remove('mobile-active'));
        cards[view].classList.add('mobile-active');

        // Move to top of DOM
        contentArea.insertBefore(cards[view], contentArea.firstChild);
        contentArea.scrollTop = 0;
      }
    } else {
      showView(view);
    }
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
      card.classList.toggle('full-width');
      if (card.classList.contains('full-width')) {
        card.style.left = '50%';
        card.style.top = '50%';
        card.style.transform = 'translate3d(-50%, -50%, 0)';
      }
    }
  });
});

// NEW: Minimize function — hides the window but keeps it in openWindows
function minimizeWindow(viewName) {
  const card = cards[viewName];
  if (!card) return;

  // Animate shrink toward icon
  const iconPos = getIconPosition(viewName);
  const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const deltaX = iconPos.x - screenCenter.x;
  const deltaY = iconPos.y - screenCenter.y;

  card.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.35s ease, border-radius 0.35s ease';
  card.style.transform = `translate3d(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px), 0) scale(0.1)`;
  card.style.opacity = '0';
  card.style.borderRadius = '50%';

  setTimeout(() => {
    card.style.display = 'none';
    // Mark as minimized — do NOT remove from openWindows
    minimizedWindows.add(viewName);

    // Switch focus to another open non-minimized window if this was active
    if (activeWindow === viewName) {
      const nextWindow = openWindows.slice().reverse().find(w => w !== viewName && !minimizedWindows.has(w));
      if (nextWindow) {
        showView(nextWindow);
      } else {
        // No visible windows — show home if home is open, else update UI
        if (openWindows.includes('home') && !minimizedWindows.has('home')) {
          showView('home');
        } else {
          activeWindow = null;
          updateOpenWindowsTabs();
          updateSidebar('');
        }
      }
    } else {
      updateOpenWindowsTabs();
      updateSidebar(activeWindow || '');
    }
  }, 350);
}

// Click on window to bring to front (UPDATED TO FIX SIDEBAR HIGHLIGHT)
document.querySelectorAll('.window-card').forEach(win => {
  win.addEventListener('mousedown', () => {
    bringToFront(win);
    const viewName = Object.keys(cards).find(key => cards[key] === win);
    if (viewName) {
      activeWindow = viewName;
      updateOpenWindowsTabs();
      updateSidebar(viewName); // This fixes the issue where clicking a window didn't update the sidebar
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

  // Offset iframe window slightly from center
  const iframeCard = document.getElementById('iframeCard');
  setTimeout(() => {
    iframeCard.style.left = 'calc(50% + 30px)';
    iframeCard.style.top = 'calc(50% + 30px)';
    bringToFront(iframeCard);
  }, 50);
}

function closeIframe() {
  document.getElementById('contentIframe').src = '';
  closeWindow('iframe');
}

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
  document.getElementById('terminalCard').addEventListener('click', () => {
    termInput.focus();
  });
}


/* WebGL animated background (Updated for Large-Scale Balanced Abstraction) */
const canvas = document.getElementById('webgl-bg');
const gl = canvas.getContext('webgl');

function resizeGL() {
  const currentDpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * currentDpr;
  canvas.height = window.innerHeight * currentDpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeGL);
resizeGL();

const vertexSrc = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

// Frosted Glass + Large Scale Abstract Liquid Shader
const fragmentSrc = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_res;

      // Pseudo-random function for glass grain
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_res.xy;
        
        // 1. Frosted Glass Distortion
        // Reduced intensity for cleaner abstract look
        float grain = random(uv * 3.0 + u_time * 0.05); 
        vec2 frostedUV = uv + (vec2(random(uv), random(uv + 1.2)) - 0.5) * 0.005;

        // 2. Complex Domain-Warped Fluid (Randomized Shapes)
        float t = u_time * 0.12; 
        vec2 flowUV = frostedUV * 2.0; // Zoom out to see more shape variation
        
        // Base wave
        float v_base = sin(flowUV.x * 2.0 + t) + cos(flowUV.y * 1.5 + t * 1.2);
        
        // Warp coordinates based on base wave
        vec2 warpedUV = flowUV + vec2(v_base * 0.5, v_base * 0.3);
        
        // Detailed wave layers on warped coordinates
        float v1 = sin(warpedUV.x * 3.0 - t * 0.5);
        float v2 = cos(warpedUV.y * 2.5 + t * 0.8);
        float v3 = sin(length(warpedUV - 1.0) * 4.0 + t * 0.2);
        
        // Combine
        float v = v_base + v1 + v2 + v3;
        
        // Normalize (approx range -4 to 4 -> 0 to 1)
        v = v * 0.15 + 0.5;

        // Colors: Balanced Light/Dark Palette
        // Dark Group (Teal/Charcoal/Slate)
        vec3 c_charcoal = vec3(0.07, 0.09, 0.10); // Charcoal #12181A
        vec3 c_teal     = vec3(0.12, 0.31, 0.33); // Deep Teal #1F4F55
        vec3 c_slate    = vec3(0.50, 0.54, 0.56); // Slate #818a8f (Replaced Light Teal)
        
        // Warm Group (Orange/Brick/Lava)
        vec3 c_orange   = vec3(0.77, 0.35, 0.16); // Burnt Orange #C45A2A
        vec3 c_brick    = vec3(0.42, 0.09, 0.05); // Dark Brick #6c180d
        vec3 c_lava     = vec3(0.90, 0.12, 0.12); // Lava Red #e62020
        
        // Complex Mixing Logic for Multi-Tone Gradient
        // We sequence the colors based on wave height 'v'
        vec3 col = c_charcoal; // Start dark
        
        // Transition up through cool tones
        col = mix(col, c_teal,   smoothstep(0.2, 0.4, v));
        col = mix(col, c_slate,  smoothstep(0.4, 0.5, v));
        
        // Transition into warm tones
        col = mix(col, c_orange, smoothstep(0.5, 0.7, v));
        col = mix(col, c_brick,  smoothstep(0.7, 0.85, v)); 
        col = mix(col, c_lava,   smoothstep(0.85, 1.0, v)); // Highest peaks get lava glow
        
        // 3. Texture Finish
        // Blend grain for paper/glass feel
        float grainStrength = 0.04;
        col += (grain - 0.5) * grainStrength;
        
        // Subtle Vignette
        float vig = 1.0 - length(uv - 0.5) * 0.4;
        col *= smoothstep(0.0, 1.5, vig);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

const program = gl.createProgram();
gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSrc));
gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSrc));
gl.linkProgram(program);
gl.useProgram(program);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1, 1, -1, -1, 1,
  -1, 1, 1, -1, 1, 1
]), gl.STATIC_DRAW);

const pos = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(pos);
gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

const uTime = gl.getUniformLocation(program, 'u_time');
const uRes = gl.getUniformLocation(program, 'u_res');

resizeGL();

const start = performance.now();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let bgRunning = false;

function drawFrame() {
  const t = (performance.now() - start) * 0.001;
  gl.uniform1f(uTime, t);
  gl.uniform2f(uRes, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function render() {
  if (!bgRunning) return;
  drawFrame();
  requestAnimationFrame(render);
}

function startBg() {
  if (bgRunning || reducedMotion) return;
  bgRunning = true;
  requestAnimationFrame(render);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) bgRunning = false;
  else startBg();
});

if (reducedMotion) {
  drawFrame(); // single static frame
} else {
  startBg();
}

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
    if (window.marked && mdfySource.value !== getMarkdown()) {
      mdfyEditor.innerHTML = marked.parse(mdfySource.value);
      saveHistoryState();
    }
    
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
    mdfySource.value = getMarkdown();
    
    // Hide toolbar
    const toolbar = document.querySelector('.markdownify-toolbar');
    if (toolbar) toolbar.style.display = 'none';
  });

  // Live preview logic from Source to Editor
  mdfySource.addEventListener('input', () => {
    if (window.marked) {
      mdfyEditor.innerHTML = marked.parse(mdfySource.value);
    }
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
  mdfyBtnCopy.addEventListener('click', () => {
    const md = mdfySource.style.display === 'block' ? mdfySource.value : getMarkdown();
    navigator.clipboard.writeText(md).then(() => {
      const originalTitle = mdfyBtnCopy.getAttribute('title');
      mdfyBtnCopy.setAttribute('title', 'Copied!');
      setTimeout(() => mdfyBtnCopy.setAttribute('title', originalTitle), 2000);
    });
  });
}

if (mdfyBtnDownload) {
  mdfyBtnDownload.addEventListener('click', () => {
    const md = mdfySource.style.display === 'block' ? mdfySource.value : getMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article.md';
    a.click();
    URL.revokeObjectURL(url);
  });
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
  const items = Array.from(container.querySelectorAll(itemSelector));
  if (items.length <= 1) return;
  
  items.sort((a, b) => {
    let textA = titleSelector ? (a.querySelector(titleSelector)?.textContent || '') : a.textContent;
    let textB = titleSelector ? (b.querySelector(titleSelector)?.textContent || '') : b.textContent;
    
    return textA.trim().toLowerCase().localeCompare(textB.trim().toLowerCase());
  });
  
  // Re-append in sorted order
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
      if (addedElements.length > 0) {
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
  
  timeEl.textContent = `${strHours}:${minutes}`;
  ampmEl.textContent = ampm;

  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  dateEl.textContent = now.toLocaleDateString('en-US', options);
}

// Initialize clock
updateDesktopClock();
setInterval(updateDesktopClock, 1000);
