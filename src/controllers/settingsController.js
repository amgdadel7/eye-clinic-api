const { sendSuccess, sendError } = require('../utils/response');

// In-memory fallback store per user id (not persistent across restarts)
const uiSettingsStore = new Map();

exports.getUISettings = async (req, res) => {
    const userId = req.user?.id || 'guest';
    const defaults = { language: 'ar', theme: 'light', sidebarCollapsed: false };
    const stored = uiSettingsStore.get(userId) || defaults;
    return sendSuccess(res, stored);
};

exports.updateUISettings = async (req, res) => {
    try {
        const userId = req.user?.id || 'guest';
        const { language, theme, sidebarCollapsed } = req.body || {};
        const current = uiSettingsStore.get(userId) || { language: 'ar', theme: 'light', sidebarCollapsed: false };
        const updated = {
            language: language || current.language,
            theme: theme || current.theme,
            sidebarCollapsed: typeof sidebarCollapsed === 'boolean' ? sidebarCollapsed : current.sidebarCollapsed
        };
        uiSettingsStore.set(userId, updated);
        return sendSuccess(res, updated, 'Settings updated');
    } catch (e) {
        return sendError(res, e.message || 'Failed to update settings', 400);
    }
};



