// tests/userController.test.js
const empresasController = require('../controllers/empresasController');

const db = require('../db.js');
const bcrypt = require('bcrypt');

jest.mock('../db.js');
jest.mock('bcrypt');



// Test vacío por ahora
describe('empresasController', () => {
  test('dummy test', () => {
    expect(true).toBe(true);
  });
});

describe('Funcion crearEmpresa', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        nombre: 'EmpresaTest',
        descripcion: 'Una empresa de prueba',
        correo: 'empresa@test.com',
        contrasenia: '123456',
        latitud: '-17.3895',
        longitud: '-66.1568',
        contacto: '77777777'
      },
      files: {
        logo: [{ buffer: Buffer.from('logo') }],
        QR_pago: [{ buffer: Buffer.from('qr') }]
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('Empresa creada correctamente', async () => {
    bcrypt.hash.mockResolvedValueOnce('hashedPass');
    db.query.mockResolvedValueOnce(); // No retorna nada en un INSERT

    await empresasController.crearEmpresa(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO empresas (nombre, correo, contrasenia, descripcion, latitud, longitud, contacto, logo, QR_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['EmpresaTest', 'empresa@test.com', 'hashedPass', 'Una empresa de prueba', '-17.3895', '-66.1568', '77777777', Buffer.from('logo'), Buffer.from('qr')]
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Empresa creada con éxito' });
  });

  it('Error al crear la empresa (ej. DB o bcrypt falla)', async () => {
    const error = new Error('Fallo en DB');
    bcrypt.hash.mockResolvedValueOnce('hashedPass');
    db.query.mockRejectedValueOnce(error);

    await empresasController.crearEmpresa(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Fallo en DB' });
  });

});

describe('Funcion obtenerEmpresa', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  it('Empresa con logo y QR_pago', async () => {
    const mockEmpresa = {
      id_empresa: 1,
      nombre: 'Empresa1',
      logo: Buffer.from('logo'),
      QR_pago: Buffer.from('qr')
    };

    db.query.mockResolvedValueOnce([[mockEmpresa]]);

    await empresasController.obtenerEmpresas(req, res);

    expect(res.json).toHaveBeenCalledWith([
      {
        id_empresa: 1,
        nombre: 'Empresa1',
        logo: `data:image/png;base64,${Buffer.from('logo').toString('base64')}`,
        QR_pago: `data:image/png;base64,${Buffer.from('qr').toString('base64')}`
      }
    ]);
  });

  it('Empresa sin logo ni QR_pago', async () => {
    const mockEmpresa = {
      id_empresa: 2,
      nombre: 'Empresa2',
      logo: null,
      QR_pago: null
    };

    db.query.mockResolvedValueOnce([[mockEmpresa]]);

    await empresasController.obtenerEmpresas(req, res);

    expect(res.json).toHaveBeenCalledWith([mockEmpresa]);
  });

  it('Empresa con logo pero sin QR_pago', async () => {
    const mockEmpresa = {
      id_empresa: 3,
      nombre: 'Empresa3',
      logo: Buffer.from('logo'),
      QR_pago: null
    };

    db.query.mockResolvedValueOnce([[mockEmpresa]]);

    await empresasController.obtenerEmpresas(req, res);

    expect(res.json).toHaveBeenCalledWith([
      {
        id_empresa: 3,
        nombre: 'Empresa3',
        logo: `data:image/png;base64,${Buffer.from('logo').toString('base64')}`,
        QR_pago: null
      }
    ]);
  });

  it('Empresa sin logo pero con QR_pago', async () => {
    const mockEmpresa = {
      id_empresa: 4,
      nombre: 'Empresa4',
      logo: null,
      QR_pago: Buffer.from('qr')
    };

    db.query.mockResolvedValueOnce([[mockEmpresa]]);

    await empresasController.obtenerEmpresas(req, res);

    expect(res.json).toHaveBeenCalledWith([
      {
        id_empresa: 4,
        nombre: 'Empresa4',
        logo: null,
        QR_pago: `data:image/png;base64,${Buffer.from('qr').toString('base64')}`
      }
    ]);
  });

  it('Error en la base de datos', async () => {
    const error = new Error('DB error');
    db.query.mockRejectedValueOnce(error);

    await empresasController.obtenerEmpresas(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
  });
 
});

describe('Funcion obtenerEmpresaPorId', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { params: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    jest.clearAllMocks();
  });

  it('Empresa encontrada con logo y QR_pago', async () => {
    req.params.id_empresa = 1;
  const mockEmpresa = {
    id_empresa: 1,
    nombre: 'Empresa1',
    logo: Buffer.from('logo'),
    QR_pago: Buffer.from('qr')
  };

  db.query.mockResolvedValueOnce([[mockEmpresa]]);

  await empresasController.obtenerEmpresaPorId(req, res);

  expect(res.json).toHaveBeenCalledWith({
    id_empresa: 1,
    nombre: 'Empresa1',
    logo: `data:image/png;base64,${Buffer.from('logo').toString('base64')}`,
    QR_pago: `data:image/png;base64,${Buffer.from('qr').toString('base64')}`
  });
  });

  it('Empresa encontrada con logo pero sin QR_pago', async () => {
    req.params.id_empresa = 2;
    const mockEmpresa = {
      id_empresa: 2,
      nombre: 'Empresa2',
      logo: Buffer.from('logo'),
      QR_pago: null
    };

    db.query.mockResolvedValueOnce([[mockEmpresa]]);

    await empresasController.obtenerEmpresaPorId(req, res);

    expect(res.json).toHaveBeenCalledWith({
      id_empresa: 2,
      nombre: 'Empresa2',
      logo: `data:image/png;base64,${Buffer.from('logo').toString('base64')}`,
      QR_pago: null
    });
  });

  it('Empresa encontrada con QR_pago pero sin logo', async () => {
    req.params.id_empresa = 3;
    const mockEmpresa = {
      id_empresa: 3,
      nombre: 'Empresa3',
      logo: null,
      QR_pago: Buffer.from('qr')
    };

    db.query.mockResolvedValueOnce([[mockEmpresa]]);

    await empresasController.obtenerEmpresaPorId(req, res);

    expect(res.json).toHaveBeenCalledWith({
      id_empresa: 3,
      nombre: 'Empresa3',
      logo: null,
      QR_pago: `data:image/png;base64,${Buffer.from('qr').toString('base64')}`
    });
  });

  it('Empresa no encontrada', async () => {
    req.params.id_empresa = 4;
    db.query.mockResolvedValueOnce([[]]);

    await empresasController.obtenerEmpresaPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Empresa no encontrada.');
  });

  it('Error en la base de datos', async () => {
    req.params.id_empresa = 5;
    const error = new Error('DB error');
    db.query.mockRejectedValueOnce(error);

    await empresasController.obtenerEmpresaPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Error al consultar la empresa.');
  });
 
});

