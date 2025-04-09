// tests/userController.test.js
const carritosController = require('../controllers/carritosController');

// Test vacío por ahora
describe('carritosController', () => {
  test('dummy test', () => {
    expect(true).toBe(true);
  });
});

const { addToCart } = require('../controllers/carritosController');
const db = require('../db.js'); // Ajusta según tu proyecto

jest.mock('../db.js'); // Mockea la base de datos

describe('Funcion addToCart', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        id_usuario: 1,
        id_producto: 101,
        cantidad: 2,
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('Producto añadido al carrito', async () => {
    // Arrange
    db.query.mockResolvedValueOnce();

    // Act
    await addToCart(req, res);

    // Assert
    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO carritos (id_negocio, id_producto, cantidad, estado) VALUES (?, ?, ?, ?)',
      [1, 101, 2, 'activo']
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({ message: 'Producto añadido al carrito.' });
  });

  it('Falla al insertar en la base de datos', async () => {
    // Arrange
    const errorMock = new Error('Error en la base de datos');
    db.query.mockRejectedValueOnce(errorMock);

    // Act
    await addToCart(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(errorMock);
  });
});



