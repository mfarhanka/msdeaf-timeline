/* ============================================================
   MSDeaf Historical Timeline — script.js
   ============================================================ */

(function () {
  'use strict';

  // Set footer year
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  const container = document.getElementById('timeline-container');
  const yearNav = document.getElementById('timeline-year-nav');
  const desktopBreakpoint = window.matchMedia('(max-width: 700px)');

  /**
   * Build a single timeline item card.
   * @param {Object} event - One event object from data.json
   * @param {string} side  - left or right
   * @returns {HTMLElement}
   */
  function buildTimelineItem(event, side) {
    const item = document.createElement('div');
    item.classList.add('timeline-item');
    item.classList.add(side);
    item.id = 'timeline-year-' + String(event.year).replace(/[^a-z0-9]+/gi, '-').toLowerCase();

    // Card
    const card = document.createElement('div');
    card.classList.add('timeline-card');

    // Photo / placeholder
    if (event.image) {
      const img = document.createElement('img');
      img.classList.add('card-photo');
      img.alt = event.imageAlt || event.title;
      img.loading = 'lazy';

      // Use onerror to fall back to the placeholder if the image is missing
      img.onerror = function () {
        console.warn('MSDeaf Timeline: image not found — ' + event.image);
        this.replaceWith(createPlaceholder(event.year));
      };
      img.src = event.image;
      card.appendChild(img);
    } else {
      card.appendChild(createPlaceholder(event.year));
    }

    // Body
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

  /**
   * Build year jump buttons from timeline events.
   * @param {Array<Object>} events
   */
  function buildYearNavigation(events) {
    if (!yearNav) {
      return;
    }

    yearNav.innerHTML = '';

    events.forEach(function (event) {
      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add('year-jump-button');
      button.textContent = event.year;
      button.setAttribute('aria-label', 'Jump to ' + event.year);

      button.addEventListener('click', function () {
        const target = document.getElementById(
          'timeline-year-' + String(event.year).replace(/[^a-z0-9]+/gi, '-').toLowerCase()
        );

        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      yearNav.appendChild(button);
    });
  }

  /**
   * Create a styled placeholder element for when no image is available.
   * @param {string} year
   * @returns {HTMLElement}
   */
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

  /**
   * Position timeline items independently on each side for desktop layouts.
   */
  function layoutTimeline() {
    const items = Array.from(container.querySelectorAll('.timeline-item'));

    container.style.height = '';

    items.forEach(function (item) {
      item.style.top = '';
    });

    if (desktopBreakpoint.matches) {
      return;
    }

    let leftOffset = 0;
    let rightOffset = 6 * 16;
    const itemGap = 64;
    const crossColumnGap = 120;
    let lastLeftTop = null;
    let lastRightTop = null;

    items.forEach(function (item) {
      const isRight = item.classList.contains('right');
      let nextTop = isRight ? rightOffset : leftOffset;

      if (isRight && lastLeftTop !== null && nextTop < lastLeftTop + crossColumnGap) {
        nextTop = lastLeftTop + crossColumnGap;
      }

      if (!isRight && lastRightTop !== null && nextTop < lastRightTop + crossColumnGap) {
        nextTop = lastRightTop + crossColumnGap;
      }

      item.style.top = nextTop + 'px';

      if (isRight) {
        lastRightTop = nextTop;
        rightOffset += item.offsetHeight + itemGap;
      } else {
        lastLeftTop = nextTop;
        leftOffset += item.offsetHeight + itemGap;
      }

      if (isRight) {
        rightOffset = Math.max(rightOffset, nextTop + item.offsetHeight + itemGap);
      } else {
        leftOffset = Math.max(leftOffset, nextTop + item.offsetHeight + itemGap);
      }
    });

    container.style.height = Math.max(leftOffset, rightOffset) - itemGap + 'px';
  }

  /**
   * Use IntersectionObserver to reveal timeline items as they enter the viewport.
   */
  function setupScrollReveal() {
    const items = container.querySelectorAll('.timeline-item');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target); // animate once
            }
          });
        },
        { threshold: 0.15 }
      );

      items.forEach(function (item) {
        observer.observe(item);
      });
    } else {
      // Fallback: show all items immediately for browsers without IntersectionObserver
      items.forEach(function (item) {
        item.classList.add('visible');
      });
    }
  }

  /**
   * Fetch timeline data from data.json and render the timeline.
   */
  function loadTimeline() {
    // Show loading state
    container.innerHTML = '<p class="timeline-loading">Loading timeline…</p>';

    fetch('data.json')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        // Clear loading state
        container.innerHTML = '';

        if (!data.events || data.events.length === 0) {
          container.innerHTML = '<p class="timeline-error">No events found.</p>';
          return;
        }

        buildYearNavigation(data.events);

        // Alternate sides, but allow CSS to offset right-side cards slightly upward.
        data.events.forEach(function (event, index) {
          const side = index % 2 === 0 ? 'left' : 'right';
          container.appendChild(buildTimelineItem(event, side));
        });

        // Activate scroll-reveal after items are in the DOM
        setupScrollReveal();
        requestAnimationFrame(layoutTimeline);
      })
      .catch(function (err) {
        container.innerHTML =
          '<p class="timeline-error">Failed to load timeline data. Please try again later.</p>';
        console.error('Timeline load error:', err);
      });
  }

  window.addEventListener('resize', layoutTimeline);
  window.addEventListener('load', layoutTimeline);

  // Kick off
  loadTimeline();
})();
