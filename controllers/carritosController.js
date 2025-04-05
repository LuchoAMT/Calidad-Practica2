const db = require('../db');

// Agregar un producto al carrito
exports.addToCart = async (req, res) => {
    const { id_usuario, id_producto, cantidad } = req.body;

    try {
        await db.query(
            'INSERT INTO carritos (id_negocio, id_producto, cantidad, estado) VALUES (?, ?, ?, ?)',
            [id_usuario, id_producto, cantidad, 'activo']
        );
        res.status(201).send({ message: 'Producto añadido al carrito.' });
    } catch (error) {
        res.status(500).send(error);
    }
};

// Recuperar productos del carrito
exports.obtenerCarritoPorId = async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT c.id_producto, c.cantidad, p.nombre, p.precio, p.imagen_url, p.id_empresa, p.descuento 
            FROM carritos c 
            JOIN productos p ON c.id_producto = p.id_producto
            WHERE c.id_negocio = ? AND c.estado = "activo"`,
            [id_usuario]
        );
        res.status(200).send(rows);
    } catch (error) {
        res.status(500).send(error);
    }
};

// Vaciar carrito
exports.vaciarCarrito = async (req, res) => {
    const { id_usuario } = req.body;

    try {
        await db.query(
            'UPDATE carritos SET estado = "inactivo" WHERE id_negocio = ?',
            [id_usuario]
        );
        res.status(200).send({ message: 'Carrito vaciado.' });
    } catch (error) {
        res.status(500).send(error);
    }
};

// Actualizar cantidad de un producto en el carrito
exports.actualizarCantidadProducto = async (req, res) => {
    const { id_usuario, id_producto, cantidad } = req.body;

    try {
        let [result] = '';
        if (cantidad <= 0){
            [result] = await db.query(
                'UPDATE carritos SET estado = ? WHERE id_negocio = ? AND id_producto = ? AND estado = "activo"',
                ["inactivo", id_usuario, id_producto]
            );
        } else {
            [result] = await db.query(
                'UPDATE carritos SET cantidad = ? WHERE id_negocio = ? AND id_producto = ? AND estado = "activo"',
                [cantidad, id_usuario, id_producto]
            );
        }

        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Producto no encontrado en el carrito.' });
        }

        res.status(200).send({ message: 'Cantidad actualizada.' });
    } catch (error) {
        res.status(500).send(error);
    }
};
