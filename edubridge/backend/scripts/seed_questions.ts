
import { pool } from '../src/config/database';

const questions = [
    // 1. Tamil
    {
        subject_id: 1,
        question_text: 'திருக்குறளை எழுதியவர் யார்?',
        question_type: 'multiple_choice',
        topic: 'Literature',
        difficulty_level: 'easy',
        marks: 1,
        options: JSON.stringify(['திருவள்ளுவர்', 'கம்பர்', 'பாரதியார்', 'ஔவையார்']),
        correct_answer: 'திருவள்ளுவர்'
    },
    {
        subject_id: 1,
        question_text: 'சிலப்பதிகாரம் என்பது யாது?',
        question_type: 'multiple_choice',
        topic: 'Literature',
        difficulty_level: 'medium',
        marks: 2,
        options: JSON.stringify(['காப்பியம்', 'சிறுகதை', 'நாவல்', 'நாடகம்']),
        correct_answer: 'காப்பியம்'
    },
    {
        subject_id: 1,
        question_text: 'தமிழின் முதல் இலக்கண நூல் எது?',
        question_type: 'short_answer',
        topic: 'Grammar',
        difficulty_level: 'hard',
        marks: 3,
        options: null,
        correct_answer: 'தொல்காப்பியம்'
    },

    // 2. Maths
    {
        subject_id: 2,
        question_text: 'What is the value of Pi (approx)?',
        question_type: 'multiple_choice',
        topic: 'Geometry',
        difficulty_level: 'easy',
        marks: 1,
        options: JSON.stringify(['3.14', '3.12', '3.16', '3.81']),
        correct_answer: '3.14'
    },
    {
        subject_id: 2,
        question_text: 'Solve for x: 2x + 5 = 15',
        question_type: 'multiple_choice',
        topic: 'Algebra',
        difficulty_level: 'medium',
        marks: 2,
        options: JSON.stringify(['5', '10', '7.5', '2']),
        correct_answer: '5'
    },
    {
        subject_id: 2,
        question_text: 'A triangle with all sides equal is called?',
        question_type: 'short_answer',
        topic: 'Geometry',
        difficulty_level: 'medium',
        marks: 2,
        options: null,
        correct_answer: 'equilateral'
    },

    // 3. Science
    {
        subject_id: 3,
        question_text: 'What is the chemical symbol for Gold?',
        question_type: 'multiple_choice',
        topic: 'Chemistry',
        difficulty_level: 'easy',
        marks: 1,
        options: JSON.stringify(['Au', 'Ag', 'Fe', 'Cu']),
        correct_answer: 'Au'
    },
    {
        subject_id: 3,
        question_text: 'Photosynthesis occurs in which part of the plant?',
        question_type: 'multiple_choice',
        topic: 'Biology',
        difficulty_level: 'medium',
        marks: 2,
        options: JSON.stringify(['Leaves', 'Roots', 'Stem', 'Flowers']),
        correct_answer: 'Leaves'
    },
    {
        subject_id: 3,
        question_text: 'Water boils at 100 degrees Celsius.',
        question_type: 'true_false',
        topic: 'Physics',
        difficulty_level: 'easy',
        marks: 1,
        options: null,
        correct_answer: 'true'
    },

    // 4. History
    {
        subject_id: 4,
        question_text: 'Who was the first Prime Minister of Sri Lanka?',
        question_type: 'multiple_choice',
        topic: 'Sri Lankan History',
        difficulty_level: 'medium',
        marks: 2,
        options: JSON.stringify(['D.S. Senanayake', 'S.W.R.D. Bandaranaike', 'Sirimavo Bandaranaike', 'J.R. Jayewardene']),
        correct_answer: 'D.S. Senanayake'
    },
    {
        subject_id: 4,
        question_text: 'In which year did World War II end?',
        question_type: 'multiple_choice',
        topic: 'World History',
        difficulty_level: 'medium',
        marks: 1,
        options: JSON.stringify(['1945', '1939', '1918', '1950']),
        correct_answer: '1945'
    },
    {
        subject_id: 4,
        question_text: 'The Great Wall of China was built to protect against invasions.',
        question_type: 'true_false',
        topic: 'Ancient History',
        difficulty_level: 'easy',
        marks: 1,
        options: null,
        correct_answer: 'true'
    },

    // 5. English
    {
        subject_id: 5,
        question_text: 'Identify the verb in the sentence: "The cat slept on the mat."',
        question_type: 'multiple_choice',
        topic: 'Grammar',
        difficulty_level: 'easy',
        marks: 1,
        options: JSON.stringify(['slept', 'cat', 'mat', 'The']),
        correct_answer: 'slept'
    },
    {
        subject_id: 5,
        question_text: 'What is the past tense of "Go"?',
        question_type: 'short_answer',
        topic: 'Grammar',
        difficulty_level: 'easy',
        marks: 1,
        options: null,
        correct_answer: 'Went'
    },
    {
        subject_id: 5,
        question_text: 'Who wrote "Romeo and Juliet"?',
        question_type: 'multiple_choice',
        topic: 'Literature',
        difficulty_level: 'medium',
        marks: 1,
        options: JSON.stringify(['William Shakespeare', 'Charles Dickens', 'Mark Twain', 'Jane Austen']),
        correct_answer: 'William Shakespeare'
    },

    // 6. Sinhala
    {
        subject_id: 6,
        question_text: 'What is the Sinhala word for "Mother"?',
        question_type: 'multiple_choice',
        topic: 'Vocabulary',
        difficulty_level: 'easy',
        marks: 1,
        options: JSON.stringify(['Amma', 'Thaththa', 'Aiya', 'Akka']),
        correct_answer: 'Amma'
    },

    // 7. Geography
    {
        subject_id: 7,
        question_text: 'Which is the longest river in the world?',
        question_type: 'multiple_choice',
        topic: 'World Geography',
        difficulty_level: 'medium',
        marks: 1,
        options: JSON.stringify(['Nile', 'Amazon', 'Yangtze', 'Mississippi']),
        correct_answer: 'Nile'
    },
    {
        subject_id: 7,
        question_text: 'Mount Everest is located in which mountain range?',
        question_type: 'short_answer',
        topic: 'Physical Geography',
        difficulty_level: 'medium',
        marks: 2,
        options: null,
        correct_answer: 'Himalayas'
    },

    // 8. Civics
    {
        subject_id: 8,
        question_text: 'What is the minimum voting age in Sri Lanka?',
        question_type: 'multiple_choice',
        topic: 'Government',
        difficulty_level: 'easy',
        marks: 1,
        options: JSON.stringify(['18', '21', '16', '25']),
        correct_answer: '18'
    },

    // 9. Pts (Physical Training/Sports?) -> Interpreting as PTS/Physical Education
    {
        subject_id: 9,
        question_text: 'How many players are there in a cricket team?',
        question_type: 'multiple_choice',
        topic: 'Sports',
        difficulty_level: 'easy',
        marks: 1,
        options: JSON.stringify(['11', '10', '12', '9']),
        correct_answer: '11'
    },

    // 10. Arts
    {
        subject_id: 10,
        question_text: 'Which are the primary colors?',
        question_type: 'multiple_choice',
        topic: 'Color Theory',
        difficulty_level: 'easy',
        marks: 1,
        options: JSON.stringify(['Red, Blue, Yellow', 'Green, Orange, Purple', 'Black, White, Grey', 'Red, Green, Blue']),
        correct_answer: 'Red, Blue, Yellow'
    },

    // 11. Dance
    {
        subject_id: 11,
        question_text: 'Kandyan dance originated in which country?',
        question_type: 'multiple_choice',
        topic: 'Traditional Dance',
        difficulty_level: 'easy',
        marks: 1,
        options: JSON.stringify(['Sri Lanka', 'India', 'Thailand', 'China']),
        correct_answer: 'Sri Lanka'
    },

    // 12. Music
    {
        subject_id: 12,
        question_text: 'How many keys are on a standard piano?',
        question_type: 'multiple_choice',
        topic: 'Instruments',
        difficulty_level: 'hard',
        marks: 2,
        options: JSON.stringify(['88', '66', '72', '90']),
        correct_answer: '88'
    },

    // 13. Drama
    {
        subject_id: 13,
        question_text: 'The person who directs a play is called the...',
        question_type: 'short_answer',
        topic: 'Theater',
        difficulty_level: 'easy',
        marks: 1,
        options: null,
        correct_answer: 'Director'
    },

    // 14. Physics
    {
        subject_id: 14,
        question_text: 'Force = Mass x Acceleration is which law?',
        question_type: 'multiple_choice',
        topic: 'Mechanics',
        difficulty_level: 'medium',
        marks: 2,
        options: JSON.stringify(['Newton\'s 2nd Law', 'Newton\'s 1st Law', 'Newton\'s 3rd Law', 'Ohm\'s Law']),
        correct_answer: 'Newton\'s 2nd Law'
    },

    // 15. Chemistry
    {
        subject_id: 15,
        question_text: 'What is the pH of pure water?',
        question_type: 'multiple_choice',
        topic: 'Acids and Bases',
        difficulty_level: 'easy',
        marks: 1,
        options: JSON.stringify(['7', '0', '14', '5']),
        correct_answer: '7'
    },

    // 16. Biology
    {
        subject_id: 16,
        question_text: 'Which organ pumps blood in the human body?',
        question_type: 'multiple_choice',
        topic: 'Anatomy',
        difficulty_level: 'easy',
        marks: 1,
        options: JSON.stringify(['Heart', 'Lungs', 'Brain', 'Liver']),
        correct_answer: 'Heart'
    },
    {
        subject_id: 16,
        question_text: 'DNA stands for Deoxyribonucleic Acid.',
        question_type: 'true_false',
        topic: 'Genetics',
        difficulty_level: 'medium',
        marks: 1,
        options: null,
        correct_answer: 'true'
    }
];

async function seedQuestions() {
    try {
        console.log('Clearing existing questions...');
        await pool.query('DELETE FROM question_bank');
        await pool.query('ALTER TABLE question_bank AUTO_INCREMENT = 1');

        console.log('Inserting new questions...');
        const teacherId = 5;

        for (const q of questions) {
            await pool.query(
                `INSERT INTO question_bank 
                (question_text, question_type, subject_id, teacher_id, topic, difficulty_level, marks, options, correct_answer, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [q.question_text, q.question_type, q.subject_id, teacherId, q.topic, q.difficulty_level, q.marks, q.options, q.correct_answer]
            );
        }

        console.log(`Successfully inserted ${questions.length} questions for Teacher ID ${teacherId}`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding questions:', error);
        process.exit(1);
    }
}

seedQuestions();
