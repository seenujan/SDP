
import { pool } from '../config/database';

const sampleQuestions = [
    // Mathematics
    {
        question_text: "What is the value of Pi (π) to two decimal places?",
        question_type: "multiple_choice",
        subject: "Mathematics",
        topic: "Geometry",
        difficulty_level: "easy",
        marks: 1,
        options: JSON.stringify(["3.12", "3.14", "3.16", "3.18"]),
        correct_answer: "3.14"
    },
    {
        question_text: "Solve for x: 2x + 5 = 15",
        question_type: "multiple_choice",
        subject: "Mathematics",
        topic: "Algebra",
        difficulty_level: "medium",
        marks: 2,
        options: JSON.stringify(["5", "10", "7.5", "2"]),
        correct_answer: "5"
    },
    {
        question_text: "A triangle with all three sides equal is called?",
        question_type: "short_answer",
        subject: "Mathematics",
        topic: "Geometry",
        difficulty_level: "medium",
        marks: 2,
        options: null,
        correct_answer: "equilateral"
    },

    // Science
    {
        question_text: "Which planet is known as the Red Planet?",
        question_type: "multiple_choice",
        subject: "Science",
        topic: "Astronomy",
        difficulty_level: "easy",
        marks: 1,
        options: JSON.stringify(["Venus", "Jupiter", "Mars", "Saturn"]),
        correct_answer: "Mars"
    },
    {
        question_text: "Water boils at 100 degrees Celsius.",
        question_type: "true_false",
        subject: "Science",
        topic: "Physics",
        difficulty_level: "easy",
        marks: 1,
        options: null,
        correct_answer: "True"
    },
    {
        question_text: "What gas do plants absorb from the atmosphere for photosynthesis?",
        question_type: "short_answer",
        subject: "Science",
        topic: "Biology",
        difficulty_level: "medium",
        marks: 2,
        options: null,
        correct_answer: "carbon dioxide,co2"
    },

    // English
    {
        question_text: "Identify the verb in the sentence: 'The cat slept on the mat.'",
        question_type: "multiple_choice",
        subject: "English",
        topic: "Grammar",
        difficulty_level: "easy",
        marks: 1,
        options: JSON.stringify(["The", "cat", "slept", "mat"]),
        correct_answer: "slept"
    },
    {
        question_text: "Who wrote 'Romeo and Juliet'?",
        question_type: "multiple_choice",
        subject: "English",
        topic: "Literature",
        difficulty_level: "medium",
        marks: 1,
        options: JSON.stringify(["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"]),
        correct_answer: "William Shakespeare"
    },

    // History
    {
        question_text: "In which year did World War II end?",
        question_type: "multiple_choice",
        subject: "History",
        topic: "World War II",
        difficulty_level: "medium",
        marks: 1,
        options: JSON.stringify(["1942", "1944", "1945", "1950"]),
        correct_answer: "1945"
    },
    {
        question_text: "The Great Wall of China was built to protect against invasions.",
        question_type: "true_false",
        subject: "History",
        topic: "Ancient Civilizations",
        difficulty_level: "easy",
        marks: 1,
        options: null,
        correct_answer: "True"
    }
];

async function seedQuestions() {
    try {
        console.log('Starting seed process...');

        // 1. Find a valid teacher ID
        const [teachers]: any = await pool.query("SELECT user_id FROM teachers LIMIT 1");
        let teacherId = 5; // Default from your screenshot fallback
        if (teachers.length > 0) {
            teacherId = teachers[0].user_id;
            console.log(`Using Teacher ID: ${teacherId}`);
        } else {
            // Fallback: Check users table for a teacher if teachers table is empty
            const [users]: any = await pool.query("SELECT id FROM users WHERE role = 'teacher' LIMIT 1");
            if (users.length > 0) {
                teacherId = users[0].id;
                console.log(`Using Teacher User ID: ${teacherId}`);
            } else {
                console.log(`No teachers found. Using ID 1 as fallback.`);
                teacherId = 1;
            }
        }

        // 2. Clear existing questions (Optional: User asked to remove old records)
        console.log('Clearing existing questions...');
        await pool.query("DELETE FROM question_bank");
        // Also reset auto increment if possible, but not strictly necessary for functionality
        await pool.query("ALTER TABLE question_bank AUTO_INCREMENT = 1");


        // 3. Insert new questions
        console.log('Inserting new questions...');
        const query = `
            INSERT INTO question_bank 
            (question_text, question_type, subject, topic, difficulty_level, marks, options, correct_answer, teacher_id) 
            VALUES ?
        `;

        const values = sampleQuestions.map(q => [
            q.question_text,
            q.question_type,
            q.subject,
            q.topic,
            q.difficulty_level,
            q.marks,
            q.options,
            q.correct_answer,
            teacherId
        ]);

        await pool.query(query, [values]);

        console.log(`✅ Successfully inserted ${values.length} questions.`);
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedQuestions();
