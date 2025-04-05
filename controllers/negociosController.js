const bcrypt = require('bcrypt');
const db = require('../db');  // Conexión a la base de datos

// Crear un nuevo negocio 
exports.crearNegocio = async (req, res) => {
    const { nombre, informacion, correo, contrasenia, latitud, longitud, contacto } = req.body;
    const foto = req.file ? req.file.buffer : null; // Obtener el buffer de la imagen

    const saltRounds = 10;

    try {
        // Hasheamos la contraseña
        const hashedPassword = await bcrypt.hash(contrasenia, saltRounds);

        const query = 'INSERT INTO negocios (nombre, correo, contrasenia, informacion, latitud, longitud, contacto, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        await db.query(query, [nombre, correo, hashedPassword, informacion, latitud, longitud, contacto, foto]);
        

        res.status(201).json({ mensaje: 'negocio creado con éxito' });
    } catch (err) {
        console.error('Error al crear el negocio:', err);
        return res.status(500).json({ error: err.message });
    }
};

// Obtener negocios
exports.obtenerNegocios = async (req, res) => {

    const query = 'SELECT * FROM negocios';

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.obtenerNegocioPorId = async (req, res) => {
    const negocioId = req.params.id_negocio;

    try {
        const [results] = await db.query('SELECT * FROM negocios WHERE id_negocio = ?', [negocioId]);

        if (results.length === 0) {
            return res.status(404).send('Negocio no encontrado.');
        }

        const negocio = results[0];

        if (negocio.foto) {
            negocio.foto = `data:image/png;base64,${negocio.foto.toString('base64')}`;
        }
        
        res.json(negocio);
    } catch (err) {
        return res.status(500).send('Error al consultar el negocio.');
    }
};

exports.actualizarNegocio = async (req, res) => {
    const negocioId = req.params.id_negocio;
    const { nombre, informacion, correo, contrasenia, latitud, longitud, contacto } = req.body;
    const foto = req.file ? req.file.buffer : null; // Obtener la imagen si existe

    try {
        // Primero verificamos si el negocio existe
        const [negocioExistente] = await db.query(
            'SELECT * FROM negocios WHERE id_negocio = ?',
            [negocioId]
        );

        if (negocioExistente.length === 0) {
            return res.status(404).json({ mensaje: 'Negocio no encontrado' });
        }

        // Preparamos los campos a actualizar
        let updateFields = [];
        let updateValues = [];

        if (nombre) {
            updateFields.push('nombre = ?');
            updateValues.push(nombre);
        }
        if (informacion) {
            updateFields.push('informacion = ?');
            updateValues.push(informacion);
        }
        if (correo) {
            updateFields.push('correo = ?');
            updateValues.push(correo);
        }
        if (contrasenia) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(contrasenia, saltRounds);
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
        if (foto) {
            updateFields.push('foto = ?');
            updateValues.push(foto);
        }

        // Si no hay campos para actualizar
        if (updateFields.length === 0) {
            return res.status(400).json({ mensaje: 'No se proporcionaron campos para actualizar' });
        }

        // Construimos la consulta SQL
        const query = `
            UPDATE negocios 
            SET ${updateFields.join(', ')}
            WHERE id_negocio = ?
        `;

        // Añadimos el id_negocio a los valores
        updateValues.push(negocioId);

        // Ejecutamos la actualización
        const [result] = await db.query(query, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se pudo actualizar el negocio' });
        }

        res.json({
            mensaje: 'Negocio actualizado exitosamente',
            negocioId: negocioId
        });
    } catch (err) {
        console.error('Error al actualizar el negocio:', err);
        res.status(500).json({
            mensaje: 'Error al actualizar el negocio',
            error: err.message
        });
    }
};

// Eliminar una negocio
exports.eliminarNegocio = async (req, res) => {
    const negocioId = req.params.id;

    const query = 'DELETE FROM negocios WHERE id_negocio = ? AND id = ?';

    try {
        await db.query(query, [req.usuarioId, negocioId]);
        res.json({ mensaje: 'negocio eliminado con éxito' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};