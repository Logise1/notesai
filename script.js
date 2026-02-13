
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            animation: {
                'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '.5' }
                }
            }
        }
    }
}


const MISTRAL_API_KEY = 'evxly62Xv91b752fbnHA2I3HD988C5RT';
const IMAGE_API_URL = 'https://greenbase.arielcapdevila.com';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBiD1RrFJy5a67mMGBYC36Yiaxv3T-o284",
    authDomain: "webmc-46fab.firebaseapp.com",
    databaseURL: "https://webmc-46fab-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "webmc-46fab",
    storageBucket: "webmc-46fab.firebasestorage.app",
    messagingSenderId: "555226754211",
    appId: "1:555226754211:web:131ec435af9b50071ba316",
    measurementId: "G-TWDNCC4F1X"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;


// --- GESTIÓN DE TEMAS ---
const themes = ['theme-neural', 'theme-solar', 'theme-matrix', 'theme-sunset', 'theme-ocean', 'theme-forest', 'theme-lavender', 'theme-cyberpunk', 'theme-minimal', 'theme-retro'];
const themeColors = ['#050505', '#f8f5f2', '#000000', '#2d1b2e', '#0a1628', '#0f1e13', '#f5f3ff', '#0c0a1d', '#ffffff', '#f4e8d8'];
let currentThemeIndex = parseInt(localStorage.getItem('my_theme_idx')) || 0;

function applyTheme() {
    document.body.className = `h-screen w-full overflow-hidden flex flex-col transition-colors duration-500 ${themes[currentThemeIndex]}`;

    // Cambiar theme-color meta tag
    const themeColorMeta = document.getElementById('theme-color-meta');
    if (themeColorMeta) themeColorMeta.content = themeColors[currentThemeIndex];

    // Toast Notification
    const toast = document.getElementById('theme-toast');
    const names = ['NEURAL', 'SOLAR', 'MATRIX', 'SUNSET', 'OCEAN', 'FOREST', 'LAVENDER', 'CYBERPUNK', 'MINIMAL', 'RETRO'];
    toast.innerText = `THEME: ${names[currentThemeIndex]}`;
    toast.style.opacity = '1';
    setTimeout(() => toast.style.opacity = '0', 2000);

    // Actualizar selección en modal de ajustes
    document.querySelectorAll('.theme-option').forEach((btn, idx) => {
        if (idx === currentThemeIndex) {
            btn.style.borderColor = 'var(--accent-color)';
            btn.style.boxShadow = '0 0 15px var(--accent-glow)';
        } else {
            btn.style.borderColor = 'var(--card-border)';
            btn.style.boxShadow = 'none';
        }
    });

    localStorage.setItem('my_theme_idx', currentThemeIndex);
}

function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme();
}

function selectTheme(index) {
    currentThemeIndex = index;
    applyTheme();
}

// Aplicar al inicio
applyTheme();


// --- ESTADO GLOBAL NOTAS ---
let notes = JSON.parse(localStorage.getItem('my_neural_notes_v2')) || [];

if (notes.length === 0) {
    notes = [
        { id: '1', title: 'Bienvenido', content: 'Prueba el botón de la paleta 🎨 arriba a la derecha para cambiar completamente el estilo de la app.', date: Date.now() },
        { id: '2', title: 'Solar Theme', content: 'El tema Solar es perfecto para leer, con fondo claro y tipografía Serif elegante.', date: Date.now() - 100000 },
        { id: '3', title: 'Matrix Mode', content: 'Follow the white rabbit. Hackea el sistema con el modo terminal.', date: Date.now() - 200000 }
    ];
    localStorage.setItem('my_neural_notes_v2', JSON.stringify(notes));
}

let currentNoteId = null;
let currentImages = [];
let searchTimeout = null;

