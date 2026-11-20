
// 1. Seleccionar los elementos HTML
const formulario = document.querySelector("#formulario");
const campoCiudad = document.querySelector("#ciudad");
const estado = document.querySelector("#estado");
const resultado = document.querySelector("#resultado");

// 2. Escuchar el envío del formulario
formulario.addEventListener("submit", consultarClima);


// 3. Función asíncrona para consultar las API
async function consultarClima(evento) {

    // Evita que la página se recargue
    evento.preventDefault();

    // Obtener el nombre de la ciudad
    const ciudad = campoCiudad.value.trim();

    // Ocultar el resultado anterior
    resultado.hidden = true;
    estado.textContent = "Buscando ciudad...";

    try {

        // 4. PRIMERA PETICIÓN: buscar las coordenadas
        const urlGeo = new URL(
            "https://geocoding-api.open-meteo.com/v1/search"
        );

        urlGeo.search = new URLSearchParams({
            name: ciudad,
            count: "1",
            language: "es",
            format: "json"
        }).toString();

        const respuestaGeo = await fetch(urlGeo);

        if (!respuestaGeo.ok) {
            throw new Error("No se pudo buscar la ciudad.");
        }

        const datosGeo = await respuestaGeo.json();

        // Comprobar que se encontró una ciudad
        const lugar = datosGeo.results?.[0];

        if (!lugar) {
            throw new Error("No encontramos esa ciudad.");
        }

        // 5. SEGUNDA PETICIÓN: consultar el clima
        estado.textContent = "Consultando el clima...";

        const urlClima = new URL(
            "https://api.open-meteo.com/v1/forecast"
        );

        urlClima.search = new URLSearchParams({
            latitude: lugar.latitude,
            longitude: lugar.longitude,
            current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
            daily: "weather_code,temperature_2m_max,temperature_2m_min",
            forecast_days: "4",
            timezone: "auto",
            temperature_unit: "celsius",
            wind_speed_unit: "kmh"
        }).toString();

        const respuestaClima = await fetch(urlClima);

        if (!respuestaClima.ok) {
            throw new Error("No se pudo consultar el clima.");
        }

        const datosClima = await respuestaClima.json();

        // 6. Extraer los datos meteorológicos actuales
        const actual = datosClima.current;

        // 7. Interpretar el código meteorológico
        const condicion = describirClima(actual.weather_code);

        // 8. Mostrar los datos en los elementos HTML
        document.querySelector("#ubicacion").textContent =
            [lugar.name, lugar.admin1, lugar.country]
            .filter(Boolean).join(", ");

        document.querySelector("#icono").textContent =
            condicion.icono;

        document.querySelector("#temperatura").textContent =
            actual.temperature_2m.toFixed(1) + " °C";

        document.querySelector("#descripcion").textContent =
            condicion.texto;

        document.querySelector("#humedad").textContent =
            actual.relative_humidity_2m + " %";

        document.querySelector("#sensacion").textContent =
            actual.apparent_temperature.toFixed(1) + " °C";

        document.querySelector("#viento").textContent =
            actual.wind_speed_10m + " km/h";

        mostrarPronostico(datosClima.daily);

        document.querySelector("#actualizacion").textContent =
            "Datos para " + actual.time.replace("T", " ") +
            " (hora local).";

        // Mostrar el resultado
        resultado.hidden = false;
        estado.textContent = "Consulta completada.";

    } catch (error) {

        // Mostrar un mensaje si ocurre algún problema
        estado.textContent = error.message;
        console.error(error);
    }
}


function mostrarPronostico(pronostico) {
    const contenedorPronostico = document.querySelector("#pronostico");
    const diasSiguientes = pronostico.time.slice(1, 4);
    const formatoFecha = new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "short"
    });

    contenedorPronostico.replaceChildren();

    diasSiguientes.forEach((fecha, indice) => {
        const condicion = describirClima(pronostico.weather_code[indice + 1]);
        const tarjeta = document.createElement("article");
        const fechaElemento = document.createElement("strong");
        const iconoElemento = document.createElement("span");
        const condicionElemento = document.createElement("span");
        const temperaturaElemento = document.createElement("span");

        fechaElemento.className = "pronostico-fecha";
        fechaElemento.textContent = formatoFecha.format(
            new Date(`${fecha}T12:00:00`)
        );

        iconoElemento.className = "pronostico-icono";
        iconoElemento.setAttribute("aria-hidden", "true");
        iconoElemento.textContent = condicion.icono;

        condicionElemento.className = "pronostico-condicion";
        condicionElemento.textContent = condicion.texto;

        temperaturaElemento.className = "pronostico-temperatura";
        temperaturaElemento.textContent =
            `${Math.round(pronostico.temperature_2m_min[indice + 1])}° / ` +
            `${Math.round(pronostico.temperature_2m_max[indice + 1])}° C`;

        tarjeta.append(
            fechaElemento,
            iconoElemento,
            condicionElemento,
            temperaturaElemento
        );
        contenedorPronostico.append(tarjeta);
    });
}


// 9. Función para traducir los códigos meteorológicos
function describirClima(codigo) {

    const condiciones = {
        0:  { texto: "Despejado", icono: "☀️" },
        1:  { texto: "Principalmente despejado", icono: "🌤️" },
        2:  { texto: "Parcialmente nublado", icono: "⛅" },
        3:  { texto: "Nublado", icono: "☁️" },
        45: { texto: "Niebla", icono: "🌫️" },
        48: { texto: "Niebla", icono: "🌫️" },
        51: { texto: "Llovizna", icono: "🌦️" },
        53: { texto: "Llovizna", icono: "🌦️" },
        55: { texto: "Llovizna intensa", icono: "🌧️" },
        61: { texto: "Lluvia ligera", icono: "🌧️" },
        63: { texto: "Lluvia moderada", icono: "🌧️" },
        65: { texto: "Lluvia intensa", icono: "🌧️" },
        71: { texto: "Nevada ligera", icono: "❄️" },
        73: { texto: "Nevada moderada", icono: "❄️" },
        75: { texto: "Nevada intensa", icono: "❄️" },
        80: { texto: "Chubascos", icono: "🌦️" },
        81: { texto: "Chubascos moderados", icono: "🌧️" },
        82: { texto: "Chubascos intensos", icono: "🌧️" },
        95: { texto: "Tormenta eléctrica", icono: "⛈️" },
        96: { texto: "Tormenta con granizo", icono: "⛈️" },
        99: { texto: "Tormenta intensa con granizo", icono: "⛈️" }
    };

    return condiciones[codigo] || {
        texto: "Condición meteorológica variable",
        icono: "🌡️"
    };
}
