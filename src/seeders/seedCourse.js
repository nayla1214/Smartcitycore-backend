require('dotenv').config();
const { sequelize, Course, Module, Video, Evaluation, Question, Option } = require('../models');

async function seedCourse() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        // 1. Crear Curso
        const course = await Course.create({
            name: 'Introducción a Smart Cities para GADs',
            description: 'Aprende los fundamentos de las ciudades inteligentes y cómo aplicarlos en la gestión municipal.',
            status: true
        });
        console.log('Course created.');

        // 2. Crear Módulo 1
        const module1 = await Module.create({
            courseId: course.id,
            title: 'Fundamentos de Ciudades Inteligentes',
            description: 'Conceptos básicos, origen y beneficios de una Smart City.',
            order_number: 1
        });

        // Crear Videos para Módulo 1
        await Video.create({
            moduleId: module1.id,
            title: '¿Qué es una Ciudad Inteligente?',
            description: 'Video introductorio sobre los pilares de una Smart City.',
            url: 'M7lc1UVf-VE', // ID de YouTube
            duration: 120, // 2 minutos (dummy)
            order_number: 1
        });

        // Crear Evaluación para Módulo 1
        const eval1 = await Evaluation.create({
            moduleId: module1.id,
            courseId: course.id,
            title: 'Evaluación del Módulo 1',
            is_final: false
        });

        const q1 = await Question.create({
            evaluationId: eval1.id,
            text: '¿Cuál es el objetivo principal de una Smart City?',
            score: 10
        });

        await Option.create({ questionId: q1.id, text: 'Mejorar la calidad de vida usando tecnología', is_correct: true });
        await Option.create({ questionId: q1.id, text: 'Solo construir edificios altos', is_correct: false });
        await Option.create({ questionId: q1.id, text: 'Aumentar el tráfico vehicular', is_correct: false });

        console.log('Module 1 created.');

        // 3. Crear Módulo 2
        const module2 = await Module.create({
            courseId: course.id,
            title: 'Tecnologías Aplicadas en GADs',
            description: 'Cómo implementar IoT, Big Data e IA en la gestión pública.',
            order_number: 2
        });

        await Video.create({
            moduleId: module2.id,
            title: 'Internet de las Cosas (IoT) en el Municipio',
            description: 'Ejemplos prácticos de sensores y recolección de datos.',
            url: 'jNQXAC9IVRw', // ID de YouTube
            duration: 90,
            order_number: 1
        });

        const eval2 = await Evaluation.create({
            moduleId: module2.id,
            courseId: course.id,
            title: 'Evaluación del Módulo 2',
            is_final: false
        });

        const q2 = await Question.create({
            evaluationId: eval2.id,
            text: '¿Qué significa IoT?',
            score: 10
        });

        await Option.create({ questionId: q2.id, text: 'Internet de las Cosas', is_correct: true });
        await Option.create({ questionId: q2.id, text: 'Intranet Oculta y Tecnológica', is_correct: false });

        console.log('Module 2 created.');

        // 4. Crear Evaluación Final (no atada a un módulo específico, sino al curso)
        const finalEval = await Evaluation.create({
            moduleId: null, // Es final, aplica al curso
            courseId: course.id,
            title: 'Evaluación Final del Curso',
            is_final: true
        });

        const qF1 = await Question.create({
            evaluationId: finalEval.id,
            text: 'Menciona un beneficio clave de implementar estrategias de Smart City en un GAD.',
            score: 10
        });

        await Option.create({ questionId: qF1.id, text: 'Optimización de recursos y servicios públicos', is_correct: true });
        await Option.create({ questionId: qF1.id, text: 'Mayor burocracia', is_correct: false });

        console.log('Final Evaluation created.');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding course:', error);
        process.exit(1);
    }
}

seedCourse();
