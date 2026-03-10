# Dividir

Aplicación web para **dividir gastos** de forma justa entre varias personas. Calcula cuánto debe pagar cada persona teniendo en cuenta qué productos comparte cada una, evitando errores de redondeo típicos.

## ¿Para qué sirve?

Cuando varias personas comparten gastos (una cena, una compra, un viaje...) y cada una paga por productos distintos, Dividir reparte el coste de cada producto entre quienes lo comparten y muestra el total exacto que debe pagar cada persona.

## Cómo usarlo

1. **Añade los productos** con su nombre y precio.
2. **Indica cuántas personas** participan.
3. **Asigna cada producto** a las personas que lo comparten.
4. **Consulta el resultado**: cuánto debe pagar cada persona.
5. Copia el resumen al portapapeles para compartirlo fácilmente.

## Características

- Interfaz en tres pasos sencillos.
- Reparto preciso con el **método de los restos mayores**, evitando que la suma de las partes difiera del total original por errores de redondeo.
- Nombres de personas editables.
- Tabla de productos editable (nombre y precio) antes de continuar.
- Resumen copiable al portapapeles.
- Diseño responsive (funciona en móvil, tablet y escritorio).
- Sin dependencias: HTML, CSS y JavaScript puros.

## Uso

Abre el archivo `index.html` directamente en cualquier navegador moderno. No requiere servidor ni proceso de compilación.

```bash
# Sin necesidad de instalar nada, simplemente abre:
index.html
```

También puedes desplegarlo en cualquier servicio de alojamiento estático (GitHub Pages, Netlify, Vercel, etc.) copiando los tres archivos del proyecto.

## Estructura del proyecto

```
dividir/
├── index.html   # Estructura HTML de la aplicación
├── script.js    # Lógica de la aplicación (vanilla JS)
└── styles.css   # Estilos y diseño responsive
```

## Tecnologías

- HTML5
- CSS3 (Flexbox, Grid, media queries)
- JavaScript ES6+ (sin frameworks ni dependencias)
