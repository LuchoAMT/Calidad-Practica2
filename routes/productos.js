const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');

// Controladores
const { crearProducto, obtenerProductosPorProveedor, actualizarProducto, eliminarProducto,obtenerPorductoPorId } = require('../controllers/productosController');

// Crear un producto
router.post('/', crearProducto);

// Obtener los productos 
router.get('/', obtenerProductosPorProveedor);

// Actualizar un producto
router.put('/:id', verificarToken, actualizarProducto);

router.get('/:id_producto', obtenerPorductoPorId);

// Eliminar un producto
router.delete('/:id', verificarToken, eliminarProducto);

module.exports = router;
