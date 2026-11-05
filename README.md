# XPGAMPP v8.4.4 — Modern XAMPP Clone (Apache 2.4 + PHP 8.4 + MySQL 9.2 + PostgreSQL 17.4)

**XPGAMPP** is a full-featured local web development stack and interactive Web Control Panel modeled after **XAMPP**, upgraded with the latest **PHP 8.4.4 (ZTS + OPcache JIT)**, **MySQL 9.2.0 (InnoDB)**, and **PostgreSQL 17.4 (PGlite / Native WAL)** alongside **Apache 2.4.63**.

---

## Included Stack & Capabilities

| Service / Daemon | Version | Default Port(s) | Admin Studio / Tool | Configuration Files |
| :--- | :--- | :--- | :--- | :--- |
| **Apache Web Server** | `2.4.63` | `8080`, `8443` | `htdocs` Project Explorer & PHP 8.4 Runner | `etc/apache2/httpd.conf`, `etc/apache2/httpd-vhosts.conf` |
| **PHP-FPM Runtime** | `8.4.4 (ZTS)` | `9000` | Interactive `phpinfo()` & Extensions Switchboard | `etc/php/php.ini`, `etc/php/php-fpm.conf` |
| **MySQL Server** | `9.2.0 (InnoDB)` | `3306` | Built-in **phpMyAdmin-style MySQL 9.2 Studio** | `etc/mysql/my.cnf` |
| **PostgreSQL Server** | `17.4` | `5432` | Built-in **pgAdmin-style PostgreSQL 17 Studio** | `etc/postgresql/postgresql.conf`, `etc/postgresql/pg_hba.conf` |

---

## Features

1. **Interactive XAMPP Control Panel (`http://0.0.0.0:3000`)**
   - Start, Stop, and Restart individual services (`Apache`, `PHP-FPM`, `MySQL`, `PostgreSQL`) or bulk **Start All / Stop All / Restart All**.
   - Live PIDs, port assignments, CPU/Memory telemetry, and **Netstat** TCP socket table.
   - Real-time bottom system event log console + raw log inspector (`apache_access.log`, `apache_error.log`, `php_error.log`, `mysql_error.log`, `postgresql.log`).
2. **Built-in Dual SQL Studio (MySQL 9.2 + PostgreSQL 17.4)**
   - Switch seamlessly between **MySQL 9.2 (`xampp_shop`)** and **PostgreSQL 17.4 (`pg_analytics`)**.
   - Browse schemas, tables, primary keys, column types, and row counts.
   - Execute live SQL queries (`SELECT`, `JOIN`, `INSERT`, `UPDATE`, `CREATE TABLE`, `SHOW TABLES`, `DESCRIBE`, `SHOW VARIABLES`, PostgreSQL `JSONB` queries, `\dt`, `SELECT version()`) and export results as JSON.
3. **`htdocs` Project Manager & Live PHP 8.4 Runner**
   - Preloaded sample applications inside `/htdocs/`:
     - `htdocs/dashboard/index.php` — Stack welcome & PHP 8.4 feature verification
     - `htdocs/dashboard/phpinfo.php` — Full `phpinfo()` diagnostic page
     - `htdocs/shop-api/index.php` — Dual-database e-commerce app querying both MySQL 9.2 & PostgreSQL 17.4
     - `htdocs/pg-explorer/index.php` — PostgreSQL 17 extensions & JSONB audit log explorer
     - `htdocs/mysql-bench/index.php` — MySQL 9.2 InnoDB relational join benchmark
   - Create, edit, save, and execute `.php` files directly in the browser or open `/htdocs/<project>/index.php`.
4. **Configuration Editor & PHP 8.4 Extensions Switchboard**
   - Edit `php.ini`, `php-fpm.conf`, `httpd.conf`, `httpd-vhosts.conf`, `my.cnf`, `postgresql.conf`, `pg_hba.conf`, and `docker-compose.yml` directly in the UI.
   - One-click toggle for PHP 8.4 extensions (`pdo_mysql`, `mysqli`, `pdo_pgsql`, `pgsql`, `opcache`, `redis`, `curl`, `gd`, `intl`, `mbstring`, `zip`, `sodium`, `ffi`, `xdebug`).
5. **Docker Compose & CLI Stack (`docker-compose.yml` + `./xampp-ctl.sh`)**
   - Ready-to-run container definitions for `php:8.4-apache`, `mysql:9.2`, `postgres:17-alpine`, `phpmyadmin:latest`, and `dpage/pgadmin4:latest`.

---

## Quick Start

### 1. Start the Web Control Panel & Embedded Stack
```bash
npm install
npm run start
```

### 2. Using the CLI Controller (`./xampp-ctl.sh`)
```bash
chmod +x xampp-ctl.sh
./xampp-ctl.sh start
./xampp-ctl.sh status
./xampp-ctl.sh logs
```

### 3. Using Native Docker Compose Containers
```bash
docker compose up -d --build
```
