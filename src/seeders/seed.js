require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Gad } = require('../models');

async function seedDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        // 1. Crear Admin
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

        // 2. Crear GADs
        const gads = [
            { name: 'Paján', description: 'Información del GAD de Paján', institutional_info: 'Misión y Visión de Paján' },
            { name: 'Puerto López', description: 'Información del GAD de Puerto López', institutional_info: 'Misión y Visión de Puerto López' },
            { name: 'Jipijapa', description: 'Información del GAD de Jipijapa', institutional_info: 'Misión y Visión de Jipijapa' }
        ];

        for (const gad of gads) {
            await Gad.findOrCreate({
                where: { name: gad.name },
                defaults: gad
            });
        }
        console.log('GADs created.');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
