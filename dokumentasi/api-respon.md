/**
 * =============================================================
 * API RESPONSE STANDARD
 * =============================================================
 * Modul ini menyediakan helper untuk membentuk response API yang
 * SERAGAM di seluruh endpoint (sukses maupun error).
 *
 * Semua controller/route WAJIB memakai fungsi di file ini,
 * jangan pernah res.json({...}) manual, supaya format tidak
 * pernah berbeda antar developer.
 *
 * Contoh pemakaian di controller:
 *
 *   const { successResponse, errorResponse, ERROR_CODES } = require('../utils/apiResponse');
 *
 *   // Sukses
 *   return successResponse(res, {
 *     message: 'Data barang berhasil diambil',
 *     data: barangList,
 *   });
 *
 *   // Error - data tidak ditemukan
 *   return errorResponse(res, {
 *     status: 404,
 *     code: ERROR_CODES.DATA_NOT_FOUND,
 *     message: 'Barang tidak ditemukan',
 *   });
 * =============================================================
 */

/**
 * Daftar kode error standar yang dipakai di seluruh aplikasi.
 * Tambahkan kode baru di sini jika ada skenario baru,
 * jangan buat string bebas di controller.
 *
 * @readonly
 * @enum {string}
 */
const ERROR_CODES = {
  ENDPOINT_NOT_FOUND: 'ENDPOINT_NOT_FOUND',
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
};

/**
 * Mengirim response SUKSES dengan format seragam.
 *
 * @param {import('express').Response} res - Objek response Express.
 * @param {Object} options
 * @param {number} [options.status=200] - HTTP status code.
 * @param {string} options.message - Pesan sukses yang profesional & jelas.
 * @param {*} [options.data=null] - Payload data yang dikembalikan ke client.
 * @param {Object} [options.pagination] - Info paginasi (page, limit, total_data, total_page).
 * @returns {import('express').Response}
 */
function successResponse(res, { status = 200, message, data = null, pagination = null }) {
  const meta = {
    timestamp: new Date().toISOString(),
    path: res.req?.originalUrl || null,
  };

  if (pagination) {
    meta.pagination = pagination;
  }

  return res.status(status).json({
    success: true,
    status,
    message,
    data,
    meta,
  });
}

/**
 * Mengirim response ERROR dengan format seragam.
 * Jangan pernah meneruskan pesan mentah dari database/Supabase ke client,
 * cukup log detail teknisnya di server (console.error / logger).
 *
 * @param {import('express').Response} res - Objek response Express.
 * @param {Object} options
 * @param {number} options.status - HTTP status code (404, 400, 500, dst).
 * @param {string} options.code - Salah satu dari ERROR_CODES.
 * @param {string} options.message - Pesan error yang profesional & aman ditampilkan ke client.
 * @param {Array<{field: string, message: string}>|null} [options.details=null] - Detail error per-field (untuk validasi).
 * @returns {import('express').Response}
 */
function errorResponse(res, { status, code, message, details = null }) {
  return res.status(status).json({
    success: false,
    status,
    message,
    errors: {
      code,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: res.req?.originalUrl || null,
    },
  });
}

module.exports = {
  successResponse,
  errorResponse,
  ERROR_CODES,
};



/**
 * =============================================================
 * CONTOH PEMAKAIAN — apiResponse.js
 * =============================================================
 * File ini menunjukkan pola pemakaian successResponse/errorResponse
 * di route & controller Express, termasuk cara menangani:
 *   1. Endpoint tidak ditemukan (404 catch-all)
 *   2. Data tidak ditemukan
 *   3. Validasi gagal
 *   4. Error tak terduga di server (500)
 *
 * GitHub Copilot akan mengenali pola import + pemakaian fungsi ini,
 * sehingga saat kamu mengetik controller baru, Copilot akan
 * menyarankan pola yang sama secara otomatis.
 * =============================================================
 */

const express = require('express');
const router = express.Router();
const { successResponse, errorResponse, ERROR_CODES } = require('../utils/apiResponse');
const { supabase } = require('../config/supabaseClient'); // sesuaikan dengan setup client Supabase kamu

/**
 * GET /api/barang/:id
 * Contoh: mengambil satu data barang berdasarkan id.
 * Menunjukkan pola: sukses, data tidak ditemukan, dan error server.
 */
router.get('/barang/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: barang, error } = await supabase
      .from('tb_barang')
      .select('*')
      .eq('id_barang', id)
      .single();

    // Data tidak ditemukan
    if (error || !barang) {
      return errorResponse(res, {
        status: 404,
        code: ERROR_CODES.DATA_NOT_FOUND,
        message: 'Barang dengan id tersebut tidak ditemukan',
      });
    }

    // Sukses
    return successResponse(res, {
      message: 'Data barang berhasil diambil',
      data: barang,
    });
  } catch (err) {
    // Jangan tampilkan err.message asli ke client, cukup log di server
    console.error('[GET /barang/:id] Error:', err);
    return errorResponse(res, {
      status: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Terjadi kesalahan pada server, coba lagi nanti',
    });
  }
});

/**
 * POST /api/barang
 * Contoh: validasi input sebelum insert.
 */
router.post('/barang', async (req, res) => {
  try {
    const { nama_barang, harga, stok } = req.body;
    const validationErrors = [];

    if (!nama_barang) {
      validationErrors.push({ field: 'nama_barang', message: 'Nama barang wajib diisi' });
    }
    if (typeof harga !== 'number' || harga <= 0) {
      validationErrors.push({ field: 'harga', message: 'Harga harus berupa angka positif' });
    }

    if (validationErrors.length > 0) {
      return errorResponse(res, {
        status: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Data yang dikirim tidak valid',
        details: validationErrors,
      });
    }

    const { data: newBarang, error } = await supabase
      .from('tb_barang')
      .insert([{ nama_barang, harga, stok }])
      .select()
      .single();

    if (error) {
      console.error('[POST /barang] Supabase error:', error);
      return errorResponse(res, {
        status: 500,
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Gagal menyimpan data barang',
      });
    }

    return successResponse(res, {
      status: 201,
      message: 'Barang berhasil ditambahkan',
      data: newBarang,
    });
  } catch (err) {
    console.error('[POST /barang] Error:', err);
    return errorResponse(res, {
      status: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Terjadi kesalahan pada server, coba lagi nanti',
    });
  }
});

module.exports = router;

/**
 * =============================================================
 * CATCH-ALL 404 — Endpoint tidak ditemukan
 * =============================================================
 * Taruh middleware ini PALING BAWAH, setelah semua route
 * terdaftar di app.js/server.js, sebelum error handler global.
 *
 * Contoh di app.js:
 *
 *   const { errorResponse, ERROR_CODES } = require('./utils/apiResponse');
 *
 *   app.use('/api/barang', require('./routes/barang'));
 *   // ... route lainnya ...
 *
 *   // Catch-all: endpoint tidak ditemukan
 *   app.use((req, res) => {
 *     return errorResponse(res, {
 *       status: 404,
 *       code: ERROR_CODES.ENDPOINT_NOT_FOUND,
 *       message: 'Endpoint yang Anda akses tidak ditemukan',
 *     });
 *   });
 *
 *   // Error handler global (menangkap error tak terduga dari middleware manapun)
 *   app.use((err, req, res, next) => {
 *     console.error('[Unhandled Error]', err);
 *     return errorResponse(res, {
 *       status: 500,
 *       code: ERROR_CODES.INTERNAL_SERVER_ERROR,
 *       message: 'Terjadi kesalahan pada server, coba lagi nanti',
 *     });
 *   });
 * =============================================================
 */