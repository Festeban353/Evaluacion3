const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Configuración de multer para la subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'imagenes/'); // Directorio donde se guardarán las imágenes subidas
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Configurar la conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tiendavirtual'
});

connection.connect((err) => {
    if (err) {
        console.error('Error de conexión a la base de datos: ' + err.stack);
        return;
    }
    console.log('Conexión exitosa a la base de datos.');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'pagina_principal')));
app.use(express.static(path.join(__dirname, 'imagenes')));

// Ruta para subir imágenes
app.post('/subir_imagenes', upload.single('imagen'), (req, res) => {
    const { NombreImagen } = req.body;
    const Imagen = req.file.filename; // Nombre del archivo de imagen generado por multer

    const sql = 'INSERT INTO imagenes (NombreImagen, Imagen) VALUES (?, ?)';
    connection.query(sql, [NombreImagen, Imagen], (err, result) => {
        if (err) {
            console.error('Error insertando imagen:', err);
            return res.status(500).send('Error insertando imagen');
        }
        console.log('Imagen insertada correctamente.');
        res.redirect('/imagenes.html'); // Redireccionar a la página de imágenes
    });
});

// Ruta para obtener todas las imágenes
app.get('/api/imagenes', (req, res) => {
    const sql = 'SELECT * FROM imagenes';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener imágenes:', err);
            res.status(500).send('Error al obtener imágenes');
            return;
        }
        res.json(results);
    });
});

// Endpoint para iniciar sesión
app.post('/iniciar_sesion', (req, res) => {
    const { correo, contraseña } = req.body;

    const query = 'SELECT Rol FROM usuarios WHERE Correo = ? AND Contraseña = ?';
    connection.query(query, [correo, contraseña], (err, results) => {
        if (err) {
            console.error('Error al iniciar sesión:', err);
            res.status(500).send('Error al iniciar sesión');
        } else if (results.length > 0) {
            const rol = results[0].Rol;
            if (rol === 1) {
                res.send('/listardatos.html');
            } else if (rol === 2) {
                res.send('/usuario.html');
            }
        } else {
            res.status(401).send('Correo o clave incorrectos');
        }
    });
});

// Endpoint para guardar usuarios
app.post('/guardar_usuarios', (req, res) => {
    const { nombre, contraseña, correo, edad, rol } = req.body;

    const sql = 'INSERT INTO usuarios (Nombre, Contraseña, Correo, Edad, Rol) VALUES (?, ?, ?, ?, ?)';
    connection.query(sql, [nombre, contraseña, correo, edad, rol], (err, result) => {
        if (err) {
            console.error('Error al insertar usuario:', err);
            return res.status(500).send('Error al insertar usuario');
        }
        console.log('Usuario registrado correctamente.');
        res.redirect('/index.html'); // Enviar respuesta al cliente
    });
});

// Endpoint para guardar juegos
app.post('/guardar_juegos', (req, res) => {
    const { nombrejuego, genero, precio, fecha, descripcion } = req.body;
    const sql = 'INSERT INTO juegos (NombreJuego, Genero, Precio, Fecha, Descripcion) VALUES (?, ?, ?, ?, ?)';
    connection.query(sql, [nombrejuego, genero, precio, fecha, descripcion], (err, result) => {
        if (err) {
            console.error('Error insertando juego:', err);
            return res.status(500).send('Error insertando juego');
        }
        console.log('Juego insertado correctamente.');
        res.redirect('/listardatos.html');
    });
});

// Ruta para obtener todos los juegos
app.get('/api/juegos', (_req, res) => {
    const sql = 'SELECT * FROM juegos';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener juegos:', err);
            res.status(500).send('Error al obtener juegos');
            return;
        }
        res.json(results);
    });
});

// Ruta para obtener un juego por ID
app.get('/api/juegos/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM juegos WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener el juego:', err);
            res.status(500).send('Error al obtener el juego');
            return;
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).send('Juego no encontrado');
        }
    });
});

// Ruta para modificar un juego
app.post('/modificar_juegos', (req, res) => {
    const { id, nombrejuego, genero, precio, fecha, descripcion } = req.body;
    const sql = 'UPDATE juegos SET NombreJuego = ?, Genero = ?, Precio = ?, Fecha = ?, Descripcion = ? WHERE id = ?';
    connection.query(sql, [nombrejuego, genero, precio, fecha, descripcion, id], (err, _result) => {
        if (err) {
            console.error('Error modificando juego:', err);
            return res.status(500).send('Error modificando juego');
        }
        console.log('Juego modificado correctamente.');
        res.status(200).send('Juego modificado exitosamente');
    });
});

// Ruta para eliminar un juego
app.delete('/eliminar_juegos/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM juegos WHERE id = ?';
    connection.query(sql, [id], (err, _results) => {
        if (err) {
            console.error('Error al eliminar el juego:', err);
            res.status(500).send('Error al eliminar el juego');
            return;
        }
        console.log('Juego eliminado correctamente.');
        res.status(200).send('Juego eliminado exitosamente');
    });
});

// Otras rutas y configuración del servidor...

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
