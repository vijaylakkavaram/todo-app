/**
 * src/index.js  — real entry point (production + dev server)
 *
 * This file is the ONLY place that calls app.listen().
 * Tests import src/server.js directly and never touch this file,
 * so no TCP server is ever opened during a test run.
 */

const app = require('./server');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Task Manager running on http://localhost:${PORT}`);
});

module.exports = server; // optional — useful for graceful shutdown scripts