# 🚀 Kanban Board Backend API

A robust Node.js backend API for the Kanban Board application with advanced features including authentication, real-time updates, and comprehensive board management.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Architecture](#-architecture)
- [Security Features](#-security-features)
- [Development Notes](#-development-notes)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based authentication** with refresh tokens
- **Password encryption** using bcryptjs
- **Role-based access control** (Admin/Member)
- **Social login integration** (Google, GitHub, LinkedIn) - *Currently commented*
- **Password reset** and email verification - *Currently commented*
- **Rate limiting** for API protection
- **Helmet.js** security headers
- **CORS** configuration

### 📊 Board Management
- **CRUD operations** for boards, lists, and cards
- **Board sharing** with permission levels (Owner/Editor/Viewer)
- **Board settings** (visibility, archiving, deletion)
- **Activity logging** and statistics
- **Search and filtering** across all content

### 🎯 Advanced Features
- **Real-time updates** via WebSocket (planned)
- **File uploads** with image processing
- **Email notifications** - *Currently commented*
- **Cron jobs** for automated tasks
- **Analytics** and reporting
- **Multi-language support**

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcryptjs
- **Validation**: express-validator
- **Security**: Helmet.js, CORS, Rate Limiting
- **File Handling**: Multer, Sharp
- **Email**: Nodemailer - *Currently commented*
- **Real-time**: Socket.io (planned)
- **Testing**: Jest (planned)

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** 
- **MongoDB** 
- **npm** or **yarn** package manager
- **Git** for version control

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kanban-board-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp config.env.example config.env
   # Edit config.env with your configuration
   ```

4. **Start MongoDB service**
   ```bash
   # On Windows
   net start MongoDB
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

## ⚙️ Configuration

Create a `config.env` file in the backend root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/kanban_board_advanced

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (SMTP) - Currently commented
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@kanbanapp.com

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Security
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=your-session-secret-key
COOKIE_SECRET=your-cookie-secret-key
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```
This will start the server with nodemon for auto-restart on file changes.

### Production Mode
```bash
npm start
```

### Build and Run
```bash
npm run build
npm start
```

### Using PM2 (Production)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 status
pm2 logs
```

## 🌐 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile
- `POST /change-password` - Change password
- `POST /forgot-password` - Request password reset
- `POST /reset-password/:token` - Reset password
- `POST /verify-email/:token` - Verify email
- `POST /refresh-token` - Refresh JWT token

### Boards (`/api/boards`)
- `GET /` - Get user's boards
- `POST /` - Create new board
- `GET /:id` - Get board details
- `PUT /:id` - Update board
- `DELETE /:id` - Delete board
- `POST /:id/share` - Share board
- `POST /:id/archive` - Archive board

### Lists (`/api/lists`)
- `GET /board/:boardId` - Get board lists
- `POST /` - Create new list
- `PUT /:id` - Update list
- `DELETE /:id` - Delete list
- `PUT /:id/reorder` - Reorder lists

### Cards (`/api/cards`)
- `GET /list/:listId` - Get list cards
- `POST /` - Create new card
- `PUT /:id` - Update card
- `DELETE /:id` - Delete card
- `PUT /:id/move` - Move card between lists
- `PUT /:id/assign` - Assign card to user

### Search (`/api/search`)
- `GET /` - Global search across boards, lists, and cards
- `GET /boards` - Search boards
- `GET /cards` - Search cards

## 🗄️ Database Schema

### User Model
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  profile: {
    firstName: String,
    lastName: String,
    bio: String,
    phone: String,
    location: String
  },
  role: String (default: 'member'),
  preferences: {
    theme: String,
    notifications: Boolean,
    language: String
  },
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Board Model
```javascript
{
  title: String (required),
  description: String,
  owner: ObjectId (ref: User),
  members: [{
    user: ObjectId (ref: User),
    role: String (owner/editor/viewer),
    joinedAt: Date
  }],
  visibility: String (public/private),
  isArchived: Boolean,
  settings: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### List Model
```javascript
{
  title: String (required),
  board: ObjectId (ref: Board),
  order: Number,
  cards: [ObjectId (ref: Card)],
  createdAt: Date,
  updatedAt: Date
}
```

### Card Model
```javascript
{
  title: String (required),
  description: String,
  list: ObjectId (ref: List),
  board: ObjectId (ref: Board),
  assignees: [ObjectId (ref: User)],
  dueDate: Date,
  labels: [String],
  attachments: [String],
  comments: [{
    user: ObjectId (ref: User),
    text: String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🏗️ Architecture

### Project Structure
```
backend/
├── config/
│   └── db.js              # Database configuration
├── controllers/            # Request handlers
│   ├── authController.js
│   ├── boardController.js
│   ├── listController.js
│   ├── cardController.js
│   ├── notificationController.js
│   └── searchController.js
├── middleware/             # Custom middleware
│   ├── auth.js            # JWT authentication
│   ├── validation.js      # Input validation
│   └── upload.js          # File upload handling
├── models/                 # Mongoose schemas
│   ├── User.js
│   ├── Board.js
│   ├── List.js
│   ├── Card.js
│   └── Notification.js
├── routes/                 # API route definitions
│   ├── auth.js
│   ├── boards.js
│   ├── lists.js
│   ├── cards.js
│   ├── notifications.js
│   └── search.js
├── services/               # Business logic
│   ├── authService.js
│   ├── boardService.js
│   ├── listService.js
│   ├── cardService.js
│   └── notificationService.js
├── uploads/                # File upload directory
├── utils/                  # Utility functions
├── server.js               # Main application file
├── package.json
└── README.md
```

### Design Patterns
- **MVC Architecture** with separation of concerns
- **Service Layer** for business logic
- **Middleware** for cross-cutting concerns
- **Repository Pattern** for data access
- **Factory Pattern** for object creation

## 🔒 Security Features

### Authentication & Authorization
- JWT tokens with configurable expiration
- Refresh token rotation
- Role-based access control
- Password hashing with bcryptjs

### API Protection
- Rate limiting per IP address
- CORS configuration
- Helmet.js security headers
- Input validation and sanitization
- SQL injection prevention (MongoDB)

### Data Validation
- Request body validation
- File type and size restrictions
- XSS protection
- CSRF protection

## 📝 Development Notes

### Currently Commented Services

#### 1. Rate Limiting
```javascript
// In server.js - Currently commented out
// const limiter = rateLimit({
//     windowMs: 2 * 1000, // for 2 seconds
//     max: 100, // limit each IP to 100 requests per windowMs
//     message: 'Too many requests from this IP, please try again later.',
//     standardHeaders: true,
//     legacyHeaders: false
// });
// app.use('/api/', limiter);
```
**Status**: Commented out to prevent 429 errors during development
**Impact**: No rate limiting on general API endpoints
**To Enable**: Uncomment the rate limiting code in server.js

#### 2. SMTP Email Services
```javascript
// In authService.js - Currently commented out
// await sendVerificationEmail(user.email, verificationToken, user.username);
// await sendPasswordResetEmail(user.email, resetToken, user.username);
```
**Status**: Commented out due to placeholder SMTP credentials
**Impact**: No email verification or password reset emails
**To Enable**: 
1. Configure real SMTP credentials in config.env
2. Uncomment email sending functions in authService.js

#### 3. Social Login Integration
```javascript
// In authService.js - Currently commented out
// const socialLogin = async (provider) => { ... }
```
**Status**: Commented out - not fully implemented
**Impact**: No social login functionality
**To Enable**: Complete social login implementation with OAuth providers

### Development vs Production
- **Development**: More lenient rate limiting, detailed error messages
- **Production**: Strict rate limiting, minimal error exposure, HTTPS enforcement

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB service is running
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

#### 2. Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill existing process or change port
```bash
# Kill process on port 5000
npx kill-port 5000

# Or change port in config.env
PORT=5001
```

#### 3. JWT Token Invalid
```bash
Error: Token is not valid
```
**Solution**: Check JWT_SECRET in config.env and restart server

#### 4. CORS Errors
```bash
Error: CORS policy blocked request
```
**Solution**: Verify FRONTEND_URL in config.env matches your frontend

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=* npm run dev
```

### Logs
Check application logs for detailed error information:
```bash
# View real-time logs
npm run dev

# Check PM2 logs (if using PM2)
pm2 logs
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This backend is designed to work with the Kanban Board frontend application. Make sure both frontend and backend are properly configured and running for full functionality.
