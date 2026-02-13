# Notes.ai - Smart Notes App 🎨📝

Una aplicación de notas inteligente con múltiples temas visuales, búsqueda AI, sincronización en la nube y soporte PWA completo.

## ✨ Características

### 🎨 **4 Temas Dinámicos**
- **Neural**: Tema oscuro con estilo neon púrpura y tecnológico
- **Solar**: Tema claro elegante con tipografía serif
- **Matrix**: Tema hacker terminal verde fosforescente
- **Sunset**: Tema vaporwave con gradientes atardecidos

Los iconos de la app cambian automáticamente según el tema seleccionado.

### 🔐 **Autenticación y Sincronización**
- Inicio de sesión con Google
- Sincronización automática de notas en Firestore
- Soporte offline con almacenamiento local

### 📱 **PWA (Progressive Web App)**
- Instalable en cualquier dispositivo
- Funciona offline
- Iconos adaptativos por tema
- Service Worker con estrategia Network First
- Totalmente optimizada para móvil

### 🤖 **Búsqueda Inteligente**
- Búsqueda local instantánea
- Búsqueda semántica con AI (Mistral)
- Resaltado de coincidencias

### 💬 **Importación de WhatsApp**
- Importa conversaciones exportadas de WhatsApp (.txt)
- Parseo automático de mensajes
- Cada mensaje se convierte en una nota

### 🖼️ **Soporte de Imágenes**
- Subida de imágenes a las notas
- Galería visual en el editor
- Miniaturas en la lista de notas

## 🚀 Instalación

1. Clona el repositorio
2. Abre `index.html` en un servidor web local (no directamente por file://)
3. Para desarrollo local, puedes usar:
   ```bash
   npx serve .
   ```

## 📖 Uso

### Cambiar Tema
- Click en el botón de paleta (🎨) en la esquina superior derecha
- O abre Ajustes y selecciona el tema deseado

### Crear Nota
- Click en el botón flotante (+)
- Escribe título y contenido
- Agrega imágenes con el botón de clip
- Guarda con el botón GUARDAR

### Buscar Notas
- Usa la barra de búsqueda
- Búsqueda local instantánea
- Si no hay resultados locales, se activa búsqueda AI (presiona Enter)

### Importar WhatsApp
1. Exporta una conversación de WhatsApp sin medios (archivo .txt)
2. Ve a Ajustes (⚙️)
3. Click en "Chat de WhatsApp"
4. Selecciona el archivo .txt
5. Las notas se importarán automáticamente

### Sincronización
1. Ve a Ajustes
2. Inicia sesión con Google
3. Tus notas se sincronizarán automáticamente con Firestore

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Estilos**: Tailwind CSS + CSS Variables
- **Backend**: Firebase (Auth + Firestore)
- **AI**: Mistral API para búsqueda semántica
- **PWA**: Service Worker, Web App Manifest
- **Tipografías**: Google Fonts (múltiples familias)

## 📁 Estructura de Archivos

```
notesai/
├── index.html          # Página principal
├── style.css           # Estilos y temas CSS
├── script.js           # Lógica JavaScript
├── manifest.json       # PWA Manifest
├── sw.js              # Service Worker
├── icon-neural.svg    # Icono tema Neural
├── icon-solar.svg     # Icono tema Solar
├── icon-matrix.svg    # Icono tema Matrix
└── icon-sunset.svg    # Icono tema Sunset
```

## 🎯 Características Técnicas

### Service Worker
- Estrategia Network First con fallback a cache
- Cache de recursos estáticos
- Soporte offline completo

### Firebase Integration
```javascript
// Configuración incluida
- Authentication con Google Provider
- Firestore para almacenamiento de notas
- Sincronización bidireccional
```

### Temas Adaptativos
- Cambio de favicon dinámico
- Meta tag theme-color adaptativo
- Apple touch icon dinámico
- CSS Variables para personalización

## 📱 Soporte Móvil

- Responsive design completo
- Touch gestures optimizados
- viewport-fit=cover para iPhone X+
- PWA installable en iOS y Android
- Iconos adaptativos

## 🔒 Privacidad

- Notas almacenadas localmente por defecto
- Sincronización opcional con Firebase
- Autenticación segura con Google
- Sin tracking de terceros

## 🌟 Roadmap

- [ ] Soporte para más formatos de importación
- [ ] Etiquetas y categorías
- [ ] Modo de edición Markdown
- [ ] Exportación a PDF
- [ ] Compartir notas
- [ ] Colaboración en tiempo real
- [ ] Modo oscuro automático (según sistema)

## 📄 Licencia

MIT License - Usa y modifica libremente

## 👨‍💻 Autor

Desarrollado con ❤️ usando tecnologías modernas web

---

**¡Disfruta tomando notas con estilo!** ✨
