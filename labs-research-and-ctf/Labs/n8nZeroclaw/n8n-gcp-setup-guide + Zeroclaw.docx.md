# **Suggested Placeholder Values**

To make this guide actionable, please replace all bracketed placeholders with your specific values. Here are example values:

| Placeholder | Example Value | Context/Purpose |
| :---: | :---: | :---- |
| \[YOUR\_DOMAIN\] | n8n.yourwebsite.com | The public subdomain URL for n8n. |
| \[YOUR\_ROOT\_DOMAIN\] | yourwebsite.com | Your root domain managed by your DNS provider. |
| \[YOUR\_STATIC\_IP\] | 34.xx.xx.xx | The External IP address of your GCP VM. |
| \[YOUR\_TIMEZONE\] | Asia/Kolkata | Used for n8n scheduled workflows. |
| \[YOUR\_USERNAME\] | yourusername | Your GCP Linux username. |
| YourStrongPasswordHere | Yourpassw0rd | The strong password for n8n's basic authentication. |

**n8n on Google Cloud Free Tier**

A Complete Self-Hosting Setup Guide

*Always Free e2-micro VM · Custom Domain · SSL · Security Hardening · $0/month*

| Parameter | Value |
| :---- | :---- |
| Target Platform | Google Cloud Platform (GCP) — Always Free Tier (no credits required) |
| Region | us-central1 (Iowa) — required for Always Free eligibility |
| VM Specification | e2-micro · 1 vCPU (bursting) · 1 GB RAM · 30 GB standard persistent disk |
| Operating System | Ubuntu 22.04 LTS |
| Automation Engine | n8n (Community Edition, self-hosted via Docker) |
| Local AI | None — e2-micro RAM is insufficient for local LLMs. Use external API integrations (Gemini, OpenAI, etc.) via n8n nodes. |
| Reverse Proxy | Nginx \+ Let's Encrypt SSL (auto-renewing) |
| Public URL | \[YOUR\_DOMAIN\] → VM static IP  |
| Monthly Cost | $0 — within GCP Always Free tier limits (30 GB standard disk, 1 e2-micro, 1 GB egress) |
| Free Tier Constraint | Static IP is FREE while attached to a running VM. Billed at \~$0.004/hr only if VM is stopped. |

| ℹ  NOTE This guide deploys n8n on GCP's Always Free tier — no trial credits needed, no monthly bill as long as you stay within free limits. The e2-micro VM (1 vCPU, 1 GB RAM) is enough to run n8n reliably for automation workflows. It cannot run local LLMs — connect to external AI APIs (Gemini Free tier, OpenAI, etc.) via n8n's built-in HTTP and AI nodes instead. Every command is explained. Every security decision is justified. An appendix documents all GCP Always Free products. |
| :---- |

# **Prerequisites & Cost Overview**

## **What You Need Before Starting**

* A Google Cloud account with an active billing account (free tier still requires a billing account on file)

* A GCP project created and linked to that billing account

* A domain managed by your DNS provider (this guide uses \[YOUR\_ROOT\_DOMAIN\])

* A modern browser with access to console.cloud.google.com

* Basic comfort with a Linux terminal

## **Understanding the Always Free Cost**

This setup is designed to run entirely within GCP's Always Free tier limits. There are no time-limited credits involved — this is the permanent free offering.

| Item | Cost |
| :---- | :---- |
| e2-micro VM (1 vCPU, 1 GB RAM) | $0 — 1 VM free per month in eligible US regions |
| 30 GB standard persistent disk | $0 — included in free tier |
| Static IP (while VM is running) | $0 — free when attached to a running VM |
| Static IP (while VM is STOPPED) | \~$0.004/hr — billed only when VM is off |
| Outbound egress (North America) | $0 — first 1 GB/month free |
| Egress beyond 1 GB/month | Billed at standard rates (\~$0.08–0.12/GB) |
| Total (normal operation) | $0/month |

| ✖  CRITICAL The Always Free e2-micro VM is available ONLY in us-west1 (Oregon), us-central1 (Iowa), and us-east1 (South Carolina). Any other region — including asia-south1 (Mumbai) — will be billed normally. This guide uses us-central1. Accept the higher latency from India as the tradeoff for zero cost. |
| :---- |

| ⚠  WARNING The free tier allows 1 GB outbound egress per month. n8n's web UI, webhooks, and API calls all consume egress. For personal/low-traffic use this is unlikely to be exceeded. Monitor your egress in GCP Console → Billing → Reports if concerned. |
| :---- |

## **Why This Stack?**

This architecture is chosen for zero cost, correct security posture, and practical automation capability.

* **n8n** is a self-hostable workflow automation tool. Running it on your own VM means your workflows, credentials, and data never leave your infrastructure.

* **e2-micro** has 1 GB RAM — enough for n8n at idle (\~200–400 MB). It cannot run local LLMs. Connect to external AI APIs (Gemini, OpenAI, Anthropic) using n8n's built-in HTTP Request or LLM nodes instead.

* **Docker Compose** manages the n8n container. One config file defines the entire stack — reproducible and easy to update or restore.

* **Nginx** acts as a reverse proxy in front of n8n. It handles SSL termination, security headers, and rate limiting — responsibilities n8n is not designed to handle at the edge.

| PHASE 1  Create the GCP Virtual Machine *Provision the Always Free e2-micro instance with correct region, disk type, and static IP.* |
| :---- |

## **Step 1.1 — Select the Correct Project**

1. Go to console.cloud.google.com

2. Click the project selector dropdown at the top of the page (next to the Google Cloud logo)

3. Select your project

| ⚠  WARNING Always verify the active project before creating any resource. GCP bills resources to the active project. Selecting the wrong project can result in unexpected charges. |
| :---- |

## **Step 1.2 — Navigate to VM Instances**

4. Click the hamburger menu (☰) in the top-left corner

5. Scroll to Compute Engine → click VM instances

6. If prompted to enable the Compute Engine API, click Enable and wait \~60 seconds

Enabling the API registers your project to use virtual machines. This is a one-time action per project.

## **Step 1.3 — Create the Instance**

Click CREATE INSTANCE at the top of the VM instances page. Fill in the following:

| Field | Value |
| :---- | :---- |
| Name | n8n-freetier |
| Region | us-central1 (Iowa)  ← REQUIRED for Always Free eligibility |
| Zone | us-central1-a |

| ✖  CRITICAL The region MUST be us-central1, us-west1, or us-east1 for the e2-micro to be free. Any other region will be billed. This guide uses us-central1-a. |
| :---- |

## **Step 1.4 — Machine Configuration**

7. Under Machine configuration, set Series to E2

8. Set Machine type to e2-micro (1 vCPU, 1 GB memory)

The e2-micro is GCP's Always Free compute instance. It has 1 vCPU (burstable) and 1 GB RAM. This is sufficient to run n8n at idle (200–400 MB RAM) with headroom for the OS and Docker. Do not attempt to run Ollama or any local LLM on this VM — it will exhaust memory and cause the OS to kill processes.

## **Step 1.5 — Boot Disk Configuration**

Click CHANGE under Boot disk and set:

| Field | Value |
| :---- | :---- |
| Operating System | Ubuntu |
| Version | Ubuntu 22.04 LTS  ← important: not 24.04 or 25.x |
| Boot disk type | Standard persistent disk  ← NOT SSD (SSD is not covered by free tier) |
| Size | 30 GB  ← maximum included in free tier |
| Snapshot schedule | No schedule |

| ✖  CRITICAL Use Standard persistent disk, NOT SSD. The Always Free tier covers 30 GB of standard persistent disk. SSD persistent disk is billed separately even within free tier. Also keep the disk at exactly 30 GB — any size above 30 GB will incur charges. |
| :---- |

