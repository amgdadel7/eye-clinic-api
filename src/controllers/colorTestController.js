const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAllTests = async (req, res) => {
    try {
        const [tests] = await pool.execute(
            'SELECT id, test_number, test_name, correct_answer, description FROM color_blindness_tests ORDER BY test_number'
        );

        sendSuccess(res, { tests });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching tests', 500);
    }
};

exports.getTestById = async (req, res) => {
    try {
        const [tests] = await pool.execute(
            'SELECT * FROM color_blindness_tests WHERE id = ?',
            [req.params.id]
        );

        if (tests.length === 0) {
            return sendError(res, 'Test not found', 404);
        }

        sendSuccess(res, { test: tests[0] });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching test', 500);
    }
};

exports.createTest = async (req, res) => {
    try {
        const { testNumber, testName, imageBase64, correctAnswer, description } = req.body;

        if (!testNumber || !imageBase64 || !correctAnswer) {
            return sendError(res, 'Required fields: testNumber, imageBase64, correctAnswer', 400);
        }

        const [result] = await pool.execute(
            'INSERT INTO color_blindness_tests (test_number, test_name, image_base64, correct_answer, description) VALUES (?, ?, ?, ?, ?)',
            [testNumber, testName, imageBase64, correctAnswer, description]
        );

        sendSuccess(res, { testId: result.insertId }, 'Test created successfully', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error creating test', 500);
    }
};

exports.updateTest = async (req, res) => {
    try {
        const { testNumber, testName, imageBase64, correctAnswer, description } = req.body;
        const updates = [];
        const values = [];

        if (testNumber) { updates.push('test_number = ?'); values.push(testNumber); }
        if (testName) { updates.push('test_name = ?'); values.push(testName); }
        if (imageBase64) { updates.push('image_base64 = ?'); values.push(imageBase64); }
        if (correctAnswer) { updates.push('correct_answer = ?'); values.push(correctAnswer); }
        if (description) { updates.push('description = ?'); values.push(description); }

        if (updates.length === 0) {
            return sendError(res, 'No fields to update', 400);
        }

        values.push(req.params.id);
        await pool.execute(`UPDATE color_blindness_tests SET ${updates.join(', ')} WHERE id = ?`, values);

        sendSuccess(res, null, 'Test updated successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating test', 500);
    }
};

exports.deleteTest = async (req, res) => {
    try {
        await pool.execute('DELETE FROM color_blindness_tests WHERE id = ?', [req.params.id]);

        sendSuccess(res, null, 'Test deleted successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error deleting test', 500);
    }
};