(function () {
  "use strict";

  // ---- Configuración ----
  const ANIO = 2026;
  const MES = 11;          // Diciembre (0 = enero)
  const DIA_INICIO = 1;
  const DIA_FIN = 24;
  const MODO_PRUEBA = new URLSearchParams(location.search).has("fecha");
  // En modo prueba (?fecha=...) se usa otro almacenamiento para no mezclar con los sobres reales
  const STORAGE_KEY = "calendario-dic-2026-abiertos" + (MODO_PRUEBA ? "-prueba" : "");
  window.Juegos.init(STORAGE_KEY);

  // true: los días que ya pasaron se pueden abrir (por si te lo perdiste)
  // false: solo se abre el sobre el mismo día
  const PERMITIR_DIAS_PASADOS = true;

  // Fuegos artificiales: salen al entrar el día indicado (una vez por día)
  // y también al abrir el sobre de esos días.
  const CELEBRACION = {
    1: "¡Empezó diciembre! Hoy se abre tu primer sobre ♥",
    24: "¡Feliz Navidad, mi amor! ♥"
  };

  // false: modo "llenado de sobres" (todos se pueden abrir para revisarlos)
  // true: cada sobre solo se abre el día que le corresponde (ponlo en true al entregarlo)
  const BLOQUEO_ACTIVO = true;

  const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const NOMBRES_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  // Contenido de cada tarjeta (edítalos a tu gusto)
  const mensajes = {
    1: "Hola Amor cree este calendario para ti ya que veo muchos videos de que algunas chicas le gustan y e investigado pero son algo costosos y quise crear uno para ti para estos 24 dias de navidad te amo mucho",
    24: "Nochebuena. ¡Feliz víspera de Navidad!"
  };

  // Días con contenido especial (tipo: imagen | puzzle | memoria | cupon | atrapar | sopa | carta | historia | video | tresenraya | simon | ruleta | cancion | mensaje | cita | quiz)
  // Para las fotos: copia la imagen a una carpeta "imagenes" y escribe su ruta en "ruta".
  const contenidos = {
    2: {
      tipo: "puzzle",
      texto: "Desliza las piezas para armar el corazón.",
      mensajeFinal: "¡Lo lograste! Así de completo me siento contigo ♥"
    },
    3: {
      tipo: "cupon",
      texto: "",
      titulo: "Cupón de amor",
      premio: "Te llevo a comer donde tú quieras",
      detalle: "Válido cuando quieras · Sin fecha de vencimiento",
      para: "Silvia Juliana"
    },
    4: {
      tipo: "imagen",
      texto: "",
      ruta: "imagenes/dia4.jpeg",                       // ej: "imagenes/dia4.jpg"
      mensaje: "Te adoro en cada momento de mi vida"
    },
    5: {
      tipo: "memoria",
      texto: "Encuentra todas las parejas.",
      mensajeFinal: "Encontraste todas las parejas perfectas como tú ♥"
    },
    6: {
      tipo: "imagen",
      texto: "",
      ruta: "imagenes/dia6.jpeg",                       // ej: "imagenes/dia6.jpg"
      mensaje: "Te amo demasiado"
    },
    7: {
      tipo: "cupon",
      texto: "",
      titulo: "Cupón de amor",
      premio: "Un día entero haciendo lo que tú desees",
      detalle: "Yo te acompaño en todo · Válido cuando quieras",
      para: "Silvia Juliana"
    },
    8: {
      tipo: "imagen",
      texto: "",
      ruta: "imagenes/dia8.jpeg",                       // ej: "imagenes/dia8.jpg"
      mensaje: "Contigo todo es mejor"          // cámbialo por el tuyo
    },
    9: {
      tipo: "atrapar",
      texto: "Mueve la cesta y atrapa 15 corazones ❤️ (¡cuidado con los copos ❄️, te quitan uno!)",
      meta: 15,
      mensajeFinal: "¡Atrapaste todos los corazones! Igual que tú atrapaste el mío ♥"
    },
    10: {
      tipo: "imagen",
      texto: "",
      ruta: "imagenes/dia10.jpeg",                       // ej: "imagenes/dia10.jpg"
      mensaje: "Eres mi lugar favorito"         // cámbialo por el tuyo
    },
    11: {
      tipo: "sopa",
      texto: "Encuentra las palabras: toca la primera letra y luego la última.",
      palabras: ["AMOR", "BESO", "ABRAZO", "NAVIDAD", "SILVIA", "TEAMO"],
      mensajeFinal: "¡Las encontraste todas! Igual que yo te encontré a ti ♥"
    },
    12: {
      tipo: "carta",
      texto: "",
      saludo: "Mi amor,",                  // cambia la carta por la tuya
      cuerpo: [
        "Hoy quiero detenerme un momento para decirte lo mucho que significas para mí. Gracias por estar, por tu sonrisa y por hacer más bonitos mis días.",
        "Este calendario es mi forma de acompañarte en estos días de diciembre, uno a uno, hasta Navidad. Cada sobre lleva un pedacito de lo que siento por ti."
      ],
      firma: "Con todo mi amor"
    },
    13: {
      tipo: "historia",
      texto: "Completa nuestra historia eligiendo una opción en cada frase.",
      pasos: [
        { frase: "Llegaste a mi vida por", opciones: ["casualidad", "destino", "una sonrisa"] },
        { frase: "Lo que más me gusta de ti es", opciones: ["tu sonrisa", "tu forma de ser", "cómo me haces sentir"] },
        { frase: "Contigo me imagino", opciones: ["viajando por el mundo", "en casa viendo películas", "envejeciendo juntos"] }
      ],
      mensajeFinal: "Esta es nuestra historia, y apenas está empezando ♥"
    },
    14: {
      tipo: "carta",
      texto: "",
      saludo: "Mi vida,",                   // cambia la carta por la tuya
      cuerpo: [
        "Cada día a tu lado es un regalo, y quiero que lo sepas: me haces feliz de una manera que no sé explicar del todo.",
        "Gracias por ser tú. Gracias por quedarte en mi vida. Ojalá esta Navidad sea tan linda como tú."
      ],
      firma: "Te amo mucho"
    },
    15: {
      tipo: "video",
      texto: "",
      ruta: "videos/dia15.mp4",                            // ej: "videos/dia15.mp4"
      poster: "",                          // opcional: imagen de portada, ej: "imagenes/portada15.jpg"
      mensaje: ""                          // opcional: texto debajo del video
    },
    16: {
      tipo: "tresenraya",
      texto: "Tú eres los corazones ❤️. ¡Haz tres en raya antes que los copos ❄️!",
      mensajeFinal: "¡Ganaste! Como siempre, ganaste mi corazón ♥"
    },
    17: {
      tipo: "cupon",
      texto: "",
      titulo: "Cupón de amor",
      premio: "Te cocino lo que tú quieras",
      detalle: "Yo cocino y tú solo disfrutas · Válido cuando quieras",
      para: "Silvia Juliana"
    },
    18: {
      tipo: "simon",
      texto: "Mira la secuencia de corazones y repítela. ¡Llega hasta la ronda 6!",
      meta: 6,
      mensajeFinal: "¡Lo lograste! Contigo todo sale perfecto ♥"
    },
    19: {
      tipo: "cupon",
      texto: "",
      titulo: "Cupón de amor",
      premio: "Abrazos y besos, ¡muchos!",
      detalle: "Sin límite · Válido cuando quieras",
      para: "Silvia Juliana"
    },
    20: {
      tipo: "ruleta",
      texto: "Gira la ruleta y descubre tu premio.",
      premios: [
        { texto: "Caramelo", emoji: "🍬" },
        { texto: "Comida rápida cualquiera", emoji: "🍔" },
        { texto: "Flores", emoji: "💐" },
        { texto: "Cosméticos", emoji: "💄" }
      ],
      aviso: "Debes tomar captura de pantalla para reclamar lo que ganaste en la ruleta."
    },
    21: {
      tipo: "cancion",
      texto: "",
      titulo: "",                          // nombre de la canción
      artista: "",                         // opcional
      ruta: "musica/cancion.mp4",                            // ej: "musica/cancion.mp3"
      enlace: "",                          // opcional: link de Spotify/YouTube (abre en otra pestaña)
      textoEnlace: "Escuchar canción",
      mensaje: ""                          // opcional: dedicatoria debajo
    },
    22: {
      tipo: "cita",
      texto: "Elige una opción en cada paso y arma tu cita ideal.",
      titulo: "Nuestra cita ideal 💗",
      para: "Silvia Juliana",
      mensajeFinal: "Esta cita es tuya, solo dime cuándo ♥",
      // Cambia, quita o agrega opciones a tu gusto
      pasos: [
        {
          etiqueta: "Lugar", titulo: "📍 Elige el lugar",
          opciones: [
            { emoji: "🏡", texto: "En casa" },
            { emoji: "🌳", texto: "En un parque" },
            { emoji: "🍽️", texto: "En un restaurante" },
            { emoji: "🎬", texto: "En el cine" }
          ]
        },
        {
          etiqueta: "Comida", titulo: "🍴 Elige la comida",
          opciones: [
            { emoji: "🍕", texto: "Pizza" },
            { emoji: "🍣", texto: "Sushi" },
            { emoji: "🍔", texto: "Hamburguesas" },
            { emoji: "🍰", texto: "Postres" }
          ]
        },
        {
          etiqueta: "Actividad", titulo: "🎯 Elige la actividad",
          opciones: [
            { emoji: "🎬", texto: "Maratón de películas" },
            { emoji: "🚶", texto: "Caminar y conversar" },
            { emoji: "🎮", texto: "Jugar juegos" },
            { emoji: "📸", texto: "Tomar muchas fotos" }
          ]
        },
        {
          etiqueta: "Compañía", titulo: "💞 Elige la compañía",
          opciones: [
            { emoji: "💑", texto: "Solo tú y yo" },
            { emoji: "👯", texto: "Con amigos" },
            { emoji: "👨‍👩‍👧", texto: "Con la familia" }
          ]
        }
      ]
    },
    23: {
      tipo: "quiz",
      texto: "Responde las 5 preguntas. Si alguna sale incorrecta, tendrás que repetirla ♥",
      mensajeFinal: "¡Te ganaste una comidita! 🍽️♥",
      preguntas: [
        { pregunta: "¿Cómo nos conocimos?", correcta: "SENA",
          opciones: ["SENA", "En el colegio", "Por redes sociales"] },
        { pregunta: "¿Cuándo es nuestro aniversario?", correcta: "01/09",
          opciones: ["01/09", "14/02", "01/10"] },
        { pregunta: "¿Qué es lo que más me gusta de ti?", correcta: "Tu cabello",
          opciones: ["Tu cabello", "Tu sonrisa", "Tus ojos"] },
        { pregunta: "¿Dónde fue nuestro primer viaje?", correcta: "Cúcuta",
          opciones: ["Cúcuta", "Medellín", "Cartagena"] },
        { pregunta: "¿Cuándo fue nuestra primera vez?", correcta: "31/12",
          opciones: ["31/12", "01/01", "25/12"] }
      ]
    },
    24: {
      tipo: "mensaje",
      texto: "",
      emoji: "🎁",
      titulo: "Feliz Navidad con amor ♥",
      cuerpo: ["Puedes reclamar tu regalo cuando quieras."]
    }
  };

  const $grid = document.getElementById("grid");
  const $semana = document.getElementById("semana");
  const $resumen = document.getElementById("resumen");
  const $modal = document.getElementById("modal");
  const $modalIcono = document.getElementById("modal-icono");
  const $modalNum = document.getElementById("modal-num");
  const $modalTitulo = document.getElementById("modal-titulo");
  const $modalTexto = document.getElementById("modal-texto");
  const $extra = document.getElementById("extra");
  const $escena = document.getElementById("escena");
  const $card = document.querySelector(".modal-card");

  // ---- Fecha "de hoy" ----
  // Para probar: abre index.html?fecha=2026-12-05
  function obtenerHoy() {
    const p = new URLSearchParams(location.search).get("fecha");
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) {
      const [y, m, d] = p.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  const HOY = obtenerHoy();

  const MS_DIA = 24 * 60 * 60 * 1000;
  // Días que faltan para el día d (positivo = futuro, 0 = hoy, negativo = pasado)
  function diasFaltan(d) {
    const objetivo = new Date(ANIO, MES, d);
    return Math.round((objetivo - HOY) / MS_DIA);
  }
  function estaDisponible(d) {
    if (!BLOQUEO_ACTIVO) return true;
    const f = diasFaltan(d);
    return f === 0 || (f < 0 && PERMITIR_DIAS_PASADOS);
  }

  // ---- Estado persistente ----
  function leerAbiertos() {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
    catch (e) { return new Set(); }
  }
  function guardarAbiertos(set) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch (e) {}
  }
  const abiertos = leerAbiertos();

  const indiceLunes = (fecha) => (fecha.getDay() + 6) % 7; // Lunes = 0

  // ---- Render ----
  function renderSemana() {
    $semana.innerHTML = "";
    DIAS_SEMANA.forEach((d, i) => {
      const el = document.createElement("div");
      el.textContent = d;
      if (i >= 5) el.classList.add("fin");
      $semana.appendChild(el);
    });
  }

  function crearVacio() {
    const v = document.createElement("div");
    v.className = "vacio";
    return v;
  }

  function renderGrid() {
    $grid.innerHTML = "";
    const offset = indiceLunes(new Date(ANIO, MES, DIA_INICIO));
    for (let i = 0; i < offset; i++) $grid.appendChild(crearVacio());

    for (let d = DIA_INICIO; d <= DIA_FIN; d++) {
      const fecha = new Date(ANIO, MES, d);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dia";
      btn.dataset.dia = d;

      const num = document.createElement("span");
      num.className = "num";
      num.textContent = d;
      btn.appendChild(num);

      const disponible = estaDisponible(d);
      const f = diasFaltan(d);

      if (indiceLunes(fecha) >= 5) btn.classList.add("fin");
      if (d === 24) btn.classList.add("navidad-eve");
      if (f === 0) btn.classList.add("hoy");
      if (!disponible) btn.classList.add("bloqueado");
      if (disponible && !abiertos.has(d)) btn.classList.add("listo");
      if (abiertos.has(d)) btn.classList.add("abierto");

      btn.setAttribute(
        "aria-label",
        `${NOMBRES_DIA[fecha.getDay()]} ${d} de diciembre` + (disponible ? "" : " (bloqueado)")
      );

      btn.addEventListener("click", () => manejarClick(d, btn));
      $grid.appendChild(btn);
    }

    const total = offset + (DIA_FIN - DIA_INICIO + 1);
    const faltan = (7 - (total % 7)) % 7;
    for (let i = 0; i < faltan; i++) $grid.appendChild(crearVacio());
  }

  function actualizarResumen() {
    const total = DIA_FIN - DIA_INICIO + 1;
    $resumen.textContent = `Del ${DIA_INICIO} al ${DIA_FIN} · ${abiertos.size} de ${total} sobres abiertos`;
  }

  // ---- Interacción ----
  function tituloFecha(d) {
    const nombre = NOMBRES_DIA[new Date(ANIO, MES, d).getDay()];
    return nombre.charAt(0).toUpperCase() + nombre.slice(1) + ", " + d + " de diciembre de " + ANIO;
  }

  function manejarClick(d, btn) {
    if (estaDisponible(d)) {
      abrirTarjeta(d, btn);
    } else {
      mostrarBloqueado(d, btn);
    }
  }

  function abrirTarjeta(d, btn) {
    abiertos.add(d);
    guardarAbiertos(abiertos);
    btn.classList.remove("listo");
    btn.classList.add("abierto");
    actualizarResumen();

    $modal.classList.remove("es-bloqueado");
    $modalIcono.textContent = "💌";
    $modalNum.textContent = d;
    $modalTitulo.textContent = tituloFecha(d);
    celebrarAlMostrar = !!CELEBRACION[d];
    $extra.innerHTML = "";
    const especial = contenidos[d];
    if (especial) {
      $modalTexto.textContent = especial.texto || "";
      $modalTexto.hidden = !especial.texto;
      window.Juegos.render(
        especial.tipo,
        $extra,
        Object.assign({ dia: d, edicion: !BLOQUEO_ACTIVO }, especial)
      );
    } else {
      $modalTexto.hidden = false;
      $modalTexto.textContent = mensajes[d] || "Aquí puedes poner el contenido de este día.";
    }
    mostrarModal(true);
  }

  function mostrarBloqueado(d, btn) {
    // Pequeña animación de "sacudida"
    btn.classList.remove("sacudir");
    void btn.offsetWidth; // reinicia la animación
    btn.classList.add("sacudir");

    const f = diasFaltan(d);
    let texto;
    if (f > 0) {
      texto = f === 1
        ? "Este sobre se abre mañana. ¡Falta solo 1 día!"
        : `Este sobre se abre el ${d} de diciembre. Faltan ${f} días, ¡hay que esperar!`;
    } else {
      texto = "Este sobre solo se podía abrir el día correspondiente.";
    }

    $extra.innerHTML = "";
    $modalTexto.hidden = false;
    $modal.classList.add("es-bloqueado");
    $modalIcono.textContent = "🔒";
    $modalNum.textContent = d;
    $modalTitulo.textContent = "Todavía no se puede abrir";
    $modalTexto.textContent = texto;
    mostrarModal();
  }

  // Animación de carta: el sobre se abre, sale el papel y luego aparece el mensaje
  let celebrarAlMostrar = false;
  let timers = [];
  function limpiarTimers() { timers.forEach(clearTimeout); timers = []; }

  function mostrarCarta() {
    limpiarTimers();
    if (celebrarAlMostrar) {
      celebrarAlMostrar = false;
      window.Juegos.fuegos(6000);
    }
    $escena.hidden = true;
    $card.hidden = false;
    document.getElementById("cerrar").focus();
  }

  function mostrarModal(animar) {
    limpiarTimers();
    $modal.hidden = false;
    if (animar) {
      $card.hidden = true;
      $escena.hidden = false;
      $escena.classList.remove("abierta");
      void $escena.offsetWidth; // reinicia la animación
      timers.push(setTimeout(() => $escena.classList.add("abierta"), 400));
      timers.push(setTimeout(mostrarCarta, 2800));
    } else {
      $escena.hidden = true;
      $card.hidden = false;
      document.getElementById("cerrar").focus();
    }
  }
  function cerrarModal() {
    limpiarTimers();
    $extra.querySelectorAll("video, audio").forEach((v) => v.pause());
    $modal.hidden = true;
  }

  $escena.addEventListener("click", mostrarCarta);

  document.getElementById("cerrar").addEventListener("click", cerrarModal);
  $modal.addEventListener("click", (e) => { if (e.target === $modal) cerrarModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModal(); });

  document.getElementById("reiniciar").addEventListener("click", () => {
    if (!confirm("¿Reiniciar todos los sobres como no abiertos?")) return;
    abiertos.clear();
    guardarAbiertos(abiertos);
    window.Juegos.reiniciar();
    Object.keys(CELEBRACION).forEach((d) => { try { localStorage.removeItem(STORAGE_KEY + "-fuegos-" + d); } catch (e) {} });
    renderGrid();
    actualizarResumen();
  });

  // ---- Corazones y copos de nieve ----
  function crearLluvia() {
    const cont = document.createElement("div");
    cont.className = "lluvia";
    cont.setAttribute("aria-hidden", "true");
    const simbolos = ["\u2665", "\u2744", "\u2665", "\u2745"];
    const colores = ["#ff6b8b", "#ffc2d1", "#ffffff", "#f6d27a"];
    for (let i = 0; i < 26; i++) {
      const s = document.createElement("span");
      s.textContent = simbolos[i % simbolos.length];
      s.style.left = Math.random() * 100 + "%";
      s.style.fontSize = 10 + Math.random() * 18 + "px";
      s.style.color = colores[Math.floor(Math.random() * colores.length)];
      s.style.animationDuration = 9 + Math.random() * 12 + "s";
      s.style.animationDelay = -Math.random() * 20 + "s";
      cont.appendChild(s);
    }
    document.body.appendChild(cont);
  }

  // ---- Celebración el día que llega ----
  function celebrarSiToca() {
    if (HOY.getFullYear() !== ANIO || HOY.getMonth() !== MES) return;
    const d = HOY.getDate();
    if (!CELEBRACION[d]) return;
    const clave = STORAGE_KEY + "-fuegos-" + d;
    try {
      if (localStorage.getItem(clave)) return;
      localStorage.setItem(clave, "1");
    } catch (e) {}
    window.Juegos.fuegos(8000, CELEBRACION[d]);
  }

  // ---- Init ----
  crearLluvia();
  const $hint = document.querySelector(".hint");
  if ($hint) {
    $hint.textContent = BLOQUEO_ACTIVO
      ? "Cada sobre solo se abre el día que le corresponde."
      : "Modo edición: todos los sobres están abiertos para revisarlos. Activa BLOQUEO_ACTIVO en script.js al terminar.";
  }
  renderSemana();
  renderGrid();
  actualizarResumen();
  celebrarSiToca();
})();