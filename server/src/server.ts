import app from "./app.js";
import { env } from "./config/env.js";


import { pool } from "./db/index.js";

async function testDatabase() {
  const result = await pool.query("SELECT NOW()");
  console.log(result.rows);
}

testDatabase();

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
