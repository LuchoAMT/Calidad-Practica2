const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');  // Conexión a la base de datos

// Lógica para iniciar sesión
exports.iniciarSesion = async (req, res) => {
    const { email, password, userType } = req.body;

    if (userType !== 'negocio' && userType !== 'empresa') {
        return res.status(400).json({ mensaje: 'Tipo de usuario no válido' });
    }

    const queryTable = userType === 'negocio' ? 'negocios' : 'empresas';
    const idColumn = userType === 'negocio' ? 'id_negocio' : 'id_empresa';

    try {
        const [userResult] = await db.query(`SELECT * FROM ${queryTable} WHERE correo = ?`, [email]);

        if (!userResult || userResult.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const user = userResult[0];  

        console.log('Usuario encontrado:', user);

        const match = await bcrypt.compare(password, user.contrasenia);
        console.log('Resultado de comparación de contraseñas:', match);

        if (!match) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        // Genera el token incluyendo el ID del usuario
        const token = jwt.sign({ id: user[idColumn] }, 'secreto', { expiresIn: '1h' });

        res.json({ token, userId: user[idColumn], userType });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};
