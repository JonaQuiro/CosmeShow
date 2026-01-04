const pantallaConfig = document.getElementById("pantalla-configuracion");
const pantallaTurno = document.getElementById("pantalla-turno");
const pantallaFinal = document.getElementById("pantalla-final");

const equipoTxt = document.getElementById("equipo-actual");
const rondaTxt = document.getElementById("ronda-actual");

const palabraTxt = document.getElementById("palabra-principal");
const prohibidasUl = document.getElementById("palabras-prohibidas");

const puntosATxt = document.getElementById("puntos-a");
const puntosBTxt = document.getElementById("puntos-b");

const btnCambiar = document.getElementById("btn-cambiar");
const btnPlay = document.getElementById("btn-play");

const cartaDiv = document.getElementById("carta");
const preTurnoDiv = document.getElementById("pre-turno");

const timerText = document.getElementById("timer-text");
const timerCircle = document.querySelector(".progress");

/* ====== CONFIG ====== */
let tiempoTurno = 60;
let rondasPorEquipo = 5;
let modoRondas = "alternadas";

/* ====== ESTADO ====== */
let equipoActual = 0;
let rondaA = 1;
let rondaB = 1;

let puntosA = 0;
let puntosB = 0;

let tiempo;
let esperandoPlay = true;
let turnoActivo = false;
let cambioUsado = false;

/* ====== MUERTE SÚBITA ====== */
let enMuerteSubita = false;
let turnoResultado = null;
let resultadoMS = { A: null, B: null };

/* ====== MAZO ====== */
let mazo = [];
let indiceCarta = 0;

