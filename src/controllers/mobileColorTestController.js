const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// Get all tests for mobile app (with base64 images)
exports.getAllTests = async (req, res) => {
    try {
        const [tests] = await pool.execute(
            'SELECT id, test_number, test_name, image_base64, correct_answer, description FROM color_blindness_tests ORDER BY test_number'
        );

        sendSuccess(res, { 
            tests: tests.map(test => ({
                testId: test.id,
                testNumber: test.test_number,
                testName: test.test_name,
                image: test.image_base64,
                correctAnswer: test.correct_answer,
                description: test.description
            }))
        });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching tests', 500);
    }
};

// Submit patient answers
exports.submitAnswers = async (req, res) => {
    try {
        const patientId = req.user.id;
        const { answers } = req.body;

        if (!Array.isArray(answers)) {
            return sendError(res, 'Answers must be an array', 400);
        }

        // Get all tests
        const [tests] = await pool.execute('SELECT id, correct_answer FROM color_blindness_tests');
        const testsMap = new Map(tests.map(t => [t.id, t.correct_answer]));

        let correctCount = 0;
        let totalCount = answers.length;

        // Insert answers and calculate results
        for (const answer of answers) {
            const isCorrect = testsMap.get(answer.testId) === answer.answer;

            if (isCorrect) {
                correctCount++;
            }

            await pool.execute(
                'INSERT INTO patient_test_answers (patient_id, test_id, answer, is_correct) VALUES (?, ?, ?, ?)',
                [patientId, answer.testId, answer.answer, isCorrect]
            );
        }

        const score = ((correctCount / totalCount) * 100).toFixed(2);
        let result = 'Normal';

        if (score < 70) {
            result = 'Color Blindness Detected';
        } else if (score < 90) {
            result = 'Possible Color Deficiency';
        }

        sendSuccess(res, {
            totalTests: totalCount,
            correctAnswers: correctCount,
            score: `${score}%`,
            result: result
        }, 'Test completed successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error submitting answers', 500);
    }
};

// Get patient test results
exports.getMyResults = async (req, res) => {
    try {
        const patientId = req.user.id;

        const [results] = await pool.execute(
            `SELECT pta.*, cbt.test_number, cbt.test_name 
             FROM patient_test_answers pta 
             JOIN color_blindness_tests cbt ON pta.test_id = cbt.id 
             WHERE pta.patient_id = ? 
             ORDER BY pta.submitted_at DESC`,
            [patientId]
        );

        // Calculate summary
        const totalTests = results.length;
        const correctAnswers = results.filter(r => r.is_correct).length;
        const score = totalTests > 0 ? ((correctAnswers / totalTests) * 100).toFixed(2) : 0;

        sendSuccess(res, {
            summary: {
                totalTests,
                correctAnswers,
                score: `${score}%`
            },
            details: results.map(r => ({
                testId: r.test_id,
                testNumber: r.test_number,
                testName: r.test_name,
                answer: r.answer,
                isCorrect: r.is_correct,
                submittedAt: r.submitted_at
            }))
        });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching results', 500);
    }
};