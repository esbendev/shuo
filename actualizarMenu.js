function actualizarEstadoBoton(id, estado) {
    const button = document.getElementById(id);
    button.classList.remove("boton-quiz--disponible", "boton-quiz--en-proceso", "boton-quiz--completado");
    if (estado === "disponible") {
        button.classList.add("boton-quiz--disponible");
    } else if (estado === "en-proceso") {
        button.classList.add("boton-quiz--en-proceso");
    } else if (estado === "completado") {
        button.classList.add("boton-quiz--completado");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".boton-quiz");
    buttons.forEach(button => {
        const id = button.id;
        const cantidadPreguntas = Number(localStorage.getItem(`quiz_cantidadPreguntas_${id}`));
        const preguntaActual = Number(localStorage.getItem(`quiz_currentId_${id}`));
        if (cantidadPreguntas > 0) {
            if (preguntaActual > 0 && preguntaActual < cantidadPreguntas) {
                actualizarEstadoBoton(id, "en-proceso");
            } else if (preguntaActual >= cantidadPreguntas) {
                actualizarEstadoBoton(id, "completado");
            } else {
                actualizarEstadoBoton(id, "disponible");
            }
        } else {
            actualizarEstadoBoton(id, "disponible");
        }
    });
});