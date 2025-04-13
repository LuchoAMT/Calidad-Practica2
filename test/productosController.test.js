const productosController = require('../controllers/productosController');
const db = require('../db');
jest.mock('../db'); 

// Test vacío por ahora
describe('productosController', () => {
    test('dummy test', () => {
      expect(true).toBe(true);
    });
  });

describe('crearProducto', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('debería crear un producto correctamente', async () => {
    req = {
      body: {
        nombre: 'Producto 1',
        descripcion: 'Descripción del producto 1',
        precio: 100,
        imagen_url: 'http://example.com/imagen.jpg'
      },
      usuarioId: 1 // ID de la empresa autenticado
    };

    db.query.mockResolvedValueOnce(); // Simular la consulta a la base de datos

    await productosController.crearProducto(req, res);

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO productos (nombre, descripcion, precio, imagen_url, id_empresa) VALUES (?, ?, ?, ?, ?)',
      ['Producto 1', 'Descripción del producto 1', 100, 'http://example.com/imagen.jpg', 1]
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Producto creado con éxito' });
  });

  it('debería manejar errores al crear un producto', async () => {
    req = {
      body: {
        nombre: 'Producto 2',
        descripcion: 'Descripción del producto 2',
        precio: 200,
        imagen_url: 'http://example.com/imagen2.jpg'
      },
      usuarioId: 2 // ID de la empresa autenticado
    };

    db.query.mockRejectedValueOnce(new Error('Error en la base de datos'));

    await productosController.crearProducto(req, res);

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO productos (nombre, descripcion, precio, imagen_url, id_empresa) VALUES (?, ?, ?, ?, ?)',
      ['Producto 2', 'Descripción del producto 2', 200, 'http://example.com/imagen2.jpg', 2]
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error en la base de datos' });
  });
});

describe('obtenerProductosPorProveedor', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('debería obtener productos filtrados por empresa correctamente', async () => {
    req = {
      query: {
        id_empresa: '5'
      }
    };

    const productosMock = [
      { id_producto: 1, nombre: 'Producto A', id_empresa: 5 },
      { id_producto: 2, nombre: 'Producto B', id_empresa: 5 }
    ];

    db.query.mockResolvedValueOnce([productosMock]);

    await productosController.obtenerProductosPorProveedor(req, res);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM productos WHERE id_empresa = ?',
      ['5']
    );
    expect(res.json).toHaveBeenCalledWith(productosMock);
  });

  it('debería obtener todos los productos si no se especifica id_empresa', async () => {
    req = { query: {} };

    const productosMock = [
      { id_producto: 1, nombre: 'Producto A', id_empresa: 1 },
      { id_producto: 2, nombre: 'Producto B', id_empresa: 2 }
    ];

    db.query.mockResolvedValueOnce([productosMock]);

    await productosController.obtenerProductosPorProveedor(req, res);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM productos',
      []
    );
    expect(res.json).toHaveBeenCalledWith(productosMock);
  });

  it('debería devolver un error si falla la consulta a la base de datos', async () => {
    req = { query: {} };

    db.query.mockRejectedValueOnce(new Error('DB error'));

    await productosController.obtenerProductosPorProveedor(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
  });
});


describe('obtenerPorductoPorId', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });

  it('debería obtener un producto correctamente por ID', async () => {
    req = { params: { id_producto: '10' } };

    const productoMock = [
      {
        id_producto: 10,
        nombre: 'Producto A',
        descripcion: 'Desc',
        precio: 50,
        imagen_url: 'url',
        id_empresa: 1
      }
    ];

    db.query.mockResolvedValueOnce([productoMock]);

    await productosController.obtenerPorductoPorId(req, res);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM productos WHERE id_producto = ?',
      ['10']
    );
    expect(res.json).toHaveBeenCalledWith(productoMock[0]);
  });

  it('debería devolver 404 si no se encuentra el producto', async () => {
    req = { params: { id_producto: '99' } };

    db.query.mockResolvedValueOnce([[]]);

    await productosController.obtenerPorductoPorId(req, res);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM productos WHERE id_producto = ?',
      ['99']
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Producto no encontrado.');
  });

  it('debería devolver 500 si ocurre un error en la base de datos', async () => {
    req = { params: { id_producto: '20' } };

    db.query.mockRejectedValueOnce(new Error('DB error'));

    await productosController.obtenerPorductoPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Error al consultar la empresa.');
  });
});


describe('actualizarProducto', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('debería actualizar el producto correctamente', async () => {
    req = {
      params: { id: '10' },
      usuarioId: 1,
      body: {
        nombre: 'Nuevo Producto',
        descripcion: 'Nueva descripción',
        precio: 99.99,
        imagen_url: 'imagen.jpg',
        etiqueta: 'promo',
        descuento: 10
      }
    };

    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await productosController.actualizarProducto(req, res);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE productos SET'),
      [
        'Nuevo Producto',
        'Nueva descripción',
        99.99,
        'imagen.jpg',
        'promo',
        10,
        '10',
        1
      ]
    );
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Producto actualizado con éxito'
    });
  });

  it('debería devolver 404 si no se encuentra el producto o no pertenece a la empresa', async () => {
    req = {
      params: { id: '20' },
      usuarioId: 2,
      body: {
        nombre: 'Producto No Existente',
        descripcion: 'Desc',
        precio: 50,
        imagen_url: 'img.png',
        etiqueta: 'oferta',
        descuento: 0
      }
    };

    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

    await productosController.actualizarProducto(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Producto no encontrado o no tiene permiso para editarlo'
    });
  });

  it('debería devolver 500 si ocurre un error en la base de datos', async () => {
    req = {
      params: { id: '30' },
      usuarioId: 3,
      body: {
        nombre: 'Error',
        descripcion: 'DB',
        precio: 1,
        imagen_url: 'error.jpg',
        etiqueta: 'x',
        descuento: 0
      }
    };

    db.query.mockRejectedValueOnce(new Error('DB error'));

    await productosController.actualizarProducto(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
  });
});


describe('eliminarProducto', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('debería eliminar el producto correctamente', async () => {
    req = {
      params: { id: '5' },
      usuarioId: 2
    };

    db.query.mockResolvedValueOnce(); // DELETE

    await productosController.eliminarProducto(req, res);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM productos'),
      ['5', 2]
    );
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Producto eliminado con éxito'
    });
  });

  it('debería devolver error 500 si falla la eliminación en base de datos', async () => {
    req = {
      params: { id: '99' },
      usuarioId: 3
    };

    db.query.mockRejectedValueOnce(new Error('Error en DB'));

    await productosController.eliminarProducto(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error en DB'
    });
  });
});