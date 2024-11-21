import Database from 'better-sqlite3';

// SQLite3 데이터베이스 연결 및 초기화
export const db = new Database('./menu.db');
db.pragma('journal_mode = WAL');