// --- DOM ---
const notesListEl = document.getElementById('notes-list');
const shimmerEl = document.getElementById('shimmer-container');
const searchInput = document.getElementById('search-input');
const searchLoader = document.getElementById('search-loader');
const editorView = document.getElementById('editor-view');
const searchIcon = document.getElementById('search-icon');
const fileInput = document.getElementById('file-upload');
const imageGallery = document.getElementById('image-gallery');
const clipBtn = document.getElementById('clip-btn');

// --- Inicialización ---
renderNotes(notes);

// --- Eventos ---
searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    if (searchTimeout) clearTimeout(searchTimeout);

    if (!query.trim()) {
        hideLoading();
        renderNotes(notes);
        searchIcon.className = "fas fa-search opacity-50";
        searchIcon.style.color = "";

        // Si llegamos aquí borrando manualmente, volvemos atrás en el historial si estábamos en búsqueda
        if (history.state && history.state.view === 'search') {
            history.back();
        }
        return;
    }

    // Si es el primer carácter, añadimos estado al historial
    if (!history.state || history.state.view !== 'search') {
        history.pushState({ view: 'search' }, '', '');
    }
    // 1. Local Search (Instant)
    const localMatches = performLocalSearch(query);

    if (localMatches.length > 0) {
        hideLoading();
        searchIcon.className = "fas fa-bolt";
        searchIcon.style.color = "var(--accent-color)";
        renderNotes(localMatches, query);
    } else {
        // 2. Prepare AI Search
        notesListEl.innerHTML = '';
        searchIcon.className = "fas fa-circle-notch fa-spin";
        searchIcon.style.color = "var(--accent-color)";

        searchTimeout = setTimeout(() => {
            performAISearch(query);
        }, 1500);
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value;
        if (!query.trim()) return;

        const localMatches = performLocalSearch(query);
        if (localMatches.length === 0) {
            if (searchTimeout) clearTimeout(searchTimeout);
            performAISearch(query);
            searchInput.blur();
        }
    }
});

fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
        await uploadImage(e.target.files[0]);
    }
});

// --- Búsqueda ---
function performLocalSearch(query) {
    const lower = query.toLowerCase();
    return notes.filter(n =>
        (n.title && n.title.toLowerCase().includes(lower)) ||
        (n.content && n.content.toLowerCase().includes(lower))
    ).map(n => ({ ...n, relevance: false, isAi: false }));
}

