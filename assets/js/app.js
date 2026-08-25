/**
 * RETRO OS DESKTOP ENVIRONMENT CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. UNLOCK / INITIALIZE AUDIO ON USER GESTURE (BROWSER AUTOPLAY COMPLIANCE)
  const unlockAudio = () => {
    if (window.retroAudio) {
      window.retroAudio.init();
    }
  };
  ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, unlockAudio, { passive: true });
  });

  // 2. SFX TOGGLE BUTTON HANDLER & UI SYNC
  const sfxToggleBtn = document.getElementById('sfx-toggle-btn');
  if (sfxToggleBtn) {
    const updateSfxButtonUI = () => {
      const isEnabled = window.retroAudio && window.retroAudio.enabled;
      sfxToggleBtn.textContent = isEnabled ? '🔊 SFX: ON' : '🔈 SFX: OFF';
      sfxToggleBtn.style.opacity = isEnabled ? '1' : '0.65';
    };
    updateSfxButtonUI();
    sfxToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.retroAudio) {
        window.retroAudio.toggle();
        updateSfxButtonUI();
      }
    });
  }

  // 3. GLOBAL INTERACTIVE SOUND DISPATCHER
  document.addEventListener('click', (e) => {
    const interactiveTarget = e.target.closest('button, a, .desktop-icon-item, .retro-window, .subbox-tab, .sidequest-card, .retro-contact-card');
    if (interactiveTarget && interactiveTarget.id !== 'sfx-toggle-btn') {
      if (window.retroAudio) window.retroAudio.playClick();
    }
  });

  // 2. WINDOW CONTROLLER FOR THE 5 SECTIONS
  const allWindows = document.querySelectorAll('.retro-window');
  const topTabs = document.querySelectorAll('.top-nav-tabs li a');
  const desktopIcons = document.querySelectorAll('.desktop-icon-item');

  let currentActiveWindow = 'about';

  window.openWindow = function(winId) {
    if (!winId) return;
    const cleanId = winId.replace(/^#/, '');
    const targetWin = document.getElementById(cleanId);
    if (!targetWin) return;

    currentActiveWindow = cleanId;

    // Hide other windows
    allWindows.forEach(w => {
      w.classList.remove('active-window');
      w.style.display = 'none';
    });

    // Show selected window
    targetWin.style.display = 'flex';
    targetWin.classList.add('active-window');

    // Uncollapse if collapsed
    const winBody = targetWin.querySelector('.window-body');
    if (winBody && winBody.classList.contains('window-collapsed')) {
      winBody.classList.remove('window-collapsed');
      const minBtn = targetWin.querySelector('.win-ctrl-min');
      if (minBtn) minBtn.textContent = '−';
    }

    // Update Top Nav Tab state
    topTabs.forEach(tab => {
      const href = tab.getAttribute('href') || '';
      if (href === `#${cleanId}` || href === cleanId) {
        tab.classList.add('active-tab');
      } else {
        tab.classList.remove('active-tab');
      }
    });

    if (window.retroAudio) window.retroAudio.playWindowOpen();
  };

  window.closeWindow = function(winId) {
    const cleanId = winId.replace(/^#/, '');
    const targetWin = document.getElementById(cleanId);
    if (targetWin) {
      targetWin.style.display = 'none';
      targetWin.classList.remove('active-window');
      topTabs.forEach(t => t.classList.remove('active-tab'));
      if (window.retroAudio) window.retroAudio.playWindowClose();
    }
  };

  // Open default window (About Me)
  window.openWindow('about');

  // Desktop Icons Click Handlers
  desktopIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      const winTarget = icon.getAttribute('data-window');
      if (winTarget) window.openWindow(winTarget);
    });
  });

  // Top Nav Tabs Click Handlers
  topTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const href = tab.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        window.openWindow(href.substring(1));
      }
    });
  });

  // Window Controls (Min, Max, Close)
  allWindows.forEach(win => {
    const closeBtn = win.querySelector('.win-ctrl-close');
    const minBtn = win.querySelector('.win-ctrl-min');
    const maxBtn = win.querySelector('.win-ctrl-expand');
    const winBody = win.querySelector('.window-body');

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.closeWindow(win.id);
      });
    }

    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (winBody) {
          const isCollapsed = winBody.classList.toggle('window-collapsed');
          minBtn.textContent = isCollapsed ? '+' : '−';
          if (window.retroAudio) window.retroAudio.playBlip(440, 'triangle', 0.05);
        }
      });
    }

    if (maxBtn) {
      maxBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.toggle('window-maximized');
        maxBtn.textContent = win.classList.contains('window-maximized') ? '❐' : '□';
        if (window.retroAudio) window.retroAudio.playBlip(520, 'sine', 0.05);
      });
    }
  });





  // 5. RETRO CLOCK
  const clockEl = document.getElementById('retro-live-clock');
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    clockEl.textContent = `${days[now.getDay()]} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 6. ANIMATED PHYSICAL CAT SPRITE CHOREOGRAPHY (8-FRAME SMOOTH FULL CYCLE)
  const catEl = document.getElementById('sleeping-cat');
  const catSprite = document.getElementById('companion-cat-sprite');
  const nudgeCatBtn = document.getElementById('nudge-cat-btn');

  if (catEl && catSprite) {
    let isCatNudgeActive = false;

    // Preload all 8 sprite frames for instantaneous zero-lag switching
    const frames = {
      sleep: 'assets/images/cat_sleep.png',
      yawn: 'assets/images/cat_yawn.png',
      sit: 'assets/images/cat_sit.png',
      stand: 'assets/images/cat_stand.png',
      walk1: 'assets/images/cat_walk.png',
      walk2: 'assets/images/cat_walk2.png',
      stretchDown: 'assets/images/cat_stretch.png',
      stretchArch: 'assets/images/cat_arch.png'
    };

    Object.values(frames).forEach(src => {
      const img = new Image();
      img.src = src;
    });

    function triggerCatNudge() {
      if (isCatNudgeActive) return;
      isCatNudgeActive = true;

      // Disappear the boop button smoothly when pressed
      if (nudgeCatBtn) {
        nudgeCatBtn.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        nudgeCatBtn.style.opacity = '0';
        nudgeCatBtn.style.transform = 'scale(0.8) translateY(8px)';
        nudgeCatBtn.style.pointerEvents = 'none';
        setTimeout(() => {
          nudgeCatBtn.style.display = 'none';
        }, 350);
      }

      catEl.classList.add('cat-waking');

      // Stage 1: Wake up & Cute Yawn (0ms)
      catSprite.src = frames.yawn;
      catSprite.style.transform = 'scaleX(1) translateY(-2px)';
      catEl.style.transform = 'translateX(0px)';
      if (window.retroAudio) {
        window.retroAudio.playBlip(780, 'triangle', 0.1, 0.12);
      }

      // Stage 2: Sit upright (800ms)
      setTimeout(() => {
        catSprite.src = frames.sit;
        catSprite.style.transform = 'scaleX(1) translateY(0px)';
      }, 800);

      // Stage 3: Stand on four paws (1500ms)
      setTimeout(() => {
        catSprite.src = frames.stand;
        catSprite.style.transform = 'scaleX(1) translateY(-3px)';
      }, 1500);

      // Stage 4: Walk Step 1 (2100ms)
      setTimeout(() => {
        catSprite.src = frames.walk1;
        catSprite.style.transform = 'scaleX(1) translateY(0px)';
        catEl.style.transform = 'translateX(25px)';
      }, 2100);

      // Stage 5: Walk Step 2 (2700ms)
      setTimeout(() => {
        catSprite.src = frames.walk2;
        catSprite.style.transform = 'scaleX(1) translateY(-2px)';
        catEl.style.transform = 'translateX(50px)';
      }, 2700);

      // Stage 6: Walk Step 3 (3300ms)
      setTimeout(() => {
        catSprite.src = frames.walk1;
        catSprite.style.transform = 'scaleX(1) translateY(0px)';
        catEl.style.transform = 'translateX(75px)';
      }, 3300);

      // Stage 7: Downward Yoga Stretch (3900ms)
      setTimeout(() => {
        catSprite.src = frames.stretchDown;
        catSprite.style.transform = 'scaleX(1) translateY(3px)';
        catEl.style.transform = 'translateX(75px)';
        if (window.retroAudio) {
          window.retroAudio.playBlip(520, 'sine', 0.14, 0.08);
        }
      }, 3900);

      // Stage 8: High Upward Arch Stretch (5200ms)
      setTimeout(() => {
        catSprite.src = frames.stretchArch;
        catSprite.style.transform = 'scaleX(1) translateY(-6px)';
        catEl.style.transform = 'translateX(75px)';
      }, 5200);

      // Stage 9: Stand Back Up (6400ms)
      setTimeout(() => {
        catSprite.src = frames.stand;
        catSprite.style.transform = 'scaleX(1) translateY(-2px)';
        catEl.style.transform = 'translateX(75px)';
      }, 6400);

      // Stage 10: Turn & Walk Step 1 Back (7000ms)
      setTimeout(() => {
        catSprite.src = frames.walk1;
        catSprite.style.transform = 'scaleX(-1) translateY(0px)';
        catEl.style.transform = 'translateX(40px)';
      }, 7000);

      // Stage 11: Walk Step 2 Back to Origin (7600ms)
      setTimeout(() => {
        catSprite.src = frames.walk2;
        catSprite.style.transform = 'scaleX(-1) translateY(-2px)';
        catEl.style.transform = 'translateX(0px)';
      }, 7600);

      // Stage 12: Curl directly into sleep (8200ms)
      setTimeout(() => {
        catSprite.src = frames.sleep;
        catSprite.style.transform = 'scaleX(1) translateY(0px)';
        catEl.style.transform = 'translateX(0px)';
        catEl.classList.remove('cat-waking');
        isCatNudgeActive = false;
      }, 8200);
    }

    catEl.addEventListener('click', triggerCatNudge);
    if (nudgeCatBtn) {
      nudgeCatBtn.addEventListener('click', triggerCatNudge);
    }
  }

  // 7. SMOOTH DISAPPEARING CAT PAW MARKS TRAIL BETWEEN BUTTONS & INTERACTIVE ELEMENTS
  let lastPawX = 0;
  let lastPawY = 0;
  let isLeftPaw = true;
  let isHoveringInteractive = false;
  let lastInteractiveMoveTime = 0;

  const interactiveSelector = 'button, a, .desktop-icon-item, .retro-btn, .top-brand-badge, .retro-contact-card, .sidequest-card, .win-btn, .subbox-tab, .about-stat-pill, .skill-retro-badge, .project-item-card, .top-nav-tabs li a';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSelector)) {
      isHoveringInteractive = true;
      lastInteractiveMoveTime = Date.now();
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest(interactiveSelector)) {
      isHoveringInteractive = false;
    }
  });

  document.addEventListener('mousemove', (e) => {
    // Ignore synthetic mousemove events on touchscreens
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

    const now = Date.now();
    const inTransition = (now - lastInteractiveMoveTime < 1600);

    if (!isHoveringInteractive && !inTransition) return;

    if (isHoveringInteractive) {
      lastInteractiveMoveTime = now;
    }

    const dist = Math.hypot(e.clientX - lastPawX, e.clientY - lastPawY);
    if (dist < 28) return; // spacing between cat paw steps

    const angle = Math.atan2(e.clientY - lastPawY, e.clientX - lastPawX) * (180 / Math.PI) + 90;
    lastPawX = e.clientX;
    lastPawY = e.clientY;

    createPawMark(e.clientX, e.clientY, angle, isLeftPaw);
    isLeftPaw = !isLeftPaw;
  });

  function createPawMark(x, y, angle, leftPaw) {
    const paw = document.createElement('div');
    paw.className = 'retro-paw-mark';

    const sideOffset = leftPaw ? -8 : 8;
    const rad = (angle - 90) * (Math.PI / 180);
    const offsetX = Math.cos(rad + Math.PI / 2) * sideOffset;
    const offsetY = Math.sin(rad + Math.PI / 2) * sideOffset;

    paw.style.left = `${x + offsetX - 14}px`;
    paw.style.top = `${y + offsetY - 14}px`;
    paw.style.transform = `rotate(${angle + (leftPaw ? -12 : 12)}deg) scale(1)`;

    paw.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Main Central Cat Palm Pad -->
        <path d="M16 15 C12.5 15 9.8 17.6 9.8 21 C9.8 24.2 12.2 26.8 14.3 26.8 C15.4 26.8 15.6 25.8 16 25.8 C16.4 25.8 16.6 26.8 17.7 26.8 C19.8 26.8 22.2 24.2 22.2 21 C22.2 17.6 19.5 15 16 15 Z" fill="#ff6b9d" stroke="#2b111e" stroke-width="1.8"/>
        <!-- 4 Cute Cat Toe Beans -->
        <ellipse cx="7.6" cy="14.2" rx="2.5" ry="3.6" transform="rotate(-32 7.6 14.2)" fill="#ff6b9d" stroke="#2b111e" stroke-width="1.8"/>
        <ellipse cx="12.4" cy="9.2" rx="2.5" ry="3.8" transform="rotate(-12 12.4 9.2)" fill="#ff6b9d" stroke="#2b111e" stroke-width="1.8"/>
        <ellipse cx="19.6" cy="9.2" rx="2.5" ry="3.8" transform="rotate(12 19.6 9.2)" fill="#ff6b9d" stroke="#2b111e" stroke-width="1.8"/>
        <ellipse cx="24.4" cy="14.2" rx="2.5" ry="3.6" transform="rotate(32 24.4 14.2)" fill="#ff6b9d" stroke="#2b111e" stroke-width="1.8"/>
      </svg>
    `;

    document.body.appendChild(paw);

    // Trigger smooth fadeout
    requestAnimationFrame(() => {
      setTimeout(() => {
        paw.classList.add('fading');
      }, 70);
    });

    // Remove from DOM after fade completes
    setTimeout(() => {
      paw.remove();
    }, 1900);
  }
});
