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
 
});

describe('Funcion obtenerEmpresaPorId', () => {
 
});

describe('Funcion actualizarEmpresa', () => {
 
});

describe('Funcion eliminarEmpresa', () => {
 
});
