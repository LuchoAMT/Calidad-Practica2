const db = require('../db'); // Conexión a la base de datos

// Crear un nuevo pedido
exports.crearPedido = async (req, res) => {
    const { id_negocio, productos } = req.body; // `productos` es un array con { id_producto, cantidad, precio }

    const pedidoQuery = 'INSERT INTO pedidos (id_negocio, fecha_pedido, estado_pedido, monto_total) VALUES (?, NOW(), ?, ?)';
    const pedidoProductoQuery = 'INSERT INTO pedido_producto (id_pedido, id_producto, cantidad, precio) VALUES (?, ?, ?, ?)';

    try {
        // Calcular el monto total del pedido
        const montoTotal = productos.reduce((total, producto) => total + producto.precio * producto.cantidad, 0);

        // Iniciar una transacción
        await db.query('START TRANSACTION');

        // Insertar el pedido en la tabla `pedidos`
        const [pedidoResult] = await db.query(pedidoQuery, [id_negocio, 'pendiente', montoTotal]);

        // Obtener el ID del pedido recién creado
        const idPedido = pedidoResult.insertId;

        // Insertar los productos en la tabla `pedido_producto`
        for (const producto of productos) {
            await db.query(pedidoProductoQuery, [idPedido, producto.id_producto, producto.cantidad, producto.precio]);
        }

        // Confirmar la transacción
        await db.query('COMMIT');

        res.status(201).json({ mensaje: 'Pedido creado con éxito', id_pedido: idPedido });
    } catch (err) {
        // Si ocurre un error, revertir la transacción
        await db.query('ROLLBACK');
        console.error('Error al crear el pedido:', err);
        res.status(500).json({ error: 'Error al crear el pedido' });
    }
};


exports.obtenerPedidosPorNegocio = async (req, res) => {
  const { id_negocio } = req.params;  // Se obtiene el id_negocio desde los parámetros de la URL

  // Consulta SQL para obtener los pedidos del negocio
  const query = `
      SELECT
    p.id_pedido,
    p.fecha_pedido,
    p.estado_pedido,
    p.monto_total,
    pp.id_producto,
    pp.cantidad,
    pp.precio,
    pr.nombre AS producto_nombre
FROM
    pedidos p
LEFT JOIN
    pedido_producto pp ON p.id_pedido = pp.id_pedido
LEFT JOIN
    productos pr ON pp.id_producto = pr.id_producto
WHERE
    p.id_negocio = ?;


  `;

  try {
      const [result] = await db.query(query, [id_negocio]);

      // Organiza los productos para cada pedido
      const pedidos = result.reduce((acc, row) => {
          let pedido = acc.find(p => p.id_pedido === row.id_pedido);
          if (!pedido) {
              pedido = {
                  id_pedido: row.id_pedido,
                  fecha_pedido: row.fecha_pedido,
                  estado_pedido: row.estado_pedido,
                  monto_total: row.monto_total,
                  productos: []
              };
              acc.push(pedido);
          }
          pedido.productos.push({
              id_producto: row.id_producto,
              nombre: row.producto_nombre,
              cantidad: row.cantidad,
              precio: row.precio
          });
          return acc;
      }, []);

      res.status(200).json(pedidos);
  } catch (err) {
      console.error('Error al obtener los pedidos:', err);
      res.status(500).json({ error: 'Error al obtener los pedidos' });
  }
};