async function performAISearch(query) {
    showLoading();

    try {
        const context = notes.map(n => ({
            id: n.id,
            text: `${n.title} ${n.content} ${n.images && n.images.length ? '[IMG]' : ''}`
        }));

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: "mistral-large-latest",
                messages: [
                    {
                        role: "system",
                        content: `Eres una IA de búsqueda. Devuelve JSON estrictamente: { "ids": ["id1"] }. Si no hay coincidencia semántica: { "ids": [] }.`
                    },
                    {
                        role: "user",
                        content: `Query: "${query}"\n\nData: ${JSON.stringify(context)}`
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        let contentStr = data.choices[0].message.content.replace(/```json|```/g, '').trim();
        const result = JSON.parse(contentStr);
        const ids = result.ids || [];

        const notesToRender = notes.filter(n => ids.includes(n.id)).map(n => ({ ...n, relevance: true, isAi: true }));

        if (notesToRender.length === 0) {
            notesListEl.innerHTML = `
                        <div class="text-center mt-20 opacity-40 fade-in-up" style="color: var(--text-muted)">
                            <i class="fas fa-satellite-dish text-5xl mb-4"></i>
                            <p class="text-sm font-mono">NO_DATA</p>
                        </div>`;
        } else {
            renderNotes(notesToRender, null);
        }

    } catch (error) {
        console.error(error);
        notesListEl.innerHTML = `<div class="text-center mt-10 font-mono text-red-500 text-xs">ERROR::CONNECTION_LOST</div>`;
    } finally {
        hideLoading();
        searchIcon.className = "fas fa-sparkles";
        searchIcon.style.color = "var(--accent-color)";
    }
}

// --- Renderizado ---
function highlightText(text, query) {
    if (!query || !text) return text || '';
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function renderNotes(items, highlightQuery = null) {
    notesListEl.innerHTML = '';

    if (items.length === 0) {
        if (!highlightQuery) {
            notesListEl.innerHTML = `
                        <div class="text-center mt-24 opacity-30 fade-in-up" style="color: var(--text-muted)">
                            <i class="far fa-circle text-4xl mb-4"></i>
                            <p class="text-xs font-mono tracking-widest">SYSTEM_READY</p>
                        </div>`;
        }
        return;
    }

    const sorted = [...items].sort((a, b) => {
        if (a.relevance && !b.relevance) return -1;
        return b.date - a.date;
    });

    sorted.forEach((note, index) => {
        const dateStr = new Date(note.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        const hasImages = note.images && note.images.length > 0;

        const displayTitle = highlightQuery ? highlightText(note.title, highlightQuery) : (note.title || 'Sin título');
        const displayContent = highlightQuery ? highlightText(note.content, highlightQuery) : (note.content || '...');

        const div = document.createElement('div');
        div.className = 'theme-card p-5 cursor-pointer fade-in-up relative overflow-hidden group hover:opacity-90';
        div.style.animationDelay = `${index * 50}ms`;

        // Bordes especiales por match
        if (note.isAi) {
            div.style.borderColor = 'var(--accent-color)';
            div.style.boxShadow = '0 0 15px var(--accent-glow)';
        } else if (highlightQuery) {
            div.style.borderColor = 'var(--text-main)';
        }

        div.onclick = () => openEditor(note.id);

        // Badge
        let badgeHtml = note.isAi ?
            `<span class="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] font-bold tracking-wider uppercase" 
                        style="color: var(--accent-color); border-color: var(--accent-color); background: var(--accent-glow)">
                        <i class="fas fa-brain"></i> AI
                    </span>` : '';

        // Thumbnail
        let imagesHtml = '';
        if (hasImages) {
            const thumbUrl = `${IMAGE_API_URL}/file/${note.images[0]}`;
            imagesHtml = `
                        <div class="w-14 h-14 rounded-lg bg-gray-500/10 flex-shrink-0 overflow-hidden border ml-4 transition-colors" style="border-color: var(--card-border)">
                            <img src="${thumbUrl}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="img">
                        </div>
                    `;
        }

        const contentHtml = `
                    ${badgeHtml}
                    <div class="flex justify-between items-start z-10 relative">
                        <div class="flex-1 min-w-0 pr-2">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-[10px] font-mono" style="color: var(--text-muted)">${dateStr}</span>
                            </div>
                            <h3 class="font-bold text-lg mb-1 truncate transition-colors font-display" style="color: var(--text-main)">${displayTitle}</h3>
                            <p class="text-sm line-clamp-2 leading-snug" style="color: var(--text-muted)">${displayContent}</p>
                        </div>
                        ${imagesHtml}
                    </div>
                `;

        div.innerHTML = contentHtml;
        notesListEl.appendChild(div);
    });
}

// --- UI Utils ---
function showLoading() {
    searchLoader.parentElement.classList.add('loading-active');
    notesListEl.classList.add('hidden');
    shimmerEl.classList.remove('hidden');
}

function hideLoading() {
    searchLoader.parentElement.classList.remove('loading-active');
    shimmerEl.classList.add('hidden');
    notesListEl.classList.remove('hidden');
}

// --- Editor ---
function openEditor(id = null) {
    currentNoteId = id;
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    const deleteBtn = document.getElementById('btn-delete');
    const meta = document.getElementById('note-meta');

    if (id) {
        const note = notes.find(n => n.id === id);
        titleInput.value = note.title;
        contentInput.value = note.content;
        currentImages = note.images ? [...note.images] : [];
        deleteBtn.classList.remove('hidden');
        meta.textContent = `ID: ${note.id} // T: ${new Date(note.date).toLocaleTimeString()}`;
    } else {
        titleInput.value = '';
        contentInput.value = '';
        currentImages = [];
        deleteBtn.classList.add('hidden');
        meta.textContent = 'NEW_ENTRY_INIT';
    }
    renderEditorImages();
    editorView.classList.remove('translate-x-full');

    // Push state para el gesto de atrás
    history.pushState({ view: 'editor' }, '', '');
}

function closeEditor() {
    editorView.classList.add('translate-x-full');
    if (!searchInput.value) {
        renderNotes(notes);
    } else {
        const query = searchInput.value;
        const localMatches = performLocalSearch(query);
        if (localMatches.length > 0) renderNotes(localMatches, query);
    }

    // Remover del history si fue abierto con pushState
    if (history.state && history.state.view === 'editor') {
        history.back();
    }
}

function saveAndClose() {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();

    if (!title && !content && currentImages.length === 0) {
        closeEditor();
        return;
    }

    const noteData = {
        title,
        content,
        images: currentImages,
        date: Date.now(),
        isAi: false
    };

    if (currentNoteId) {
        const idx = notes.findIndex(n => n.id === currentNoteId);
        if (idx !== -1) {
            notes[idx] = { ...notes[idx], ...noteData };
            syncNoteToFirestore(notes[idx]);
        }
    } else {
        const newNote = { id: Date.now().toString(), ...noteData };
        notes.unshift(newNote);
        syncNoteToFirestore(newNote);
    }

    localStorage.setItem('my_neural_notes_v2', JSON.stringify(notes));
    renderNotes(notes);
    searchInput.value = '';
    closeEditor();
}

function deleteCurrentNote() {
    if (confirm('CONFIRM DELETE?')) {
        deleteNoteFromFirestore(currentNoteId);
        notes = notes.filter(n => n.id !== currentNoteId);
        localStorage.setItem('my_neural_notes_v2', JSON.stringify(notes));
        renderNotes(notes);
        searchInput.value = '';
        closeEditor();
    }
}

// --- Imágenes ---
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const originalIcon = clipBtn.innerHTML;
    clipBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    clipBtn.style.color = 'var(--accent-color)';
    clipBtn.disabled = true;

    try {
        const response = await fetch(`${IMAGE_API_URL}/upload`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload Failed');
        const data = await response.json();
        currentImages.push(data.id);
        renderEditorImages();
    } catch (error) {
        console.error(error);
        alert("UPLOAD_ERROR");
    } finally {
        clipBtn.innerHTML = originalIcon;
        clipBtn.style.color = '';
        clipBtn.disabled = false;
        fileInput.value = '';
    }
}

function renderEditorImages() {
    imageGallery.innerHTML = '';
    if (currentImages.length === 0) {
        imageGallery.classList.add('hidden');
        return;
    }
    imageGallery.classList.remove('hidden');

    currentImages.forEach((imgId, index) => {
        const imgUrl = `${IMAGE_API_URL}/file/${imgId}`;
        const div = document.createElement('div');
        div.className = "relative group rounded-lg overflow-hidden border aspect-square";
        div.style.borderColor = 'var(--card-border)';
        div.style.background = 'var(--bg-color)';

        div.innerHTML = `
                    <img src="${imgUrl}" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all">
                    <button onclick="removeImage(${index})" class="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center transition-colors backdrop-blur-md" style="background: rgba(0,0,0,0.6); color: white;">
                        <i class="fas fa-times text-[10px]"></i>
                    </button>
                `;
        imageGallery.appendChild(div);
    });
}
function removeImage(index) {
    currentImages.splice(index, 1);
    renderEditorImages();
}

// --- FIREBASE AUTH & SYNC ---

// Auth state observer
auth.onAuthStateChanged(user => {
    currentUser = user;
    updateUserUI();
    if (user) {
        // Usuario autenticado, sincronizar
        syncNotesFromFirestore();
    }
});

function updateUserUI() {
    const loggedIn = document.getElementById('logged-in-state');
    const loggedOut = document.getElementById('logged-out-state');

    if (currentUser) {
        loggedOut.classList.add('hidden');
        loggedIn.classList.remove('hidden');
        document.getElementById('user-name').textContent = currentUser.displayName || 'Usuario';
        document.getElementById('user-email').textContent = currentUser.email;
        document.getElementById('user-avatar').src = currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + (currentUser.displayName || 'U');
    } else {
        loggedOut.classList.remove('hidden');
        loggedIn.classList.add('hidden');
    }
}

async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        showSyncStatus(true);
    } catch (error) {
        console.error('Error signing in:', error);
        alert('Error al iniciar sesión: ' + error.message);
    }
}

async function signOut() {
    try {
        await auth.signOut();
        notes = JSON.parse(localStorage.getItem('my_neural_notes_v2')) || [];
        renderNotes(notes);
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

async function syncNotesFromFirestore() {
    if (!currentUser) return;

    showSyncStatus(true);
    try {
        const userNotesRef = db.collection('users').doc(currentUser.uid).collection('notes');
        const snapshot = await userNotesRef.get();

        if (!snapshot.empty) {
            const firestoreNotes = [];
            snapshot.forEach(doc => {
                firestoreNotes.push({ id: doc.id, ...doc.data() });
            });

            // Merge con notas locales
            const localNotes = notes;
            const merged = [...firestoreNotes];

            localNotes.forEach(localNote => {
                if (!merged.find(n => n.id === localNote.id)) {
                    merged.push(localNote);
                }
            });

            notes = merged.sort((a, b) => b.date - a.date);
            localStorage.setItem('my_neural_notes_v2', JSON.stringify(notes));
            renderNotes(notes);
        }

        showSyncStatus(false);
    } catch (error) {
        console.error('Error syncing from Firestore:', error);
        showSyncStatus(false);
    }
}

async function syncNoteToFirestore(note) {
    if (!currentUser) return;

    try {
        const userNotesRef = db.collection('users').doc(currentUser.uid).collection('notes');
        await userNotesRef.doc(note.id).set(note);
    } catch (error) {
        console.error('Error syncing note:', error);
    }
}

async function deleteNoteFromFirestore(noteId) {
    if (!currentUser) return;

    try {
        const userNotesRef = db.collection('users').doc(currentUser.uid).collection('notes');
        await userNotesRef.doc(noteId).delete();
    } catch (error) {
        console.error('Error deleting note:', error);
    }
}

function showSyncStatus(show) {
    const syncStatus = document.getElementById('sync-status');
    if (show) {
        syncStatus.classList.remove('hidden');
    } else {
        setTimeout(() => {
            syncStatus.classList.add('hidden');
        }, 1000);
    }
}

// Modificar saveAndClose para sincronizar
const originalSaveAndClose = saveAndClose;
saveAndClose = function () {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();

    if (!title && !content && currentImages.length === 0) {
        closeEditor();
        return;
    }

    const noteData = {
        title,
        content,
        images: currentImages,
        date: Date.now(),
        isAi: false
    };

    if (currentNoteId) {
        const idx = notes.findIndex(n => n.id === currentNoteId);
        if (idx !== -1) {
            notes[idx] = { ...notes[idx], ...noteData };
            syncNoteToFirestore(notes[idx]);
        }
    } else {
        const newNote = { id: Date.now().toString(), ...noteData };
        notes.unshift(newNote);
        syncNoteToFirestore(newNote);
    }

    localStorage.setItem('my_neural_notes_v2', JSON.stringify(notes));
    renderNotes(notes);
    searchInput.value = '';
    closeEditor();
};

// Modificar deleteCurrentNote para sincronizar
const originalDeleteCurrentNote = deleteCurrentNote;
deleteCurrentNote = function () {
    if (confirm('CONFIRM DELETE?')) {
        deleteNoteFromFirestore(currentNoteId);
        notes = notes.filter(n => n.id !== currentNoteId);
        localStorage.setItem('my_neural_notes_v2', JSON.stringify(notes));
        renderNotes(notes);
        searchInput.value = '';
        closeEditor();
    }
};

// --- WHATSAPP IMPORT ---
document.getElementById('whatsapp-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const importedNotes = parseWhatsAppChat(text);

        if (importedNotes.length > 0) {
            // Agregar notas importadas
            importedNotes.forEach(note => {
                notes.unshift(note);
                if (currentUser) syncNoteToFirestore(note);
            });

            localStorage.setItem('my_neural_notes_v2', JSON.stringify(notes));
            renderNotes(notes);
            alert(`✅ ${importedNotes.length} notas importadas desde WhatsApp`);
            closeSettings();
        } else {
            alert('No se encontraron mensajes válidos en el archivo');
        }
    } catch (error) {
        console.error('Error importing WhatsApp:', error);
        alert('Error al importar el archivo');
    }

    e.target.value = '';
});

function parseWhatsAppChat(text) {
    const lines = text.split('\n');
    const notes = [];

    // Regex para formato WhatsApp: [DD/MM/YYYY, HH:MM:SS] Nombre: Mensaje
    const messageRegex = /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]?\s*[-–]?\s*([^:]+):\s*(.+)$/i;

    let currentNote = null;

    lines.forEach(line => {
        const match = line.match(messageRegex);

        if (match) {
            // Nueva nota
            if (currentNote && currentNote.content.trim()) {
                notes.push(currentNote);
            }

            const [_, date, time, sender, message] = match;
            currentNote = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title: `${sender} - ${date} `,
                content: message,
                date: Date.now(),
                images: [],
                isAi: false
            };
        } else if (currentNote && line.trim()) {
            // Continuar nota anterior (mensaje multilínea)
            currentNote.content += '\n' + line;
        }
    });

    // Agregar última nota
    if (currentNote && currentNote.content.trim()) {
        notes.push(currentNote);
    }

    return notes;
}

