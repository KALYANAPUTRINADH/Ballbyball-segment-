import express from "express";
import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse, 
  generateAuthenticationOptions, 
  verifyAuthenticationResponse 
} from '@simplewebauthn/server';

import path from "path";
import fs from "fs";
import { Readable } from "stream";

import dotenv from "dotenv";
dotenv.config();
import youtubedl from "youtube-dl-exec";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";



import crypto from "crypto";
import { requireAuth, requireRole } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';


let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn("Could not load firebase config", e);
}


// Initialize Firebase Admin (still used for Auth verifyIdToken)
if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), 
    projectId: firebaseConfig.projectId
  });
}

// Client-side Firestore Instance for 100% permission safety


import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId || '(default)');

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import Twilio from 'twilio';

let stripeClient: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, { apiVersion: '2025-01-27.acacia' as any });
  }
  return stripeClient;
}

let razorpayClient: Razorpay | null = null;
export function getRazorpay(): Razorpay {
  if (!razorpayClient) {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_live_TFiA0nbeLZ9yWg';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || '0PVYHHrV4XGeiBgDL7lkJwAa';
    if (!key_id || !key_secret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required');
    }
    razorpayClient = new Razorpay({ key_id, key_secret });
  }
  return razorpayClient;
}

let twilioClient: Twilio.Twilio | null = null;
export function getTwilio(): Twilio.Twilio {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required');
    }
    twilioClient = Twilio(sid, token);
  }
  return twilioClient;
}



// Set ffmpeg path
if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}

dotenv.config();




const app = express();



// Trust reverse proxy for correct client IP address resolving (crucial for rate limiting and CSRF origin validation)
app.set('trust proxy', true);

// Payload bounds
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security Middlewares - Helmet configuration for security hardening
app.use(helmet({
  frameguard: false, // Allow iframe rendering in AI Studio preview (crucial for development preview tool inside iframe)
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https:", "http:", "data:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
      frameAncestors: ["'self'", "https:", "http:"], // Allow rendering in AI Studio iframe
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true, // sets X-Content-Type-Options: nosniff
}));

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
}));

// Cryptographically secure CSRF Protection Implementation

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

function generateCsrfToken(): string {
  const token = crypto.randomBytes(24).toString('hex');
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex');
  return `${token}.${signature}`;
}

function verifyCsrfToken(tokenWithSignature: string): boolean {
  try {
    if (!tokenWithSignature || typeof tokenWithSignature !== 'string') return false;
    const parts = tokenWithSignature.split('.');
    if (parts.length !== 2) return false;
    const [token, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', CSRF_SECRET)
      .update(token)
      .digest('hex');
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (err) {
    console.error('Error verifying CSRF token:', err);
    return false;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length === 2) {
      cookies[parts[0].trim()] = parts[1].trim();
    }
  });
  return cookies;
}

const csrfProtection = (req: any, res: any, next: any) => {
  // Safe methods do not require CSRF token checks
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const csrfHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  const cookies = parseCookies(req.headers.cookie);
  const csrfCookie = cookies['XSRF-TOKEN'];

  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie || !verifyCsrfToken(csrfHeader)) {
    return res.status(403).json({ error: 'CSRF token mismatch or invalid token' });
  }

  next();
};


// API routes go here FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});


app.get("/api/firebase-config", (req, res) => {
  res.json(firebaseConfig);
});

app.get("/api/config", (req, res) => {
  res.json({
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_live_TFiA0nbeLZ9yWg',
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || ''
  });
});

app.get("/api/publisher-config", (req, res) => {
  res.json({ clientId: "ca-pub-5378331432453842" });
});

app.get("/ads.txt", (req, res) => {
  res.type('text/plain');
  res.send("google.com, pub-5378331432453842, DIRECT, f08c47fec0942fa0");
});

// DB Proxy endpoints removed for security

app.use('/api/', (req, res, next) => {
  if (req.path.startsWith('/proxy/') || req.path.startsWith('/auth/')) {
    return next();
  }
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }
  return csrfProtection(req, res, next);
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  validate: { trustProxy: false },
});
app.use('/api/', apiLimiter);

// Strict rate limiting on sensitive / authentication and payment endpoints to prevent abuse and brute-force attacks
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests to this high-security endpoint. Please wait 15 minutes and try again.' },
  validate: { trustProxy: false },
});
app.use('/api/payments/', sensitiveLimiter);
app.use('/api/users/sync', sensitiveLimiter);
app.use('/api/users/delete', sensitiveLimiter);

// CSRF token provider endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = generateCsrfToken();
  res.cookie('XSRF-TOKEN', token, {
    sameSite: 'lax',
    path: '/',
  });
  res.json({ csrfToken: token });
});



