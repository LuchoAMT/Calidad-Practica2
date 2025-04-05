const express = require('express');
const multer = require('multer');
const { verificarToken } = require('../middleware/auth');  // Middleware para verificar token de autenticación

const storage = multer.memoryStorage(); 
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024 // Limitar el tamaño del archivo a 3 MB
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|png|webp/; 
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(file.originalname.split('.').pop().toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Tipo de archivo no permitido. Solo se permiten imágenes Jpg, Png, y Webp'));
        }
    }
}); // Configuración básica de multer

// Controladores
const { crearEmpresa, obtenerEmpresas, obtenerEmpresaPorId, eliminarEmpresa, actualizarEmpresa } = require('../controllers/empresasController');

const router = express.Router();

// Crear una empresa
router.post('/', upload.fields([{ name: 'logo' }, { name: 'QR_pago' }]), crearEmpresa);

// Obtener las empresas
router.get('/', obtenerEmpresas);

// Obtener las empresas por id
router.get('/:id_empresa', obtenerEmpresaPorId);

// Actualizar una empresa
router.put('/:id_empresa', verificarToken, upload.fields([{ name: 'logo' }, { name: 'QR_pago' }]), actualizarEmpresa);

// Eliminar una empresa
router.delete('/:id_empresa', verificarToken, eliminarEmpresa);

module.exports = router;