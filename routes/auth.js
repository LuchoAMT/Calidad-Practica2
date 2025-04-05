const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/iniciar-sesion', authController.iniciarSesion);

module.exports = router;