describe('Funcion eliminarEmpresa', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { params: {}, usuarioId: 1 };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  it('Empresa eliminada con éxito', async () => {
    req.params.id = 1;

    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await empresasController.eliminarEmpresa(req, res);

    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Empresa eliminada con éxito' });
  });

  it('Error al eliminar la empresa', async () => {
    req.params.id = 1;

    const error = new Error('DB error');
    db.query.mockRejectedValueOnce(error);

    await empresasController.eliminarEmpresa(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
  });
 
});


describe('actualizarEmpresa', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id_empresa: '1' },
      body: {},
      files: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('debe retornar 404 si la empresa no existe', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Empresa no encontrada' });
  });

  it('debe retornar 400 si no se proporcionan campos para actualizar', async () => {
    db.query.mockResolvedValueOnce([[{ id_empresa: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se proporcionaron campos para actualizar' });
  });

  it('debe actualizar correctamente con campos básicos', async () => {
    req.body = {
      nombre: 'Empresa X',
      descripcion: 'Descripción de prueba',
      correo: 'correo@empresa.com'
    };

    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]])
      .mockResolvedValueOnce([[{ affectedRows: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Empresa actualizada exitosamente',
      empresaId: '1'
    });
  });

  it('debe actualizar la contraseña si se proporciona', async () => {
    req.body = { contrasenia: 'nueva123' };

    bcrypt.hash.mockResolvedValueOnce('hashed123');
    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]])
      .mockResolvedValueOnce([[{ affectedRows: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('nueva123', 10);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Empresa actualizada exitosamente',
      empresaId: '1'
    });
  });

  it('debe incluir logo y QR_pago si se envían', async () => {
    req.body = { nombre: 'Empresa con archivos' };
    req.files = {
      logo: [{ buffer: Buffer.from('logo data') }],
      QR_pago: [{ buffer: Buffer.from('qr data') }]
    };

    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]])
      .mockResolvedValueOnce([[{ affectedRows: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Empresa actualizada exitosamente',
      empresaId: '1'
    });
  });

  it('debe manejar error inesperado en el try-catch', async () => {
    db.query.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await empresasController.actualizarEmpresa(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Error al actualizar la empresa',
      error: 'Fallo de conexión'
    });
  });

  it('debe retornar 404 si no se afectó ninguna fila al actualizar', async () => {
    req.body = { nombre: 'Otra Empresa' };
  
    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]]) // Empresa encontrada
      .mockResolvedValueOnce([{ affectedRows: 0 }]); // Ninguna fila actualizada
  
    await empresasController.actualizarEmpresa(req, res);
  
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo actualizar la empresa' });
  });
  

  it('debe actualizar solo el campo nombre', async () => {
    req.body = { nombre: 'SoloNombre' };

    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]])
      .mockResolvedValueOnce([[{ affectedRows: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Empresa actualizada exitosamente',
      empresaId: '1'
    });
  });

  it('debe actualizar solo el campo descripcion', async () => {
    req.body = { descripcion: 'Descripción nueva' };

    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]])
      .mockResolvedValueOnce([[{ affectedRows: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Empresa actualizada exitosamente',
      empresaId: '1'
    });
  });

  it('debe actualizar solo el campo correo', async () => {
    req.body = { correo: 'nuevo@correo.com' };

    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]])
      .mockResolvedValueOnce([[{ affectedRows: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Empresa actualizada exitosamente',
      empresaId: '1'
    });
  });

  it('debe actualizar solo el campo latitud', async () => {
    req.body = { latitud: '45.123' };

    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]])
      .mockResolvedValueOnce([[{ affectedRows: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Empresa actualizada exitosamente',
      empresaId: '1'
    });
  });

  it('debe actualizar solo el campo longitud', async () => {
    req.body = { longitud: '67.987' };

    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]])
      .mockResolvedValueOnce([[{ affectedRows: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Empresa actualizada exitosamente',
      empresaId: '1'
    });
  });

  it('debe actualizar solo el campo contacto', async () => {
    req.body = { contacto: '77777777' };

    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]])
      .mockResolvedValueOnce([[{ affectedRows: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Empresa actualizada exitosamente',
      empresaId: '1'
    });
  });

  it('debe actualizar solo el campo logo', async () => {
    req.files = {
      logo: [{ buffer: Buffer.from('logodata') }]
    };

    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]])
      .mockResolvedValueOnce([[{ affectedRows: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Empresa actualizada exitosamente',
      empresaId: '1'
    });
  });

  it('debe actualizar solo el campo QR_pago', async () => {
    req.files = {
      QR_pago: [{ buffer: Buffer.from('qrdata') }]
    };

    db.query
      .mockResolvedValueOnce([[{ id_empresa: 1 }]])
      .mockResolvedValueOnce([[{ affectedRows: 1 }]]);

    await empresasController.actualizarEmpresa(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Empresa actualizada exitosamente',
      empresaId: '1'
    });
  });
});

