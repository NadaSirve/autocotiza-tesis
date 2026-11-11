// backend/src/config/db.js
const { Pool } = require('pg');
const { createClient } = require('redis');
require('dotenv').config();

// 1. Conexión a PostgreSQL 15
const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'autocotiza',
    max: 20
});

// Verificar conexión a PostgreSQL al iniciar
pool.connect()
    .then(client => {
        console.log('✅ Conectado exitosamente a PostgreSQL (Base de datos: autocotiza)');
        client.release();
    })
    .catch(err => console.error('❌ Error conectando a PostgreSQL. Revisa tu contraseña en .env:', err.message));

// 2. Sistema de Caché Híbrido (Redis + Fallback en Memoria RAM para Windows)
const memoryCache = new Map();
let redisClient = null;
let redisActivo = false;

async function inicializarCache() {
    try {
        redisClient = createClient({
            url: process.env.REDIS_URL,
            socket: { reconnectStrategy: false }
        });
        redisClient.on('error', () => {}); // Silenciar si Redis no está corriendo en Windows
        await redisClient.connect();
        redisActivo = true;
        console.log('⚡ Conectado a Redis Caché (Puerto 6379)');
    } catch (err) {
        console.log('⚡ Modo Caché en Memoria Local activado (Respaldo automático sin Redis externo)');
    }
}
inicializarCache();

const cache = {
    async get(key) {
        if (redisActivo && redisClient) return await redisClient.get(key);
        const item = memoryCache.get(key);
        if (item && item.expira > Date.now()) return item.valor;
        return null;
    },
    async setEx(key, segundos, valor) {
        if (redisActivo && redisClient) {
            await redisClient.setEx(key, segundos, valor);
        } else {
            memoryCache.set(key, { valor, expira: Date.now() + (segundos * 1000) });
        }
    }
};

module.exports = { pool, cache };