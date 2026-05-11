import Database from 'better-sqlite3';
const db = new Database(':memory:');
db.exec("CREATE TABLE test (id INTEGER, data TEXT)");
try {
  let arr = ["foo"];
  db.prepare("INSERT INTO test VALUES (?, ?)").run(1, arr);
  const row = db.prepare("SELECT * FROM test").get();
  console.log("ROW:", row);
} catch (e: any) {
  console.log("ERROR:", e.message);
}
