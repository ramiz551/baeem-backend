// ==========================================
// 🚀 BAEEM - WORLD'S BEST E-COMMERCE
// ==========================================
// 🔥 BRAIN OF YOUR WEBSITE - POWERING EVERYTHING
// ==========================================

const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const admin = require('firebase-admin');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 🎨 MIDDLEWARE - BEAUTY & POWER SETUP
// ==========================================

// Serve static files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
        if (path.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
        }
    }
}));

// Parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session management (user login)
app.use(session({
    secret: 'baeem-super-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ================================
// 🔐 FIREBASE INITIALIZATION WITH ERROR HANDLING
// ================================

// ✅ CRITICAL FIX: Handle missing serviceAccountKey.json gracefully
let firebaseInitialized = false;

try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://hol-sell-marketplace-default-rtdb.firebaseio.com"
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
    console.log('⚠️ Firebase service account not found - running in limited mode');
    console.log('ℹ️ Health checks and basic routes will work, but Firebase features will be disabled');
    firebaseInitialized = false;
}

// Admin security middleware (only if Firebase is initialized)
const ADMIN_EMAILS = ['xyzdar6@gmail.com'];
function requireAdmin(req, res, next) {
    if (!firebaseInitialized) {
        return res.status(503).send('Firebase service unavailable');
    }
    
    const userEmail = req.session.user ? req.session.user.email : null;
    if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
        next();
    } else {
        res.status(403).send(`
            <h2>🚫 ACCESS DENIED</h2>
            <p>Admin panel access restricted to authorized personnel only.</p>
            <a href="/">Return to Homepage</a>
        `);
    }
}

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        const fileExtension = file.originalname.split('.').pop();
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + fileExtension);
    }
});
const upload = multer({ storage: storage });

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 🌟 ROUTES - WEBSITE PAGES
// ==========================================

// 🏠 HOME PAGE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ CRITICAL: HEALTH CHECK ENDPOINT
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'BAEEM Backend is running perfectly!',
        firebase: firebaseInitialized ? 'Connected' : 'Disabled',
        timestamp: Date.now(),
        version: '1.0.0'
    });
});

// ✅ CRITICAL: API STATUS ENDPOINT
app.get('/api/status', (req, res) => {
    res.json({ 
        success: true, 
        service: 'BAEEM Backend',
        status: 'Operational',
        firebase: firebaseInitialized,
        timestamp: new Date().toISOString()
    });
});

// ✅ CRITICAL: ROOT API ENDPOINT
app.get('/api', (req, res) => {
    res.json({ 
        message: 'Welcome to BAEEM Backend API',
        status: 'Running',
        firebase: firebaseInitialized,
        endpoints: ['/health', '/api/status', '/api/messages', '/api/conversations']
    });
});

// 👤 LOGIN PAGE
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 👤 REGISTER PAGE
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// 🎌 LOGIN PROCESSING (Only if Firebase is initialized)
app.post('/login', async (req, res) => {
    if (!firebaseInitialized) {
        return res.send(`
            <script>
                alert('Authentication service temporarily unavailable');
                window.location.href = '/login';
            </script>
        `);
    }

    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.send(`
                <script>
                    alert('Please enter both email and password');
                    window.location.href = '/login';
                </script>
            `);
        }

        const userRecord = await admin.auth().getUserByEmail(email);
        
        req.session.user = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || 'User'
        };

        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        }

        res.send(`
            <script>
                alert('${errorMessage}');
                window.location.href = '/login';
            </script>
        `);
    }
});

// 📝 REGISTER PROCESSING (Only if Firebase is initialized)
app.post('/register', async (req, res) => {
    if (!firebaseInitialized) {
        return res.send(`
            <script>
                alert('Registration service temporarily unavailable');
                window.location.href = '/register';
            </script>
        `);
    }

    try {
        const { email, password, displayName } = req.body;
        
        if (!email || !password || !displayName) {
            return res.send(`
                <script>
                    alert('Please fill all fields');
                    window.location.href = '/register';
                </script>
            `);
        }

        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: displayName
        });

        req.session.user = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: displayName
        };

        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('Register error:', error);
        
        let errorMessage = 'Registration failed. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email already registered.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters.';
        }

        res.send(`
            <script>
                alert('${errorMessage}');
                window.location.href = '/register';
            </script>
        `);
    }
});

