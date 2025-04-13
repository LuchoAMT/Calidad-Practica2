const negocioController = require('../controllers/negociosController');
const db = require('../db.js');
const bcrypt = require('bcrypt');  

jest.mock('../db.js');
jest.mock('bcrypt');

// Test vacío por ahora
describe('negociosController', () => {
    test('dummy test', () => {
      expect(true).toBe(true);
    });
});



describe('Función crearNegocio', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        nombre: 'Tienda Test',
        correo: 'tienda@test.com',
        contrasenia: 'password123',
        informacion: 'Una tienda de prueba',
        latitud: '10.000',
        longitud: '-66.000',
        contacto: '1234567890',
      },
      file: {
        buffer: Buffer.from('fake-image-data'),
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('Crear el negocio correctamente en la base de datos', async () => {
    bcrypt.hash.mockResolvedValueOnce('hashedPassword123');
    db.query.mockResolvedValueOnce(); // Inserción exitosa

    await negocioController.crearNegocio(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO negocios'),
      [
        'Tienda Test',
        'tienda@test.com',
        'hashedPassword123',
        'Una tienda de prueba',
        '10.000',
        '-66.000',
        '1234567890',
        expect.any(Buffer), // La imagen en buffer
      ]
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'negocio creado con éxito' });
  });

  it('Error al crear el negocio (fallo en la base de datos)', async () => {
    bcrypt.hash.mockResolvedValueOnce('hashedPassword123');
    db.query.mockRejectedValueOnce(new Error('Error en DB'));

    await negocioController.crearNegocio(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error en DB' });
  });
});


describe('Función obtenerNegocios', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('Devuelve la lista de negocios correctamente', async () => {
    const mockNegocios = [{ id_negocio: 1, nombre: 'Negocio 1' }, { id_negocio: 2, nombre: 'Negocio 2' }];
    db.query.mockResolvedValueOnce([mockNegocios]);

    await negocioController.obtenerNegocios(req, res);

    expect(db.query).toHaveBeenCalledWith('SELECT * FROM negocios');
    expect(res.json).toHaveBeenCalledWith(mockNegocios);
  });

  it('Error al consultar negocios (fallo en DB)', async () => {
    db.query.mockRejectedValueOnce(new Error('Fallo en DB'));

    await negocioController.obtenerNegocios(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Fallo en DB' });
  });
});


describe('Función obtenerNegocioPorId', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        id_negocio: '1',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('Devuelve un negocio correctamente (con foto)', async () => {
    const bufferFoto = Buffer.from('fakeimagebinary');
    const mockNegocio = {
      id_negocio: 1,
      nombre: 'Tienda Test',
      foto: bufferFoto,
    };

    db.query.mockResolvedValueOnce([[mockNegocio]]);

    await negocioController.obtenerNegocioPorId(req, res);

    expect(db.query).toHaveBeenCalledWith('SELECT * FROM negocios WHERE id_negocio = ?', ['1']);
    expect(res.json).toHaveBeenCalledWith({
      ...mockNegocio,
      foto: `data:image/png;base64,${bufferFoto.toString('base64')}`,
    });
  });

  it('Devuelve un negocio correctamente (sin foto)', async () => {
    const mockNegocio = {
      id_negocio: 2,
      nombre: 'Tienda sin foto',
      foto: null,
    };

    db.query.mockResolvedValueOnce([[mockNegocio]]);

    await negocioController.obtenerNegocioPorId(req, res);

    expect(res.json).toHaveBeenCalledWith(mockNegocio);
  });

  it('Negocio no encontrado', async () => {
    db.query.mockResolvedValueOnce([[]]); // no se encontró el negocio

    await negocioController.obtenerNegocioPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Negocio no encontrado.');
  });

  it('Error al consultar el negocio', async () => {
    db.query.mockRejectedValueOnce(new Error('Fallo en DB'));

    await negocioController.obtenerNegocioPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Error al consultar el negocio.');
  });
});



