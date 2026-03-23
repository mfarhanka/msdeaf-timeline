/* ============================================================
   MSDeaf Historical Timeline — script.js
   ============================================================ */

(function () {
  'use strict';

  const API = {
    timeline: 'api/timeline.php',
    adminStatus: 'api/admin-status.php',
    adminLogin: 'api/admin-login.php',
    adminLogout: 'api/admin-logout.php',
    adminSave: 'api/admin-save.php',
    adminReset: 'api/admin-reset.php'
  };

  const footerYear = document.getElementById('footer-year');
  const siteTitle = document.querySelector('.site-title');
  const siteSubtitle = document.querySelector('.site-subtitle');
  const poweredByName = document.querySelector('.powered-by strong');
  const container = document.getElementById('timeline-container');
  const yearNav = document.getElementById('timeline-year-nav');
  const adminAuthGate = document.getElementById('admin-auth-gate');
  const adminAuthForm = document.getElementById('admin-auth-form');
  const adminAuthStatus = document.getElementById('admin-auth-status');
  const adminPasswordInput = document.getElementById('admin-password');
  const adminProtected = document.getElementById('admin-console-protected');
  const adminToggle = document.getElementById('admin-console-toggle');
  const adminLogoutButton = document.getElementById('admin-logout-button');
  const adminPanel = document.getElementById('admin-console-panel');
  const adminStatus = document.getElementById('admin-console-status');
  const adminForm = document.getElementById('admin-event-form');
  const adminFormTitle = document.getElementById('admin-form-title');
  const adminEventIdInput = document.getElementById('admin-event-id');
  const adminSaveButton = document.getElementById('admin-save-button');
  const adminCancelEditButton = document.getElementById('admin-cancel-edit-button');
  const adminNewEventButton = document.getElementById('admin-new-event-button');
  const adminExportButton = document.getElementById('admin-export-button');
  const adminResetButton = document.getElementById('admin-reset-button');
  const adminEventList = document.getElementById('admin-event-list');
  const adminEventCount = document.getElementById('admin-event-count');
  const desktopBreakpoint = window.matchMedia('(max-width: 700px)');

  const state = {
    meta: {
      title: siteTitle ? siteTitle.textContent : 'Malaysian Deaf Sports History',
      subtitle: siteSubtitle ? siteSubtitle.textContent : '',
      organization: poweredByName ? poweredByName.textContent : 'Malaysian Deaf Sports Association (MSDeaf)'
    },
    events: [],
    editingEventId: null,
    isAdminAuthenticated: false,
    authUsername: null
  };

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  function slugify(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'event';
  }

  function getTimelineItemId(event) {
    return 'timeline-event-' + slugify(event.year) + '-' + slugify(event.id);
  }

  function normalizeEvent(event, index) {
    return {
      id: event && event.id !== undefined && event.id !== null ? String(event.id) : 'event-' + Date.now() + '-' + index,
      year: String(event && event.year ? event.year : ''),
      date: String(event && event.date ? event.date : event && event.year ? event.year : ''),
      title: String(event && event.title ? event.title : ''),
      description: String(event && event.description ? event.description : ''),
      image: String(event && event.image ? event.image : ''),
      imageAlt: String(event && event.imageAlt ? event.imageAlt : event && event.title ? event.title : '')
    };
  }

  function cloneEvents(events) {
    return (events || []).map(function (event, index) {
      return normalizeEvent(event, index);
    });
  }

  async function apiFetch(url, options) {
    const response = await fetch(url, Object.assign({
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json'
      }
    }, options || {}));

    let data = null;

    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      const message = data && data.message ? data.message : 'Request failed.';
      const requestError = new Error(message);
      requestError.status = response.status;
      throw requestError;
    }

    return data;
  }

  function setAdminAuthStatus(message, tone) {
    if (!adminAuthStatus) {
      return;
    }

    adminAuthStatus.textContent = message;
    adminAuthStatus.dataset.tone = tone || 'neutral';
  }

  function setAdminStatus(message, tone) {
    if (!adminStatus) {
      return;
    }

    adminStatus.textContent = message;
    adminStatus.dataset.tone = tone || 'neutral';
  }

  function setAdminConsoleOpen(isOpen) {
    if (!adminToggle || !adminPanel) {
      return;
    }

    if (!state.isAdminAuthenticated) {
      adminPanel.hidden = true;
      adminToggle.setAttribute('aria-expanded', 'false');
      adminToggle.textContent = 'Open Admin Console';
      return;
    }

    adminPanel.hidden = !isOpen;
    adminToggle.setAttribute('aria-expanded', String(isOpen));
    adminToggle.textContent = isOpen ? 'Close Admin Console' : 'Open Admin Console';
  }

  function applyAdminAccessState() {
    if (adminAuthGate) {
      adminAuthGate.hidden = state.isAdminAuthenticated;
    }

    if (adminProtected) {
      adminProtected.hidden = !state.isAdminAuthenticated;
    }

    if (!state.isAdminAuthenticated) {
      setAdminConsoleOpen(false);
      resetAdminForm();
      if (adminPasswordInput) {
        adminPasswordInput.value = '';
      }
    }
  }

  function resetAdminForm() {
    if (!adminForm) {
      return;
    }

    adminForm.reset();
    adminEventIdInput.value = '';
    state.editingEventId = null;
    adminFormTitle.textContent = 'Create Event';
    adminSaveButton.textContent = 'Add Event';
    adminCancelEditButton.hidden = true;
  }

  function populateAdminForm(event) {
    if (!adminForm || !event) {
      return;
    }

    adminEventIdInput.value = event.id;
    adminForm.elements.year.value = event.year;
    adminForm.elements.date.value = event.date;
    adminForm.elements.title.value = event.title;
    adminForm.elements.description.value = event.description;
    adminForm.elements.image.value = event.image;
    adminForm.elements.imageAlt.value = event.imageAlt;

    state.editingEventId = event.id;
    adminFormTitle.textContent = 'Edit Event';
    adminSaveButton.textContent = 'Update Event';
    adminCancelEditButton.hidden = false;
    setAdminConsoleOpen(true);
  }

  function applyTimelinePayload(payload) {
    state.meta = {
      title: payload && payload.title ? payload.title : 'Malaysian Deaf Sports History',
      subtitle: payload && payload.subtitle ? payload.subtitle : '',
      organization: payload && payload.organization ? payload.organization : 'Malaysian Deaf Sports Association (MSDeaf)'
    };
    state.events = cloneEvents(payload && payload.events ? payload.events : []);

    if (siteTitle) {
      siteTitle.textContent = state.meta.title;
    }

    if (siteSubtitle) {
      siteSubtitle.textContent = state.meta.subtitle;
    }

    if (poweredByName) {
      poweredByName.textContent = state.meta.organization;
    }

    document.title = state.meta.title + ' | MSDeaf Timeline';
  }

  function createPlaceholder(year) {
    const placeholder = document.createElement('div');
    placeholder.classList.add('card-photo-placeholder');

    const yearEl = document.createElement('div');
    yearEl.classList.add('placeholder-year');
    yearEl.textContent = year;

    const labelEl = document.createElement('div');
    labelEl.classList.add('placeholder-label');
    labelEl.textContent = 'MSDeaf';

    placeholder.appendChild(yearEl);
    placeholder.appendChild(labelEl);
    return placeholder;
  }

  function buildTimelineItem(event, side) {
    const item = document.createElement('div');
    item.classList.add('timeline-item', side);
    item.id = getTimelineItemId(event);

    const card = document.createElement('div');
    card.classList.add('timeline-card');

    if (event.image) {
      const img = document.createElement('img');
      img.classList.add('card-photo');
      img.alt = event.imageAlt || event.title;
      img.loading = 'lazy';
      img.addEventListener('load', function () {
        requestAnimationFrame(layoutTimeline);
      });
      img.onerror = function () {
        this.replaceWith(createPlaceholder(event.year));
        requestAnimationFrame(layoutTimeline);
      };
      img.src = event.image;
      card.appendChild(img);
    } else {
      card.appendChild(createPlaceholder(event.year));
    }

    const body = document.createElement('div');
    body.classList.add('card-body');

    const dateTag = document.createElement('span');
    dateTag.classList.add('card-date');
    dateTag.textContent = event.date || event.year;

    const title = document.createElement('h2');
    title.classList.add('card-title');
    title.textContent = event.title;

    const desc = document.createElement('p');
    desc.classList.add('card-description');
    desc.textContent = event.description;

    body.appendChild(dateTag);
    body.appendChild(title);
    body.appendChild(desc);
    card.appendChild(body);
    item.appendChild(card);
    return item;
  }

  function buildYearNavigation(events) {
    if (!yearNav) {
      return;
    }

    yearNav.innerHTML = '';
    yearNav.hidden = events.length === 0;

    events.forEach(function (event) {
      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add('year-jump-button');
      button.textContent = event.year;
      button.title = event.title;
      button.setAttribute('aria-label', 'Jump to ' + event.year + ': ' + event.title);
      button.addEventListener('click', function () {
        const target = document.getElementById(getTimelineItemId(event));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      yearNav.appendChild(button);
    });
  }

  function renderAdminEventList() {
    if (!adminEventList || !adminEventCount) {
      return;
    }

    adminEventCount.textContent = state.events.length + ' event' + (state.events.length === 1 ? '' : 's');
    adminEventList.innerHTML = '';

    if (state.events.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.classList.add('admin-empty-state');
      emptyState.textContent = 'No events yet. Use the form to create the first timeline item.';
      adminEventList.appendChild(emptyState);
      return;
    }

    state.events.forEach(function (event, index) {
      const card = document.createElement('article');
      card.classList.add('admin-event-card');

      const order = document.createElement('p');
      order.classList.add('admin-event-order');
      order.textContent = 'Item ' + (index + 1);

      const meta = document.createElement('p');
      meta.classList.add('admin-event-meta');
      meta.textContent = event.year + (event.date && event.date !== event.year ? ' • ' + event.date : '');

      const title = document.createElement('h4');
      title.classList.add('admin-event-name');
      title.textContent = event.title;

      const description = document.createElement('p');
      description.classList.add('admin-event-description');
      description.textContent = event.description.length > 150 ? event.description.slice(0, 147) + '...' : event.description;

      const actions = document.createElement('div');
      actions.classList.add('admin-event-actions');

      [
        { action: 'edit', label: 'Edit', classes: '' },
        { action: 'move-up', label: 'Move Up', classes: 'secondary', disabled: index === 0 },
        { action: 'move-down', label: 'Move Down', classes: 'secondary', disabled: index === state.events.length - 1 },
        { action: 'delete', label: 'Delete', classes: 'danger' }
      ].forEach(function (actionConfig) {
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('admin-list-button');
        if (actionConfig.classes) {
          button.classList.add(actionConfig.classes);
        }
        button.dataset.action = actionConfig.action;
        button.dataset.eventId = event.id;
        button.textContent = actionConfig.label;
        button.disabled = Boolean(actionConfig.disabled);
        actions.appendChild(button);
      });

      card.appendChild(order);
      card.appendChild(meta);
      card.appendChild(title);
      card.appendChild(description);
      card.appendChild(actions);
      adminEventList.appendChild(card);
    });
  }

  function layoutTimeline() {
    const items = Array.from(container.querySelectorAll('.timeline-item'));

    container.style.height = '';
    items.forEach(function (item) {
      item.style.top = '';
    });

    if (desktopBreakpoint.matches || items.length === 0) {
      return;
    }

    let leftOffset = 0;
    let rightOffset = 96;
    const itemGap = 64;
    const crossColumnGap = 120;
    let lastLeftTop = null;
    let lastRightTop = null;

    items.forEach(function (item) {
      const isRight = item.classList.contains('right');
      let nextTop = isRight ? rightOffset : leftOffset;

      if (isRight && lastLeftTop !== null) {
        nextTop = Math.max(nextTop, lastLeftTop + crossColumnGap);
      }

      if (!isRight && lastRightTop !== null) {
        nextTop = Math.max(nextTop, lastRightTop + crossColumnGap);
      }

      item.style.top = nextTop + 'px';

      if (isRight) {
        lastRightTop = nextTop;
        rightOffset = nextTop + item.offsetHeight + itemGap;
      } else {
        lastLeftTop = nextTop;
        leftOffset = nextTop + item.offsetHeight + itemGap;
      }
    });

    container.style.height = Math.max(leftOffset, rightOffset) - itemGap + 'px';
  }

  function setupScrollReveal() {
    const items = container.querySelectorAll('.timeline-item');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      items.forEach(function (item) {
        observer.observe(item);
      });
    } else {
      items.forEach(function (item) {
        item.classList.add('visible');
      });
    }
  }

  function renderTimeline() {
    container.innerHTML = '';

    if (state.events.length === 0) {
      container.style.height = '';
      container.innerHTML = '<p class="timeline-error">No events found in the database. Run setup_database.php or add one from the admin console.</p>';
      return;
    }

    state.events.forEach(function (event, index) {
      const side = index % 2 === 0 ? 'left' : 'right';
      container.appendChild(buildTimelineItem(event, side));
    });

    setupScrollReveal();
    requestAnimationFrame(layoutTimeline);
  }

  function renderApplication() {
    buildYearNavigation(state.events);
    renderTimeline();
    renderAdminEventList();
  }

  async function loadAdminStatus() {
    try {
      const response = await apiFetch(API.adminStatus);
      state.isAdminAuthenticated = Boolean(response.authenticated);
      state.authUsername = response.username || null;
      applyAdminAccessState();

      if (state.isAdminAuthenticated) {
        setAdminAuthStatus('Admin console unlocked for ' + state.authUsername + '.', 'success');
      } else {
        setAdminAuthStatus('Admin tools are locked.', 'neutral');
      }
    } catch (error) {
      state.isAdminAuthenticated = false;
      state.authUsername = null;
      applyAdminAccessState();
      setAdminAuthStatus('Admin status could not be loaded.', 'error');
    }
  }

  async function loadTimeline() {
    container.innerHTML = '<p class="timeline-loading">Loading timeline…</p>';

    try {
      const payload = await apiFetch(API.timeline);
      applyTimelinePayload(payload);
      renderApplication();
      resetAdminForm();
      setAdminStatus('Connected to MySQL timeline data.', 'success');
    } catch (error) {
      container.style.height = '';
      container.innerHTML = '<p class="timeline-error">Failed to load timeline from MySQL. Run setup_database.php and check your MySQL connection.</p>';
      setAdminStatus(error.message || 'Timeline data could not be loaded.', 'error');
    }
  }

  function generateEventId() {
    return 'event-' + Date.now();
  }

  function exportTimelineData() {
    const payload = {
      title: state.meta.title,
      subtitle: state.meta.subtitle,
      organization: state.meta.organization,
      events: state.events
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = 'msdeaf-timeline-data.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);

    setAdminStatus('Exported the current timeline as JSON.', 'success');
  }

  async function saveTimelineToServer(message) {
    const response = await apiFetch(API.adminSave, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        title: state.meta.title,
        subtitle: state.meta.subtitle,
        organization: state.meta.organization,
        events: state.events
      })
    });

    applyTimelinePayload(response.timeline);
    renderApplication();
    setAdminStatus(message || response.message || 'Timeline saved.', 'success');
  }

  function initializeAdminEvents() {
    applyAdminAccessState();

    if (adminAuthForm) {
      adminAuthForm.addEventListener('submit', async function (submitEvent) {
        submitEvent.preventDefault();

        try {
          const response = await apiFetch(API.adminLogin, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              password: adminPasswordInput ? adminPasswordInput.value : ''
            })
          });

          state.isAdminAuthenticated = Boolean(response.authenticated);
          state.authUsername = response.username || 'admin';
          applyAdminAccessState();
          setAdminAuthStatus('Admin console unlocked for ' + state.authUsername + '.', 'success');
          setAdminStatus('Server session started. Admin changes now save to MySQL.', 'success');
        } catch (error) {
          state.isAdminAuthenticated = false;
          state.authUsername = null;
          applyAdminAccessState();
          setAdminAuthStatus(error.message || 'Admin login failed.', 'error');
        }
      });
    }

    if (adminToggle) {
      adminToggle.addEventListener('click', function () {
        setAdminConsoleOpen(adminPanel.hidden);
      });
    }

    if (adminLogoutButton) {
      adminLogoutButton.addEventListener('click', async function () {
        try {
          await apiFetch(API.adminLogout, {
            method: 'POST'
          });
        } catch (error) {
          // Lock UI even if logout request fails on the server.
        }

        state.isAdminAuthenticated = false;
        state.authUsername = null;
        applyAdminAccessState();
        setAdminAuthStatus('Admin tools are locked.', 'neutral');
      });
    }

    if (adminNewEventButton) {
      adminNewEventButton.addEventListener('click', function () {
        resetAdminForm();
        setAdminConsoleOpen(true);
        setAdminStatus('Ready to create a new event.', 'neutral');
      });
    }

    if (adminCancelEditButton) {
      adminCancelEditButton.addEventListener('click', function () {
        resetAdminForm();
        setAdminStatus('Edit cancelled.', 'neutral');
      });
    }

    if (adminExportButton) {
      adminExportButton.addEventListener('click', exportTimelineData);
    }

    if (adminResetButton) {
      adminResetButton.addEventListener('click', async function () {
        if (!window.confirm('Reset the timeline to the seeded data.json version in MySQL?')) {
          return;
        }

        try {
          const response = await apiFetch(API.adminReset, {
            method: 'POST'
          });

          applyTimelinePayload(response.timeline);
          renderApplication();
          resetAdminForm();
          setAdminStatus(response.message || 'Timeline reset successfully.', 'warning');
        } catch (error) {
          setAdminStatus(error.message || 'Reset failed.', 'error');
        }
      });
    }

    if (adminForm) {
      adminForm.addEventListener('submit', async function (submitEvent) {
        submitEvent.preventDefault();

        const formData = new FormData(adminForm);
        const eventData = normalizeEvent({
          id: adminEventIdInput.value || generateEventId(),
          year: formData.get('year'),
          date: formData.get('date') || formData.get('year'),
          title: formData.get('title'),
          description: formData.get('description'),
          image: formData.get('image'),
          imageAlt: formData.get('imageAlt') || formData.get('title')
        }, state.events.length + 1);

        if (!eventData.year || !eventData.title || !eventData.description) {
          setAdminStatus('Year, title, and description are required.', 'error');
          return;
        }

        const isEditing = Boolean(state.editingEventId);

        if (isEditing) {
          const existingIndex = state.events.findIndex(function (event) {
            return event.id === state.editingEventId;
          });

          if (existingIndex !== -1) {
            state.events.splice(existingIndex, 1, eventData);
          }
        } else {
          state.events.push(eventData);
        }

        try {
          await saveTimelineToServer(isEditing ? 'Event updated successfully in MySQL.' : 'Event added successfully to MySQL.');
          resetAdminForm();
        } catch (error) {
          setAdminStatus(error.message || 'Save failed.', 'error');
          await loadTimeline();
        }
      });
    }

    if (adminEventList) {
      adminEventList.addEventListener('click', async function (clickEvent) {
        const button = clickEvent.target.closest('button[data-action]');
        if (!button) {
          return;
        }

        const eventId = button.dataset.eventId;
        const eventIndex = state.events.findIndex(function (event) {
          return event.id === eventId;
        });

        if (eventIndex === -1) {
          return;
        }

        if (button.dataset.action === 'edit') {
          populateAdminForm(state.events[eventIndex]);
          setAdminStatus('Editing event "' + state.events[eventIndex].title + '".', 'neutral');
          return;
        }

        if (button.dataset.action === 'delete') {
          if (!window.confirm('Delete "' + state.events[eventIndex].title + '" from the timeline?')) {
            return;
          }

          if (state.editingEventId === eventId) {
            resetAdminForm();
          }

          state.events.splice(eventIndex, 1);

          try {
            await saveTimelineToServer('Event deleted successfully from MySQL.');
          } catch (error) {
            setAdminStatus(error.message || 'Delete failed.', 'error');
            await loadTimeline();
          }
          return;
        }

        if (button.dataset.action === 'move-up' && eventIndex > 0) {
          const movedEvent = state.events.splice(eventIndex, 1)[0];
          state.events.splice(eventIndex - 1, 0, movedEvent);

          try {
            await saveTimelineToServer('Event order updated in MySQL.');
          } catch (error) {
            setAdminStatus(error.message || 'Reorder failed.', 'error');
            await loadTimeline();
          }
          return;
        }

        if (button.dataset.action === 'move-down' && eventIndex < state.events.length - 1) {
          const movedEvent = state.events.splice(eventIndex, 1)[0];
          state.events.splice(eventIndex + 1, 0, movedEvent);

          try {
            await saveTimelineToServer('Event order updated in MySQL.');
          } catch (error) {
            setAdminStatus(error.message || 'Reorder failed.', 'error');
            await loadTimeline();
          }
        }
      });
    }
  }

  window.addEventListener('resize', layoutTimeline);
  window.addEventListener('load', layoutTimeline);

  initializeAdminEvents();
  Promise.all([loadAdminStatus(), loadTimeline()]);
})();