// 📊 USER DASHBOARD
app.get('/dashboard', (req, res) => {
    if (!firebaseInitialized) {
        return res.send(`
            <h2>Service Temporarily Unavailable</h2>
            <p>Firebase services are currently unavailable. Please try again later.</p>
            <a href="/">Return to Homepage</a>
        `);
    }
    
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 📦 POST AD PAGE
app.get('/post-ad', (req, res) => {
    if (!firebaseInitialized || !req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'post-ad.html'));
});

// 📦 PROCESS AD POSTING (Only if Firebase is initialized)
app.post('/post-ad', upload.single('image'), async (req, res) => {
    if (!firebaseInitialized || !req.session.user) {
        return res.redirect('/login');
    }

    try {
        const { title, description, price, category, location } = req.body;
        const image = req.file ? '/uploads/' + req.file.filename : null;

        const db = admin.database();
        const adRef = db.ref('ads').push();
        
        await adRef.set({
            title: title,
            description: description,
            price: price,
            category: category,
            location: location,
            image: image,
            userId: req.session.user.uid,
            userName: req.session.user.displayName,
            userEmail: req.session.user.email,
            createdAt: Date.now(),
            status: 'active',
            featured: false
        });

        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('Ad posting error:', error);
        res.send(`
            <script>
                alert('Failed to post ad. Please try again.');
                window.location.href = '/post-ad';
            </script>
        `);
    }
});

// 👑 ADMIN PANEL
app.get('/admin', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 📄 ABOUT FOUNDER PAGE
app.get('/about-founder', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about-founder.html'));
});

// 📜 POLICY PAGE
app.get('/policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'policy.html'));
});

// 🚪 LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ==========================================
// 💬 MESSAGING SYSTEM (Only if Firebase is initialized)
// ==========================================

