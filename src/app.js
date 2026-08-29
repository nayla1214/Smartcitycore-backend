const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/gads', require('./routes/gadRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/modules', require('./routes/moduleRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/evaluations', require('./routes/evaluationRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API is running smoothly' });
});

module.exports = app;
