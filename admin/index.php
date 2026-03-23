<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MSDeaf Timeline Admin</title>
  <link rel="stylesheet" href="../styles.css" />
</head>
<body data-api-base="../api/" class="admin-page-body">

  <main class="admin-dashboard-layout">
    <aside class="admin-sidebar" aria-label="Admin navigation">
      <div class="admin-sidebar-brand">
        <p class="admin-console-kicker">MSDeaf</p>
        <h1 class="admin-sidebar-title">Timeline Admin</h1>
        <p class="admin-sidebar-note">Server-backed content management for the public timeline.</p>
      </div>

      <nav class="admin-sidebar-menu">
        <a class="admin-sidebar-link" href="#admin-auth-gate">Login</a>
        <a class="admin-sidebar-link" href="#admin-console-shell">Workspace</a>
        <a class="admin-sidebar-link" href="#admin-event-form">Event Form</a>
        <a class="admin-sidebar-link" href="#admin-event-list-section">Event Table</a>
        <a class="admin-sidebar-link" href="../setup_database.php">DB Setup</a>
        <a class="admin-sidebar-link admin-sidebar-link-accent" href="../index.html">View Public Timeline</a>
      </nav>

      <div class="admin-sidebar-session" data-admin-protected hidden>
        <p class="admin-sidebar-session-label">Session</p>
        <p class="admin-sidebar-session-note">The admin workspace is unlocked for this session.</p>
        <button class="admin-console-action danger admin-sidebar-lock" id="admin-logout-button" type="button">Lock Console</button>
      </div>
    </aside>

    <section class="admin-dashboard-content">
      <section class="admin-console-shell" id="admin-console-shell" aria-label="Timeline admin console">
        <div class="admin-auth-gate" id="admin-auth-gate">
          <div class="admin-auth-copy">
            <p class="admin-console-kicker">Admin Access</p>
            <h2 class="admin-console-title">Protected Timeline Manager</h2>
            <p class="admin-console-note">Sign in to access the timeline editor, export tools, and reset controls for this server-backed timeline.</p>
          </div>

          <form class="admin-auth-form" id="admin-auth-form">
            <div class="admin-field admin-auth-field">
              <label for="admin-password">Admin Password</label>
              <input id="admin-password" name="password" type="password" autocomplete="current-password" required />
            </div>
            <button class="admin-console-action" type="submit">Unlock Admin Console</button>
          </form>
          <p class="admin-auth-status" id="admin-auth-status" aria-live="polite">Admin tools are locked.</p>
        </div>

        <div class="admin-console-protected" id="admin-console-protected" data-admin-protected hidden>
          <div class="admin-console-panel" id="admin-console-panel">
            <div class="admin-console-toolbar">
              <p class="admin-console-status" id="admin-console-status" aria-live="polite">Connected to the server timeline.</p>
              <div class="admin-console-actions">
                <button class="admin-console-action secondary" id="admin-new-event-button" type="button">New Event</button>
                <button class="admin-console-action" id="admin-export-button" type="button">Export JSON</button>
                <button class="admin-console-action danger" id="admin-reset-button" type="button">Reset Default</button>
              </div>
            </div>

            <div class="admin-console-grid">
              <form class="admin-form" id="admin-event-form">
                <div class="admin-form-header">
                  <h3 class="admin-form-title" id="admin-form-title">Create Event</h3>
                  <p class="admin-form-note">Add a new timeline item or edit an existing one. The display order follows the list on the right.</p>
                </div>

                <input type="hidden" id="admin-event-id" name="eventId" />

                <div class="admin-field">
                  <label for="admin-year">Year</label>
                  <input id="admin-year" name="year" type="text" required />
                </div>

                <div class="admin-field">
                  <label for="admin-date">Date Label</label>
                  <input id="admin-date" name="date" type="text" placeholder="Example: August 1977" />
                </div>

                <div class="admin-field">
                  <label for="admin-title">Title</label>
                  <input id="admin-title" name="title" type="text" required />
                </div>

                <div class="admin-field">
                  <label for="admin-description">Description</label>
                  <textarea id="admin-description" name="description" rows="6" required></textarea>
                </div>

                <div class="admin-field">
                  <label for="admin-image">Image Path</label>
                  <input id="admin-image" name="image" type="text" placeholder="images/example.jpg" />
                </div>

                <div class="admin-field">
                  <label for="admin-image-alt">Image Alt Text</label>
                  <input id="admin-image-alt" name="imageAlt" type="text" placeholder="Describe the image" />
                </div>

                <div class="admin-form-actions">
                  <button class="admin-console-action" id="admin-save-button" type="submit">Add Event</button>
                  <button class="admin-console-action secondary" id="admin-cancel-edit-button" type="button" hidden>Cancel Edit</button>
                </div>
              </form>

              <section class="admin-event-list-panel" id="admin-event-list-section" aria-labelledby="admin-event-list-title">
                <div class="admin-event-list-header">
                  <div>
                    <h3 class="admin-event-list-title" id="admin-event-list-title">Current Events</h3>
                    <p class="admin-event-list-note">Reorder items to change how the timeline alternates left and right.</p>
                  </div>
                  <p class="admin-event-count" id="admin-event-count">0 events</p>
                </div>
                <div class="admin-event-list" id="admin-event-list"></div>
              </section>
            </div>
          </div>
        </div>
      </section>

    </section>
  </main>

  <footer class="site-footer">
    <p>&copy; <span id="footer-year"></span> Malaysian Deaf Sports Association (MSDeaf). All rights reserved.</p>
  </footer>

  <script src="../script.js"></script>
</body>
</html>