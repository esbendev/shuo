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

    function isEmptyDay(item) {
        return Array.isArray(item.content)
            && item.content.length > 0
            && item.content.every(subItem => subItem.disabled === true && subItem.link === "#");
    }

    function groupConsecutiveEmptyDays(data) {
        const groupedData = [];

        for (let i = 0; i < data.length; i += 1) {
            const current = data[i];

            if (!isEmptyDay(current)) {
                groupedData.push(current);
                continue;
            }

            const startDay = Number(current.number);
            let endDay = startDay;
            let j = i + 1;

            while (
                j < data.length
                && isEmptyDay(data[j])
                && Number(data[j].number) === endDay + 1
            ) {
                endDay = Number(data[j].number);
                j += 1;
            }

            if (startDay === endDay) {
                groupedData.push(current);
            } else {
                groupedData.push({
                    number: "-",
                    content: [
                        {
                            text: `Empty days ${startDay}-${endDay}`,
                            link: "#",
                            id: `empty_days_${startDay}_${endDay}`,
                            disabled: true
                        }
                    ]
                });
            }

            i = j - 1;
        }

        return groupedData;
    }

    function actualizarEstadosBotones() {
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
    }

    function renderCalendar(url, selector) {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const calendarGrid = document.querySelector(selector);
                const processedData = groupConsecutiveEmptyDays(data);

                processedData.forEach(item => {
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

                actualizarEstadosBotones();
            })
            .catch(error => console.error('Error loading JSON:', error));
    }

    renderCalendar('./contenido/preguntas/tubh/1/lista_dias.json', '.calendar-grid#calendar-grid-1');
    renderCalendar('./contenido/preguntas/tubh/2/lista_dias.json', '.calendar-grid#calendar-grid-2');


});