30 GB standard disk is sufficient for: Ubuntu OS (\~8 GB used), Docker images (\~1.5 GB for n8n), and n8n workflow data (\~1 GB). Total realistic usage: \~12–15 GB, leaving comfortable headroom.

## **Step 1.6 — Firewall Rules**

Under Firewall, check both boxes:

* Allow HTTP traffic

* Allow HTTPS traffic

| ⚠  WARNING These checkboxes enable GCP-level firewall rules for ports 80 and 443\. This is separate from UFW (the OS-level firewall configured in Phase 2). Both must be configured. Forgetting either one will cause connection issues — the GCP firewall blocks traffic before it ever reaches UFW. |
| :---- |

Port 5678 (n8n's native port) is intentionally not opened here. n8n will only be reachable through Nginx on port 443, which proxies internally to 5678\. This means n8n is never directly exposed to the internet.

## **Step 1.7 — Reserve a Static IP Address**

This step is critical. Without a static IP, your VM's public IP changes on every reboot, breaking your DNS record.

9. Scroll down and expand Advanced options

10. Click Networking

11. Under Network interfaces, click the edit (pencil) icon on the default interface

12. Scroll to External IPv4 address

13. Change the dropdown from Ephemeral to Create IP address

14. Name it: n8n-freetier-ip

15. Click Reserve, then Done

A reserved static IP costs \~$0.004/hour ONLY when it is not attached to a running VM. While your VM is running, the static IP is completely free. Keep your VM running to avoid this charge.

## **Step 1.8 — Verify Cost Estimate and Create**

Before clicking Create, check the Monthly estimate panel on the right side of the screen. With the e2-micro in us-central1 and a 30 GB standard disk, the estimate should show $0.00 or a negligible amount (the calculator may not reflect all free tier credits automatically — the actual bill will be $0 within free tier limits).

Click CREATE. The VM takes 60–90 seconds to provision. A green checkmark will appear when it is ready.

## **Step 1.9 — Record Your Static IP**

In the VM instances list, note the External IP shown in the table. It will look like \[YOUR\_STATIC\_IP\]. You will need this IP in Phase 6 when adding the DNS record.

## **Troubleshooting — Phase 1**

### **Compute Engine API fails to enable**

This usually means billing is not properly linked to the project. Go to Billing in the GCP Console and confirm a billing account is associated with the project. A billing account is required even for free tier usage.

### **Cost estimate shows a non-zero amount**

Verify: (1) region is set to us-central1, us-west1, or us-east1 — not any other region; (2) machine type is e2-micro specifically; (3) disk type is Standard persistent disk, not SSD; (4) disk size is 30 GB or less; (5) snapshot schedule is set to No schedule.

### **Cannot find e2-micro in the machine type dropdown**

Make sure the Series is set to E2 first. Machine types are filtered by series. Then look for e2-micro specifically in the dropdown — it is at the top of the E2 list as the smallest option.

| PHASE 2  SSH Access & Server Hardening *Secure the VM before installing anything. A freshly provisioned cloud VM receives automated probe traffic within minutes of going live.* |
| :---- |

## **Step 2.1 — Connect via GCP Browser SSH**

16. Go to Compute Engine → VM instances

17. Find n8n-freetier in the list

18. Under the Connect column, click SSH

19. A browser-based terminal will open and authenticate automatically

GCP manages short-lived SSH certificates on your behalf. You do not need to manage keys manually. The connection is encrypted and authenticated via your Google account.

| ℹ  NOTE GCP automatically creates a Linux user matching your Google account username (e.g. yourname@n8n-freetier:\~$). This is your working user for the entire guide. All commands below use sudo for elevated actions rather than switching to root. Do not run a persistent root shell (sudo \-i) for routine work. |
| :---- |

## **Step 2.2 — Update the System**

```bash
sudo apt update &&
sudo apt upgrade -y
```

This refreshes the package index and installs all pending security patches. Run this before anything else — you are building on top of whatever state the image shipped in.

This may take 2–4 minutes. Wait for it to complete fully before proceeding.

## **Step 2.3 — Configure UFW Firewall**

UFW (Uncomplicated Firewall) is Ubuntu's built-in firewall manager. You will define exactly which ports are allowed and deny everything else.

```bash
# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing
# Allow only required ports
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# Enable and verify
sudo ufw enable
sudo ufw status verbose
```

Why these three ports only:

* **ssh (port 22\)** — required for you to connect and manage the server

* **80/tcp** — HTTP, required for Let's Encrypt certificate validation in Phase 5

* **443/tcp** — HTTPS, the only port n8n will be publicly accessible on

Expected output of ufw status verbose:

```bash
Status: active
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
```

## **Step 2.4 — Install and Configure fail2ban**

```bash
sudo apt install fail2ban -y
```

Create a dedicated override config file for the SSH jail. Never edit jail.conf directly — it gets overwritten on updates.

```bash
sudo
nano /etc/fail2ban/jail.d/sshd-custom.conf
```

Paste the following content exactly (no \# characters at the start of any line):

```bash
[sshd] enabled \= true port \= ssh maxretry \= 5 bantime \= 3600 findtime \= 600
```

Save and exit: Ctrl+O → Enter → Ctrl+X

| Setting | Effect |
| :---- | :---- |
| enabled \= true | Activates the SSH jail |
| maxretry \= 5 | Triggers a ban after 5 failed login attempts |
| bantime \= 3600 | Bans the offending IP for 3600 seconds (1 hour) |
| findtime \= 600 | Counts failures within a 10-minute sliding window |

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status sshd
```

Expected output includes File list: /var/log/auth.log and Currently banned: 0\.

## **Step 2.5 — Enable Unattended Security Upgrades**

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

Select Yes when the dialog appears. This automatically installs security patches in the background. Only security updates are applied — major version upgrades are not. This is standard hardening for any internet-facing server.

## **Step 2.6 — Disable Root SSH Login**

```bash
sudo
nano /etc/ssh/sshd_config
```

Find the PermitRootLogin line (use Ctrl+W to search) and set it to:

```bash
PermitRootLogin no
```

Save and exit: Ctrl+O → Enter → Ctrl+X. Then restart SSH:

```bash
sudo systemctl restart sshd
```

Even with fail2ban active, disabling root SSH login means an attacker who compromises one credential still cannot obtain a root shell directly. They would need both a valid user account and sudo access.

## **Troubleshooting — Phase 2**

### **fail2ban status shows ERROR or is not running**

The most common cause is a syntax error in the config file. Check for any \# characters at the start of the lines in sshd-custom.conf — all lines in that file should be uncommented (no leading \#). Run sudo systemctl status fail2ban for the specific error message.

### **ufw enable warning about disrupting SSH**

This is expected. UFW warns you that enabling the firewall could break your SSH session if port 22 is not allowed. Since you already ran sudo ufw allow ssh before enabling, it is safe to proceed.

### **jail.local vs jail.d approach**

If you copied jail.conf to jail.local and edited it, everything in that file is commented out by default (lines starting with \#). Commented-out lines are ignored. Use the jail.d/sshd-custom.conf approach in this guide — it is cleaner and survives package updates without conflict.

| PHASE 3  Install Docker & Docker Compose *Install the container runtime that will host n8n.* |
| :---- |

## **Step 3.1 — Remove Old Docker Versions**

```bash
sudo apt remove
docker docker-engine docker.io containerd runc -y
```

Ubuntu sometimes ships with unofficial Docker packages. Removing them prevents version conflicts. "Package not found" messages are normal — it just means they were not installed.

## **Step 3.2 — Install Prerequisites**

| sudo apt install \-y ca-certificates curl gnupg lsb-release |  |
| :---- | :---- |
| **Package** | **Purpose** |
| ca-certificates | Validates SSL certificates when downloading packages |
| curl | Downloads files from the internet |
| gnupg | Handles GPG cryptographic key verification |
| lsb-release | Detects your Ubuntu version for the correct package repository |

## **Step 3.3 — Add Docker's Official GPG Key**

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg |
sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

This downloads Docker's official cryptographic signing key. When you install Docker packages, apt uses this key to verify the packages have not been tampered with. This is the security-correct way to add third-party repositories.

## **Step 3.4 — Add Docker's Official Repository**

```bash
echo \\   "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \\   $(lsb_release -cs) stable" |
sudo tee /etc/apt/sources.list.d/docker.list \> /dev/null
```

This tells apt where to find Docker packages. Using Docker's own repository ensures you get the latest stable version. Ubuntu's default repository often ships an older version.

## **Step 3.5 — Install Docker Engine**

| sudo apt update sudo apt install \-y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin |  |
| :---- | :---- |
| **Package** | **Purpose** |
| docker-ce | The Docker engine (CE \= Community Edition, free) |
| docker-ce-cli | The docker command line tool |
| containerd.io | The low-level container runtime Docker sits on top of |
| docker-buildx-plugin | Extended build capabilities |
| docker-compose-plugin | Modern Docker Compose as a plugin — gives you the docker compose command |

## **Step 3.6 — Add Your User to the Docker Group**

```bash
sudo usermod -aG
docker $USER
```

| ⚠  WARNING When GCP creates your VM, it automatically sets up a user matching your Google account username (e.g. \[YOUR\_USERNAME\]). Use that username explicitly if $USER does not resolve correctly. You can verify with: whoami. If needed, substitute your actual username: sudo usermod \-aG docker yourusername  |
| :---- |

Log out and reconnect via SSH to apply the group change. Then verify:

```bash
groups #
docker should appear in the output
```

## **Step 3.7 — Verify Docker Works**

```bash
docker run hello-world
docker compose version
```

The hello-world container should print "Hello from Docker\!" confirming the engine works. Docker Compose should return a version string like Docker Compose version v2.x.x.

| ℹ  NOTE Use docker compose (with a space) throughout this guide. This is the modern plugin syntax. The older docker-compose (with a hyphen) is a legacy standalone binary and is not installed here. |
| :---- |

## **Troubleshooting — Phase 3**

### **docker: permission denied after adding to group**

The group change requires a fresh login session to take effect. Close the browser SSH window completely and reconnect via GCP Console → SSH. newgrp docker works for the current shell session but does not always propagate correctly in GCP's browser SSH environment.

### **version attribute warning in docker-compose.yml**

Newer Docker Compose v2.x no longer requires the version: field at the top of docker-compose.yml. If you see WARN: the attribute version is obsolete, remove the version: "3.8" line from your file. This is a warning, not an error — your containers still start correctly.

| PHASE 4  Deploy n8n via Docker Compose *Define and start the n8n container with a single configuration file. Configure memory swap for the e2-micro.* |
| :---- |

## **Architecture Overview**

Before running any commands, understand what you are building:

```bash
Internet     │    443 (HTTPS)     │   Nginx  ← (Phase 5: handles SSL \+ security headers)     │   5678 (localhost only)     │   n8n container     │   External AI APIs (Gemini, OpenAI, Anthropic, etc.)   via n8n HTTP Request or LLM nodes — outbound only
```

n8n's port 5678 is only accessible from within the VM itself (localhost). All public traffic enters on port 443 via Nginx and is forwarded internally. No application port is directly exposed to the internet.

## **Step 4.1 — Add Swap Space (Critical for e2-micro)**

The e2-micro has only 1 GB RAM. Without swap, the OS may kill the n8n process under brief memory pressure (e.g. during workflow execution or startup). Adding 1 GB of swap gives the system a safety buffer.

```bash
# Create a 1 GB swap file
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
# Make swap permanent across reboots echo '/swapfile none swap sw 0 0' |
sudo tee -a /etc/fstab
# Verify swap is active free -h
```

Expected output of free \-h should now show a Swap row with 1.0G total. Without this step, n8n may intermittently crash on the e2-micro under load.

| ℹ  NOTE Swap on a standard persistent disk is slower than RAM. This is acceptable for occasional overflow — it prevents crashes. It should not be relied on for sustained heavy workloads. |
| :---- |

## **Step 4.2 — Create Working Directory and Volume**

```bash
mkdir -p \~/n8n-stack && cd \~/n8n-stack
docker volume create n8n_data
```

Docker volumes store data outside the container on the host disk. Your n8n workflows, credentials, and settings persist across container restarts, updates, or recreations.

## **Step 4.3 — Create docker-compose.yml**

```bash
nano \~/n8n-stack/docker-compose.yml
```

Paste the following content (replace the password value before saving):

```bash
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
  
   - "127.0.0.1:5678:5678"
    volumes:
  
   - n8n_data:/home/node/.n8n
    environment:
  
   - N8N_HOST=[YOUR_DOMAIN]
  
   - N8N_PORT=5678
  
   - N8N_PROTOCOL=https
  
   - WEBHOOK_URL=https://[YOUR_DOMAIN]/
  
   - N8N_EDITOR_BASE_URL=https://[YOUR_DOMAIN]/
  
   - GENERIC_TIMEZONE=[YOUR_TIMEZONE]
  
   - N8N_BASIC_AUTH_ACTIVE=true
  
   - N8N_BASIC_AUTH_USER=admin
  
   - N8N_BASIC_AUTH_PASSWORD=YourStrongPasswordHere
  
   - NODE_OPTIONS=--max-old-space-size=512 volumes:
  n8n_data:
    external: true
```

| ✖  CRITICAL Before saving, replace YourStrongPasswordHere with a strong password (16+ characters, mixed case, numbers, symbols). This is the password protecting your n8n instance from the internet. |
| :---- |

| Setting | Purpose |
| :---- | :---- |
| restart: unless-stopped | n8n auto-restarts after VM reboots unless manually stopped |
| 127.0.0.1:5678:5678 | Binds n8n port to localhost only — not the public internet. Critical security setting. |
| n8n\_data:/home/node/.n8n | Persists all n8n data (workflows, credentials, settings) across container restarts |
| N8N\_HOST / WEBHOOK\_URL | Tells n8n its public URL so webhook URLs are generated correctly |
| GENERIC\_TIMEZONE=\[YOUR\_TIMEZONE\]  | Sets correct timezone for scheduled workflows (adjust if needed) |
| NODE\_OPTIONS=--max-old-space-size=512 | Caps n8n's Node.js memory to 512 MB — prevents it from consuming all 1 GB RAM on e2-micro |

## **Step 4.4 — Start n8n**

```bash
cd \~/n8n-stack
docker compose up -d
```

The \-d flag runs the container in detached mode (background). First run pulls the n8n image from Docker Hub and takes 2–3 minutes. Verify it is running:

```bash
docker compose ps
```

Expected output:

```bash
NAME   IMAGE              STATUS         PORTS
n8n    n8nio/n8n:latest   Up X seconds   127.0.0.1:5678-\>5678/tcp
```

| ✖  CRITICAL Confirm the port binding shows 127.0.0.1:5678-\>5678/tcp — NOT 0.0.0.0:5678. The 127.0.0.1 prefix means n8n is only reachable from within the VM itself, not from the internet. This is the critical security binding. |
| :---- |

## **Troubleshooting — Phase 4**

### **Container shows Exit or Restarting status**

Run docker compose logs n8n to see the error. Common causes: wrong password format in the environment variable (avoid special shell characters like $ without escaping), insufficient disk space (check df \-h), or a syntax error in docker-compose.yml.

### **n8n uses too much memory and gets killed (OOMKilled)**

Verify the swap was successfully created: free \-h should show 1.0G swap. Also confirm NODE\_OPTIONS=--max-old-space-size=512 is present in docker-compose.yml. If n8n is still being killed, reduce the memory cap to 384: NODE\_OPTIONS=--max-old-space-size=384.

### **n8n port bound to 0.0.0.0 instead of 127.0.0.1**

The 127.0.0.1: prefix was accidentally omitted from the ports line in docker-compose.yml. Stop the stack with docker compose down, fix the file, and run docker compose up \-d again. This is a critical security issue — n8n should never bind to all interfaces directly.

### **version attribute warning**

Newer Docker Compose v2.x no longer requires the version: field. If you see WARN: the attribute version is obsolete, remove any version: line from the top of docker-compose.yml. This is a warning, not an error.

| PHASE 5  Nginx Reverse Proxy \+ Let's Encrypt SSL *Put Nginx in front of n8n to handle HTTPS termination, security headers, and rate limiting.* |
| :---- |

## **Step 5.1 — Install Nginx and Certbot**

| sudo apt install \-y nginx certbot python3-certbot-nginx |  |
| :---- | :---- |
| **Package** | **Purpose** |
| nginx | The reverse proxy web server |
| certbot | The Let's Encrypt certificate management CLI |
| python3-certbot-nginx | Certbot plugin that automatically edits Nginx config for SSL |

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

Look for active (running). Nginx should now be serving on port 80\.

## **Step 5.2 — Create the Nginx Site Config**

```bash
# Remove the default site
sudo rm /etc/nginx/sites-enabled/default
# Create config for your subdomain
sudo
nano /etc/nginx/sites-available/n8n
```

Paste this initial HTTP-only config (Certbot will upgrade it to HTTPS automatically):

```bash
server {
    listen 80;
    server_name [YOUR_DOMAIN];
    location / {
        proxy_pass http://127.0.0.1:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        chunked_transfer_encoding off;
    }
}
```

Replace \[YOUR\_DOMAIN\] with your actual subdomain. Save and exit: Ctrl+O → Enter → Ctrl+X.

| Directive | Purpose |
| :---- | :---- |
| proxy\_pass http://127.0.0.1:5678 | Forwards all requests to n8n on localhost |
| Upgrade \+ Connection: upgrade | Required for n8n's WebSocket connections (real-time UI) |
| X-Real-IP / X-Forwarded-For | Passes real client IPs to n8n so logs show actual visitors |
| proxy\_read\_timeout 300s | Allows long-running n8n workflows up to 5 minutes |

## **Step 5.3 — Enable the Site and Test Config**

```bash
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

nginx \-t must return:

```bash
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Fix any errors before proceeding. Do not proceed to Certbot with a broken Nginx config.

| ✖  CRITICAL The DNS A record (Phase 6\) must be added and propagated BEFORE running Certbot. Let's Encrypt validates domain ownership by making an HTTP request to your server. If DNS is not pointing to your VM yet, certificate issuance will fail with a timeout error. |
| :---- |

## **Step 5.4 — Issue the SSL Certificate**

After confirming DNS is propagated (see Phase 6), run:

```bash
sudo certbot --nginx -d [YOUR_DOMAIN]
```

Certbot will:

20. Contact Let's Encrypt and prove you control the domain via HTTP challenge

21. Download a signed SSL certificate to /etc/letsencrypt/live/\[YOUR\_DOMAIN\]/

22. Automatically edit your Nginx config to add the SSL/443 block

23. Set up a systemd timer for automatic renewal

When prompted: enter your email address, accept terms of service (Y), and choose whether to share your email with EFF.

Expected success output:

```bash
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/[YOUR_DOMAIN]/fullchain.pem
Congratulations\! You have successfully enabled HTTPS on https://[YOUR_DOMAIN]
```

## **Step 5.5 — Verify Auto-Renewal**

```bash
sudo certbot renew --dry-run
```

Expected: Congratulations, all simulated renewals succeeded. The certificate expires every 90 days and will renew automatically — no manual action needed.

## **Step 5.6 — Harden the Nginx Config**

After Certbot has issued your certificate, replace the Nginx site config with a hardened version:

```bash
sudo
nano /etc/nginx/sites-available/n8n
```

Replace the entire file contents with:

```bash
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name [YOUR_DOMAIN];
    return 301 https://$host$request_uri;
    }
server {
    listen 443 ssl;
    server_name [YOUR_DOMAIN];
    ssl_certificate /etc/letsencrypt/live/[YOUR_DOMAIN]/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/[YOUR_DOMAIN]/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    add_header Strict-Transport-Security "max-age=31536000;
    includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1;
    mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    server_tokens off;
    limit_req zone=n8n_limit burst=20 nodelay;
        proxy_pass http://127.0.0.1:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        chunked_transfer_encoding off;
    }
}
  location / {
```

Add the rate limiting zone to the main Nginx config:

```bash
sudo
nano /etc/nginx/nginx.conf
```

Inside the http { block (add as the first line after http {):

```bash
limit_req_zone $binary_remote_addr zone=n8n_limit:10m rate=10r/s;
```

| Header / Directive | Security Purpose |
| :---- | :---- |
| Strict-Transport-Security | Forces browsers to use HTTPS for 1 year (HSTS) |
| X-Frame-Options: SAMEORIGIN | Prevents clickjacking attacks |
| X-Content-Type-Options: nosniff | Prevents MIME type sniffing attacks |
| server\_tokens off | Hides Nginx version from HTTP response headers |
| limit\_req zone=n8n\_limit | Rate limits to 10 requests/second per IP — blocks brute force |
| return 301 https:// | Permanently redirects all HTTP to HTTPS |

```bash
sudo nginx -t &&
sudo systemctl reload nginx
```

Verify the security headers are present:

```bash
curl -I https://[YOUR_DOMAIN]
```

## **Troubleshooting — Phase 5**

### **Certbot fails with "Timeout during connect (likely firewall problem)"**

This means the GCP-level firewall is blocking port 80\. This is separate from UFW. Go to GCP Console → Compute Engine → VM instances → click the VM → scroll to Network interfaces → verify the VM has the http-server and https-server network tags. If missing, go to VPC Network → Firewall and confirm the default-allow-http and default-allow-https rules exist and target those tags. Alternatively, on the VM details page, check the Firewall section under the instance — both Allow HTTP traffic and Allow HTTPS traffic should be checked.

### **nginx \-t returns unknown directive "limit\_req"**

This means the limit\_req\_zone line was added outside the http { } block. Open /etc/nginx/nginx.conf, find the http { line, and add the limit\_req\_zone directive as the very first line inside that block.

| PHASE 6  Configure DNS — Point Subdomain to VM *Create the DNS A record that maps your subdomain to the VM's static IP.* |
| :---- |

| ⚠  WARNING This phase should be done BEFORE running the Certbot command in Phase 5, Step 5.4. Let's Encrypt needs DNS to resolve to your VM's IP to complete domain validation. Do Phases 5.1–5.3 first, then do Phase 6, wait for DNS propagation, then do Phase 5.4. |
| :---- |

## **Step 6.1 — Get Your VM's Static IP**

```bash
curl -s ifconfig.me
```

This returns your VM's public IP address. Confirm it matches the External IP shown in GCP Console → VM instances.

## **Step 6.2 — Add the DNS A Record**

24. Log in to your domain registrar or DNS provider's control panel.

25. Navigate to the DNS management section for your domain.

26. Add a new DNS record with the following details:

| Field | Value |
| :---- | :---- |
| Type | A |
| Name/Host | n8n (This creates \[YOUR\_DOMAIN\]) |
| Target/Value/IPv4 address | Your VM's static IP from Step 6.1 |
| TTL | Default or Auto |

27. Save the record.

| ✖  CRITICAL If your DNS provider offers a proxy service (like Cloudflare's "orange cloud"), ensure the record is set to "DNS only" (unproxied). Proxied records change the IP that Let's Encrypt sees during certificate validation, which will cause Certbot to fail. |
| :---- |

## **Step 6.3 — Verify DNS Propagation**

```bash
dig [YOUR_DOMAIN] \+short
```

This should return your VM's IP address. If it returns nothing or a different IP, wait a few minutes and try again. DNS changes can take anywhere from a few minutes to a few hours to propagate depending on your provider.

Only proceed to Certbot (Phase 5, Step 5.4) once this command returns your correct VM IP.

## **Troubleshooting — Phase 6**

### **dig returns nothing after 10+ minutes**

Verify the A record was saved correctly in your DNS provider's dashboard — go back to DNS settings and confirm the record exists with the correct IP. Also confirm you are querying the right subdomain name. Check for typos.

### **dig returns a different IP instead of your VM IP**

If your DNS provider uses proxying (e.g., Cloudflare), the record might be set to proxied. Edit the record and ensure it is set to "DNS only" (unproxied). Wait a few minutes and re-check.

| PHASE 7  Set Up n8n — First Workflow *Create your n8n account and build a test workflow to confirm the stack is working end to end.* |
| :---- |

## **Step 7.1 — Set Up Your n8n Owner Account**

Open https://\[YOUR\_DOMAIN\] in your browser. You should see the n8n "Set up owner account" page served over HTTPS (padlock visible in the address bar).

29. Enter your email address

30. Enter your first and last name

31. Set a strong password (16+ characters)

32. Click Next and complete any additional setup prompts

33. Activate the Community Edition if prompted — a code will be sent to your email

| ℹ  NOTE n8n's newer versions use their own internal account system rather than the N8N\_BASIC\_AUTH settings in docker-compose.yml. The account you create on this screen is your primary login. Store the password securely. |
| :---- |

## **Step 7.2 — Understanding External AI in n8n**

The e2-micro cannot run local LLMs. Connect to external AI APIs instead. n8n has built-in nodes for:

* **Google Gemini** — Gemini 1.5 Flash is free up to 15 requests/minute and 1 million tokens/day via Google AI Studio. No billing required for the free tier.

* **OpenAI** — Requires a paid API key. Integrates via n8n's built-in OpenAI node.

* **Anthropic (Claude)** — Requires a paid API key. Integrates via n8n's Anthropic node or HTTP Request node.

* **HTTP Request node** — Connects to any REST API. Use this for any AI provider not natively supported by n8n.

| 💡 TIP Google Gemini API free tier is the best fit for this zero-cost setup. Get a free API key at aistudio.google.com — no credit card required. |
| :---- |

## **Step 7.3 — Build a Test Workflow**

This workflow tests that n8n is running, can execute logic, and can reach an external API.

34. Click \+ New workflow on the n8n canvas

35. Click \+ → search for Manual Trigger → add it

36. Click \+ → search for HTTP Request → add it

37. In the HTTP Request node, configure:

    * Method: POST

    * URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR\_GEMINI\_API\_KEY

    * Body Content Type: JSON

    * Body: { "contents": \[{ "parts": \[{ "text": "What is n8n? Answer in 2 sentences." }\] }\] }

38. Connect Manual Trigger → HTTP Request

39. Click Test workflow → click the Manual Trigger's Test step button

The HTTP Request node should return a 200 response with a JSON body containing Gemini's answer. This confirms n8n is running correctly and outbound internet access works from the VM.

## **Troubleshooting — Phase 7**

### **Browser cannot reach https://n8n.yourdomain.com**

Check: (1) docker compose ps shows n8n as Up; (2) sudo systemctl status nginx shows active; (3) dig \[YOUR\_DOMAIN\] \+short returns your VM's IP address.

### **HTTP Request node returns 403 or API key error**

Verify the Gemini API key is correct and was generated from aistudio.google.com. Ensure the key is pasted in the URL with no extra spaces. The free tier key works without any billing setup.

### **n8n shows login page instead of setup page**

The owner account was already created. Log in with your email and password. If you forgot the password, reset n8n completely: docker compose down → docker volume rm n8n\_data → docker volume create n8n\_data → docker compose up \-d. This wipes all n8n data and restarts fresh.

# **Quick Reference**

## **Essential Commands**

| Task | Command |
| :---- | :---- |
| Check container status | docker compose ps |
| View n8n logs | docker compose logs n8n |
| Follow n8n logs live | docker compose logs \-f n8n |
| Restart n8n | docker compose restart n8n |
| Stop n8n | docker compose down |
| Start n8n | docker compose up \-d |
| Check disk usage | df \-h |
| Check RAM and swap usage | free \-h |
| Check swap is active | swapon \--show |
| Check container resource usage | docker stats |
| Check fail2ban SSH status | sudo fail2ban-client status sshd |
| Check UFW firewall status | sudo ufw status verbose |
| Test Nginx config | sudo nginx \-t |
| Reload Nginx | sudo systemctl reload nginx |
| View Nginx error log | sudo tail \-f /var/log/nginx/error.log |

## **File Locations**

| Resource | Path |
| :---- | :---- |
| Docker Compose file | \~/n8n-stack/docker-compose.yml |
| Nginx site config | /etc/nginx/sites-available/n8n |
| Nginx main config | /etc/nginx/nginx.conf |
| SSL Certificate | /etc/letsencrypt/live/\[YOUR\_DOMAIN\]/fullchain.pem  |
| SSL Private Key | /etc/letsencrypt/live/\[YOUR\_DOMAIN\]/privkey.pem  |
| Let's Encrypt renewal config | /etc/letsencrypt/renewal/\[YOUR\_DOMAIN\].conf  |
| fail2ban SSH jail config | /etc/fail2ban/jail.d/sshd-custom.conf |
| SSH daemon config | /etc/ssh/sshd\_config |
| Swap file | /swapfile |
| Nginx access log | /var/log/nginx/access.log |
| Nginx error log | /var/log/nginx/error.log |
| Let's Encrypt log | /var/log/letsencrypt/letsencrypt.log |
| Auth log (fail2ban watches) | /var/log/auth.log |

## **Free AI APIs Compatible with n8n**

| Provider | Details |
| :---- | :---- |
| Google Gemini 1.5 Flash | Free — 15 req/min, 1M tokens/day. Get key at aistudio.google.com |
| Google Gemini 1.5 Pro | Free — 2 req/min, 50 req/day. Get key at aistudio.google.com |
| Groq (Llama, Mistral, Gemma) | Free tier with fast inference. console.groq.com |
| Together AI | Free $1 credit on signup. api.together.xyz |
| Hugging Face Inference API | Free for public models. huggingface.co/inference-api |
| OpenRouter (free models) | Select models free. openrouter.ai |

## **Security Posture Summary**

| Layer | Configuration |
| :---- | :---- |
| GCP Firewall | Ports 80 and 443 only — HTTP/HTTPS |
| UFW Firewall | Ports 22, 80, 443 only — all else denied inbound |
| fail2ban | SSH: 5 failed attempts triggers 1-hour IP ban |
| Root SSH Login | Disabled via PermitRootLogin no in sshd\_config |
| n8n Port Exposure | Bound to 127.0.0.1:5678 only — never directly public |
| Memory Cap | NODE\_OPTIONS limits n8n to 512 MB — prevents OOM on e2-micro |
| Swap | 1 GB swap file — prevents OS killing n8n under brief memory pressure |
| HTTPS | Let's Encrypt TLS — auto-renewing every 90 days |
| HSTS | Strict-Transport-Security: 1 year — browsers force HTTPS permanently |
| Security Headers | X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy |
| Rate Limiting | Nginx: 10 req/s per IP with burst of 20 — blocks brute force |
| Unattended Upgrades | Security patches applied automatically in background |

# **Appendix: GCP Always Free Tier — Full Product Reference**

This appendix documents every GCP Always Free product with monthly usage limits that never expire. These are complementary services you can integrate with your n8n instance at zero additional cost.

| ⚠  WARNING Source: Official GCP documentation at docs.cloud.google.com/free/docs/free-cloud-features — verified March 2026\. These limits are subject to change with 30 days notice from Google. Always verify current limits on the official page before designing a project around them. |
| :---- |

## **Your VM in the Always Free Table**

| ✔  SUCCESS This guide already uses the Always Free Compute Engine tier: 1 e2-micro VM in us-central1, 30 GB standard persistent disk, 1 GB outbound transfer/month. These are the exact limits GCP grants permanently at no cost. Every other product in the table below is an additional free resource you can layer on top of this setup. |
| :---- |

## **Complete Always Free Tier Table**

Source: Google Cloud Free Program documentation. All limits are per billing account per month unless otherwise noted.

| Product | Always Free Limit | Relevance to This n8n Stack |
| :---- | :---- | :---- |
| Compute Engine | 1 e2-micro VM/month (us-west1, us-central1, us-east1 only) 30 GB standard persistent disk 1 GB outbound transfer/month (North America only) | ✅ THIS GUIDE — Already in use. Hosts your n8n instance at $0/month. |
| Cloud Storage | 5 GB regional storage (US regions only) 5,000 Class A Ops/month 50,000 Class B Ops/month 100 GB outbound transfer/month (excl. China/Australia) | ✅ Useful — store n8n workflow exports, backups, or files processed by workflows. |
| BigQuery | 1 TiB queries/month 10 GiB storage/month | ✅ Useful — store and query n8n workflow logs or event data at scale for free. |
| Cloud Run | 2M requests/month 360,000 GB-seconds memory 180,000 vCPU-seconds compute 1 GB outbound transfer/month (North America) | ✅ Useful — run serverless functions that n8n triggers via HTTP webhook. |
| Cloud Run Functions | 2M invocations/month 400,000 GB-seconds compute 200,000 GHz-seconds compute 5 GB outbound transfer/month | ✅ Useful — lightweight serverless handlers for n8n webhook triggers. |
| Firestore | 1 GiB storage/project 50,000 reads/day 20,000 writes/day 20,000 deletes/day 10 GiB outbound transfer/month | ✅ Useful — free NoSQL database for persisting workflow state or n8n output data. |
| Cloud Shell | Free access to Cloud Shell 5 GB persistent disk storage | ✅ Always useful — browser-based terminal for managing GCP resources without SSH. |
| Google Cloud Observability (Logging \+ Monitoring) | First 50 GiB log data/project/month Default retention at no cost All non-chargeable metrics 1M time series/month (Monitoring API reads) | ✅ Highly relevant — monitor VM health, Docker container status, and set billing alerts. |
| Secret Manager | 6 active secret versions/month 10,000 access operations/month 3 secret rotation notifications/month | ✅ Useful — store n8n API keys and credentials securely outside docker-compose.yml. |
| Security Command Center | Standard tier — misconfiguration scanning, vulnerability detection, compliance | ✅ SecOps relevant — free automated scanning of your GCP project security posture. |
| Pub/Sub | 10 GiB messages/month | ✅ Useful — trigger n8n workflows from GCP events (VM alerts, storage events, etc.). |
| Cloud Build | 2,500 build-minutes/month (e2-standard-2) | ✅ Useful — auto-rebuild and redeploy n8n Docker image when you update configs. |
| Artifact Registry | 0.5 GB storage/month | ⚠ Limited — enough for 1 small Docker image. Useful if customising the n8n image. |
| Cloud Source Repositories | 5 users/billing account 50 GB storage/month 50 GB outbound transfer/month | ✅ Useful — version-control your docker-compose.yml and Nginx configs privately. |
| GKE (Kubernetes Engine) | 1 free Autopilot or zonal Standard cluster/month (cluster charge only — compute billed separately) | ⚠ Advanced — overkill for a single n8n instance. Relevant for future scaling. |
| Workflows | 5,000 internal steps/month 2,000 external HTTP calls/month | ✅ Useful — GCP-native orchestration that can complement n8n automation flows. |
| Cloud Natural Language API | 5,000 units/month | ✅ Useful — free NLP (sentiment, entity extraction) callable from n8n HTTP Request nodes. |
| Cloud Vision | 1,000 units/month | ✅ Useful — free image analysis callable from n8n workflows via HTTP Request. |
| Speech-to-Text | 60 minutes/month (V1 API) | ✅ Useful — transcribe audio inputs in n8n automation flows. |
| Video Intelligence API | 1,000 units/month | Low relevance for this stack unless building video processing workflows. |
| reCAPTCHA | 10,000 assessments/month | ✅ Useful — protect n8n webhook endpoints or any forms you expose publicly. |
| Web Risk | 100,000 uri.search calls/month | ✅ SecOps relevant — check URLs in n8n security monitoring or threat-intel workflows. |
| App Engine | 28 F1 instance hours/day 9 B1 instance hours/day 1 GB outbound transfer/day | ⚠ Alternative hosting option — not needed since n8n runs on e2-micro here. |
| Agent Engine | 180,000 vCPU-seconds/month 360,000 GiB-seconds/month | ✅ Useful — run GCP AI agents that integrate with or are triggered by n8n workflows. |
| Application Integration | 400 executions/month 20 GiB data processed/month 2 free connection nodes (Google services) | ✅ Useful — GCP-native integration layer that complements n8n for Google service workflows. |
| Cloud Key Management Service | 100 active key versions/month 10,000 cryptographic operations/month (Autokey-created keys only) | ✅ SecOps relevant — encrypt secrets and API keys used in n8n credentials. |

## **Scaling Up: When to Upgrade Beyond Free Tier**

This setup runs n8n indefinitely at $0/month. The e2-micro is sufficient for personal automation, low-traffic webhooks, and scheduled workflows. There are two scenarios where you may want to upgrade:

### **Scenario A — n8n Performance Degradation**

If you notice n8n becoming slow or crashing under heavier workflow loads, the 1 GB RAM ceiling of the e2-micro is the bottleneck. Upsize to e2-small (2 GB RAM) or e2-medium (4 GB RAM) without recreating the VM:

```bash
# Resize without data loss:
# 1\. Stop the VM in GCP Console (Compute Engine → VM instances → Stop)
# 2\. Click Edit on the stopped VM
# 3\. Change Machine type to e2-small or e2-medium
# 4\. Save and Start the VM
# Docker, n8n data, Nginx config, and SSL certs are all preserved
# e2-small:  2 GB RAM — \~$13/month
# e2-medium: 4 GB RAM — \~$27/month
```

### **Scenario B — Add a Local LLM (Ollama)**

If you want to run a local LLM alongside n8n without paying for external AI API calls, you need at minimum 16 GB RAM. Upgrade to e2-standard-4 and add Ollama back:

| Machine Type | Specs | Est. Cost | Use Case |
| :---- | :---- | :---- | :---- |
| e2-micro (this guide) | 1 vCPU, 1 GB RAM | $0/month (free tier) | n8n only \+ external AI APIs |
| e2-small | 2 vCPU, 2 GB RAM | \~$13/month | n8n with more headroom |
| e2-medium | 2 vCPU, 4 GB RAM | \~$27/month | n8n \+ small Python scripts |
| e2-standard-4 | 4 vCPU, 16 GB RAM | \~$117/month | n8n \+ Ollama \+ 7-8B LLM |
| e2-standard-8 | 8 vCPU, 32 GB RAM | \~$235/month | n8n \+ Ollama \+ 13B LLM |

# **Sudo Permissions for GCP user :** 

## **Startup Script Method**

Step 1 — Go to your VM in GCP Console

* Compute Engine → VM Instances → click your VM → Edit

Step 2 — Stop the VM first  
The VM must be stopped to edit metadata safely.

Step 3 — Add the startup script  
Scroll down to Metadata section → Add item:

* Key: startup-script  
* Value:

bash

`#!/bin/bash`  
*`# Add user to the sudo group explicitly`*  
`usermod -aG sudo [YOUR_USERNAME]`

*`# Recreate the GCP sudoers drop-in file in case it's missing/corrupt`*  
`echo "%google-sudoers ALL=(ALL:ALL) NOPASSWD:ALL" > /etc/sudoers.d/google_sudoers`  
`chmod 440 /etc/sudoers.d/google_sudoers`

*`# Also add a direct user entry as a fallback`*  
`echo "[YOUR_USERNAME] ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/[YOUR_USERNAME]`  
`chmod 440 /etc/sudoers.d/[YOUR_USERNAME]`

*`# Replace sudo-rs with classic sudo`*  
`apt-get install -y sudo`

Step 4 — Save and Start the VM  
The script runs automatically as root on boot, before you log in.

Step 5 — SSH in and test

bash

`sudo whoami`  
*`# Expected output: root`*

Step 6 — Clean up (important)  
Once sudo works, remove the startup script from metadata so it doesn't re-run on every reboot:

* VM → Edit → Metadata → delete the startup-script entry → Save

---

\[Inference\] The direct /etc/sudoers.d/\[YOUR\_USERNAME\] entry is included as a belt-and-suspenders fallback in case the google-sudoers group rule is still not picked up by sudo-rs. This is expected to work but is not guaranteed — behavior depends on your exact OS image version on GCP.

# **Installing ZeroClaw**

**⚠️ Critical Free-Tier Analysis First**

Before a single command, here is the constraint check against your e2-micro:

| Factor | Your VM | Zeroclaw Requirement | Status |
| :---- | :---- | :---- | :---- |
| **RAM (runtime)** | 1 GB \+ 1 GB swap | **\< 5 MB** runtime | ✅ Safe |
| **RAM (build from source)** | \~500 MB headroom | **2–4 GB minimum** | ❌ DO NOT build from source |
| **Disk** | \~15 GB free | \~50 MB binary | ✅ Safe |
| **Port conflict** | n8n on 5678 | Gateway on 42617 | ✅ No conflict |
| **UFW changes needed** | Ports 22/80/443 | None — gateway is localhost-only | ✅ No changes |
| **GCP cost** | $0/month | No new resources | ✅ Free |

**The golden rule for your machine: always install the pre-built binary. Never run ./bootstrap.sh without \--prebuilt-only, and never run cargo build. A source build will exhaust your RAM and OOM-kill both Zeroclaw AND n8n.**[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

**Objective**

Install Zeroclaw on your existing n8n-freetier VM (Ubuntu 22.04, e2-micro, us-central1) **without affecting n8n**, using the pre-built binary to stay within the 1 GB RAM hard limit.

**What We Are Building**

Internet  
    │  
   443 (HTTPS)  
    │  
  Nginx  ← existing, handling n8n SSL  
    │  
  ┌──────────────────────────────────┐  
  │  VM (e2-micro)                   │  
  │  ├── n8n container  :5678        │  
  │  └── zeroclaw daemon :42617      │  ← new, localhost-only  
  └──────────────────────────────────┘

Zeroclaw's gateway binds to 127.0.0.1:42617 by default — just like n8n's 127.0.0.1:5678 — so nothing is exposed to the internet.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

**Prerequisites**

* SSH into your VM via GCP Console → VM instances → SSH

* n8n is already running (docker compose ps shows it as Up)

* You have sudo access

**Step 1 — Verify Resources Before Starting**

**Description:** Confirm you have enough free RAM and disk before proceeding.

**Why:** The e2-micro has 1 GB RAM. n8n occupies 200–400 MB. You must confirm there is headroom before adding any new process.[\[2\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.oxymqxocinna)

\# Check RAM and swap  
free \-h

\# Check disk  
df \-h /

\# Confirm n8n is healthy  
cd \~/n8n-stack && docker compose ps

**Expected result:**

* free \-h shows \~500–700 MB used, with \~300–500 MB available \+ 1 GB swap

* df \-h / shows at least 4 GB free (you need \~200 MB for the install itself)

* docker compose ps shows n8n as Up

**Cost/free-tier check:** This is read-only diagnostics. Zero cost impact.

**Pause here and run Step 1\. Reply with: Done, Need help, or paste the exact output.**

**Step 2 — Install Build Essentials (Lightweight)**

**Description:** Install curl and tar which are needed to download and extract the pre-built binary.

**Why:** The pre-built binary approach skips Rust entirely. You only need curl to download it and tar to extract it. Both are tiny and already likely installed, but this command is idempotent.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

sudo apt install \-y curl tar

**Expected result:** Either packages are installed fresh, or output says already the newest version. Either is correct.

**Cost/free-tier check:** These are base Ubuntu packages. No disk concern — curl and tar are under 5 MB combined.

**Pause here. Reply with: Done, Need help, or paste the exact error.**

**Step 3 — Download the Pre-Built Binary**

**Description:** Download the Zeroclaw pre-built binary directly from the official GitHub releases page for x86\_64 Linux (your VM's architecture).

**Why:** This bypasses cargo build entirely. The pre-built binary is \~8.8 MB. Your VM's architecture is x86\_64 because GCP e2-micro is Intel/AMD.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

\# Move to home directory  
cd \~

\# Download the latest pre-built binary for x86\_64 Linux  
curl \-fsSLO https://github.com/zeroclaw-labs/zeroclaw/releases/latest/download/zeroclaw-x86\_64-unknown-linux-gnu.tar.gz

\# Verify the file downloaded  
ls \-lh zeroclaw-x86\_64-unknown-linux-gnu.tar.gz

**Command breakdown:**

40. curl \-fsSL — fail silently on error (\-f), suppress progress bars (\-sS), follow redirects (\-L)

41. \-O — save the file with its original filename

42. The filename zeroclaw-x86\_64-unknown-linux-gnu.tar.gz is the standard Rust binary target triple for Intel/AMD 64-bit Linux[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

**Expected result:** File downloaded, size shown as approximately 8–12 MB.

**Cost/free-tier check:** This is a single outbound download from GitHub. Counts against your 1 GB egress allowance but uses only \~10 MB. No billing risk.

**Pause here. Reply with: Done, Need help, or paste the exact error.**

**Step 4 — Extract and Install the Binary**

**Description:** Extract the archive and install the binary to /usr/local/bin so it is available system-wide.

**Why:** /usr/local/bin is in every user's $PATH on Ubuntu. Installing here means you can run zeroclaw from any directory without any PATH changes.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

\# Extract the archive  
tar xzf zeroclaw-x86\_64-unknown-linux-gnu.tar.gz

\# See what was extracted  
ls \-lh zeroclaw\*

\# Install the binary system-wide  
sudo install \-m 0755 zeroclaw /usr/local/bin/zeroclaw

\# Verify it is accessible  
zeroclaw \--version

**Command breakdown:**

* tar xzf — extract (x), decompress gzip (z), from file (f)

* install \-m 0755 — copy the file and set permissions to executable by owner, readable/executable by group and others

* /usr/local/bin/zeroclaw — the installation destination in PATH

**Expected result:**

zeroclaw 0.1.7

(or the current latest version number)

**Cost/free-tier check:** Installing a binary to /usr/local/bin uses \~9 MB of disk. No billing impact.

**Pause here. Reply with: Done, Need help, or paste the exact output.**

**Step 5 — Run System Diagnostics**

**Description:** Run Zeroclaw's built-in doctor to confirm the environment is ready.

**Why:** zeroclaw doctor checks that required dependencies are present and reports any missing components before you start configuring.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

zeroclaw doctor

**Expected result:** A status table showing components as ✅ OK. It may flag that no config exists yet — that is expected since we haven't onboarded yet.

**Pause here. Reply with: Done, Need help, or paste the exact output.**

**Step 6 — Onboard Zeroclaw (Interactive Setup)**

**Description:** Run the interactive onboarding wizard to configure your AI provider, memory backend, and gateway settings.

**Why:** zeroclaw onboard \--interactive walks you through every configuration option and writes \~/.zeroclaw/config.toml. You must choose an external AI provider here — **do NOT configure Ollama or any local LLM**, as the e2-micro cannot run them.[\[2\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.oxymqxocinna)[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

zeroclaw onboard \--interactive

**During the wizard, use these settings:**

| Prompt | Recommended Value | Reason |
| :---- | :---- | :---- |
| **AI Provider** | openrouter or openai or gemini | Use the same API you already use with n8n |
| **API Key** | Your existing key | Reuse what you have |
| **Model** | openrouter/auto or gemini-1.5-flash | Free-tier compatible models |
| **Memory backend** | sqlite | Lightweight, no external DB needed |
| **Gateway host** | 127.0.0.1 (default) | **Keep this — do NOT change to 0.0.0.0** |
| **Gateway port** | 42617 (default) | No conflict with n8n's 5678 |
| **Autonomy level** | supervised | Safer for a shared VM |
| **Runtime kind** | native | Docker mode is optional; native uses less memory |

💡 **Tip:** If you already have a free Gemini API key from Google AI Studio (used in n8n), you can reuse it here with provider gemini.[\[2\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.oxymqxocinna)

**Expected result:** Wizard completes and says config saved to \~/.zeroclaw/config.toml.

**Cost/free-tier check:** No GCP resources are created. AI API calls go outbound over the internet — counts against your 1 GB/month egress allowance, but typical conversational usage is well under this limit.

**Pause here. Reply with: Done, Need help, or paste the exact output.**

**Step 7 — Verify the Config**

**Description:** Inspect the generated config to confirm gateway is bound to localhost and runtime is native.

**Why:** You need to confirm the security-critical binding before starting the daemon.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

\# View the config  
cat \~/.zeroclaw/config.toml

\# Quick check: confirm localhost binding  
grep \-E "host|port|kind" \~/.zeroclaw/config.toml

**Expected output (key lines):**

\[gateway\]  
port \= 42617  
host \= "127.0.0.1"    ← MUST be 127.0.0.1, not 0.0.0.0

\[runtime\]  
kind \= "native"       ← MUST be native, not docker (unless you chose docker)

⚠️ **WARNING:** If host shows 0.0.0.0, edit the config immediately: nano \~/.zeroclaw/config.toml and change it to 127.0.0.1. A public-facing gateway with no firewall rule is a security risk.

**Pause here. Reply with: Done, Need help, or paste the relevant config lines.**

**Step 8 — Test the Agent**

**Description:** Run a quick one-shot agent message to confirm Zeroclaw can reach your AI provider and respond.

**Why:** This confirms end-to-end connectivity: binary → config → API key → AI provider → response.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

zeroclaw agent \-m "Hello\! What is today's date and time?"

**Expected result:** Zeroclaw responds with a message from your configured AI provider.

**Pause here. Reply with: Done, Need help, or paste the exact output.**

**Step 9 — Install as a Systemd Service**

**Description:** Register Zeroclaw as a persistent background service so it survives VM reboots alongside n8n.

**Why:** n8n uses Docker's restart: unless-stopped policy. Zeroclaw uses systemd user-level service for the same effect — automatic startup on reboot, no manual intervention needed.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

\# Install the systemd user service  
zeroclaw service install

\# Start the service  
zeroclaw service start

\# Check status  
zeroclaw service status

\# Verify it is running  
zeroclaw status

**Command breakdown:**

* zeroclaw service install — creates a systemd user unit file at \~/.config/systemd/user/zeroclaw.service

* zeroclaw service start — starts the daemon now

* zeroclaw status — shows full runtime status including gateway, memory, channels

**Expected result from zeroclaw status:**

Gateway:  running on 127.0.0.1:42617  
Memory:   sqlite (auto-save: on)  
Service:  active (running)

**Cost/free-tier check:** Zeroclaw daemon uses \<5 MB RAM at runtime. With n8n using \~200–400 MB, total is still well within the 1 GB \+ 1 GB swap envelope. No GCP billing impact.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

**Pause here. Reply with: Done, Need help, or paste the exact output.**

**Step 10 — Verify Both Services Coexist**

**Description:** Confirm n8n and Zeroclaw are both running and using separate resources without conflict.

**Why:** This is the final health check before you consider the installation complete.[\[2\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.oxymqxocinna)[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

\# Check n8n is still healthy  
cd \~/n8n-stack && docker compose ps

\# Check Zeroclaw service  
zeroclaw service status

\# Check total memory usage  
free \-h

\# Check disk usage  
df \-h /

\# Optional: see per-process RAM usage  
docker stats \--no-stream

**Expected result:**

* n8n: Up X minutes — unchanged

* Zeroclaw: active (running)

* RAM: still within comfortable bounds (under 900 MB used including swap)

**Pause here. Reply with: Done, Need help, or paste the exact output.**

**Concepts Learned**

* **Pre-built binary vs. source build** — Rust compilation is RAM-hungry at build time (2–4 GB), but the resulting binary is tiny at runtime (\<5 MB). Always use pre-built binaries on constrained machines.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

* **Port isolation** — Zeroclaw gateway defaults to 127.0.0.1:42617, identical security posture to n8n's 127.0.0.1:5678. Neither is directly internet-accessible.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

* **Systemd user services** — Unlike Docker's restart: unless-stopped, Zeroclaw uses a systemd user unit. Both achieve the same outcome: automatic restart on reboot.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

* **Trait-driven provider architecture** — Zeroclaw's AI provider, memory, channels, and tools are all swappable via config.toml. You can switch from Gemini to OpenRouter with one line change and a service restart.[\[1\]](https://docs.google.com/document/d/1eF6aTNWVQue-_kLKYjRGMlYv4Lc6mB0B/edit#bookmark=id.yhpu8hd45rsg)

**Quick Reference**

| Task | Command |
| :---- | :---- |
| Start Zeroclaw | zeroclaw service start |
| Stop Zeroclaw | zeroclaw service stop |
| Check status | zeroclaw status |
| View logs | journalctl \--user \-u zeroclaw \-f |
| Chat with agent | zeroclaw agent |
| Edit config | nano \~/.zeroclaw/config.toml |
| Restart after config change | zeroclaw service restart |
| Check n8n still running | cd \~/n8n-stack && docker compose ps |

**Optional Next Step — Expose Gateway via Nginx**

If you later want to reach the Zeroclaw gateway from outside the VM (for webhooks), add a new Nginx server block pointing to 127.0.0.1:42617, exactly like the existing n8n block points to 127.0.0.1:5678. You would create a new subdomain (e.g., zeroclaw.\[YOUR\_ROOT\_DOMAIN\]), add a DNS record, and issue a new Let's Encrypt certificate with Certbot.

\[Inference\] This optional step follows the exact same pattern as Phase 5 and Phase 6 in your existing guide — no new concepts are required.

*End of Guide*