// 🔄 GET MESSAGES BETWEEN TWO USERS
app.get('/api/messages/:otherUserId', async (req, res) => {
    if (!firebaseInitialized) {
        return res.status(503).json({ error: 'Firebase service unavailable' });
    }
    
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const currentUserId = req.session.user.uid;
        const otherUserId = req.params.otherUserId;

        const db = admin.database();
        const messagesRef = db.ref('messages');
        
        const snapshot = await messagesRef
            .orderByChild('conversationId')
            .equalTo([currentUserId, otherUserId].sort().join('_'))
            .once('value');

        const messages = [];
        snapshot.forEach(childSnapshot => {
            messages.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        messages.sort((a, b) => a.timestamp - b.timestamp);
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// 📨 SEND MESSAGE
app.post('/api/messages/send', async (req, res) => {
    if (!firebaseInitialized) {
        return res.status(503).json({ error: 'Firebase service unavailable' });
    }
    
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const { receiverId, message, adId } = req.body;
        const senderId = req.session.user.uid;
        const senderName = req.session.user.displayName;

        if (!receiverId || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const db = admin.database();
        const messagesRef = db.ref('messages');
        const newMessageRef = messagesRef.push();

        const messageData = {
            senderId: senderId,
            senderName: senderName,
            receiverId: receiverId,
            message: message,
            adId: adId || null,
            timestamp: Date.now(),
            conversationId: [senderId, receiverId].sort().join('_'),
            read: false
        };

        await newMessageRef.set(messageData);

        res.json({ 
            success: true, 
            messageId: newMessageRef.key,
            timestamp: messageData.timestamp
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// 👥 GET USER CONVERSATIONS
app.get('/api/conversations', async (req, res) => {
    if (!firebaseInitialized) {
        return res.status(503).json({ error: 'Firebase service unavailable' });
    }
    
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const currentUserId = req.session.user.uid;
        const db = admin.database();
        const messagesRef = db.ref('messages');

        const snapshot = await messagesRef
            .orderByChild('conversationId')
            .once('value');

        const conversations = {};
        
        snapshot.forEach(childSnapshot => {
            const message = childSnapshot.val();
            const convId = message.conversationId;

            if (convId.includes(currentUserId)) {
                const otherUserId = message.senderId === currentUserId ? 
                    message.receiverId : message.senderId;
                
                if (!conversations[otherUserId]) {
                    conversations[otherUserId] = {
                        otherUserId: otherUserId,
                        otherUserName: message.senderId === currentUserId ? 
                            message.receiverName : message.senderName,
                        lastMessage: message.message,
                        lastTimestamp: message.timestamp,
                        unreadCount: 0
                    };
                }

                if (message.timestamp > conversations[otherUserId].lastTimestamp) {
                    conversations[otherUserId].lastMessage = message.message;
                    conversations[otherUserId].lastTimestamp = message.timestamp;
                }

                if (!message.read && message.receiverId === currentUserId) {
                    conversations[otherUserId].unreadCount++;
                }
            }
        });

        const conversationsArray = Object.values(conversations)
            .sort((a, b) => b.lastTimestamp - a.lastTimestamp);

        res.json(conversationsArray);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});

// 🆕 ADD MESSAGE BUTTON TO ADS
app.get('/ad-with-chat/:adId', async (req, res) => {
    if (!firebaseInitialized || !req.session.user) {
        return res.redirect('/login');
    }

    try {
        const adId = req.params.adId;
        const db = admin.database();
        const adRef = db.ref('ads').child(adId);
        const adSnapshot = await adRef.once('value');
        
        if (!adSnapshot.exists()) {
            return res.status(404).send('Ad not found');
        }

        const ad = adSnapshot.val();
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${ad.title} - BAEEM</title>
                <link rel="stylesheet" href="/css/style.css">
                <style>
                    .ad-detail { max-width: 800px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                    .chat-btn { background: #667eea; color: white; padding: 1rem 2rem; border: none; border-radius: 5px; cursor: pointer; font-size: 1.1rem; margin-top: 2rem; }
                    .chat-btn:hover { background: #5a6fd8; }
                </style>
            </head>
            <body>
                <header class="main-header">
                    <div class="container">
                        <a href="/" class="logo">BAEEM</a>
                        <nav class="user-nav">
                            <a href="/dashboard" class="nav-link">Dashboard</a>
                            <a href="/logout" class="nav-link">Logout</a>
                        </nav>
                    </div>
                </header>
                <div class="ad-detail">
                    <h1>${ad.title}</h1>
                    <p class="ad-price">$${ad.price}</p>
                    <p>${ad.description}</p>
                    <button class="chat-btn" onclick="startChat('${ad.userId}', '${adId}')">
                        💬 Chat with Seller
                    </button>
                </div>
                <script>
                    function startChat(sellerId, adId) {
                        window.location.href = '/chat?userId=' + sellerId + '&adId=' + adId;
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Ad detail error:', error);
        res.status(500).send('Error loading ad');
    }
});

// 💬 CHAT PAGE ROUTE
app.get('/chat', (req, res) => {
    if (!firebaseInitialized || !req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(__dirname + '/public/messaging/chat.html');
});

// ==========================================
// 🚀 START SERVER - POWER ON!
// ==========================================

app.listen(PORT, '0.0.0.0', () => {
    console.log('🎉 baeem Server Running!');
    console.log('🌐 Visit: http://localhost:' + PORT);
    console.log('🔥 Powered by Node.js + Express');
    console.log('💎 Professional Grade Activated');
    console.log('🇵🇰❤️🇨🇳 Pak-China Friendship Forever!');
    console.log('🔧 Firebase Status:', firebaseInitialized ? 'Connected' : 'Limited Mode');
});
