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

// Get tests by test type (normal, protanopia, deuteranopia)
// الحصول على الاختبارات حسب نوع الاختبار
exports.getTestsByType = async (req, res) => {
    try {
        const { testType } = req.params; // normal, protanopia, deuteranopia
        
        // Map test types to plate_type values
        // تعيين أنواع الاختبارات إلى قيم plate_type
        let plateType;
        if (testType === 'normal') {
            plateType = 'All see';
        } else if (testType === 'protanopia' || testType === 'deuteranopia') {
            plateType = 'Red-Green';
        } else {
            return sendError(res, 'Invalid test type. Use: normal, protanopia, or deuteranopia', 400);
        }

        // Get tests filtered by plate type
        // الحصول على الاختبارات المصفاة حسب نوع اللوحة
        const [tests] = await pool.execute(
            `SELECT id, test_number, test_name, image_base64, correct_answer, description, plate_type 
             FROM color_blindness_tests 
             WHERE plate_type = ? 
             ORDER BY test_number`,
            [plateType]
        );

        sendSuccess(res, { 
            testType: testType,
            tests: tests.map(test => ({
                testId: test.id,
                testNumber: test.test_number,
                testName: test.test_name,
                image: test.image_base64,
                correctAnswer: test.correct_answer,
                description: test.description,
                plateType: test.plate_type
            }))
        });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching tests by type', 500);
    }
};

// Get preview image for a test type
// الحصول على صورة المعاينة لنوع الاختبار
exports.getTestTypePreview = async (req, res) => {
    try {
        const { testType } = req.params; // normal, protanopia, deuteranopia
        
        // Map test types to plate_type values
        // تعيين أنواع الاختبارات إلى قيم plate_type
        let plateType;
        if (testType === 'normal') {
            plateType = 'All see';
        } else if (testType === 'protanopia' || testType === 'deuteranopia') {
            plateType = 'Red-Green';
        } else {
            return sendError(res, 'Invalid test type. Use: normal, protanopia, or deuteranopia', 400);
        }

        // Get first test image for this plate type as preview
        // الحصول على أول صورة اختبار لهذا النوع كمعاينة
        const [tests] = await pool.execute(
            `SELECT id, test_number, test_name, image_base64, plate_type 
             FROM color_blindness_tests 
             WHERE plate_type = ? 
             ORDER BY test_number 
             LIMIT 1`,
            [plateType]
        );

        if (tests.length === 0) {
            return sendError(res, `No preview image found for test type: ${testType}`, 404);
        }

        sendSuccess(res, {
            testType: testType,
            previewImage: tests[0].image_base64,
            testId: tests[0].id,
            testNumber: tests[0].test_number,
            testName: tests[0].test_name
        });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching test type preview', 500);
    }
};