function mezclarCartas() {
    mazo = [...cartas];
    for (let i = mazo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
    indiceCarta = 0;
}

/* ====== COMENZAR ====== */
document.getElementById("btn-comenzar").onclick = () => {
    tiempoTurno = +document.querySelector("input[name='tiempo']:checked").value;
    rondasPorEquipo = +document.getElementById("select-rondas").value;
    modoRondas = document.querySelector("input[name='modo']:checked").value;

    mezclarCartas();

    pantallaConfig.style.display = "none";
    pantallaTurno.style.display = "block";
    iniciarTurno();
};

/* ====== TURNO ====== */
function iniciarTurno() {
    actualizarUI();
    nuevaCarta();

    esperandoPlay = true;
    turnoActivo = false;
    turnoResultado = null;

    cartaDiv.classList.add("oculto");
    preTurnoDiv.style.display = "block";

    btnCambiar.disabled = true;
    actualizarTimer(tiempoTurno);
}

/* ====== PLAY ====== */
btnPlay.onclick = () => {
    if (!esperandoPlay) return;

    esperandoPlay = false;
    turnoActivo = true;

    preTurnoDiv.style.display = "none";
    cartaDiv.classList.remove("oculto");

    btnCambiar.disabled = false;
    cambioUsado = false;

    let t = tiempoTurno;
    actualizarTimer(t);

    clearInterval(tiempo);
    tiempo = setInterval(() => {
        t--;
        actualizarTimer(t);
        if (t <= 0) {
            clearInterval(tiempo);
            penalizar();
        }
    }, 1000);
};

/* ====== TIMER ====== */
function actualizarTimer(t) {
    timerText.textContent = t;
    const progreso = (t / tiempoTurno) * 339;
    timerCircle.style.strokeDashoffset = 339 - progreso;
}

/* ====== CARTA ====== */
function nuevaCarta() {
    if (indiceCarta >= mazo.length) {
        finalizar();
        return;
    }

    const carta = mazo[indiceCarta++];
    cartaDiv.classList.remove("animar");

    palabraTxt.textContent = carta.palabra;
    prohibidasUl.innerHTML = "";

    carta.prohibidas.forEach(p => {
        const li = document.createElement("li");
        li.textContent = p;
        prohibidasUl.appendChild(li);
    });

    void cartaDiv.offsetWidth;
    cartaDiv.classList.add("animar");
}

/* ====== UI ====== */
function actualizarUI() {
    equipoTxt.textContent = `Equipo ${equipoActual === 0 ? "A" : "B"}`;
    rondaTxt.textContent = enMuerteSubita
        ? "⚔️ Muerte súbita"
        : `Ronda ${equipoActual === 0 ? rondaA : rondaB} / ${rondasPorEquipo}`;
}

/* ====== PUNTOS ====== */
function sumar() {
    if (!turnoActivo) return;
    turnoResultado = true;
    equipoActual === 0 ? puntosA++ : puntosB++;
    avanzar();
}

function penalizar() {
    if (!turnoActivo) return;
    turnoResultado = false;
    equipoActual === 0 ? puntosA-- : puntosB--;
    avanzar();
}

/* ====== AVANZAR ====== */
function avanzar() {
    clearInterval(tiempo);
    turnoActivo = false;

    /* ===== MUERTE SÚBITA ===== */
    if (enMuerteSubita) {
        const eq = equipoActual === 0 ? "A" : "B";
        resultadoMS[eq] = turnoResultado;

        if (resultadoMS.A !== null && resultadoMS.B !== null) {

            if (resultadoMS.A && !resultadoMS.B) {
                puntosA++;
                return finalizar();
            }

            if (!resultadoMS.A && resultadoMS.B) {
                puntosB++;
                return finalizar();
            }

            // empate → sigue mata-mata
            resultadoMS.A = null;
            resultadoMS.B = null;
            equipoActual = 0;
        } else {
            equipoActual = equipoActual === 0 ? 1 : 0;
        }

        iniciarTurno();
        return;
    }

    /* ===== JUEGO NORMAL ===== */
    puntosATxt.textContent = puntosA;
    puntosBTxt.textContent = puntosB;

    if (equipoActual === 0) rondaA++;
    else rondaB++;

    if (rondaA > rondasPorEquipo && rondaB > rondasPorEquipo) {
        return finalizar();
    }

    if (modoRondas === "alternadas") {
        equipoActual = equipoActual === 0 ? 1 : 0;
    } else {
        if (equipoActual === 0 && rondaA > rondasPorEquipo) equipoActual = 1;
        if (equipoActual === 1 && rondaB > rondasPorEquipo) equipoActual = 0;
    }

    iniciarTurno();
}

/* ====== FINAL ====== */
function finalizar() {

    if (!enMuerteSubita && puntosA === puntosB) {
        alert("⚔️ Empate! Muerte súbita ⚔️");

        enMuerteSubita = true;
        resultadoMS.A = null;
        resultadoMS.B = null;
        equipoActual = 0;

        iniciarTurno();
        return;
    }

    pantallaTurno.style.display = "none";
    pantallaFinal.style.display = "block";

    document.getElementById("final-a").textContent = puntosA;
    document.getElementById("final-b").textContent = puntosB;
    document.getElementById("ganador").textContent =
        puntosA > puntosB ? "🏆 Ganó Equipo A" : "🏆 Ganó Equipo B";
}

/* ====== BOTONES ====== */
document.getElementById("btn-acierto").onclick = sumar;
document.getElementById("btn-error").onclick = penalizar;

btnCambiar.onclick = () => {
    if (!cambioUsado && turnoActivo) {
        cambioUsado = true;
        nuevaCarta();
    }
};

document.getElementById("btn-nueva-partida").onclick = () => location.reload();

/* ====== REGLAMENTO ====== */
const modalReglamento = document.getElementById("modal-reglamento");
document.getElementById("btn-reglamento").onclick = () => modalReglamento.style.display = "block";
document.getElementById("btn-cerrar-reglamento").onclick = () => modalReglamento.style.display = "none";

/* ====== SERVICE WORKER ====== */
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./sw.js")
            .then(reg => console.log("SW registrado", reg.scope))
            .catch(err => console.error("SW error", err));
    });
}

