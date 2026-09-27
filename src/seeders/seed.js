require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function seedDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        const adminPassword = await bcrypt.hash('admin123', 10);

        await User.findOrCreate({
            where: { email: 'admin@plataforma.com' },
            defaults: {
                name: 'Administrador General',
                email: 'admin@plataforma.com',
                password: adminPassword,
                role: 'ADMIN'
            }
        });

        console.log('Admin user created.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();