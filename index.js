const express = require('express');
const cors = require('cors');
const app = express();
app.disable('x-powered-by');
const port = 3000;

const corsOptions = {
    origin: ['http://localhost:4200', 'merkabo.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
// Middleware
app.use(express.json());

// Rutas
const productosRoutes = require('./routes/productos');
const empresasRoutes = require('./routes/empresas');
const authRoutes = require('./routes/auth');
const negociosRoutes = require('./routes/negocios');
const pedidosRoutes = require('./routes/pedidos');
const carritosRoutes = require('./routes/carritos');

app.use('/auth', authRoutes);
app.use('/productos', productosRoutes);
app.use('/empresas', empresasRoutes);
app.use('/negocios', negociosRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/carritos', carritosRoutes);

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});