#!/bin/bash
# CSE Platform — VPS provisioning script
# Fresh Ubuntu 24.04 -> production Frappe LMS template federation site.
#
# Derived from the verified Milestone 1 runbook (runbook/milestone-1-runbook.md).
# Run as root from a clone of this repo:
#
#   cd platform/deploy
#   SITE_DOMAIN=demo.cseplatform.com \
#   ADMIN_PASSWORD='choose-strong-pw' \
#   DB_ROOT_PASSWORD='choose-strong-pw' \
#   LETSENCRYPT_EMAIL=you@example.com \
#   bash provision-vps.sh
#
# Sealed-box rule: frappe/lms source is never modified. All CSE configuration
# is applied as site data by the scripts in ../scripts.

set -euo pipefail

SITE_DOMAIN="${SITE_DOMAIN:?Set SITE_DOMAIN (e.g. demo.cseplatform.com)}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:?Set ADMIN_PASSWORD}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:?Set DB_ROOT_PASSWORD}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"   # empty = skip SSL setup
FRAPPE_BRANCH="${FRAPPE_BRANCH:-version-15}"
SCRIPTS_DIR="$(cd "$(dirname "$0")/../scripts" && pwd)"

echo "==> [1/8] System packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq mariadb-server mariadb-client libmariadb-dev pkg-config \
    redis-server wkhtmltopdf cron git python3-dev python3-pip python3-venv \
    nginx supervisor ufw curl

