const { syllabusData } = require('./src/data/syllabus');
const TOTAL_SYLLABUS_TOPICS = syllabusData
    .filter(m => m.id !== 'resource-bank')
    .reduce((acc, mod) => acc + mod.topics.length, 0);
console.log("Total Topics:", TOTAL_SYLLABUS_TOPICS);
