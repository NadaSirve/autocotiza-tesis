// backend/src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const { pool, cache } = require('./config/db');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// 1. Endpoint de Salud y Disponibilidad (SLA-01)
app.get('/salud', (req, res) => {
    res.status(200).json({
        estado: 'OK',
        servicio: 'AutoCotiza API REST',
        uptime_segundos: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// 2. Obtener Catálogo de Vehículos y Categorías para los selectores
app.get('/api/vehiculos', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id_vehiculo, marca, modelo, anio_inicio, anio_fin, motorizacion FROM vehiculos ORDER BY marca, modelo'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener vehículos' });
    }
});

// 3. Buscador Principal y Comparador de Precios (CU-01, CU-02, CU-03 + SLA-02)
app.get('/api/repuestos/buscar', async (req, res) => {
    const { marca, modelo, anio, codigo_oem, solo_stock, orden } = req.query;
    const cacheKey = `search:${marca || ''}:${modelo || ''}:${anio || ''}:${codigo_oem || ''}:${solo_stock || ''}:${orden || ''}`;

    try {
        // Consultar Caché primero
        const cached = await cache.get(cacheKey);
        if (cached) {
            return res.json({ origen: 'Caché en Memoria (< 5ms)', resultados: JSON.parse(cached) });
        }

        // Consulta SQL Parametrizada (Prevención SQL Injection - OWASP Top 10)
        let query = `
            SELECT DISTINCT
                r.id_repuesto, r.codigo_oem, r.nombre_estandarizado, r.marca_fabricante,
                c.nombre_categoria,
                o.id_oferta, p.nombre_tienda, o.sku_tienda, o.nombre_publicado_tienda,
                o.precio_clp, o.disponible_stock, o.url_producto_afiliado, o.fecha_actualizacion
            FROM repuestos r
            LEFT JOIN categorias c ON r.id_categoria = c.id_categoria
            LEFT JOIN compatibilidad_vehiculo cv ON r.id_repuesto = cv.id_repuesto
            LEFT JOIN vehiculos v ON cv.id_vehiculo = v.id_vehiculo
            LEFT JOIN equivalencias_oem eq ON r.id_repuesto = eq.id_repuesto
            JOIN ofertas_proveedor o ON r.id_repuesto = o.id_repuesto
            JOIN proveedores p ON o.id_proveedor = p.id_proveedor
            WHERE p.activo = true
        `;
        const params = [];

        if (marca && modelo) {
            params.push(marca, modelo);
            query += ` AND v.marca ILIKE $${params.length - 1} AND v.modelo ILIKE $${params.length}`;
        }

        if (anio) {
            params.push(parseInt(anio));
            query += ` AND $${params.length} BETWEEN v.anio_inicio AND v.anio_fin`;
        }

        if (codigo_oem && codigo_oem.trim() !== '') {
            params.push(`%${codigo_oem.trim()}%`);
            query += ` AND (r.codigo_oem ILIKE $${params.length} OR eq.codigo_alternativo ILIKE $${params.length} OR r.nombre_estandarizado ILIKE $${params.length})`;
        }

        if (solo_stock === 'true') {
            query += ` AND o.disponible_stock = true`;
        }

        query += orden === 'desc' ? ` ORDER BY o.precio_clp DESC` : ` ORDER BY o.precio_clp ASC`;

        const { rows } = await pool.query(query, params);

        // Agrupar ofertas por repuesto
        const mapaRepuestos = new Map();
        for (const row of rows) {
            if (!mapaRepuestos.has(row.id_repuesto)) {
                mapaRepuestos.set(row.id_repuesto, {
                    id_repuesto: row.id_repuesto,
                    codigo_oem: row.codigo_oem,
                    nombre: row.nombre_estandarizado,
                    fabricante: row.marca_fabricante,
                    categoria: row.nombre_categoria,
                    ofertas: []
                });
            }
            const repuesto = mapaRepuestos.get(row.id_repuesto);
            // Evitar duplicados de la misma oferta
            if (!repuesto.ofertas.some(of => of.id_oferta === row.id_oferta)) {
                repuesto.ofertas.push({
                    id_oferta: row.id_oferta,
                    tienda: row.nombre_tienda,
                    sku: row.sku_tienda,
                    nombre_tienda_original: row.nombre_publicado_tienda,
                    precio_clp: row.precio_clp,
                    disponible: row.disponible_stock,
                    actualizado: row.fecha_actualizacion
                });
            }
        }

        const resultados = Array.from(mapaRepuestos.values());

        // Guardar en caché por 10 minutos
        await cache.setEx(cacheKey, 600, JSON.stringify(resultados));

        res.json({ origen: 'PostgreSQL 15', resultados });
    } catch (err) {
        console.error('Error en búsqueda:', err);
        res.status(500).json({ error: 'Error interno al procesar la búsqueda' });
    }
});

// 4. Redirección de Afiliado y Registro de Clics (CU-04 + KPI-03)
app.get('/api/redireccion/:id_oferta', async (req, res) => {
    const { id_oferta } = req.params;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    try {
        const { rows } = await pool.query(
            'SELECT url_producto_afiliado FROM ofertas_proveedor WHERE id_oferta = $1',
            [id_oferta]
        );
        if (rows.length === 0) return res.status(404).send('Oferta no encontrada');

        await pool.query(
            'INSERT INTO clics_afiliacion (id_oferta, ip_hash) VALUES ($1, $2)',
            [id_oferta, ipHash]
        );

        res.redirect(rows[0].url_producto_afiliado);
    } catch (err) {
        res.status(500).send('Error al redirigir al proveedor');
    }
});

// 5. Panel de Monitoreo de KPIs y SLAs (CU-07)
app.get('/api/metricas', async (req, res) => {
    try {
        const clics = await pool.query('SELECT COUNT(*)::int AS total_clics FROM clics_afiliacion');
        const ofertas = await pool.query('SELECT COUNT(*)::int AS total_ofertas FROM ofertas_proveedor');
        const logs = await pool.query('SELECT * FROM logs_extraccion ORDER BY fecha_ejecucion DESC LIMIT 5');

        res.json({
            total_clics_afiliados: clics.rows[0].total_clics,
            total_ofertas_activas: ofertas.rows[0].total_ofertas,
            ultimos_ciclos_scraping: logs.rows
        });
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo métricas' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Backend AutoCotiza corriendo en: http://localhost:${PORT}`);
});