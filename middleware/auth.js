const jwt = require('jsonwebtoken');

exports.verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ mensaje: 'Token no proporcionado' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(403).json({ mensaje: 'Formato de token inválido' });

    jwt.verify(token, 'secreto', (err, decoded) => {
        if (err) return res.status(401).json({ mensaje: 'Token inválido o expirado' });
        req.usuarioId = decoded.id;
        console.log("Usuario ID extraído del token: ", req.usuarioId);
        next();
    });
};