describe('actualizarNegocio', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id_negocio: '1' },
      body: {
        nombre: 'Nuevo nombre',
        informacion: 'Nueva info',
        correo: 'nuevo@correo.com',
        contrasenia: 'nuevaClave',
        latitud: '20.0',
        longitud: '-100.0',
        contacto: '1234567890'
      },
      file: { buffer: Buffer.from('fake-image') }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
    db.query.mockResolvedValue([[{ id_negocio: 1 }]]);
    bcrypt.hash.mockResolvedValue('hashedPassword');
  });

  it('Actualiza todos los campos', async () => {
    db.query.mockResolvedValueOnce([[{ id_negocio: 1 }]]); // negocio existe
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // update exitoso

    await negocioController.actualizarNegocio(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('nuevaClave', 10);
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Negocio actualizado exitosamente',
      negocioId: '1'
    });
  });

  it('Actualiza sin foto', async () => {
    delete req.file;

    await negocioController.actualizarNegocio(req, res);

    expect(bcrypt.hash).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Negocio actualizado exitosamente' }));
  });

  it('Actualiza sin foto ni contacto', async () => {
    delete req.file;
    delete req.body.contacto;

    await negocioController.actualizarNegocio(req, res);

    expect(bcrypt.hash).toHaveBeenCalled();
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE negocios'), expect.any(Array));
  });

  it('Actualiza sin foto, contacto y longitud', async () => {
    delete req.file;
    delete req.body.contacto;
    delete req.body.longitud;

    await negocioController.actualizarNegocio(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  it('Actualiza solo nombre, info, correo y contraseña', async () => {
    req.body = {
      nombre: 'SoloNombre',
      informacion: 'SoloInfo',
      correo: 'solo@correo.com',
      contrasenia: 'clave'
    };

    await negocioController.actualizarNegocio(req, res);

    expect(bcrypt.hash).toHaveBeenCalled();
  });

  it('Actualiza solo nombre, info y correo', async () => {
    req.body = {
      nombre: 'NombreInfoCorreo',
      informacion: 'Info',
      correo: 'correo@correo.com'
    };

    await negocioController.actualizarNegocio(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  it('Actualiza solo nombre e info', async () => {
    req.body = {
      nombre: 'Nombre',
      informacion: 'Info'
    };

    await negocioController.actualizarNegocio(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  it('Actualiza solo nombre', async () => {
    req.body = { nombre: 'NombreSolito' };

    await negocioController.actualizarNegocio(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  it('No se proporcionan campos para actualizar', async () => {
    req.body = {};
    delete req.file;

    await negocioController.actualizarNegocio(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se proporcionaron campos para actualizar' });
  });

  it('No se encuentra el negocio', async () => {
    db.query.mockResolvedValueOnce([[]]); // no existe

    await negocioController.actualizarNegocio(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Negocio no encontrado' });
  });

  it('Error al ejecutar la actualización', async () => {
    db.query.mockResolvedValueOnce([[{ id_negocio: 1 }]]);
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]); // update fallido

    await negocioController.actualizarNegocio(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo actualizar el negocio' });
  });

  it('Solo actualiza contraseña (con hash)', async () => {
    req.body = { contrasenia: 'soloPass' };

    await negocioController.actualizarNegocio(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('soloPass', 10);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Negocio actualizado exitosamente' }));
  });

  it('Error en la consulta al buscar el negocio', async () => {
    db.query.mockRejectedValueOnce(new Error('Fallo DB'));

    await negocioController.actualizarNegocio(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      mensaje: 'Error al actualizar el negocio',
      error: 'Fallo DB'
    }));
  });
});

describe('eliminarNegocio', () => {
  let req, res;

  beforeEach(() => {
      req = {
          params: { id: '20' },
          usuarioId: 1
      };
      res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
      };
  });

  it('Eliminación exitosa del negocio (desactivacion)', async () => {
      db.query.mockResolvedValueOnce();

      await negocioController.eliminarNegocio(req, res);

      expect(db.query).toHaveBeenCalledWith(
          'DELETE FROM negocios WHERE id_negocio = ? AND id = ?',
          [req.usuarioId, req.params.id]
      );
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'negocio eliminado con éxito' });
  });

  it('Error al eliminar el negocio (DB error)', async () => {
      const error = new Error('Error de base de datos');
      db.query.mockRejectedValueOnce(error);

      await negocioController.eliminarNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
  });
});
