import Database from 'better-sqlite3';
const db = new Database('./chathotel.db');
const res = db.prepare("SELECT id, contract_urls FROM stays").all();
console.log(res);
