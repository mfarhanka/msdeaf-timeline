# MSDeaf-Timeline

Static timeline site for Malaysian Deaf Sports history.

## MySQL Setup

This project now uses PHP and MySQL for timeline storage.

- Database name: `msdeaf-timeline`
- Default MySQL host: `127.0.0.1`
- Default MySQL user: `root`
- Default MySQL password: empty in XAMPP by default

Run the setup page in your browser after Apache and MySQL are running:

- `http://localhost/MSDeaf-Timeline/setup_database.php`

What the setup page does:

- Creates the `msdeaf-timeline` database
- Creates the `site_settings`, `timeline_events`, and `admin_users` tables
- Seeds the timeline from `data.json`
- Creates the default admin account

## Admin Console

The site includes an admin console for managing timeline events through PHP APIs and MySQL.

- Add new events
- Edit existing events
- Delete events
- Reorder events
- Export the current timeline as JSON
- Reset back to the default `data.json`

Important:

- Timeline changes are saved to MySQL
- `data.json` is used only as the seed source for setup or reset
- Admin access uses a PHP session after login
- Use `Export JSON` if you want to keep or publish the edited timeline data

## Admin Login

- The admin console now stays hidden until you sign in
- Default username on the server: `admin`
- The default password is `msdeaf-admin-2026`
- The unlocked state lasts only for the current PHP session until logout or session expiry

## API Files

- `setup_database.php` creates the database and tables
- `db.php` contains the shared PDO and schema helpers
- `api/timeline.php` returns the public timeline payload
- `api/admin-login.php` starts the admin session
- `api/admin-logout.php` ends the admin session
- `api/admin-save.php` writes timeline changes to MySQL
- `api/admin-reset.php` reseeds the database from `data.json`