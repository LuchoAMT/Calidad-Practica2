// tests/userController.test.js
const carritosController = require('../controllers/carritosController');
const { addToCart } = require('../controllers/carritosController');
const db = require('../db.js'); // Ajusta según tu proyecto

jest.mock('../db.js'); // Mockea la base de datos, osea no usa el modulo real de la base de datos, sino que lo simula 

// Test vacío por ahora
describe('carritosController', () => {
  test('dummy test', () => {
    expect(true).toBe(true);
  });
});



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


describe('Funcion obtenerCarritoPorId',()=>{
  let req;
  let res;
  
  beforeEach(() => {
    req = {
      params: {
        id_usuario: 1,
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it(' Devuelve productos del carrito del usuario', async () => {
    // Arrange
    const mockRows = [
      {
        id_producto: 101,
        cantidad: 2,
        nombre: 'Producto 1',
        precio: 10,
        imagen_url: 'img1.jpg',
        id_empresa: 5,
        descuento: 0.1,
      },
    ];
    db.query.mockResolvedValueOnce([mockRows]);

    // Act
    await carritosController.obtenerCarritoPorId(req, res);

    // Assert
    expect(db.query).toHaveBeenCalledWith(
      `SELECT c.id_producto, c.cantidad, p.nombre, p.precio, p.imagen_url, p.id_empresa, p.descuento 
            FROM carritos c 
            JOIN productos p ON c.id_producto = p.id_producto
            WHERE c.id_negocio = ? AND c.estado = "activo"`,
      [1]
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockRows);
  });

  it('falla en la consulta del carrito', async () => {
    // Arrange
    const errorMock = new Error('Fallo en la base de datos');
    db.query.mockRejectedValueOnce(errorMock);

    // Act
    await carritosController.obtenerCarritoPorId(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(errorMock);
  });



});




