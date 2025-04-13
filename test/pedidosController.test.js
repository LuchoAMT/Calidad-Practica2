const pedidosController = require('../controllers/pedidosController');
const db = require('../db'); 
jest.mock('../db');

// Test vacío por ahora
describe('crearPedido', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('debería crear un pedido correctamente con al menos un producto', async () => {
    req = {
      body: {
        id_negocio: 1,
        productos: [
          { id_producto: 1, cantidad: 2, precio: 10 },
          { id_producto: 2, cantidad: 1, precio: 20 }
        ]
      }
    };

    db.query
      .mockResolvedValueOnce() // START TRANSACTION
      .mockResolvedValueOnce([{ insertId: 101 }]) // INSERT INTO pedidos
      .mockResolvedValueOnce() // producto 1
      .mockResolvedValueOnce() // producto 2
      .mockResolvedValueOnce(); // COMMIT

    await pedidosController.crearPedido(req, res);

    expect(db.query).toHaveBeenCalledWith('START TRANSACTION');
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO pedidos'),
      expect.arrayContaining([1, 'pendiente', 40])
    );
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO pedido_producto'),
      [101, 1, 2, 10]
    );
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO pedido_producto'),
      [101, 2, 1, 20]
    );
    expect(db.query).toHaveBeenCalledWith('COMMIT');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Pedido creado con éxito',
      id_pedido: 101
    });
  });

  it('debería manejar correctamente un pedido con lista vacía de productos', async () => {
    req = {
      body: {
        id_negocio: 1,
        productos: []
      }
    };

    db.query
      .mockResolvedValueOnce() // START TRANSACTION
      .mockResolvedValueOnce([{ insertId: 102 }]) // INSERT pedido con monto 0
      .mockResolvedValueOnce(); // COMMIT

    await pedidosController.crearPedido(req, res);

    expect(db.query).toHaveBeenCalledWith('START TRANSACTION');
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO pedidos'),
      [1, 'pendiente', 0]
    );
    expect(db.query).toHaveBeenCalledWith('COMMIT');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Pedido creado con éxito',
      id_pedido: 102
    });
  });

  it('debería hacer rollback si ocurre un error al insertar el pedido', async () => {
    req = {
      body: {
        id_negocio: 1,
        productos: [{ id_producto: 1, cantidad: 1, precio: 10 }]
      }
    };

    db.query
      .mockResolvedValueOnce() // START TRANSACTION
      .mockRejectedValueOnce(new Error('Fallo en inserción')); // Error en INSERT pedido

    await pedidosController.crearPedido(req, res);

    expect(db.query).toHaveBeenCalledWith('ROLLBACK');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error al crear el pedido' });
  });
});


describe('obtenerPedidosPorNegocio', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { id_negocio: '1' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('debería obtener los pedidos correctamente con productos agrupados', async () => {
    const dbResponse = [
      {
        id_pedido: 1,
        fecha_pedido: '2024-04-01',
        estado_pedido: 'pendiente',
        monto_total: 30,
        id_producto: 1,
        cantidad: 2,
        precio: 10,
        producto_nombre: 'Producto A'
      },
      {
        id_pedido: 1,
        fecha_pedido: '2024-04-01',
        estado_pedido: 'pendiente',
        monto_total: 30,
        id_producto: 2,
        cantidad: 1,
        precio: 10,
        producto_nombre: 'Producto B'
      }
    ];

    db.query.mockResolvedValueOnce([dbResponse]);

    await pedidosController.obtenerPedidosPorNegocio(req, res);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        id_pedido: 1,
        fecha_pedido: '2024-04-01',
        estado_pedido: 'pendiente',
        monto_total: 30,
        productos: [
          {
            id_producto: 1,
            nombre: 'Producto A',
            cantidad: 2,
            precio: 10
          },
          {
            id_producto: 2,
            nombre: 'Producto B',
            cantidad: 1,
            precio: 10
          }
        ]
      }
    ]);
  });

  it('debería devolver un arreglo vacío si no hay pedidos', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await pedidosController.obtenerPedidosPorNegocio(req, res);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('debería manejar errores si falla la consulta a la base de datos', async () => {
    db.query.mockRejectedValueOnce(new Error('Error DB'));

    await pedidosController.obtenerPedidosPorNegocio(req, res);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener los pedidos' });
  });
});