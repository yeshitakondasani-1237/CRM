import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import smartRoutes from './routes/smartRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import filterRoutes from './routes/filterRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import automationRoutes from './routes/automationRoutes.js';

// Seeder Import
import User from './models/User.js';
import seedData from './utils/seedData.js';

// Configure Env Variables
dotenv.config();

// Establish MongoDB Connection
connectDB().then(async () => {
  try {
    // Automatically seed data if the database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Initializing automated seed script...');
      await seedData();
    }
  } catch (error) {
    console.error('Seeding check failed:', error);
  }
});

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*', // allows simple connections from all hosts
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Socket Event Handler
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Room association based on User ID
  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their socket room`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Store socket instance globally
app.set('socketio', io);

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// REST Endpoints mapping
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/smart', smartRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/automations', automationRoutes);

// Root Check Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Manufacturing BDA CRM API is running successfully.' });
});

// Fallback error-handling routing
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
