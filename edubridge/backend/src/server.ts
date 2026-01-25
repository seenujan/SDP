import express from 'express';
import cors from 'cors';
import { config } from './config/environment';
import { testConnection } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import teacherRoutes from './routes/teacher.routes';
import studentRoutes from './routes/student.routes';
import parentRoutes from './routes/parent.routes';
import profileRoutes from './routes/profile.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'EduBridge API is running' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
        console.error('❌ Cannot start server without database connection');
        process.exit(1);
    }

    app.listen(config.port, () => {
        console.log(`🚀 Server running on port ${config.port}`);
        console.log(`📍 API: http://localhost:${config.port}/api`);
    });
}

startServer();
