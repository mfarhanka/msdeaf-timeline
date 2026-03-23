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

  /**
   * Build and insert a single timeline item card into the container.
   * @param {Object} event  - One event object from data.json
   * @param {number} index  - Index in the events array (0-based)
   */
  function buildTimelineItem(event, index) {
    const item = document.createElement('div');
    item.classList.add('timeline-item');

    // Alternate sides: even index → left (default), odd index → right
    if (index % 2 !== 0) {
      item.classList.add('right');
    }

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
    container.appendChild(item);
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

        // Build each timeline item
        data.events.forEach(function (event, index) {
          buildTimelineItem(event, index);
        });

        // Activate scroll-reveal after items are in the DOM
        setupScrollReveal();
      })
      .catch(function (err) {
        container.innerHTML =
          '<p class="timeline-error">Failed to load timeline data. Please try again later.</p>';
        console.error('Timeline load error:', err);
      });
  }

  // Kick off
  loadTimeline();
})();
