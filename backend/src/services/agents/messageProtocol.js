const { randomUUID } = require('crypto');

const MESSAGE_TYPES = {
    TASK: 'TASK',
    FINDINGS: 'FINDINGS',
    ALERT: 'ALERT',
    RECOMMENDATION: 'RECOMMENDATION',
    ESCALATION: 'ESCALATION',
    REPORT: 'REPORT',
};

function createAgentMessage({ from, to, type, payload = {}, priority = 3 }) {
    if (!from || !to || !type) {
        throw new Error('Agent message requires from, to, and type');
    }

    return {
        messageId: randomUUID(),
        from,
        to,
        type,
        payload,
        priority,
        createdAt: new Date(),
    };
}

module.exports = {
    MESSAGE_TYPES,
    createAgentMessage,
};
