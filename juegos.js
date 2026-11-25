(function () {
  "use strict";

  let PREFIJO = "calendario";

  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }
  function leer(k) { try { return localStorage.getItem(PREFIJO + k); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(PREFIJO + k, v); return true; } catch (e) { return false; } }
  function borrar(k) { try { localStorage.removeItem(PREFIJO + k); } catch (e) {} }
  function barajar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* =====================================================
     IMAGEN con mensaje arriba (días 4, 6, 8 y 10)
     La foto se define por código con "ruta" en script.js
     ===================================================== */
  function imagen(cont, o) {
    const marco = el("div", "foto-marco");
    const img = el("img", "foto-img");
    img.alt = "Foto para ti";
    const msg = el("div", "foto-msg", o.mensaje || "");
    const vacio = el("div", "foto-vacio", "Aquí irá tu foto \u2665");
    marco.append(img, vacio, msg);
    cont.appendChild(marco);

    const hint = el("div", "foto-hint", "Toca la foto para verla completa");
    hint.hidden = true;
    cont.appendChild(hint);

    // Visor a pantalla completa
    function ampliar() {
      if (!marco.classList.contains("con-foto")) return;
      const visor = el("div", "visor");
      const grande = el("img", "visor-img");
      grande.src = img.currentSrc || img.src;
      grande.alt = "Foto para ti";
      const m = el("div", "visor-msg", o.mensaje || "");
      const x = el("button", "visor-x", "\u00d7");
      x.type = "button";
      x.setAttribute("aria-label", "Cerrar foto");
      visor.append(grande, m, x);
      document.body.appendChild(visor);

      function cerrar() {
        document.removeEventListener("keydown", tecla, true);
        visor.remove();
      }
      function tecla(e) {
        if (e.key === "Escape") { e.stopImmediatePropagation(); cerrar(); }
      }
      document.addEventListener("keydown", tecla, true);
      visor.addEventListener("click", cerrar);
    }
    marco.addEventListener("click", ampliar);

    if (o.ruta) {
      img.onload = () => { marco.classList.add("con-foto"); hint.hidden = false; };
      img.onerror = () => { marco.classList.remove("con-foto"); hint.hidden = true; };
      img.src = o.ruta;
    }
  }

  /* =====================================================
     ROMPECABEZAS deslizante de corazón "Te amo" (día 2)
     ===================================================== */
  function dibujarCorazon() {
    const S = 450;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");

    const fondo = g.createLinearGradient(0, 0, S, S);
    fondo.addColorStop(0, "#ffd9e2");
    fondo.addColorStop(1, "#ff8fab");
    g.fillStyle = fondo;
    g.fillRect(0, 0, S, S);

    // Copos de nieve
    g.fillStyle = "rgba(255,255,255,.85)";
    g.font = "26px serif";
    [[40, 70], [380, 60], [50, 400], [390, 410], [215, 40], [30, 230], [405, 235]]
      .forEach(([x, y]) => g.fillText("❄", x, y));

    // Corazón
    g.save();
    g.translate(S / 2, 205);
    g.beginPath();
    g.moveTo(0, 135);
    g.bezierCurveTo(-215, -10, -115, -160, 0, -50);
    g.bezierCurveTo(115, -160, 215, -10, 0, 135);
    g.closePath();
    const rel = g.createLinearGradient(-120, -100, 120, 140);
    rel.addColorStop(0, "#e0284f");
    rel.addColorStop(1, "#a30f2f");
    g.fillStyle = rel;
    g.shadowColor = "rgba(120,0,30,.4)";
    g.shadowBlur = 20;
    g.fill();
    g.shadowBlur = 0;
    g.lineWidth = 7;
    g.strokeStyle = "#f6d27a";
    g.stroke();

    g.fillStyle = "#fff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "italic bold 62px Georgia, serif";
    g.fillText("Te amo", 0, 12);
    g.restore();

    return c.toDataURL("image/png");
  }

  function puzzle(cont, o) {
    const N = 3, TOTAL = N * N;
    const URL_IMG = dibujarCorazon();

    const caja = el("div", "puzzle");
    const piezas = [];
    for (let i = 0; i < TOTAL; i++) {
      const b = el("button", "pieza");
      b.type = "button";
      b.setAttribute("aria-label", "Pieza " + (i + 1));
      b.style.backgroundImage = "url(" + URL_IMG + ")";
      b.style.backgroundPosition =
        ((i % N) * 100 / (N - 1)) + "% " + (Math.floor(i / N) * 100 / (N - 1)) + "%";
      if (i === TOTAL - 1) b.classList.add("oculta"); // la pieza que falta
      piezas.push(b);
      caja.appendChild(b);
    }

    const pie = el("div", "puzzle-pie");
    const contador = el("span", "", "Movimientos: 0");
    const ref = el("img", "puzzle-ref");
    ref.src = URL_IMG;
    ref.alt = "Así debe quedar";
    ref.title = "Así debe quedar";
    pie.append(contador, el("span", "", "Así debe quedar:"), ref);

    const final = el("div", "ganaste");
    final.hidden = true;
    cont.append(caja, pie, final);

    const pos = Array.from({ length: TOTAL }, (_, i) => i); // pos[pieza] = posición
    let hueco = TOTAL - 1;
    let movs = 0;

    function vecinos(p) {
      const r = Math.floor(p / N), c = p % N, v = [];
      if (r > 0) v.push(p - N);
      if (r < N - 1) v.push(p + N);
      if (c > 0) v.push(p - 1);
      if (c < N - 1) v.push(p + 1);
      return v;
    }
    function resuelto() { return pos.every((p, i) => p === i); }
    function colocar() {
      piezas.forEach((b, i) => {
        b.style.left = (pos[i] % N) * (100 / N) + "%";
        b.style.top = Math.floor(pos[i] / N) * (100 / N) + "%";
      });
    }
    function mover(pieza) {
      const p = pos[pieza];
      pos[pieza] = hueco;
      hueco = p;
      pos[TOTAL - 1] = hueco;
    }

    // Mezcla con movimientos válidos (siempre tiene solución)
    let previo = -1;
    const mezclas = o.mezclas || 150;
    for (let k = 0; k < mezclas; k++) {
      const op = vecinos(hueco).filter((x) => x !== previo);
      const elegido = op[Math.floor(Math.random() * op.length)];
      previo = hueco;
      mover(pos.indexOf(elegido));
    }
    if (resuelto()) mover(pos.indexOf(vecinos(hueco)[0]));
    colocar();

    piezas.forEach((b, i) => {
      if (i === TOTAL - 1) return;
      b.addEventListener("click", () => {
        if (resuelto()) return;
        if (!vecinos(hueco).includes(pos[i])) return;
        mover(i);
        movs++;
        contador.textContent = "Movimientos: " + movs;
        colocar();
        if (resuelto()) {
          caja.classList.add("completo");
          piezas[TOTAL - 1].classList.remove("oculta");
          final.textContent = o.mensajeFinal || "¡Lo lograste! ♥";
          final.hidden = false;
        }
      });
    });
  }

  /* =====================================================
     MEMORIA de parejas con temática de amor (día 5)
     ===================================================== */
  function memoria(cont, o) {
    const simbolos = ["❤️", "🌹", "💌", "💍", "🎁", "❄️", "🧸", "🍫"];
    const baraja = barajar(simbolos.concat(simbolos));

    const tablero = el("div", "memoria");
    const pie = el("div", "puzzle-pie");
    const contador = el("span", "", "Intentos: 0");
    pie.appendChild(contador);
    const final = el("div", "ganaste");
    final.hidden = true;

    let abiertas = [], bloqueo = false, aciertos = 0, intentos = 0;

    baraja.forEach((s) => {
      const b = el("button", "carta-m");
      b.type = "button";
      b.dataset.v = s;
      b.setAttribute("aria-label", "Carta");
      const interior = el("div", "interior");
      interior.append(el("div", "dorso", "♥"), el("div", "frente", s));
      b.appendChild(interior);

      b.addEventListener("click", () => {
        if (bloqueo || b.classList.contains("volteada") || b.classList.contains("acertada")) return;
        b.classList.add("volteada");
        abiertas.push(b);
        if (abiertas.length < 2) return;

        intentos++;
        contador.textContent = "Intentos: " + intentos;
        const [x, y] = abiertas;
        abiertas = [];
        if (x.dataset.v === y.dataset.v) {
          [x, y].forEach((c) => { c.classList.remove("volteada"); c.classList.add("acertada"); });
          aciertos++;
          if (aciertos === simbolos.length) {
            final.textContent = o.mensajeFinal || "¡Encontraste todas las parejas! ♥";
            final.hidden = false;
          }
        } else {
          bloqueo = true;
          setTimeout(() => {
            x.classList.remove("volteada");
            y.classList.remove("volteada");
            bloqueo = false;
          }, 800);
        }
      });
      tablero.appendChild(b);
    });

    cont.append(tablero, pie, final);
  }

  /* =====================================================
     CUPÓN de comida (día 3)
     ===================================================== */
  function cupon(cont, o) {
    const clave = "-cupon-" + o.dia;

    const c = el("div", "cupon");
    c.appendChild(el("div", "cupon-tit", o.titulo || "Cupón de amor"));
    c.appendChild(el("div", "cupon-gran", o.premio || "Una comida donde tú quieras"));
    c.appendChild(el("div", "cupon-det", o.detalle || "Válido cuando quieras"));
    c.appendChild(el("div", "cupon-linea"));
    const pie = el("div", "cupon-pie");
    pie.append(el("span", "", "Para: " + (o.para || "")), el("span", "", "N.º " + (o.numero || String(o.dia).padStart(3, "0"))));
    c.appendChild(pie);
    c.appendChild(el("div", "sello-canje", "CANJEADO"));

    const acciones = el("div", "acciones");
    const btn = el("button", "btn", "Canjear cupón");
    btn.type = "button";
    acciones.appendChild(btn);

    function pintar() {
      const usado = leer(clave) === "1";
      c.classList.toggle("canjeado", usado);
      btn.disabled = usado;
      btn.textContent = usado ? "Cupón canjeado ♥" : "Canjear cupón";
    }
    btn.addEventListener("click", () => {
      if (!confirm("¿Canjear el cupón ahora?")) return;
      guardar(clave, "1");
      pintar();
    });

    pintar();
    cont.append(c, acciones);
  }

  /* =====================================================
     ATRAPA LOS CORAZONES (día 9)
     ===================================================== */
  function atrapar(cont, o) {
    const W = 300, H = 400, META = o.meta || 15;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    cv.className = "atrapa";
    const caja = el("div", "atrapa-caja");
    const inicio = el("button", "atrapa-inicio", "Toca para empezar \u2665");
    inicio.type = "button";
    caja.append(cv, inicio);
    const final = el("div", "ganaste");
    final.hidden = true;
    cont.append(caja, final);

    const g = cv.getContext("2d");
    let x = W / 2, items = [], puntos = 0, corriendo = false, raf = 0, ultimo = 0, acumulado = 0;
    const teclas = { izq: false, der: false };

    function limitar() { x = Math.max(32, Math.min(W - 32, x)); }
    function mover(clientX) {
      const r = cv.getBoundingClientRect();
      x = (clientX - r.left) * W / r.width;
      limitar();
    }
    cv.addEventListener("pointermove", (e) => mover(e.clientX));
    cv.addEventListener("pointerdown", (e) => mover(e.clientX));

    function tecla(e, abajo) {
      if (e.key === "ArrowLeft") teclas.izq = abajo;
      if (e.key === "ArrowRight") teclas.der = abajo;
    }
    const kd = (e) => tecla(e, true), ku = (e) => tecla(e, false);

    function dibujar() {
      const fondo = g.createLinearGradient(0, 0, 0, H);
      fondo.addColorStop(0, "#5a1130");
      fondo.addColorStop(1, "#24060f");
      g.fillStyle = fondo;
      g.fillRect(0, 0, W, H);
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = "28px serif";
      items.forEach((it) => g.fillText(it.tipo === "corazon" ? "\u2764\uFE0F" : "\u2744\uFE0F", it.x, it.y));
      g.font = "42px serif";
      g.fillText("\uD83E\uDDFA", x, H - 36);
      g.textAlign = "left";
      g.font = "bold 18px Georgia, serif";
      g.fillStyle = "#ffc2d1";
      g.fillText("\u2665 " + puntos + " / " + META, 12, 20);
    }

    function detener() {
      corriendo = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", kd);
      document.removeEventListener("keyup", ku);
    }

    function paso(t) {
      if (!corriendo) return;
      if (!cv.isConnected || cv.offsetParent === null) { // se cerró la tarjeta
        detener();
        inicio.hidden = false;
        return;
      }
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;

      acumulado += dt;
      if (acumulado > 0.65) {
        acumulado = 0;
        items.push({
          x: 20 + Math.random() * (W - 40),
          y: -20,
          v: 110 + Math.random() * 90 + puntos * 3,
          tipo: Math.random() < 0.22 ? "copo" : "corazon"
        });
      }
      if (teclas.izq) x -= 260 * dt;
      if (teclas.der) x += 260 * dt;
      limitar();

      items.forEach((it) => { it.y += it.v * dt; });
      items = items.filter((it) => {
        if (it.y > H - 64 && it.y < H - 20 && Math.abs(it.x - x) < 38) {
          if (it.tipo === "corazon") puntos++;
          else puntos = Math.max(0, puntos - 1);
          return false;
        }
        return it.y < H + 20;
      });

      dibujar();
      if (puntos >= META) {
        detener();
        final.textContent = o.mensajeFinal || "\u00a1Lo lograste! \u2665";
        final.hidden = false;
        inicio.textContent = "Jugar de nuevo \u2665";
        inicio.hidden = false;
        return;
      }
      raf = requestAnimationFrame(paso);
    }

    function iniciar() {
      items = []; puntos = 0; acumulado = 0; x = W / 2;
      final.hidden = true;
      inicio.hidden = true;
      corriendo = true;
      ultimo = performance.now();
      document.addEventListener("keydown", kd);
      document.addEventListener("keyup", ku);
      raf = requestAnimationFrame(paso);
    }
    inicio.addEventListener("click", iniciar);
    dibujar();
  }

  /* =====================================================
     SOPA DE LETRAS de amor (día 11)
     ===================================================== */
  function sopa(cont, o) {
    const N = 9;
    const palabras = (o.palabras || ["AMOR", "BESO", "ABRAZO", "NAVIDAD", "SILVIA", "TEAMO"])
      .map((p) => p.toUpperCase());
    const dirs = [[0, 1], [1, 0], [1, 1]]; // derecha, abajo, diagonal
    let grid;

    function generar() {
      for (let intento = 0; intento < 50; intento++) {
        const t = Array.from({ length: N }, () => Array(N).fill(""));
        let ok = true;
        for (const w of palabras) {
          let puesta = false;
          for (let k = 0; k < 300 && !puesta; k++) {
            const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
            const r = Math.floor(Math.random() * N), c = Math.floor(Math.random() * N);
            const fr = r + dr * (w.length - 1), fc = c + dc * (w.length - 1);
            if (fr >= N || fc >= N) continue;
            let cabe = true;
            for (let i = 0; i < w.length; i++) {
              const v = t[r + dr * i][c + dc * i];
              if (v !== "" && v !== w[i]) { cabe = false; break; }
            }
            if (!cabe) continue;
            for (let i = 0; i < w.length; i++) t[r + dr * i][c + dc * i] = w[i];
            puesta = true;
          }
          if (!puesta) { ok = false; break; }
        }
        if (ok) {
          const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          for (let r = 0; r < N; r++)
            for (let c = 0; c < N; c++)
              if (t[r][c] === "") t[r][c] = abc[Math.floor(Math.random() * abc.length)];
          return t;
        }
      }
      return null;
    }
    grid = generar();
    if (!grid) { cont.appendChild(el("div", "ganaste", "No se pudo generar la sopa de letras.")); return; }

    const tablero = el("div", "sopa");
    const celdas = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const b = el("button", "letra", grid[r][c]);
        b.type = "button";
        b.dataset.r = r; b.dataset.c = c;
        celdas.push(b);
        tablero.appendChild(b);
      }
    }
    const lista = el("div", "palabras");
    const etiquetas = {};
    palabras.forEach((w) => {
      const s = el("span", "", w);
      etiquetas[w] = s;
      lista.appendChild(s);
    });
    const final = el("div", "ganaste");
    final.hidden = true;
    cont.append(tablero, lista, final);

    const halladas = new Set();
    let inicio = null;
    const celda = (r, c) => celdas[r * N + c];

    function limpiarInicio() {
      if (inicio) celda(inicio.r, inicio.c).classList.remove("inicio");
      inicio = null;
    }

    tablero.addEventListener("click", (e) => {
      const b = e.target.closest(".letra");
      if (!b) return;
      const r = +b.dataset.r, c = +b.dataset.c;
      if (!inicio) {
        inicio = { r, c };
        b.classList.add("inicio");
        return;
      }
      const dr = r - inicio.r, dc = c - inicio.c;
      const largo = Math.max(Math.abs(dr), Math.abs(dc));
      const recta = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
      if (largo > 0 && recta) {
        const pr = Math.sign(dr), pc = Math.sign(dc);
        const pos = [];
        let txt = "";
        for (let i = 0; i <= largo; i++) {
          pos.push([inicio.r + pr * i, inicio.c + pc * i]);
          txt += grid[inicio.r + pr * i][inicio.c + pc * i];
        }
        const rev = txt.split("").reverse().join("");
        const w = palabras.find((p) => !halladas.has(p) && (p === txt || p === rev));
        if (w) {
          halladas.add(w);
          pos.forEach(([a, b2]) => celda(a, b2).classList.add("hallada"));
          etiquetas[w].classList.add("ok");
          if (halladas.size === palabras.length) {
            final.textContent = o.mensajeFinal || "\u00a1Las encontraste todas! \u2665";
            final.hidden = false;
          }
        }
      }
      limpiarInicio();
    });
  }

  /* =====================================================
     CARTA DE AMOR (días 12 y 14)
     ===================================================== */
  function carta(cont, o) {
    const papel = el("div", "carta-papel");
    if (o.saludo) papel.appendChild(el("div", "carta-saludo", o.saludo));
    (o.cuerpo || []).forEach((p) => papel.appendChild(el("p", "carta-p", p)));
    if (o.firma) papel.appendChild(el("div", "carta-firma", o.firma + " \u2665"));
    cont.appendChild(papel);
  }

  /* =====================================================
     HISTORIA para completar (día 13)
     "Llegaste a mi vida por ..." con 3 opciones por frase
     ===================================================== */
  function historia(cont, o) {
    const pasos = o.pasos || [];
    let i = 0;
    const elegidas = [];

    const progreso = el("div", "historia-progreso");
    const frase = el("div", "historia-frase");
    const opciones = el("div", "historia-ops");
    const resumen = el("div", "historia-resumen");
    const final = el("div", "ganaste");
    final.hidden = true;
    const acciones = el("div", "acciones");
    const otra = el("button", "btn sec", "Volver a empezar");
    otra.type = "button";
    otra.hidden = true;
    acciones.appendChild(otra);
    cont.append(progreso, frase, opciones, resumen, final, acciones);

    function pintarResumen() {
      resumen.innerHTML = "";
      elegidas.forEach((txt, k) => {
        const linea = el("div", "historia-linea");
        linea.append(pasos[k].frase + " ", el("strong", "", txt + "."));
        resumen.appendChild(linea);
      });
    }

    function mostrar() {
      pintarResumen();
      if (i >= pasos.length) {
        progreso.textContent = "";
        frase.hidden = true;
        opciones.hidden = true;
        final.textContent = o.mensajeFinal || "Esta es nuestra historia \u2665";
        final.hidden = false;
        otra.hidden = false;
        return;
      }
      const p = pasos[i];
      progreso.textContent = (i + 1) + " / " + pasos.length;
      frase.hidden = false;
      opciones.hidden = false;
      frase.textContent = "";
      frase.append(p.frase + " ", el("span", "hueco", "_____"));
      opciones.innerHTML = "";
      p.opciones.forEach((txt) => {
        const b = el("button", "opcion", txt);
        b.type = "button";
        b.addEventListener("click", () => { elegidas.push(txt); i++; mostrar(); });
        opciones.appendChild(b);
      });
    }

    otra.addEventListener("click", () => {
      i = 0; elegidas.length = 0;
      final.hidden = true; otra.hidden = true;
      mostrar();
    });
    mostrar();
  }

  /* =====================================================
     VIDEO (día 15) - se define por código con "ruta"
     ===================================================== */
  function video(cont, o) {
    const marco = el("div", "video-marco");
    const vacio = el("div", "video-vacio", "Aquí irá tu video \u2665");
    marco.appendChild(vacio);
    if (o.ruta) {
      const v = document.createElement("video");
      v.controls = true;
      v.playsInline = true;
      v.preload = "metadata";
      if (o.poster) v.poster = o.poster;
      v.addEventListener("loadedmetadata", () => marco.classList.add("con-video"));
      v.addEventListener("error", () => { marco.classList.remove("con-video"); v.remove(); });
      v.src = o.ruta;
      marco.appendChild(v);
    }
    cont.appendChild(marco);
    if (o.mensaje) cont.appendChild(el("div", "video-pie", o.mensaje));
  }

  /* =====================================================
     TRES EN RAYA: corazones contra copos (día 16)
     ===================================================== */
  function tresenraya(cont, o) {
    const YO = "\u2764\uFE0F", ELLA = "\u2744\uFE0F";
    const nivel = o.nivel === undefined ? 0.5 : o.nivel; // probabilidad de que la máquina juegue bien
    const lineas = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let t, terminado;

    const tablero = el("div", "tres");
    const botones = [];
    for (let k = 0; k < 9; k++) {
      const b = el("button", "casilla");
      b.type = "button";
      b.setAttribute("aria-label", "Casilla " + (k + 1));
      b.addEventListener("click", () => jugar(k));
      botones.push(b);
      tablero.appendChild(b);
    }
    const estado = el("div", "tres-estado");
    const final = el("div", "ganaste");
    final.hidden = true;
    const acciones = el("div", "acciones");
    const otra = el("button", "btn sec", "Jugar de nuevo");
    otra.type = "button";
    otra.hidden = true;
    acciones.appendChild(otra);
    cont.append(tablero, estado, final, acciones);

    function ganador(b) {
      for (const [a, c, d] of lineas) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
      return b.every(Boolean) ? "empate" : null;
    }
    function huecoGanador(b, ficha) {
      for (const [a, c, d] of lineas) {
        const v = [b[a], b[c], b[d]];
        if (v.filter((x) => x === ficha).length === 2 && v.includes("")) return [a, c, d][v.indexOf("")];
      }
      return -1;
    }
    function jugadaMaquina() {
      const libres = t.map((v, k) => (v === "" ? k : -1)).filter((k) => k >= 0);
      if (Math.random() < nivel) {
        let k = huecoGanador(t, ELLA);
        if (k < 0) k = huecoGanador(t, YO);
        if (k < 0 && t[4] === "") k = 4;
        if (k >= 0) return k;
      }
      return libres[Math.floor(Math.random() * libres.length)];
    }
    function pintar() {
      botones.forEach((b, k) => { b.textContent = t[k]; b.disabled = t[k] !== "" || terminado; });
    }
    function fin(r) {
      terminado = true;
      pintar();
      estado.textContent = "";
      if (r === YO) final.textContent = o.mensajeFinal || "\u00a1Ganaste! \u2665";
      else final.textContent = r === "empate" ? "\u00a1Empate! Intenta otra vez \u2665" : "\u00a1Casi! Los copos ganaron esta vez. Intenta otra vez \u2665";
      final.hidden = false;
      otra.hidden = false;
    }
    function jugar(k) {
      if (terminado || t[k] !== "") return;
      t[k] = YO;
      let r = ganador(t);
      if (r) { fin(r); return; }
      t[jugadaMaquina()] = ELLA;
      r = ganador(t);
      if (r) { fin(r); return; }
      pintar();
    }
    function nueva() {
      t = Array(9).fill("");
      terminado = false;
      final.hidden = true;
      otra.hidden = true;
      estado.textContent = "Tú eres " + YO + " \u00b7 Empiezas tú";
      pintar();
    }
    otra.addEventListener("click", nueva);
    nueva();
  }

  /* =====================================================
     SIMÓN DE CORAZONES (día 18): repetir la secuencia
     ===================================================== */
  function simon(cont, o) {
    const META = o.meta || 6;
    const colores = ["#e63946", "#ff6b8b", "#f6d27a", "#2a9d8f"];
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

    const estado = el("div", "simon-estado", "Pulsa empezar");
    const tablero = el("div", "simon");
    const botones = colores.map((col, i) => {
      const b = el("button", "simon-b", "\u2665");
      b.type = "button";
      b.style.setProperty("--col", col);
      b.setAttribute("aria-label", "Corazón " + (i + 1));
      b.addEventListener("click", () => tocar(i));
      tablero.appendChild(b);
      return b;
    });
    const final = el("div", "ganaste");
    final.hidden = true;
    const acciones = el("div", "acciones");
    const empezar = el("button", "btn", "Empezar");
    empezar.type = "button";
    acciones.appendChild(empezar);
    cont.append(estado, tablero, final, acciones);

    let seq = [], pos = 0, aceptando = false, partida = 0;
    const activo = () => tablero.isConnected && tablero.offsetParent !== null;

    function iluminar(i, ms) {
      botones[i].classList.add("on");
      return esperar(ms).then(() => botones[i].classList.remove("on"));
    }

    async function reproducir(id) {
      aceptando = false;
      estado.textContent = "Ronda " + seq.length + " / " + META + " \u00b7 Mira la secuencia";
      await esperar(500);
      for (const i of seq) {
        if (id !== partida || !activo()) return;
        await iluminar(i, 450);
        await esperar(220);
      }
      if (id !== partida) return;
      pos = 0;
      aceptando = true;
      estado.textContent = "Ronda " + seq.length + " / " + META + " \u00b7 Tu turno";
    }

    function siguiente() {
      const idx = seq.length;
      const nuevo = (o.secuencia && o.secuencia[idx] !== undefined)
        ? o.secuencia[idx]
        : Math.floor(Math.random() * 4);
      seq.push(nuevo);
      reproducir(partida);
    }

    function tocar(i) {
      if (!aceptando) return;
      iluminar(i, 200);
      if (i !== seq[pos]) {
        aceptando = false;
        partida++;
        estado.textContent = "\u00a1Ups! Esa no era. Intenta otra vez";
        empezar.textContent = "Intentar de nuevo";
        empezar.hidden = false;
        return;
      }
      pos++;
      if (pos === seq.length) {
        aceptando = false;
        if (seq.length >= META) {
          estado.textContent = "";
          final.textContent = o.mensajeFinal || "\u00a1Lo lograste! \u2665";
          final.hidden = false;
          empezar.textContent = "Jugar de nuevo";
          empezar.hidden = false;
        } else {
          setTimeout(() => { if (activo()) siguiente(); }, 800);
        }
      }
    }

    empezar.addEventListener("click", () => {
      partida++;
      seq = [];
      final.hidden = true;
      empezar.hidden = true;
      siguiente();
    });
  }

  /* =====================================================
     RULETA de premios (día 20)
     ===================================================== */
  function ruleta(cont, o) {
    const premios = o.premios || [];
    const n = premios.length;
    const seg = 360 / n;
    const clave = "-ruleta-" + o.dia;
    const S = 300, R = 140;
    const colores = ["#ff6b8b", "#fff4ef", "#2a9d8f", "#f6d27a", "#c8102e", "#ffc2d1"];
    const letra = ["#fff", "#5a1130", "#fff", "#5a1130", "#fff", "#5a1130"];

    const caja = el("div", "ruleta-caja");
    const aguja = el("div", "ruleta-aguja", "\u25BC");
    const rueda = el("canvas", "ruleta-rueda");
    rueda.width = rueda.height = S;
    caja.append(aguja, rueda);

    const resultado = el("div", "ruleta-resultado");
    resultado.hidden = true;
    const acciones = el("div", "acciones");
    const girar = el("button", "btn", "Girar la ruleta");
    girar.type = "button";
    acciones.appendChild(girar);
    cont.append(caja, acciones, resultado);

    // Dibujo de la rueda: el segmento 0 empieza arriba y avanza hacia la derecha
    const g = rueda.getContext("2d");
    g.translate(S / 2, S / 2);
    for (let i = 0; i < n; i++) {
      const ini = (-90 + i * seg) * Math.PI / 180;
      const fin = (-90 + (i + 1) * seg) * Math.PI / 180;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, R, ini, fin);
      g.closePath();
      g.fillStyle = colores[i % colores.length];
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = "#f6d27a";
      g.stroke();

      const a = (-90 + i * seg + seg / 2) * Math.PI / 180;
      const izquierda = Math.cos(a) < 0;
      g.save();
      g.rotate(izquierda ? a + Math.PI : a);
      g.fillStyle = letra[i % letra.length];
      g.textBaseline = "middle";
      g.textAlign = izquierda ? "left" : "right";
      const x = izquierda ? -(R - 14) : (R - 14);
      const partes = premios[i].texto.length > 13 && premios[i].texto.includes(" ")
        ? [premios[i].texto.split(" ").slice(0, 2).join(" "), premios[i].texto.split(" ").slice(2).join(" ")]
        : [premios[i].texto];
      g.font = "bold 15px Georgia, serif";
      partes.forEach((p, k) => g.fillText(p, x, (k - (partes.length - 1) / 2) * 17));
      g.restore();
    }
    // Centro
    g.beginPath();
    g.arc(0, 0, 20, 0, Math.PI * 2);
    g.fillStyle = "#c8102e";
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = "#f6d27a";
    g.stroke();
    g.fillStyle = "#fff";
    g.font = "18px serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("\u2665", 0, 1);

    function mostrar(k) {
      const p = premios[k];
      resultado.textContent = "";
      resultado.append(
        el("div", "ruleta-emoji", p.emoji || "\uD83C\uDF81"),
        el("div", "ruleta-gano", "\u00a1Ganaste!"),
        el("div", "ruleta-premio", p.texto),
        el("div", "ruleta-aviso", o.aviso || "Toma captura de pantalla para reclamar tu premio.")
      );
      resultado.hidden = false;
    }
    function anguloCentro(k) { return (360 - (k * seg + seg / 2)) % 360; }

    const guardado = leer(clave);
    if (guardado !== null && premios[+guardado]) {
      rueda.style.transform = "rotate(" + anguloCentro(+guardado) + "deg)";
      girar.disabled = true;
      girar.textContent = "Ya giraste \u2665";
      mostrar(+guardado);
    }

    girar.addEventListener("click", () => {
      girar.disabled = true;
      const k = Math.floor(Math.random() * n);
      const desvio = (Math.random() - 0.5) * seg * 0.6; // cae dentro del segmento, sin quedar en la línea
      const total = 360 * 5 + anguloCentro(k) + desvio;
      rueda.style.transition = "transform 4.6s cubic-bezier(.17,.67,.12,.99)";
      rueda.style.transform = "rotate(" + total + "deg)";
      setTimeout(() => {
        guardar(clave, String(k));
        girar.textContent = "Ya giraste \u2665";
        mostrar(k);
      }, 4800);
    });
  }

  /* =====================================================
     CANCIÓN de amor (día 21)
     Botón de reproducir + onda musical con corazones.
     La canción se define por código con "ruta".
     ===================================================== */
  function cancion(cont, o) {
    const W = 300, H = 130;
    const fmt = (s) => {
      if (!isFinite(s)) return "0:00";
      const m = Math.floor(s / 60), x = Math.floor(s % 60);
      return m + ":" + (x < 10 ? "0" : "") + x;
    };

    cont.appendChild(el("div", "cancion-titulo", o.titulo || "Una canción para ti \u2665"));
    if (o.artista) cont.appendChild(el("div", "cancion-artista", o.artista));

    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    cv.className = "cancion-wave";
    cont.appendChild(cv);

    const barra = el("div", "cancion-barra");
    const prog = el("div", "cancion-prog");
    barra.appendChild(prog);
    const tiempo = el("div", "cancion-tiempo", "0:00");
    const boton = el("button", "btn cancion-play", "\u25B6  Reproducir canción");
    boton.type = "button";
    cont.append(barra, tiempo, boton);

    let sonando = false;
    let audio = null;

    if (o.ruta) {
      audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.style.display = "none";
      audio.src = o.ruta;
      audio.addEventListener("play", () => { sonando = true; etiqueta(); });
      audio.addEventListener("pause", () => { sonando = false; etiqueta(); });
      audio.addEventListener("ended", () => { sonando = false; prog.style.width = "0"; etiqueta(); });
      audio.addEventListener("timeupdate", () => {
        const d = audio.duration;
        prog.style.width = d ? (audio.currentTime / d * 100) + "%" : "0";
        tiempo.textContent = fmt(audio.currentTime) + " / " + fmt(d);
      });
      audio.addEventListener("loadedmetadata", () => { tiempo.textContent = "0:00 / " + fmt(audio.duration); });
      audio.addEventListener("error", () => {
        sonando = false;
        etiqueta();
        tiempo.textContent = "No se pudo cargar la canción.";
      });
      cont.appendChild(audio);
      barra.addEventListener("click", (e) => {
        if (!audio.duration) return;
        const r = barra.getBoundingClientRect();
        audio.currentTime = audio.duration * Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      });
    } else if (o.edicion) {
      cont.appendChild(el("div", "cancion-nota", "Modo edición: agrega la ruta de la canción en script.js (campo \"ruta\")."));
    }

    function etiqueta() {
      boton.textContent = sonando ? "\u23F8  Pausar canción" : "\u25B6  Reproducir canción";
    }
    boton.addEventListener("click", () => {
      if (audio) {
        if (audio.paused) {
          const p = audio.play();
          if (p && p.catch) p.catch(() => { tiempo.textContent = "No se pudo reproducir la canción."; });
        } else {
          audio.pause();
        }
      } else {
        sonando = !sonando; // sin canción: solo muestra la animación
        etiqueta();
      }
    });

    if (o.enlace) {
      const acciones = el("div", "acciones");
      const link = el("a", "btn sec", o.textoEnlace || "Escuchar en otra app");
      link.href = o.enlace;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      acciones.appendChild(link);
      cont.appendChild(acciones);
    }
    if (o.mensaje) cont.appendChild(el("div", "video-pie", o.mensaje));

    // ---- Animación: barras con un corazón en la punta + corazones que suben ----
    const g = cv.getContext("2d");
    const N = 17;
    const barras = Array.from({ length: N }, (_, i) => ({
      h: 0.08, fase: Math.random() * 6.28, vel: 2.2 + Math.random() * 3, mix: 0.5 + Math.random()
    }));
    let flotan = [], ultimoCorazon = 0;

    function dibujar(t) {
      const s = t / 1000;
      g.clearRect(0, 0, W, H);
      const base = H - 14, ancho = 9, sep = (W - 24) / N;

      barras.forEach((b, i) => {
        const objetivo = sonando
          ? 0.18 + 0.82 * Math.abs(Math.sin(s * b.vel + b.fase) * 0.65 + Math.sin(s * b.vel * 0.47 + i) * 0.35 * b.mix)
          : 0.07;
        b.h += (objetivo - b.h) * 0.14;
        const alto = b.h * (H - 52);
        const x = 12 + i * sep + sep / 2;

        const grad = g.createLinearGradient(0, base, 0, base - alto);
        grad.addColorStop(0, "#c8102e");
        grad.addColorStop(1, "#ff6b8b");
        g.fillStyle = grad;
        g.beginPath();
        g.roundRect ? g.roundRect(x - ancho / 2, base - alto, ancho, alto, 5) : g.rect(x - ancho / 2, base - alto, ancho, alto);
        g.fill();

        g.font = "15px serif";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = i % 3 === 0 ? "#f6d27a" : "#ffc2d1";
        g.fillText("\u2665", x, base - alto - 8);
      });

      if (sonando && t - ultimoCorazon > 260) {
        ultimoCorazon = t;
        flotan.push({ x: 20 + Math.random() * (W - 40), y: base - 10, v: 35 + Math.random() * 45, fase: Math.random() * 6.28, tam: 10 + Math.random() * 10, vida: 1 });
      }
      flotan = flotan.filter((f) => {
        f.y -= f.v * 0.016;
        f.vida -= 0.007;
        if (f.vida <= 0 || f.y < -10) return false;
        g.globalAlpha = Math.max(0, f.vida);
        g.fillStyle = "#ff8fab";
        g.font = f.tam + "px serif";
        g.fillText("\u2665", f.x + Math.sin(s * 2 + f.fase) * 8, f.y);
        return true;
      });
      g.globalAlpha = 1;
    }

    function ciclo(t) {
      if (!cv.isConnected) { if (audio) audio.pause(); return; }
      if (cv.offsetParent === null) { setTimeout(() => requestAnimationFrame(ciclo), 250); return; }
      dibujar(t);
      requestAnimationFrame(ciclo);
    }
    requestAnimationFrame(ciclo);
  }

  /* =====================================================
     MENSAJE FINAL (día 24)
     ===================================================== */
  function mensaje(cont, o) {
    const caja = el("div", "mensaje-final");
    if (o.emoji) caja.appendChild(el("div", "mensaje-emoji", o.emoji));
    if (o.titulo) caja.appendChild(el("div", "mensaje-titulo", o.titulo));
    (o.cuerpo || []).forEach((p) => caja.appendChild(el("div", "mensaje-cuerpo", p)));
    cont.appendChild(caja);
  }

  /* =====================================================
     FUEGOS ARTIFICIALES (celebración)
     ===================================================== */
  function banner(texto) {
    const b = el("div", "banner-fiesta", texto);
    document.body.appendChild(b);
    setTimeout(() => b.classList.add("sale"), 5200);
    setTimeout(() => b.remove(), 6000);
  }

  function fuegos(ms, texto) {
    ms = ms || 7000;
    if (texto) banner(texto);
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cv = document.createElement("canvas");
    cv.className = "fuegos";
    document.body.appendChild(cv);
    const g = cv.getContext("2d");
    let W = 0, H = 0;
    function ajustar() {
      const d = window.devicePixelRatio || 1;
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * d; cv.height = H * d;
      g.setTransform(d, 0, 0, d, 0, 0);
    }
    ajustar();
    window.addEventListener("resize", ajustar);

    const colores = ["#ff6b8b", "#f6d27a", "#ff3b5c", "#ffffff", "#3ddc97", "#ffc2d1"];
    const azar = (a) => a[Math.floor(Math.random() * a.length)];
    let cohetes = [], chispas = [];
    const t0 = performance.now();
    let ultimo = t0, proximo = t0;

    function explotar(x, y, col) {
      const corazon = Math.random() < 0.3;
      const n = corazon ? 40 : 60;
      for (let i = 0; i < n; i++) {
        let vx, vy;
        if (corazon) {
          const t = (i / n) * Math.PI * 2;
          vx = 16 * Math.pow(Math.sin(t), 3) * 11;
          vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 11;
        } else {
          const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 190;
          vx = Math.cos(a) * v; vy = Math.sin(a) * v;
        }
        chispas.push({ x, y, vx, vy, vida: 1, col, tam: 1.8 + Math.random() * 1.6 });
      }
    }

    function limpiar() {
      window.removeEventListener("resize", ajustar);
      cv.remove();
    }

    function paso(t) {
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      const activo = t - t0 < ms;

      g.globalCompositeOperation = "destination-out";
      g.fillStyle = "rgba(0,0,0,.25)";
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "lighter";

      if (activo && t >= proximo) {
        const cuantos = Math.random() < 0.3 ? 2 : 1;
        for (let k = 0; k < cuantos; k++) {
          cohetes.push({
            x: W * (0.12 + Math.random() * 0.76), y: H,
            vy: -H * (0.9 + Math.random() * 0.25),
            meta: H * (0.12 + Math.random() * 0.38),
            col: azar(colores)
          });
        }
        proximo = t + 380 + Math.random() * 500;
      }

      cohetes = cohetes.filter((c) => {
        c.y += c.vy * dt;
        g.fillStyle = "#fff";
        g.beginPath(); g.arc(c.x, c.y, 2.2, 0, Math.PI * 2); g.fill();
        if (c.y <= c.meta) { explotar(c.x, c.y, c.col); return false; }
        return true;
      });

      chispas = chispas.filter((p) => {
        p.vy += 150 * dt;
        p.vx *= 0.985;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vida -= dt * 0.55;
        if (p.vida <= 0) return false;
        g.globalAlpha = Math.max(0, p.vida);
        g.fillStyle = p.col;
        g.beginPath(); g.arc(p.x, p.y, p.tam, 0, Math.PI * 2); g.fill();
        return true;
      });
      g.globalAlpha = 1;

      if (!activo && cohetes.length === 0 && chispas.length === 0) { limpiar(); return; }
      requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  /* =====================================================
     CONSTRUYE TU CITA IDEAL (día 22)
     Elige una opción por paso y al final se arma la cita
     ===================================================== */
  function cita(cont, o) {
    const pasos = o.pasos || [];
    let i = 0;
    const elegidas = [];

    const progreso = el("div", "historia-progreso");
    const titulo = el("div", "historia-frase");
    const opciones = el("div", "historia-ops");
    const tarjeta = el("div", "cita-card");
    tarjeta.hidden = true;
    const acciones = el("div", "acciones");
    const otra = el("button", "btn sec", "Armar otra cita");
    otra.type = "button";
    otra.hidden = true;
    acciones.appendChild(otra);
    cont.append(progreso, titulo, opciones, tarjeta, acciones);

    function resumen() {
      tarjeta.innerHTML = "";
      tarjeta.appendChild(el("div", "cita-tit", o.titulo || "Nuestra cita ideal \uD83D\uDC97"));
      if (o.para) tarjeta.appendChild(el("div", "cita-para", "Para: " + o.para));
      const filas = el("div", "cita-filas");
      pasos.forEach((p, k) => {
        const f = el("div", "cita-fila");
        f.append(el("span", "cita-et", p.etiqueta || p.titulo), el("strong", "", (elegidas[k].emoji || "") + " " + elegidas[k].texto));
        filas.appendChild(f);
      });
      tarjeta.appendChild(filas);
      tarjeta.appendChild(el("div", "cita-cierre", o.mensajeFinal || "Esta cita es tuya \u2665"));
      tarjeta.hidden = false;
    }

    function mostrar() {
      if (i >= pasos.length) {
        progreso.textContent = "";
        titulo.hidden = true;
        opciones.hidden = true;
        resumen();
        otra.hidden = false;
        return;
      }
      const p = pasos[i];
      progreso.textContent = (i + 1) + " / " + pasos.length;
      titulo.hidden = false;
      opciones.hidden = false;
      tarjeta.hidden = true;
      otra.hidden = true;
      titulo.textContent = p.titulo;
      opciones.innerHTML = "";
      p.opciones.forEach((op) => {
        const b = el("button", "opcion", (op.emoji ? op.emoji + "  " : "") + op.texto);
        b.type = "button";
        b.addEventListener("click", () => { elegidas.push(op); i++; mostrar(); });
        opciones.appendChild(b);
      });
    }

    otra.addEventListener("click", () => { i = 0; elegidas.length = 0; mostrar(); });
    mostrar();
  }

  /* =====================================================
     QUIZ (día 23): hay que repetir las incorrectas
     hasta acertar las preguntas
     ===================================================== */
  function quiz(cont, o) {
    const preguntas = (o.preguntas || []).map((p) => ({
      pregunta: p.pregunta,
      correcta: p.correcta,
      opciones: barajar(p.opciones.slice()),
      sel: null,
      ok: false,
      descartadas: new Set(),
      botones: []
    }));

    const lista = el("div", "quiz");
    const estado = el("div", "quiz-estado");
    const final = el("div", "ganaste");
    final.hidden = true;
    const acciones = el("div", "acciones");
    const revisar = el("button", "btn", "Revisar respuestas");
    revisar.type = "button";
    revisar.disabled = true;
    acciones.appendChild(revisar);

    const bloques = preguntas.map((q, n) => {
      const bloque = el("div", "quiz-p");
      bloque.appendChild(el("div", "quiz-q", (n + 1) + ". " + q.pregunta));
      const ops = el("div", "quiz-ops");
      q.opciones.forEach((txt) => {
        const b = el("button", "opcion", txt);
        b.type = "button";
        b.addEventListener("click", () => {
          if (q.ok || q.descartadas.has(txt)) return;
          q.sel = txt;
          pintar();
        });
        q.botones.push(b);
        ops.appendChild(b);
      });
      bloque.appendChild(ops);
      lista.appendChild(bloque);
      return bloque;
    });
    cont.append(lista, estado, final, acciones);

    function pintar() {
      preguntas.forEach((q) => {
        q.botones.forEach((b) => {
          b.classList.toggle("sel", !q.ok && q.sel === b.textContent);
          b.classList.toggle("correcta", q.ok && q.correcta === b.textContent);
          b.classList.toggle("descartada", q.descartadas.has(b.textContent));
        });
      });
      const pendientes = preguntas.filter((q) => !q.ok);
      revisar.disabled = pendientes.length === 0 || pendientes.some((q) => q.sel === null);
    }

    revisar.addEventListener("click", () => {
      let primeraMala = -1;
      preguntas.forEach((q, n) => {
        bloques[n].classList.remove("repetir");
        if (q.ok) return;
        if (q.sel === q.correcta) {
          q.ok = true;
        } else {
          q.descartadas.add(q.sel);
          q.sel = null;
          bloques[n].classList.add("repetir");
          if (primeraMala < 0) primeraMala = n;
        }
      });
      pintar();
      const buenas = preguntas.filter((q) => q.ok).length;
      if (buenas === preguntas.length) {
        estado.textContent = "Correctas: " + buenas + " / " + preguntas.length;
        final.textContent = o.mensajeFinal || "\u00a1Lo lograste! \u2665";
        final.hidden = false;
        revisar.hidden = true;
        final.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        const malas = preguntas.length - buenas;
        estado.textContent = "Correctas: " + buenas + " / " + preguntas.length +
          " \u00b7 Debes repetir: te " + (malas === 1 ? "quedó 1 incorrecta" : "quedaron " + malas + " incorrectas") + ". Vuelve a elegir en las marcadas \u2665";
        bloques[primeraMala].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    pintar();
  }

  /* =====================================================
     API pública
     ===================================================== */
  const tipos = { imagen, puzzle, memoria, cupon, atrapar, sopa, carta, historia, video, tresenraya, simon, ruleta, cancion, mensaje, cita, quiz };

  window.Juegos = {
    init(prefijo) { PREFIJO = prefijo; },
    fuegos,
    render(tipo, cont, opciones) {
      cont.innerHTML = "";
      if (tipos[tipo]) tipos[tipo](cont, opciones || {});
    },
    // Borra lo que depende del progreso (cupones canjeados y ruleta). Las fotos se conservan.
    reiniciar() {
      for (let d = 1; d <= 31; d++) { borrar("-cupon-" + d); borrar("-ruleta-" + d); }
    }
  };
})();