// --- MODAL DE AJUSTES ---
function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
    applyTheme(); // Actualizar selección visual

    // Push state para el gesto de atrás
    history.pushState({ view: 'settings' }, '', '');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');

    // Remover del history si fue abierto con pushState
    if (history.state && history.state.view === 'settings') {
        history.back();
    }
}

// Cerrar modal al hacer click fuera
document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
        closeSettings();
    }
});

// --- PWA SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}

// Detectar instalación PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Aquí podrías mostrar un botón de "Instalar App"
    console.log('PWA installation available');
});

// --- GESTIÓN DEL GESTO DE ATRÁS ---
// Listener para el evento popstate (cuando el usuario presiona atrás)
window.addEventListener('popstate', (event) => {
    // Si hay un editor abierto, cerrarlo
    if (!editorView.classList.contains('translate-x-full')) {
        editorView.classList.add('translate-x-full');
        if (!searchInput.value) {
            renderNotes(notes);
        } else {
            const query = searchInput.value;
            const localMatches = performLocalSearch(query);
            if (localMatches.length > 0) renderNotes(localMatches, query);
        }
        return;
    }

    // Si hay ajustes abiertos, cerrarlos
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
        return;
    }

    // Si hay búsqueda activa, limpiarla
    if (searchInput.value.trim()) {
        searchInput.value = '';
        searchIcon.className = "fas fa-search opacity-50";
        searchIcon.style.color = "";
        hideLoading();
        renderNotes(notes);
        return;
    }
});

// Al inicio, establecer un estado base
history.replaceState({ view: 'main' }, '', '');
