const bcrypt = require('bcrypt');
const db = require('../db');  // Conexión a la base de datos

// Crear una nueva empresa 
exports.crearEmpresa = async (req, res) => {
    const { nombre, descripcion, correo, contrasenia, latitud, longitud, contacto } = req.body;
    const logo = req.files['logo'] ? req.files['logo'][0].buffer : null;
    const QR_pago = req.files['QR_pago'] ? req.files['QR_pago'][0].buffer : null;

    const saltRounds = 10;

    try {
        // Hasheamos la contraseña
        const hashedPassword = await bcrypt.hash(contrasenia, saltRounds);

        const query = 'INSERT INTO empresas (nombre, correo, contrasenia, descripcion, latitud, longitud, contacto, logo, QR_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

        await db.query(query, [nombre, correo, hashedPassword, descripcion, latitud, longitud, contacto, logo, QR_pago]);

        // Respuesta exitosa
        res.status(201).json({ mensaje: 'Empresa creada con éxito' });
    } catch (err) {
        console.error('Error al crear la empresa:', err);
        return res.status(500).json({ error: err.message });
    }
}

// Obtener todas las empresas
exports.obtenerEmpresas = async (req, res) => {
    const query = 'SELECT * FROM empresas';

    try {
        const [results] = await db.query(query);

        const empresas = results.map(empresa => {
            if (empresa.logo) {
                empresa.logo = `data:image/png;base64,${empresa.logo.toString('base64')}`;
            }
            if (empresa.QR_pago) {
                empresa.QR_pago = `data:image/png;base64,${empresa.QR_pago.toString('base64')}`;
            }
            return empresa;
        });

        res.json(empresas);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Obtener empresa
exports.obtenerEmpresaPorId = async (req, res) => {
    const empresaId = req.params.id_empresa;

    try {
        const [results] = await db.query('SELECT * FROM empresas WHERE id_empresa = ?', [empresaId]);

        if (results.length === 0) {
            return res.status(404).send('Empresa no encontrada.');
        }

        const empresa = results[0];

        if (empresa.logo) {
            empresa.logo = `data:image/png;base64,${empresa.logo.toString('base64')}`;
        }
        if (empresa.QR_pago) {
            empresa.QR_pago = `data:image/png;base64,${empresa.QR_pago.toString('base64')}`;
        }

        res.json(empresa);
    } catch (err) {
        return res.status(500).send('Error al consultar la empresa.');
    }
};


exports.actualizarEmpresa = async (req, res) => {
    const empresaId = req.params.id_empresa;
    const { nombre, descripcion, correo, contrasenia, latitud, longitud, contacto } = req.body;
    const logo = req.files['logo'] ? req.files['logo'][0].buffer : null;
    const QR_pago = req.files['QR_pago'] ? req.files['QR_pago'][0].buffer : null;

    try {
        const [empresaExistente] = await db.query('SELECT * FROM empresas WHERE id_empresa = ?', [empresaId]);

        if (empresaExistente.length === 0) {
            return res.status(404).json({ mensaje: 'Empresa no encontrada' });
        }

        let updateFields = [];
        let updateValues = [];

        if (nombre){
            updateFields.push('nombre = ?');
            updateValues.push(nombre);
        } 

        if (descripcion) {
            updateFields.push('descripcion = ?');
            updateValues.push(descripcion);
        } 

        if (correo) {
            updateFields.push('correo = ?');
            updateValues.push(correo);
        } 

        if (contrasenia) {
            const hashedPassword = await bcrypt.hash(contrasenia, 10);
            updateFields.push('contrasenia = ?');
            updateValues.push(hashedPassword);
        }

        if (latitud) {
            updateFields.push('latitud = ?'); 
            updateValues.push(latitud);
        } 

        if (longitud) {
            updateFields.push('longitud = ?'); 
            updateValues.push(longitud);
        } 

        if (contacto) {
            updateFields.push('contacto = ?');
            updateValues.push(contacto);  
        } 

        if (logo) {
            updateFields.push('logo = ?');
            updateValues.push(logo);
        } 

        if (QR_pago) {
            updateFields.push('QR_pago = ?');
            updateValues.push(QR_pago);
        } 
        

        if (updateFields.length === 0) {
            return res.status(400).json({ mensaje: 'No se proporcionaron campos para actualizar' });
        }

        const query = `UPDATE empresas SET ${updateFields.join(', ')} WHERE id_empresa = ?`;
        updateValues.push(empresaId);

        const [result] = await db.query(query, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se pudo actualizar la empresa' });
        }

        res.json({ mensaje: 'Empresa actualizada exitosamente', empresaId });
    } catch (err) {
        console.error('Error al actualizar la empresa:', err);
        res.status(500).json({ mensaje: 'Error al actualizar la empresa', error: err.message });
    }
};


// Eliminar una empresa
exports.eliminarEmpresa = async (req, res) => {
    const empresaId = req.params.id;

    const query = 'DELETE FROM empresas WHERE id_empresa = ? AND id = ?';

    try {
        await db.query(query, [req.usuarioId, empresaId]);
        res.json({ mensaje: 'Empresa eliminada con éxito' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};