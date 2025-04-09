
const authController = require('../controllers/authController');

const db = require('../db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


jest.mock('../db.js');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');



describe('Funcion iniciarSesion', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        email: 'correo@test.com',
        password: 'password123',
        userType: 'negocio', // valor por defecto
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('Tipo de usuario no válido', async () => {
    req.body.userType = 'otro';

    await authController.iniciarSesion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Tipo de usuario no válido' });
  });

  it('Usuario no encontrado', async () => {
    db.query.mockResolvedValueOnce([[]]); // No se encontró el usuario

    await authController.iniciarSesion(req, res);

    expect(db.query).toHaveBeenCalledWith('SELECT * FROM negocios WHERE correo = ?', ['correo@test.com']);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Usuario no encontrado' });
  });

  it('Contraseña incorrecta', async () => {
    db.query.mockResolvedValueOnce([[{ contrasenia: 'hashedpass', id_negocio: 1 }]]);
    bcrypt.compare.mockResolvedValueOnce(false);

    await authController.iniciarSesion(req, res);

    expect(bcrypt.compare).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Contraseña incorrecta' });
  });

  it('Inicio de sesión exitoso como negocio', async () => {
    db.query.mockResolvedValueOnce([[{ contrasenia: 'hashedpass', id_negocio: 1 }]]);
    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValue('token123');

    await authController.iniciarSesion(req, res);

    expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, 'secreto', { expiresIn: '1h' });
    expect(res.json).toHaveBeenCalledWith({
      token: 'token123',
      userId: 1,
      userType: 'negocio',
    });
  });

  it('Inicio de sesión exitoso como empresa', async () => {
    req.body.userType = 'empresa';
    db.query.mockResolvedValueOnce([[{ contrasenia: 'hashedpass', id_empresa: 5 }]]);
    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValue('token456');

    await authController.iniciarSesion(req, res);

    expect(jwt.sign).toHaveBeenCalledWith({ id: 5 }, 'secreto', { expiresIn: '1h' });
    expect(res.json).toHaveBeenCalledWith({
      token: 'token456',
      userId: 5,
      userType: 'empresa',
    });
  });

  it('Error en consulta a base de datos', async () => {
    const error = new Error('Fallo en DB');
    db.query.mockRejectedValueOnce(error);

    await authController.iniciarSesion(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error en el servidor' });
  });

  it('Error en comparación de contraseñas', async () => {
    db.query.mockResolvedValueOnce([[{ contrasenia: 'hashedpass', id_negocio: 1 }]]);
    bcrypt.compare.mockRejectedValueOnce(new Error('Fallo bcrypt'));

    await authController.iniciarSesion(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error en el servidor' });
  });


 
});

