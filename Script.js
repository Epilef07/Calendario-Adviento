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

  // true: los días que ya pasaron se pueden abrir (por si te lo perdiste)
  // false: solo se abre el sobre el mismo día
  const PERMITIR_DIAS_PASADOS = true;

  const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const NOMBRES_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  // Contenido de cada tarjeta (edítalos a tu gusto)
  const mensajes = {
    1: "¡Empieza diciembre!",
    24: "Nochebuena. ¡Feliz víspera de Navidad!"
  };

  const $grid = document.getElementById("grid");
  const $semana = document.getElementById("semana");
  const $resumen = document.getElementById("resumen");
  const $modal = document.getElementById("modal");
  const $modalIcono = document.getElementById("modal-icono");
  const $modalNum = document.getElementById("modal-num");
  const $modalTitulo = document.getElementById("modal-titulo");
  const $modalTexto = document.getElementById("modal-texto");

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
    $modalTexto.textContent = mensajes[d] || "Aquí puedes poner el contenido de este día.";
    mostrarModal();
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

    $modal.classList.add("es-bloqueado");
    $modalIcono.textContent = "🔒";
    $modalNum.textContent = d;
    $modalTitulo.textContent = "Todavía no se puede abrir";
    $modalTexto.textContent = texto;
    mostrarModal();
  }

  function mostrarModal() {
    $modal.hidden = false;
    document.getElementById("cerrar").focus();
  }
  function cerrarModal() { $modal.hidden = true; }

  document.getElementById("cerrar").addEventListener("click", cerrarModal);
  $modal.addEventListener("click", (e) => { if (e.target === $modal) cerrarModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModal(); });

  document.getElementById("reiniciar").addEventListener("click", () => {
    if (!confirm("¿Reiniciar todos los sobres como no abiertos?")) return;
    abiertos.clear();
    guardarAbiertos(abiertos);
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

  // ---- Init ----
  crearLluvia();
  renderSemana();
  renderGrid();
  actualizarResumen();
})();