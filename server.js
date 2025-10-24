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
const PORT = process.env.PORT || 3000; // ✅ FIXED: Uses environment port

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
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// ================================
// 🔐 ADMIN SECURITY - SUPER ADMIN ACCESS
// ================================

const ADMIN_EMAILS = [
    'xyzdar6@gmail.com'  // ONLY YOU CAN ACCESS ADMIN PANEL
];

// Middleware to check if user is admin - CORRECTED VERSION
function requireAdmin(req, res, next) {
    // FIXED: Check if user session exists and has email property
    const userEmail = req.session.user ? req.session.user.email : null;
    
    if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
        next(); // Allow access
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
        // Professional filename with original extension
        const fileExtension = file.originalname.split('.').pop();
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + fileExtension);
    }
});
const upload = multer({ storage: storage });

// Set EJS as template engine (beautiful pages)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize Firebase Admin SDK with service account
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://hol-sell-marketplace-default-rtdb.firebaseio.com" // ✅ FIXED: Correct Firebase URL
});

// ==========================================
// 🌟 ROUTES - WEBSITE PAGES
// ==========================================

// 🏠 HOME PAGE - STUNNING LANDING
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 👤 LOGIN PAGE - ELEGANT DESIGN
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 👤 REGISTER PAGE - MODERN DESIGN
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// 🎌 LOGIN PROCESSING - PROFESSIONAL FIREBASE ADMIN
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Input validation
        if (!email || !password) {
            return res.send(`
                <script>
                    alert('Please enter both email and password');
                    window.location.href = '/login';
                </script>
            `);
        }

        // Firebase Admin authentication
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Store user in session - CORRECTED: This creates req.session.user object
        req.session.user = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || 'User'
        };

        // Login successful - redirect to dashboard
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific Firebase errors
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

// 📝 REGISTER PROCESSING - PROFESSIONAL FIREBASE ADMIN
app.post('/register', async (req, res) => {
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

        // Create user in Firebase Admin
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: displayName
        });

        // Store user in session - CORRECTED: This creates req.session.user object
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

// 📊 USER DASHBOARD - PREMIUM DESIGN
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 📦 POST AD PAGE - PROFESSIONAL FORM
app.get('/post-ad', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'post-ad.html'));
});

// 📦 PROCESS AD POSTING WITH IMAGE UPLOAD
app.post('/post-ad', upload.single('image'), async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const { title, description, price, category, location } = req.body;
        const image = req.file ? '/uploads/' + req.file.filename : null;

        // Save to Firebase Database
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

// 👑 ADMIN PANEL - POWERFUL DASHBOARD
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
// 💬 MESSAGING SYSTEM - BUYER-SELLER COMMUNICATION
// ==========================================

// 🔄 GET MESSAGES BETWEEN TWO USERS
app.get('/api/messages/:otherUserId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const currentUserId = req.session.user.uid;
        const otherUserId = req.params.otherUserId;

        const db = admin.database();
        const messagesRef = db.ref('messages');
        
        // Get messages between current user and other user
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

        // Sort by timestamp
        messages.sort((a, b) => a.timestamp - b.timestamp);
        
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// 📨 SEND MESSAGE
app.post('/api/messages/send', async (req, res) => {
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

        // Convert to array and sort by last message time
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
    if (!req.session.user) {
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
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(__dirname + '/public/messaging/chat.html');
});

// ==========================================
// 🚀 START SERVER - POWER ON!
// ==========================================

app.listen(PORT, '0.0.0.0', () => { // ✅ FIXED: Binds to all network interfaces
    console.log('🎉 baeem Server Running!');
    console.log('🌐 Visit: http://localhost:' + PORT); // ✅ FIXED: Dynamic port display
    console.log('🔥 Powered by Node.js + Express');
    console.log('💎 Professional Grade Activated');
    console.log('🇵🇰❤️🇨🇳 Pak-China Friendship Forever!');
});
