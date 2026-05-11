import Database from 'better-sqlite3';
const db = new Database(':memory:');
db.exec("CREATE TABLE test (id INTEGER, data TEXT)");
try {
  let arr = ["foo"];
  db.prepare("INSERT INTO test VALUES (?, ?)").run(1, arr);
  console.log("SUCCESS");
} catch (e: any) {
  console.log("ERROR:", e.message);
}