# Node 22 + yarn (Frappe v15 asset builds)
if ! command -v node >/dev/null || [ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 18 ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y -qq nodejs
fi
npm install -g yarn >/dev/null 2>&1 || true

echo "==> [2/8] MariaDB (utf8mb4 + root password)"
cat > /etc/mysql/mariadb.conf.d/99-frappe.cnf <<'EOF'
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4
EOF
systemctl enable --now mariadb
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('${DB_ROOT_PASSWORD}'); FLUSH PRIVILEGES;" || true

echo "==> [3/8] frappe user + bench CLI"
id frappe >/dev/null 2>&1 || useradd -m -s /bin/bash frappe
# Ubuntu >=21.04 creates home dirs 0750 (login.defs HOME_MODE). nginx serves
# /assets and /files as www-data straight from ~/frappe-bench/sites, so it
# needs traverse access or every page renders unstyled (CSS/JS/images 403).
chmod 755 /home/frappe
# bench shells out to `sudo supervisorctl` / `sudo nginx` when reloading;
# without this, bench init dies at its final "reload" step on fresh servers
echo 'frappe ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl, /usr/sbin/nginx' > /etc/sudoers.d/frappe
chmod 440 /etc/sudoers.d/frappe
su - frappe -c "pip3 install --user --break-system-packages --quiet frappe-bench"
FRAPPE_HOME=/home/frappe
BENCH="$FRAPPE_HOME/.local/bin/bench"

echo "==> [4/8] bench init + apps (frappe ${FRAPPE_BRANCH}, lms, payments)"
if [ ! -d "$FRAPPE_HOME/frappe-bench" ]; then
    su - frappe -c "cd ~ && $BENCH init --frappe-branch ${FRAPPE_BRANCH} frappe-bench"
fi
su - frappe -c "cd ~/frappe-bench && [ -d apps/lms ] || CYPRESS_INSTALL_BINARY=0 $BENCH get-app lms"
su - frappe -c "cd ~/frappe-bench && [ -d apps/payments ] || $BENCH get-app payments --branch ${FRAPPE_BRANCH}"

echo "==> [5/8] Site ${SITE_DOMAIN} + LMS install"
if [ ! -d "$FRAPPE_HOME/frappe-bench/sites/${SITE_DOMAIN}" ]; then
    su - frappe -c "cd ~/frappe-bench && $BENCH new-site ${SITE_DOMAIN} \
        --mariadb-root-password '${DB_ROOT_PASSWORD}' \
        --admin-password '${ADMIN_PASSWORD}' \
        --mariadb-user-host-login-scope='%'"
fi
su - frappe -c "cd ~/frappe-bench && $BENCH --site ${SITE_DOMAIN} list-apps | grep -q '^lms' || $BENCH --site ${SITE_DOMAIN} install-app lms"
su - frappe -c "cd ~/frappe-bench && $BENCH use ${SITE_DOMAIN}"
# Server Scripts power the 1-year certificate expiry rule (must be global in v15)
su - frappe -c "cd ~/frappe-bench && $BENCH set-config -g server_script_enabled 1"
su - frappe -c "cd ~/frappe-bench && $BENCH --site ${SITE_DOMAIN} enable-scheduler"

echo "==> [6/8] CSE configuration (branding, roles, course, certificate)"
mkdir -p $FRAPPE_HOME/cse-scripts
cp "$SCRIPTS_DIR"/*.py "$SCRIPTS_DIR"/*.sh $FRAPPE_HOME/cse-scripts/
chown -R frappe:frappe $FRAPPE_HOME/cse-scripts
PY=$FRAPPE_HOME/frappe-bench/env/bin/python
RUN="SITE=${SITE_DOMAIN} $PY $FRAPPE_HOME/cse-scripts/run_on_site.py"
su - frappe -c "$PY $FRAPPE_HOME/cse-scripts/gen_logo.py"
su - frappe -c "$RUN $FRAPPE_HOME/cse-scripts/configure_branding_roles.py"
su - frappe -c "$RUN $FRAPPE_HOME/cse-scripts/create_course.py"
su - frappe -c "$RUN $FRAPPE_HOME/cse-scripts/configure_certificate.py"
su - frappe -c "$RUN $FRAPPE_HOME/cse-scripts/fix_print_format.py"

echo "==> [7/8] Production setup (supervisor + nginx) + firewall + backups"
su - frappe -c "cd ~/frappe-bench && $BENCH setup supervisor --yes && $BENCH setup nginx --yes"
ln -sf $FRAPPE_HOME/frappe-bench/config/supervisor.conf /etc/supervisor/conf.d/frappe-bench.conf
ln -sf $FRAPPE_HOME/frappe-bench/config/nginx.conf /etc/nginx/conf.d/frappe-bench.conf
# default nginx site would shadow the bench config
rm -f /etc/nginx/sites-enabled/default
# bench's nginx template uses `access_log ... main`, but Ubuntu's stock
# /etc/nginx/nginx.conf doesn't define a `main` log_format, so nginx -t fails.
if ! grep -q "log_format main" /etc/nginx/nginx.conf; then
    sed -i 's|^http {|http {\n\tlog_format main '\''$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" "$http_x_forwarded_for"'\'';|' /etc/nginx/nginx.conf
fi
systemctl restart supervisor
nginx -t && systemctl restart nginx
su - frappe -c "cd ~/frappe-bench && $BENCH setup backups"   # nightly cron; ship offsite separately
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

if [ -n "$LETSENCRYPT_EMAIL" ]; then
    echo "==> [8/8] HTTPS via Let's Encrypt"
    apt-get install -y -qq certbot python3-certbot-nginx
    certbot --nginx -d "${SITE_DOMAIN}" --non-interactive --agree-tos -m "${LETSENCRYPT_EMAIL}" --redirect
else
    echo "==> [8/8] Skipping SSL (set LETSENCRYPT_EMAIL to enable)"
fi

echo
echo "==> Health check"
sleep 3
curl -s "http://127.0.0.1:8080/api/method/ping" -H "Host: ${SITE_DOMAIN}" || true
echo
echo "DONE. Visit: http://${SITE_DOMAIN}/lms (admin login: Administrator / your ADMIN_PASSWORD)"
echo "Demo coach login: coach@demofed.test / CoachDemo_1  (change or delete for public demos)"
