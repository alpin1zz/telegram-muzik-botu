const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'admin-panel', 'views'));

const STATS_FILE = path.join(__dirname, 'data', 'stats.json');
const LOGS_FILE = path.join(__dirname, 'data', 'logs.json');

function loadStats() {
    if (fs.existsSync(STATS_FILE)) {
        return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    }
    return {
        global: { totalCommandsUsed: 0, totalVoiceChatTimeMinutes: 0 },
        groups: {},
        users: {},
        monthlyResetDate: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
    };
}

function loadLogs() {
    if (fs.existsSync(LOGS_FILE)) {
        return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
    }
    return [];
}

app.get('/admin', async (req, res) => {
    const stats = loadStats();
    const logs = loadLogs().slice(-20).reverse();

    const usersForDisplay = Object.values(stats.users)
        .sort((a, b) => b.totalCommandsUsed - a.totalCommandsUsed)
        .slice(0, 10);

    const groupsForDisplay = Object.values(stats.groups)
        .sort((a, b) => b.totalCommandsUsed - a.totalCommandsUsed)
        .slice(0, 10);

    const commandCounts = {};
    logs.forEach(log => {
        commandCounts[log.command] = (commandCounts[log.command] || 0) + 1;
    });
    const mostUsedCommands = Object.entries(commandCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([command, count]) => ({ command, count }));

    const errorCommandCounts = {};
    logs.filter(log => !log.success).forEach(log => {
        errorCommandCounts[log.command] = (errorCommandCounts[log.command] || 0) + 1;
    });
    const mostErroredCommands = Object.entries(errorCommandCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([command, count]) => ({ command, count }));

    res.render('stats', {
        stats: stats,
        users: usersForDisplay,
        groups: groupsForDisplay,
        logs: logs,
        mostUsedCommands: mostUsedCommands,
        mostErroredCommands: mostErroredCommands
    });
});

app.listen(PORT, () => {
    console.log(`Admin paneli http://localhost:${PORT}/admin adresinde çalışıyor`);
});