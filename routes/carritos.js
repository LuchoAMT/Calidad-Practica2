const express = require('express');
const router = express.Router();
const cartController = require('../controllers/carritosController');

router.post('/add', cartController.addToCart);
router.get('/:id_usuario', cartController.obtenerCarritoPorId);
router.post('/vaciar', cartController.vaciarCarrito);
router.post('/actualizar', cartController.actualizarCantidadProducto);

module.exports = router;
