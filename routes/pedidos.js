const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');

//crear un nuevo producto
router.post('/nuevo', pedidosController.crearPedido);
router.get('/:id_negocio',pedidosController.obtenerPedidosPorNegocio)

module.exports = router;