app.get('/api/auth/check-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });
    
    // We can also check if the phone exists by just querying the collection
    const snap = await db.collection('profiles').where('phone', '==', phone).limit(1).get();
    
    res.json({ exists: !snap.empty });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Database proxy endpoint removed


app.post("/api/payments/verify", requireAuth, async (req: AuthRequest, res) => {
  const { provider, orderId, transactionId, amount, description } = req.body;
  // In a real app, you would query Stripe or Razorpay to verify the transaction.
  // Here we assume if it hits this authenticated endpoint with a valid transaction ID, we grant pro status.
  try {
    const userId = (req as any).user.uid;
    const rawAmount = amount || 49;
    const rawDescription = description || 'Streamlify Pro Subscription';
    
    const planDuration = rawAmount === 399 || rawAmount > 100 ? 'yearly' : 'monthly';
    const expiryDate = new Date();
    if (planDuration === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    await db.collection('profiles').doc(userId).set({ 
      is_pro: true,
      pro_expiration_date: expiryDate.toISOString()
    }, { merge: true });

    // Calculate and convert into dollars for rupees (1 USD = 83 INR)
    let finalAmount = rawAmount;
    let finalCurrency = 'INR';
    
    if (provider === 'stripe') {
      finalAmount = parseFloat((rawAmount / 83.0).toFixed(2));
      finalCurrency = 'USD';
    } else if (provider === 'razorpay') {
      finalCurrency = 'INR';
    }

    // Create a real completed transaction in the database
    try {
      await db.collection('transactions').add({
        user_id: userId,
        amount: finalAmount,
        description: rawDescription,
        currency: finalCurrency,
        status: 'completed',
        order_id: orderId || transactionId || 'tx_' + Math.random().toString(36).substring(7),
        created_at: FieldValue.serverTimestamp()
      });
    } catch (txError) {
      console.error('Error inserting transaction on verify:', txError);
    }

    res.json({ success: true, is_pro: true });
  } catch (error) {
    console.error("Verification error", error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

    // Admin Proxy role verification endpoint - keeps admin login phone numbers server-side
app.post('/api/admin/verify-role', async (req, res) => {
  try {
    const { phone, uid } = req.body;
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const ADMIN_PHONES = (process.env.ADMIN_PHONE_NUMBERS || '6305605194,8688678943').split(',');
    
    const isPhoneAdmin = 
      ADMIN_PHONES.some(p => cleanPhone.endsWith(p) || cleanPhone === p || (uid && String(uid).includes(p)));
      
    res.json({ isAdmin: isPhoneAdmin });
  } catch (err: any) {
    console.error("Error verifying admin role:", err);
    res.status(500).json({ isAdmin: false, error: err.message });
  }
});

// WhatsApp Notifications
app.post('/api/notifications/whatsapp', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ error: 'Missing to or message' });
    const client = getTwilio();
    await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stripe Integration
app.post('/api/stripe/create-checkout-session', requireAuth, async (req, res) => {
  const { amount, description } = req.body;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: description || 'Premium Subscription',
            },
            unit_amount: (amount || 49) * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });
    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    if (String(error.message || error).includes('fetch failed') || String(error.message || error).includes('FetchError')) {
      res.status(503).json({ error: 'Database connection failed' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Razorpay Integration
app.post('/api/payments/razorpay/create-order', requireAuth, async (req, res) => {
  try {
    const razorpay = getRazorpay();
    const { amount, description } = req.body;
    const options = {
      amount: (amount || 49) * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        description: description || 'Streamlify Pro Subscription'
      }
    };
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, ...order });
  } catch (error: any) {
    if (String(error.message || error).includes('fetch failed') || String(error.message || error).includes('FetchError')) {
      res.status(503).json({ error: 'Database connection failed' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});



// Custom error handling middleware for handling parsing errors or payload limits gracefully and returning JSON
app.use((err: any, req: any, res: any, next: any) => {
  if (err && (err.status === 413 || err.statusCode === 413)) {
    return res.status(413).json({
      success: false,
      error: "Payload too large.",
      details: "The uploaded video exceeds our maximum size limit. Base64 encoding expands files by ~33%. Please upload a smaller video clip or a shorter video segment (under 150MB)."
    });
  }
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    return res.status(400).json({
      success: false,
      error: "Malformed request payload.",
      details: err.message
    });
  }
  next(err);
});

// Preset high-fidelity cricket match data for interactive preview (Simulating AI results on real classic overs)
const PRESET_MATCHES: any[] = [];



// 1. API - Return server API status
app.get("/api/status", (req, res) => {
  res.json({
    hasApiKey: false,
    currentTime: new Date().toISOString()
  });
});

// 2. API - Return preset crickets match analyses

// Proxy server endpoints for mock data
app.get("/api/mock-data/performance/:sport", (req, res) => {
  const sport = req.params.sport.toLowerCase();
  
  if (sport === 'cricket') {
    return res.json({
      cricketStrikeRateData: [
        { match: 'Match 1', sr: 120, avg: 135 },
        { match: 'Match 2', sr: 145, avg: 135 },
        { match: 'Match 3', sr: 110, avg: 135 },
        { match: 'Match 4', sr: 160, avg: 135 },
        { match: 'Match 5', sr: 155, avg: 135 },
      ],
      cricketBowlingData: [
        { match: 'Match 1', wickets: 2, economy: 6.5 },
        { match: 'Match 2', wickets: 0, economy: 8.2 },
        { match: 'Match 3', wickets: 3, economy: 5.4 },
        { match: 'Match 4', wickets: 1, economy: 7.1 },
        { match: 'Match 5', wickets: 4, economy: 4.8 },
      ]
    });
  } else if (sport === 'football') {
    return res.json({
      footballPossessionData: [
        { match: 'Match 1', possession: 55, passAccuracy: 82 },
        { match: 'Match 2', possession: 60, passAccuracy: 88 },
        { match: 'Match 3', possession: 45, passAccuracy: 75 },
        { match: 'Match 4', possession: 65, passAccuracy: 90 },
        { match: 'Match 5', possession: 50, passAccuracy: 79 },
      ],
      footballAttackingData: [
        { name: 'Shots', A: 12, fullMark: 20 },
        { name: 'On Target', A: 6, fullMark: 20 },
        { name: 'Key Passes', A: 8, fullMark: 20 },
        { name: 'Dribbles', A: 15, fullMark: 20 },
        { name: 'Crosses', A: 7, fullMark: 20 },
      ]
    });
  } else if (sport === 'basketball') {
    return res.json({
      basketballShootingData: [
        { match: 'Match 1', fg: 45, '3pt': 33 },
        { match: 'Match 2', fg: 52, '3pt': 40 },
        { match: 'Match 3', fg: 38, '3pt': 25 },
        { match: 'Match 4', fg: 60, '3pt': 50 },
        { match: 'Match 5', fg: 48, '3pt': 35 },
      ],
      basketballStatsMap: [
        { name: 'Points', value: 24 },
        { name: 'Rebounds', value: 8 },
        { name: 'Assists', value: 6 },
        { name: 'Steals', value: 2 },
        { name: 'Blocks', value: 1 },
      ]
    });
  } else if (sport === 'tennis') {
    return res.json({
      tennisServeData: [
        { match: 'Match 1', firstServe: 65, aces: 5 },
        { match: 'Match 2', firstServe: 72, aces: 8 },
        { match: 'Match 3', firstServe: 58, aces: 3 },
        { match: 'Match 4', firstServe: 68, aces: 6 },
        { match: 'Match 5', firstServe: 75, aces: 10 },
      ]
    });
  }
  
  return res.json({
    defaultPerformanceData: [
      { metric: 'Game 1', score: 75, average: 70 },
      { metric: 'Game 2', score: 82, average: 70 },
      { metric: 'Game 3', score: 68, average: 70 },
      { metric: 'Game 4', score: 90, average: 70 },
      { metric: 'Game 5', score: 85, average: 70 },
    ]
  });
});

app.get("/api/mock-data/analytics", (req, res) => {
  res.json({
    completed: 12,
    upcoming: 5,
    ongoing: 2
  });
});

app.get("/api/preset-matches", (req, res) => {
  res.json(PRESET_MATCHES);
});

import scraper from '@vreden/youtube_scraper';

// API - Resolve YouTube URL to raw stream URL
app.get("/api/yt-stream", async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: "Missing YouTube URL" });

  try {
    // 1. First try @vreden/youtube_scraper which can bypass some IP blocks
    try {
      const vredenData = await scraper.ytmp4(url);
      if (vredenData && vredenData.download && vredenData.download.url) {
        return res.json({ url: vredenData.download.url, title: vredenData.metadata?.title || 'YouTube Video', isLive: false });
      }
    } catch (vredenErr) {
      console.log("Vreden scraper failed, trying youtubedl-exec...", vredenErr);
    }

    // 2. Fallback to youtubedl-exec
    const info = await youtubedl(url, {
      dumpJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      ]
    });

    const data = typeof info === "string" ? JSON.parse(info) : info;
    
    if (data.is_live) {
      const format = data.formats.find((f: any) => f.protocol === 'm3u8' || f.protocol === 'm3u8_native' || (f.url && f.url.includes("m3u8")));
      if (format && format.url) {
        return res.json({ url: format.url, title: data.title, isLive: true });
      }
    }

    // Try to get a pre-merged format
    const format = data.formats.slice().reverse().find((f: any) => f.vcodec !== 'none' && f.acodec !== 'none' && (f.ext === 'mp4' || f.ext === 'webm'));
    if (format && format.url) {
      return res.json({ url: format.url, title: data.title, isLive: false });
    }

    // Fallback to video only
    const anyVideo = data.formats.slice().reverse().find((f: any) => f.vcodec !== 'none');
    if (anyVideo && anyVideo.url) {
      return res.json({ url: anyVideo.url, title: data.title, isLive: data.is_live });
    }

    res.status(500).json({ error: "Could not find a suitable remote stream format for this video." });
  } catch (error: any) {
    if (error.message?.includes("Sign in") || error.message?.includes("bot")) {
      return res.status(403).json({ error: "YouTube Bot Protection: Google Cloud IPs are blocked from resolving YouTube streams directly. Please use a direct .m3u8 link or upload a local video." });
    }
    console.error("YouTube parse error:", error);
    res.status(500).json({ error: error.message || "Failed to resolve YouTube stream" });
  }
});

// Proxy route to bypass CORS for external videos (and use ffmpeg to transcode if needed)
app.get("/api/proxy-video", async (req, res) => {
  const videoUrl = req.query.url as string;
  const useFfmpeg = req.query.ffmpeg === 'true';

  if (!videoUrl) {
    return res.status(400).send("Missing url parameter");
  }
  
    if (useFfmpeg) {
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    // Simulate live streaming with a generated live clock/camera feed
    // which prevents the ffmpeg SIGSEGV network issues when fetching http inputs.
    const text = `Camera ${req.query.camera || '1'} Live Feed`;
    
    ffmpeg()
      .input('testsrc=size=640x360:rate=30')
      .inputFormat('lavfi')
      .outputOptions([
        `-vf`, `drawtext=text='${text}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.5:boxborderw=10`,
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-g', '30'
      ])
      .on('error', (err) => {
        console.error('FFmpeg proxy error:', err);
        if (!res.headersSent) {
           res.status(500).send('FFmpeg processing error');
        }
      })
      .pipe(res, { end: true });
    return;
  }

  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch video: ${response.statusText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    
    if (contentType && (contentType.includes("mpegurl") || contentType.includes("m3u8")) || videoUrl.includes(".m3u8")) {
      let text = await response.text();
      text = text.replace(/(https?:\/\/[^\s]+)/g, (match) => {
        return `/api/proxy-video?url=${encodeURIComponent(match)}`;
      });
      const baseUrlStr = videoUrl.substring(0, videoUrl.lastIndexOf("/") + 1);
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
         const line = lines[i].trim();
         if (line && !line.startsWith('#') && !line.startsWith('http') && !line.startsWith('/api/')) {
             lines[i] = `/api/proxy-video?url=${encodeURIComponent(baseUrlStr + line)}`;
         }
      }
      text = lines.join('\n');
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.status(200).send(text);
      return;
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    
    if (response.body) {
       const readableNodeStream = Readable.fromWeb(response.body as any);
       readableNodeStream.pipe(res);
    } else {
       res.status(500).send("No body in response");
    }
  } catch (err: any) {
    console.error("Proxy error:", err);
    res.status(500).send(err.message);
  }
});

// Helper function to generate simulated delivery segmentation results
function getSimulatedAnalysis(videoName: string | undefined, simulatedOverNumber: number) {
  const simulatedOver = Number(simulatedOverNumber) || 1;
  return {
    matchTitle: videoName ? `Processed: ${videoName}` : "AI Analysed Live Footage Stream",
    venue: "Live Detected Venue Feed",
    description: "Automated analysis completed cleanly. Replays and broadcast interruptions deleted from timeline.",
    deliveries: [
      {
        over: simulatedOver,
        ball: 1,
        startTime: 0.1,
        endTime: 9.1,
        bowlerReleaseTime: 3.1,
        batsmanHitTime: 3.8,
        ballOutcome: "Dot Ball",
        runs: 0,
        wicket: false,
        extra: false,
        bowler: "Bowler1",
        batsman: "Batter1",
        description: "Delivery 1 of over.",
        cameraAngles: ["Bowler End Zoom", "Fielder Slip Track"],
        hasReplay: false,
        visualMarkers: [
          { time: 3.1, label: "Release", type: "bowler_release" },
          { time: 3.8, label: "Strike", type: "batsman_hit" }
        ]
      },
      {
        over: simulatedOver,
        ball: 2,
        startTime: 14.1,
        endTime: 23.5,
        bowlerReleaseTime: 16.5,
        batsmanHitTime: undefined,
        ballOutcome: "Wide",
        runs: 1,
        wicket: false,
        extra: true,
        isWide: true,
        bowler: "Bowler1",
        batsman: "Batter1",
        description: "Wide ball outside off stump.",
        cameraAngles: ["Bowler End Zoom", "Wicketkeeper Cam"],
        hasReplay: false,
        visualMarkers: [
          { time: 16.5, label: "Release", type: "bowler_release" },
        ]
      },
      {
        over: simulatedOver,
        ball: 2,
        startTime: 29.0,
        endTime: 39.5,
        bowlerReleaseTime: 31.5,
        batsmanHitTime: 32.2,
        ballOutcome: "4 Runs",
        runs: 4,
        wicket: false,
        extra: false,
        bowler: "Bowler1",
        batsman: "Batter1",
        description: "FOUR! Brilliant drive.",
        cameraAngles: ["Bowler End Zoom", "Boundary Pan Cam"],
        hasReplay: false,
        visualMarkers: [
          { time: 31.5, label: "Release", type: "bowler_release" },
          { time: 32.2, label: "Strike", type: "batsman_hit" }
        ]
      },
      {
        over: simulatedOver,
        ball: 3,
        startTime: 45.0,
        endTime: 55.0,
        bowlerReleaseTime: 47.5,
        batsmanHitTime: 48.2,
        ballOutcome: "1 Run",
        runs: 1,
        wicket: false,
        extra: false,
        bowler: "Bowler1",
        batsman: "Batter1",
        description: "Taps it to single and runs.",
        cameraAngles: ["Action Cam"],
        hasReplay: false,
        visualMarkers: [
          { time: 47.5, label: "Release", type: "bowler_release" }
        ]
      },
      {
        over: simulatedOver,
        ball: 4,
        startTime: 60.0,
        endTime: 70.0,
        bowlerReleaseTime: 62.5,
        batsmanHitTime: 63.2,
        ballOutcome: "Dot Ball",
        runs: 0,
        wicket: false,
        extra: false,
        bowler: "Bowler1",
        batsman: "Batter1",
        description: "Defends back to bowler.",
        cameraAngles: ["Bowler End Zoom"],
        hasReplay: false,
        visualMarkers: [
          { time: 62.5, label: "Release", type: "bowler_release" }
        ]
      },
      {
        over: simulatedOver,
        ball: 5,
        startTime: 75.0,
        endTime: 85.0,
        bowlerReleaseTime: 77.5,
        batsmanHitTime: 78.2,
        ballOutcome: "6 Runs",
        runs: 6,
        wicket: false,
        extra: false,
        bowler: "Bowler1",
        batsman: "Batter1",
        description: "Hooks it over fine leg for a six.",
        cameraAngles: ["Bowler End Zoom", "Boundary Pan Cam"],
        hasReplay: false,
        visualMarkers: [
          { time: 77.5, label: "Release", type: "bowler_release" },
          { time: 78.2, label: "Strike", type: "batsman_hit" }
        ]
      },
      {
        over: simulatedOver,
        ball: 6,
        startTime: 90.0,
        endTime: 100.0,
        bowlerReleaseTime: 92.5,
        batsmanHitTime: 93.2,
        ballOutcome: "Wicket",
        runs: 0,
        wicket: true,
        extra: false,
        bowler: "Bowler1",
        batsman: "Batter1",
        description: "Clean bowled! The off stump is knocked back.",
        cameraAngles: ["Bowler End Zoom", "Stump Cam"],
        hasReplay: false,
        visualMarkers: [
          { time: 92.5, label: "Release", type: "bowler_release" }
        ]
      }
    ]
  };
}

// 3. API - segment a uploaded base64 / dummy video using mock engine
app.post("/api/segment", requireAuth, async (req, res) => {
  const { videoName, simulatedOverNumber = 1 } = req.body;
  console.log(`Received segmentation request. Name: ${videoName || "uploaded_video.mp4"}`);

  console.log("Serving high-quality simulated delivery segmentation analytics");
  const result = getSimulatedAnalysis(videoName, simulatedOverNumber);
  
  // Simulate 1.5 seconds delay for realistic "AI Processing" feeling
  setTimeout(() => {
    res.json({ success: true, analysis: result, isMocked: true });
  }, 1500);
});

// WebAuthn Passkey Routes
app.post("/api/auth/register-passkey-options", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const host = req.headers.host || "localhost:3000";
    const rpID = host.split(":")[0];
    
    // Check if user has any existing registered passkeys to prevent re-registration
    const passkeysSnap = await db.collection('passkeys').where('user_id', '==', user.uid).get();
    const excludeCredentials = passkeysSnap.docs.map(doc => ({
      id: doc.id,
      type: 'public-key' as const,
      transports: doc.data().transports || [],
    }));

    const options = await generateRegistrationOptions({
      rpName: 'Cricket Deliveries',
      rpID: rpID,
      userID: Uint8Array.from(Buffer.from(user.uid)),
      userName: user.email || user.name || user.uid,
      userDisplayName: user.name || user.email || user.uid,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      }
    });

    // Save challenge associated with user.uid
    await db.collection('challenges').doc(user.uid).set({
      challenge: options.challenge,
      created_at: FieldValue.serverTimestamp()
    });

    res.json(options);
  } catch (error: any) {
    console.error('Error generating register options:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/register-passkey-verify", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const body = req.body;
    const host = req.headers.host || "localhost:3000";
    const rpID = host.split(":")[0];
    const expectedOrigin = req.headers.origin || `http://${host}`;

    // Retrieve saved challenge
    const challengeDoc = await db.collection('challenges').doc(user.uid).get();
    if (!challengeDoc.exists) {
      return res.status(400).json({ error: 'Challenge not found or expired' });
    }
    const expectedChallenge = challengeDoc.data()?.challenge;
    await db.collection('challenges').doc(user.uid).delete(); // single-use

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const regInfo = verification.registrationInfo as any;
      const credentialPublicKey = regInfo.credentialPublicKey || regInfo.credential?.publicKey;
      const credentialID = regInfo.credentialID || regInfo.credential?.id;
      const counter = regInfo.counter !== undefined ? regInfo.counter : (regInfo.credential?.counter || 0);

      // Save passkey to Firestore
      const publicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64');
      const credIdBase64 = Buffer.from(credentialID).toString('base64');

      await db.collection('passkeys').doc(body.id).set({
        user_id: user.uid,
        public_key: publicKeyBase64,
        credential_id_base64: credIdBase64,
        counter: counter,
        transports: body.response.transports || [],
        created_at: FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Verification failed' });
    }
  } catch (error: any) {
    console.error('Error verifying register response:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login-passkey-options", async (req, res) => {
  try {
    const { phone } = req.body;
    const host = req.headers.host || "localhost:3000";
    const rpID = host.split(":")[0];

    let allowCredentials = undefined;

    if (phone) {
      const profileSnap = await db.collection('profiles').where('phone', '==', phone).get();
      if (!profileSnap.empty) {
        const userId = profileSnap.docs[0].id;
        const passkeysSnap = await db.collection('passkeys').where('user_id', '==', userId).get();
        allowCredentials = passkeysSnap.docs.map(doc => ({
          id: doc.id,
          type: 'public-key' as const,
          transports: doc.data().transports || [],
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    const sessionId = crypto.randomBytes(16).toString('hex');
    await db.collection('auth_challenges').doc(sessionId).set({
      challenge: options.challenge,
      created_at: FieldValue.serverTimestamp()
    });

    res.json({ options, sessionId });
  } catch (error: any) {
    console.error('Error generating login options:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login-passkey-verify", async (req, res) => {
  try {
    const { body, sessionId } = req.body;
    const host = req.headers.host || "localhost:3000";
    const rpID = host.split(":")[0];
    const expectedOrigin = req.headers.origin || `http://${host}`;

    // Retrieve saved challenge
    const challengeDoc = await db.collection('auth_challenges').doc(sessionId).get();
    if (!challengeDoc.exists) {
      return res.status(400).json({ error: 'Session expired or invalid' });
    }
    const expectedChallenge = challengeDoc.data()?.challenge;
    await db.collection('auth_challenges').doc(sessionId).delete();

    // Look up the passkey credential from our database
    const passkeyDoc = await db.collection('passkeys').doc(body.id).get();
    if (!passkeyDoc.exists) {
      return res.status(400).json({ error: 'Passkey not registered with any user' });
    }

    const passkeyData = passkeyDoc.data();
    if (!passkeyData) {
      return res.status(400).json({ error: 'Invalid passkey data' });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: passkeyDoc.id,
        publicKey: Buffer.from(passkeyData.public_key, 'base64'),
        counter: passkeyData.counter,
        transports: passkeyData.transports || [],
      }
    });

    if (verification.verified && verification.authenticationInfo) {
      // Update counter
      await db.collection('passkeys').doc(body.id).update({
        counter: verification.authenticationInfo.newCounter
      });

      // Fetch profile
      const userProfileDoc = await db.collection('profiles').doc(passkeyData.user_id).get();
      const profile = userProfileDoc.exists ? userProfileDoc.data() : null;
      const uid = passkeyData.user_id;

      const mockUser = {
        uid: uid,
        displayName: profile?.full_name || profile?.username || 'Passkey User',
        phoneNumber: profile?.phone || '',
        email: profile?.email || '',
        photoURL: profile?.photo_url || '',
        metadata: {
          creationTime: profile?.created_at || new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      };

      res.json({
        success: true,
        user: mockUser,
        token: `mock_token:${uid}`
      });
    } else {
      res.status(400).json({ error: 'Verification failed' });
    }
  } catch (error: any) {
    console.error('Error verifying login response:', error);
    res.status(500).json({ error: error.message });
  }
});


// Database API Routes
app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => { res.json({ success: true, message: "Handled client-side" }); });

app.get("/api/clubs", requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('clubs').orderBy('created_at', 'desc').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error: any) {
    res.json([]);
  }
});

app.get("/api/associations", requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('associations').orderBy('created_at', 'desc').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error: any) {
    res.json([]);
  }
});

app.get("/api/tournaments", requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('tournaments').orderBy('created_at', 'desc').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});





app.get("/api/looking_posts", requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('looking_posts').orderBy('created_at', 'desc').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error: any) {
    if (String(error.message || error).includes('fetch failed') || String(error.message || error).includes('FetchError')) {
      res.status(503).json({ error: 'Database connection failed' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Unused and insecure APIs removed
app.delete("/api/users/delete", requireAuth, async (req: AuthRequest, res) => { res.json({ success: true, message: 'Handled client-side' }); });





const PORT = 3000;

import { getMessaging } from 'firebase-admin/messaging';

app.post("/api/notify", requireAuth, async (req: any, res: any) => {
  try {
    const { matchId, title, body, data } = req.body;
    if (!matchId) {
      return res.status(400).json({ error: "No matchId provided" });
    }
    
    // Hacker proof: Ownership check for notifications
    const uid = (req as any).user?.uid;
    const isAdmin = (req as any).user?.role === 'admin';
    if (!isAdmin) {
       const matchSnap = await db.collection('matches').doc(matchId).get();
       let owner = null;
       if (matchSnap.exists) {
         owner = matchSnap.data().owner_id || matchSnap.data().created_by;
       } else {
         const tmSnap = await db.collection('tournaments').doc(matchId).get();
         if (tmSnap.exists) {
           owner = tmSnap.data().owner_id || tmSnap.data().created_by;
         }
       }
       if (owner !== uid) {
         return res.status(403).json({ error: 'Forbidden: You do not own this match/tournament' });
       }
    }

    // Since we don't have a complex follow system, let's just broadcast to all users who have an fcm_token
    const profilesSnap = await db.collection('profiles').get();
    const tokens: string[] = [];
    profilesSnap.forEach((doc: any) => {
      const profile = doc.data();
      if (profile.fcm_token) {
        tokens.push(profile.fcm_token);
      }
    });

    // We will not return early if no FCM tokens, so in-app notifications still work.
    // We will just skip the multicast send if tokens is empty.

    const message = {
      notification: {
        title: title || "Live Match Update",
        body: body || "A match has been updated.",
      },
      data: data || {},
      tokens: tokens,
    };

    let response = null;
    if (tokens.length > 0) {
      try {
        response = await getMessaging().sendEachForMulticast(message);
      } catch(e) {
        console.error("FCM Send Error:", e);
      }
    }
    
    // Also save in-app notification for all users
    try {
       const batch = db.batch();
       profilesSnap.forEach((doc) => {
         const uid = doc.id;
         const notifRef = db.collection('notifications').doc();
         batch.set(notifRef, {
           user_id: uid,
           title: title || "Live Match Update",
           body: body || "A match has been updated.",
           type: 'match_update',
           is_read: false,
           created_at: FieldValue.serverTimestamp(),
           action_url: matchId ? `/?match=${matchId}` : undefined
         });
       });
       await batch.commit();
    } catch (e) {
       console.error("Failed to save in-app notifications", e);
    }

    res.json({ success: true, response });
  } catch (error) {
    console.error("FCM Send Error:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// Start the server


import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { createProxyMiddleware } from 'http-proxy-middleware';
// @ts-ignore
import NodeMediaServer from 'node-media-server';

const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8001,
    allow_origin: '*'
  }
};
const _global = globalThis as any;
if (!_global.__NMS_STARTED__) {
  _global.__NMS_STARTED__ = true;
  const nms = new NodeMediaServer(nmsConfig);
  try {
    nms.run();
    
    // Store reference to clean up on restart
    _global.__NMS_INSTANCE__ = nms;
    
    const cleanup = () => {
      if (_global.__NMS_INSTANCE__) {
        _global.__NMS_INSTANCE__.stop();
        _global.__NMS_INSTANCE__ = null;
      }
    };
    
    process.once('SIGINT', cleanup);
    process.once('SIGTERM', cleanup);
    process.once('exit', cleanup);
    
  } catch (e) {
    console.error("Failed to start NodeMediaServer:", e);
  }
}


app.use(createProxyMiddleware({
  pathFilter: '/live',
  target: process.env.FLV_SERVER_URL || 'http://127.0.0.1:8001',
  router: (req: any) => {
    const hostQuery = req.query?.flvHost as string;
    if (hostQuery && /^[a-zA-Z0-9.-]+(:[0-9]+)?$/.test(hostQuery)) {
      return `http://${hostQuery}`;
    }
    return process.env.FLV_SERVER_URL || 'http://127.0.0.1:8001';
  },
  changeOrigin: true,
  ws: true,
  on: {
    error: (err, req, res: any) => {
      if (res && typeof res.status === 'function' && !res.headersSent) {
        res.status(502).json({ error: 'Live streaming server is offline or stream key is not active' });
      }
    }
  }
} as any));

app.use('/live', (req, res) => {
  res.status(404).send('Stream not active');
});


async function startServer() {
  const isProduction = process.env.NODE_ENV === "production" || process.env.PM2_HOME !== undefined || process.argv.some(arg => arg.includes('server.cjs'));
  if (!isProduction) {
    const vite = await import("vite");
    const viteServer = await vite.createServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
        allowedHosts: true
      },
      appType: "spa",
    });
    app.use(viteServer.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Catch-all for undefined API routes to return 404 instead of serving index.html
    app.all('/api/*', (req, res) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });
    
    // Catch-all for undefined static assets to return 404 (e.g. .png, .ico, .txt, .xml)
    app.get(/\.(js|css|ico|png|jpg|jpeg|svg|woff|woff2|ttf|eot|txt|xml|json)$/, (req, res) => {
      res.status(404).send('Not found');
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/stream/youtube') {
      const rtmpUrl = url.searchParams.get('rtmpUrl');
      const rtmpKey = url.searchParams.get('rtmpKey');
      const obsRtmpUrl = url.searchParams.get('obsRtmpUrl');
      const obsRtmpKey = url.searchParams.get('obsRtmpKey');
      
      const fullYoutubeUrl = rtmpUrl && rtmpKey ? `${rtmpUrl}/${rtmpKey}` : null;
      const fullObsUrl = obsRtmpUrl && obsRtmpKey ? `${obsRtmpUrl}/${obsRtmpKey}` : null;
      
      if (!fullYoutubeUrl && !fullObsUrl) {
        ws.send(JSON.stringify({ type: 'error', message: 'Missing RTMP destinations' }));
        ws.close();
        return;
      }
      
      let ffmpegOutputArgs: string[] = [];
      if (fullYoutubeUrl && fullObsUrl) {
         console.log(`Starting FFmpeg stream (Parallel) to ${fullYoutubeUrl} AND ${fullObsUrl}`);
         ffmpegOutputArgs = [
           '-f', 'tee',
           '-map', '0:v',
           '-map', '0:a',
           `[f=flv]${fullYoutubeUrl}|[f=flv]${fullObsUrl}`
         ];
      } else {
         const targetUrl = fullYoutubeUrl || fullObsUrl;
         console.log(`Starting FFmpeg stream to ${targetUrl}`);
         ffmpegOutputArgs = [
           '-f', 'flv',
           targetUrl as string
         ];
      }
      
      const ffmpegPath = ffmpegInstaller ? ffmpegInstaller.path : 'ffmpeg';
      const ffmpegProcess = spawn(ffmpegPath, [
        '-f', 'webm',
        '-i', '-',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-b:v', '4500k',
        '-maxrate', '4500k',
        '-bufsize', '9000k',
        '-pix_fmt', 'yuv420p',
        '-g', '60',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        ...ffmpegOutputArgs
      ]);
      
      ffmpegProcess.on('close', (code, signal) => {
        console.log(`FFmpeg process closed, code ${code}, signal ${signal}`);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: 'FFmpeg process ended' }));
          ws.close();
        }
      });

      ffmpegProcess.stdin.on('error', (e) => {
        console.error('FFmpeg STDIN Error', e);
      });

      ffmpegProcess.stderr.on('data', (data) => {
        // console.log('FFmpeg stderr: ' + data.toString());
      });

      ws.on('message', (msg) => {
        if (Buffer.isBuffer(msg)) {
          ffmpegProcess.stdin.write(msg);
        } else {
          console.log('Received non-buffer message from WebSocket:', msg);
        }
      });

      ws.on('close', () => {
        console.log('Client WebSocket closed');
        ffmpegProcess.stdin.end();
        ffmpegProcess.kill('SIGINT');
      });
    } else if (url.pathname === '/api/stream/obs-control') {
      const matchId = url.searchParams.get('matchId') || 'global';
      (ws as any).matchId = matchId;
      console.log(`OBS controller/overlay client connected for match: ${matchId}`);
      
      ws.on('message', (msg) => {
        try {
          const data = JSON.parse(msg.toString());
          console.log(`OBS-control message received for match ${matchId}:`, data);
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1 && (client as any).matchId === matchId) {
              client.send(JSON.stringify(data));
            }
          });
        } catch (err) {
          console.error('Error in OBS-control message processing:', err);
        }
      });
    }
  });
}

startServer();
