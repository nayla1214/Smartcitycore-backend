require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Gad, Course, Module, Video, Evaluation, Question, Option } = require('../models');

async function seedAll() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        await sequelize.sync({ alter: true });

        // 1. Admin
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
        console.log('✓ Admin user created.');

        // 3. Curso 1
        let course = await Course.findByPk(1);
        if (!course) {
            course = await Course.create({
                id: 1,
                name: 'Ciudades Inteligentes y Gobierno Digital',
                description: 'Aprende los conceptos fundamentales de las ciudades inteligentes, transformación digital en el sector público y gestión eficiente de los GADs.',
                status: true
            });
        }

        // ─── MÓDULO 1 ───────────────────────────────────────────────
        let mod1 = await Module.findByPk(1);
        if (!mod1) {
            mod1 = await Module.create({
                id: 1,
                courseId: course.id,
                title: 'Fundamentos de Ciudades Inteligentes',
                description: 'Introducción a los conceptos clave de las ciudades inteligentes.',
                order_number: 1
            });
        }

        let vid1 = await Video.findByPk(1);
        if (!vid1) {
            vid1 = await Video.create({
                id: 1,
                moduleId: mod1.id,
                title: 'Video 1: ¿Qué es una Ciudad Inteligente?',
                description: 'Visión general del concepto de ciudad inteligente y sus componentes principales.',
                url:'2HS6SITpfOY',
                duration: 426,
                order_number: 1
            });
        } else {
            await vid1.update({ url: '2HS6SITpFOY', duration: 426 });
        }

        let eval1 = await Evaluation.findByPk(1);
        if (!eval1) {
            eval1 = await Evaluation.create({
                id: 1,
                moduleId: mod1.id,
                courseId: course.id,
                title: 'Evaluación: Fundamentos de Ciudades Inteligentes',
                is_final: false
            });
        }

        await Question.destroy({ where: { evaluationId: eval1.id } });

        const q1 = await Question.create({ evaluationId: eval1.id, text: '¿Cuál de las siguientes opciones describe mejor una ciudad inteligente?', score: 1 });
        await Option.create({ questionId: q1.id, text: 'Una ciudad con muchos edificios altos y modernos', is_correct: false });
        await Option.create({ questionId: q1.id, text: 'Una ciudad que usa tecnología y datos para mejorar la calidad de vida de sus ciudadanos', is_correct: true });
        await Option.create({ questionId: q1.id, text: 'Una ciudad con una gran población y alta densidad', is_correct: false });

        const q2 = await Question.create({ evaluationId: eval1.id, text: '¿Qué significa IoT en el contexto de ciudades inteligentes?', score: 1 });
        await Option.create({ questionId: q2.id, text: 'Internet of Traffic', is_correct: false });
        await Option.create({ questionId: q2.id, text: 'Internet of Things (Internet de las Cosas)', is_correct: true });
        await Option.create({ questionId: q2.id, text: 'Institute of Technology', is_correct: false });

        console.log('✓ Module 1, Video and Evaluation seeded.');

        // ─── MÓDULO 2 ───────────────────────────────────────────────
        let mod2 = await Module.findByPk(2);
        if (!mod2) {
            mod2 = await Module.create({
                id: 2,
                courseId: course.id,
                title: 'Gobierno Digital y Transformación Pública',
                description: 'Aprende cómo los GADs pueden implementar el gobierno digital.',
                order_number: 2
            });
        }

        let vid2 = await Video.findByPk(2);
        if (!vid2) {
            vid2 = await Video.create({
                id: 2,
                moduleId: mod2.id,
                title: 'Video 1: Qué es el Gobierno Digital',
                description: 'Conceptos de e-government y transformación digital en el sector público ecuatoriano.',
                url: 'aqz-KE-bpKQ',
                duration: 600,
                order_number: 1
            });
        } else {
            await vid2.update({ url: 'aqz-KE-bpKQ', duration: 600 });
        }

        let eval2 = await Evaluation.findByPk(2);
        if (!eval2) {
            eval2 = await Evaluation.create({
                id: 2,
                moduleId: mod2.id,
                courseId: course.id,
                title: 'Evaluación: Gobierno Digital',
                is_final: false
            });
        }

        await Question.destroy({ where: { evaluationId: eval2.id } });

        const q2_1 = await Question.create({ evaluationId: eval2.id, text: '¿Qué es el gobierno digital (e-government)?', score: 1 });
        await Option.create({ questionId: q2_1.id, text: 'Un gobierno formado únicamente por empresas tecnológicas', is_correct: false });
        await Option.create({ questionId: q2_1.id, text: 'El uso de tecnologías digitales para mejorar la administración pública y los servicios a ciudadanos', is_correct: true });
        await Option.create({ questionId: q2_1.id, text: 'Un sistema que elimina completamente los trámites presenciales', is_correct: false });

        const q2_2 = await Question.create({ evaluationId: eval2.id, text: '¿Cuál es una ventaja directa del gobierno digital para el ciudadano?', score: 1 });
        await Option.create({ questionId: q2_2.id, text: 'Mayor tiempo de espera en oficinas', is_correct: false });
        await Option.create({ questionId: q2_2.id, text: 'Acceso a servicios desde cualquier lugar y en cualquier momento', is_correct: true });
        await Option.create({ questionId: q2_2.id, text: 'Más formularios físicos que llenar', is_correct: false });

        console.log('✓ Module 2, Video and Evaluation seeded.');

        // ─── MÓDULO 3 ───────────────────────────────────────────────
        let mod3 = await Module.findByPk(3);
        if (!mod3) {
            mod3 = await Module.create({
                id: 3,
                courseId: course.id,
                title: 'Gestión Sostenible y Participación Ciudadana',
                description: 'Estrategias para involucrar a los ciudadanos en la gestión del GAD.',
                order_number: 3
            });
        }

        let vid3 = await Video.findByPk(3);
        if (!vid3) {
            vid3 = await Video.create({
                id: 3,
                moduleId: mod3.id,
                title: 'Video 1: Participación Ciudadana y Sostenibilidad',
                description: 'Mecanismos modernos para involucrar a la comunidad.',
                url: 'dQw4w9WgXcQ',
                duration: 210,
                order_number: 1
            });
        } else {
            await vid3.update({ url: 'dQw4w9WgXcQ', duration: 210 });
        }

        let eval3 = await Evaluation.findByPk(3);
        if (!eval3) {
            eval3 = await Evaluation.create({
                id: 3,
                moduleId: mod3.id,
                courseId: course.id,
                title: 'Evaluación: Gestión Sostenible',
                is_final: false
            });
        }

        await Question.destroy({ where: { evaluationId: eval3.id } });

        const q3_1 = await Question.create({ evaluationId: eval3.id, text: '¿Qué es la participación ciudadana en el contexto de un GAD?', score: 1 });
        await Option.create({ questionId: q3_1.id, text: 'El derecho y la práctica de los ciudadanos de involucrarse activamente en la toma de decisiones públicas', is_correct: true });
        await Option.create({ questionId: q3_1.id, text: 'La participación de empresas privadas en el gobierno', is_correct: false });

        console.log('✓ Module 3, Video and Evaluation seeded.');

        console.log('🎉 Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedAll();
