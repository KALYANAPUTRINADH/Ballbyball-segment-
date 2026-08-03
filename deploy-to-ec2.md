# Complete AWS Deployment Guide (Frontend & Backend)

This guide covers deploying the full application (React frontend + Express/NodeMediaServer backend) to Amazon EC2 and connecting your domain name (`streamlify.in`).

## 1. Export Your Code
1. Click the **Settings** menu in the top right of this editor.
2. Select **Export to GitHub** (recommended) or **Export as ZIP**.

## 2. Launch an AWS EC2 Instance
1. Go to the [AWS EC2 Console](https://console.aws.amazon.com/ec2/).
2. Click **Launch instances**.
3. **Name:** `streamlify-server`
4. **OS (AMI):** Ubuntu 24.04 LTS
5. **Instance Type:** `t3.medium` (Recommended for video streaming & building).
6. **Key Pair:** Create a new key pair (`streamlify.pem`) and download it.
7. **Network Settings (Security Group):**
   - Allow **SSH** (Port 22)
   - Allow **HTTP** (Port 80)
   - Allow **HTTPS** (Port 443)
   - Add Custom TCP Rule: **Port 1935** (For OBS RTMP Streaming)
   - Add Custom TCP Rule: **Port 8001** (Optional, for NMS HTTP/WebSocket streaming)
8. Click **Launch instance**.

## 3. Connect Domain Name (streamlify.in)
1. Go to your Domain Registrar (e.g., GoDaddy, Hostinger, Namecheap).
2. Find the **DNS Settings / Manage DNS**.
3. Add an **A Record**:
   - **Name:** `@`
   - **Value:** `<YOUR_EC2_PUBLIC_IP>` (Get this from the AWS Console)
   - **TTL:** Default/Auto

## 4. Setup Server Environment
Connect to your EC2 instance via SSH:
```bash
chmod 400 streamlify.pem
ssh -i "streamlify.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

Install the necessary dependencies (Node.js, Git, Nginx, Certbot):
```bash
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git, Nginx, and Certbot
sudo apt install -y git nginx certbot python3-certbot-nginx

# Install PM2 for keeping the app running
sudo npm install -g pm2
```

## 5. Clone and Build the Application
```bash
# Clone your repository (Replace with your actual GitHub URL)
git clone https://github.com/your-username/streamlify.git
cd streamlify

# Install dependencies
npm install

# Build the frontend and backend bundle
npm run build
```

## 6. Start the Backend Server
Use PM2 to run the built Node server in the background:
```bash
NODE_ENV=production pm2 start dist/server.cjs --name "streamlify"
pm2 save
pm2 startup
```

## 7. Setup Nginx as a Reverse Proxy (for Port 80 & 443)
Configure Nginx to route traffic to your Node.js app:
```bash
sudo tee /etc/nginx/sites-available/streamlify > /dev/null << 'EOF'
server {
    listen 80;
    server_name streamlify.in www.streamlify.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # For WebSocket connections (Live scoring, Video feeds)
    location /live {
        proxy_pass http://localhost:8001/live;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/streamlify /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Enable HTTPS / SSL Security
Run Certbot to get a free SSL certificate:
```bash
sudo certbot --nginx -d streamlify.in -d www.streamlify.in
```

## 9. Connect OBS Studio
Now that your app is live at `https://streamlify.in`, open OBS Studio:
1. Go to **Settings > Stream**.
2. **Service:** Custom...
3. **Server:** `rtmp://streamlify.in/live`
4. **Stream Key:** (Copy your stream key from the Match Streamer view in the app)
5. Click **Start Streaming**!
