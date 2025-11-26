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
    // console.log(`Botón ${id} actualizado a estado: ${estado}`);
}

document.addEventListener("DOMContentLoaded", () => {

    fetch('./contenido/preguntas/tubh/1/lista_dias.json')
        .then(response => response.json())
        .then(data => {
            const calendarGrid = document.querySelector('.calendar-grid#calendar-grid-1');

            data.forEach(item => {
                const gridItem = document.createElement('div');
                gridItem.classList.add('grid-item');

                const circle = document.createElement('div');
                circle.classList.add('circle');
                circle.textContent = item.number;

                const contentContainer = document.createElement('div');
                contentContainer.classList.add('content-container');

                item.content.forEach(subItem => {
                    const content = document.createElement('a');
                    content.textContent = subItem.text;
                    content.href = subItem.link;
                    content.id = subItem.id;
                    content.classList.add('boton-quiz');
                    if (subItem.disabled) {
                        content.classList.add('disabled');
                        content.href = "#";
                    }

                    contentContainer.appendChild(content);
                });

                gridItem.appendChild(circle);
                gridItem.appendChild(contentContainer);
                calendarGrid.appendChild(gridItem);
            });

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
        })
        .catch(error => console.error('Error loading JSON:', error));

    fetch('./contenido/preguntas/tubh/2/lista_dias.json')
        .then(response => response.json())
        .then(data => {
            const calendarGrid = document.querySelector('.calendar-grid#calendar-grid-2');

            data.forEach(item => {
                const gridItem = document.createElement('div');
                gridItem.classList.add('grid-item');

                const circle = document.createElement('div');
                circle.classList.add('circle');
                circle.textContent = item.number;

                const contentContainer = document.createElement('div');
                contentContainer.classList.add('content-container');

                item.content.forEach(subItem => {
                    const content = document.createElement('a');
                    content.textContent = subItem.text;
                    content.href = subItem.link;
                    content.id = subItem.id;
                    content.classList.add('boton-quiz');
                    if (subItem.disabled) {
                        content.classList.add('disabled');
                        content.href = "#";
                    }

                    contentContainer.appendChild(content);
                });

                gridItem.appendChild(circle);
                gridItem.appendChild(contentContainer);
                calendarGrid.appendChild(gridItem);
            });

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
        })
        .catch(error => console.error('Error loading JSON:', error));


});