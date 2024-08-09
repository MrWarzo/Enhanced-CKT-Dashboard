window.addEventListener("load", () => main());

const { protocol, hostname, href } = window.location;
const DASHBOARD_URL = `${protocol}//${hostname}`;
const REFRESH_INTERVAL = 60000;
const BUTTON_BASE_STYLE = `
    padding: 0px 1.125rem;
    appearance: none;
    text-align: left;
    text-decoration: none;
    box-sizing: border-box;
    height: 2.25rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    -webkit-tap-highlight-color: transparent;
    display: inline-block;
    width: auto;
    border-radius: 0.25rem;
    font-weight: 600;
    position: relative;
    line-height: 1;
    font-size: 0.875rem;
    user-select: none;
    cursor: pointer;
    border: 0.0625rem solid transparent;
    background-color: rgb(76, 193, 98);
    color: rgb(255, 255, 255);
    margin: 0 0 0 0.5rem;
`;
const BUTTON_HOVER_STYLE = `
    background-color: rgb(61, 170, 81);
`;
const BUTTON_HOVER_ACTIVE = `
    transform: translateY(0.0625rem);
`;

function getCsrfTOken() {
    return fetch(DASHBOARD_URL + "/login", { method: "GET" })
        .then((response) => response.text())
        .then((responseText) => {
            const parser = new DOMParser();
            const csrfDocument = parser.parseFromString(
                responseText,
                "text/html"
            );

            const csrfInput = csrfDocument.getElementsByName("_csrf_token")[0];
            return csrfInput.value;
        });
}

function login(csrfToken) {
    const body = new URLSearchParams();
    body.append("_csrf_token", csrfToken);
    body.append("username", "pereira@winylo.com");
    body.append("password", "mdp");

    return fetch(DASHBOARD_URL + "/login", {
        method: "POST",
        headers: {
            ContentType: "application/x-www-form-urlencoded",
            Origin: DASHBOARD_URL,
        },
        body,
    });
}

function getTotalDuration(recapWeek) {
    // Initialise les minutes totales à zéro
    let totalMinutes = 0;

    // Parcourir les événements et accumuler la durée totale en minutes
    recapWeek.forEach((event) => {
        const start = new Date(event.start);
        const end = event.end ? new Date(event.end) : new Date();

        const duration = (end - start) / (1000 * 60); // Convertir les millisecondes en minutes
        totalMinutes += duration;
    });

    // Convertir la durée totale en heures et minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);

    // Formater la durée totale en "hh'h' mm"
    const formattedDuration = `${String(hours).padStart(2, "0")}h ${String(
        minutes
    ).padStart(2, "0")}`;

    // Convertir la durée totale en millisecondes
    const totalMilliseconds = totalMinutes * 60 * 1000;

    // Retourner un tableau avec la durée formatée et la durée totale en millisecondes
    return [formattedDuration, totalMilliseconds];
}

function getFirstDayOfTheWeek() {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);

    return monday;
}

function getRecapWeek(timer) {
    return fetch(DASHBOARD_URL + "/webapi/timeClock/recapWeek", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            date: getFirstDayOfTheWeek().toISOString().split("T")[0],
        }),
    })
        .catch(() => {
            // Si le recapWeek plante (session expirée) on stop tout et on relance le main
            if (timer) clearInterval(timer);
            main();
        })
        .then((response) => response.json());
}

async function readSyncStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([key], function (result) {
            if (result[key] === undefined) {
                reject();
            } else {
                resolve(result[key]);
            }
        });
    });
}

// TODO : Fix Error extension contect invalidated
async function writeSyncStorage(key, value) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set({ [key]: value }, function () {
            resolve();
        });
    });
}

// TODO: utiliser les routes api dev à l'occasion
async function main() {
    const csrfToken = await getCsrfTOken(); // Le token CSRF est necessaire pour le login
    // TODO : vérifier si on a déjà un cookie valide, réduire le nombre de fetch
    await login(csrfToken); // Le login recup le cookie PHP_SESSIONID
    await displayInfos();

    let isRefreshing = false;

    let timer = setInterval(() => {
        if (isRefreshing) return;
        isRefreshing = true;
        displayInfos(timer).finally(() => {
            isRefreshing = false;
            console.log("Refreshed at : " + new Date().toLocaleTimeString());
        });
    }, REFRESH_INTERVAL);

    // On relance l'intervale si on revient sur la page
    window.addEventListener("focus", () => {
        console.log("Restarted at : " + new Date().toLocaleTimeString());
        clearInterval(timer);
        displayInfos();
        timer = setInterval(() => {
            if (isRefreshing) return;
            isRefreshing = true;
            displayInfos(timer).finally(() => {
                isRefreshing = false;
                console.log(
                    "Refreshed at : " + new Date().toLocaleTimeString()
                );
            });
            // TODO : Ajouter un logger propre pour savoir quand ca refresh
        }, REFRESH_INTERVAL);
    });

    // On stoppe l'intervale si on quitte la page
    window.addEventListener("blur", () => {
        clearInterval(timer);
        console.log("Stopped at : " + new Date().toLocaleTimeString());
    });
}

async function displayInfos(timer) {
    if (
        href !== DASHBOARD_URL + "/" &&
        href !== DASHBOARD_URL + "/customPage/6"
    )
        return new Promise((resolve) => resolve());

    const recapWeek = await getRecapWeek(timer); // Recupere les pointages de la semaine
    const totalDuration = getTotalDuration(recapWeek); // Calcule la durée totale de travail

    /** Remove des anciennes nodes */
    const oldTrueTotalPNode = document.getElementById("trueTotalPNode");
    oldTrueTotalPNode?.remove();

    const oldPTimeToBeDone = document.getElementById("pTimeToBeDone");
    oldPTimeToBeDone?.remove();

    const oldDiv = document.getElementById("divHoursToDO");
    oldDiv?.remove();
    /** ------------------------- */

    const trueTotalPNode = document.createElement("p");
    trueTotalPNode.setAttribute("id", "trueTotalPNode");

    const pNode = document.getElementsByClassName("mantine-Paper-root")[0];

    let HoursToDO = 35;
    await readSyncStorage("HoursToDO")
        .then((data) => {
            HoursToDO = data;
        })
        .catch(async () => {
            await writeSyncStorage("HoursToDO", HoursToDO);
        });

    const timeToBeDone = HoursToDO * 60 * 60 * 1000 - totalDuration[1];
    const pTimeToBeDone = document.createElement("p");
    pTimeToBeDone.setAttribute("id", "pTimeToBeDone");
    pTimeToBeDone.innerHTML = `<div><span style="font-weight:700">Temps restant : </span>${formattedTime(
        timeToBeDone
    )}</div>`;
    trueTotalPNode.innerHTML = `<div><span style="font-weight:700">Total : </span>${totalDuration[0]}</div>`;

    // TODO: Il faut aussi qu'on l'affiche direct dans le popup de l'extension pour ne plus dependre de la page
    pNode.appendChild(trueTotalPNode);
    pNode.appendChild(pTimeToBeDone);

    computedInputAndButton(
        HoursToDO,
        pNode,
        totalDuration[1],
        totalDuration[0],
        "HoursToDO",
        "Temps à faire : "
    );

    return new Promise((resolve) => resolve());
}

// calcule le temps de travail effectué
function computedNewTotalTimeStamp(totalTimestamp, titleCheckInTime) {
    const now = new Date();
    const checkInTime = new Date();
    checkInTime.setHours(parseInt(titleCheckInTime[1]));
    checkInTime.setMinutes(parseInt(titleCheckInTime[2]));

    // temps entre l'heure actuelle et l'heure de début de pointage
    const calculated = now.getTime() - checkInTime.getTime();

    return calculated + totalTimestamp;
}

function computedInputAndButton(
    HoursToDO,
    pNode,
    newTotalTimestamp,
    newTotalTime,
    storage,
    label
) {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.marginTop = "1rem";
    div.id = "divHoursToDO";

    const p = document.createElement("p");
    p.innerHTML = label;
    p.style.fontWeight = "700";

    const input = document.createElement("input");
    input.value = HoursToDO;
    input.type = "number";
    input.style.width = "3rem";
    input.style.marginLeft = "0.5rem";
    input.style.padding = "0.5rem";
    input.style.border = "2px solid #3e9d51";
    input.style.borderRadius = "0.25rem";
    input.style.textAlign = "center";
    input.style.color = "#3e9d51";
    input.style.appearance = "textfield";
    input.addEventListener("change", async (e) => {
        await writeSyncStorage(storage, e.target.value);
    });

    const svg = document.createElement("svg");
    svg.innerHTML = `<svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 512 512"
            fill="#ffffff"
        >
            <path d="M272 0H396.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H272c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128H192v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48z"></path>
        </svg>`;
    svg.width = "100%";
    svg.height = "100%";

    const button = document.createElement("button");
    button.innerHTML = '<i class="fas fa-copy"></i>';
    button.classList.add("ckt-button");
    button.classList.add("primary");
    button.style.marginLeft = "0.5rem";
    button.style = BUTTON_BASE_STYLE;

    button.addEventListener("click", () =>
        handleCopyClick(input.value, newTotalTimestamp, newTotalTime)
    );
    button.addEventListener("mouseover", () => {
        button.style = BUTTON_BASE_STYLE + BUTTON_HOVER_STYLE;
    });
    button.addEventListener("mouseout", () => {
        button.style = BUTTON_BASE_STYLE;
    });
    button.addEventListener("mousedown", () => {
        button.style = BUTTON_BASE_STYLE + BUTTON_HOVER_ACTIVE;
    });
    button.addEventListener("mouseup", () => {
        button.style = BUTTON_BASE_STYLE + BUTTON_HOVER_STYLE;
    });

    button.appendChild(svg);

    div.appendChild(p);
    div.appendChild(input);
    div.appendChild(button);

    pNode.appendChild(div);
}

// Gère l'évènement au clic sur les boutons de copie
function handleCopyClick(HoursToDO, newTotalTimestamp, newTotalTime) {
    const timeToBeDone = HoursToDO * 60 * 60 * 1000 - newTotalTimestamp;
    const timeToBeDoneValue = formattedTime(timeToBeDone);
    const smiley = computedSmiley(newTotalTimestamp, HoursToDO);

    const textToCopy = `Temps de travail effectué : ${newTotalTime} \nReste à faire : ${timeToBeDoneValue} ${smiley}`;
    navigator.clipboard.writeText(textToCopy);

    /** Envois sur webhook discord (fais à la zbeul, a revoir au grand nettoyage) */

    const divMe = document.querySelector('div[class="user-section"]');
    const firstName = divMe.getElementsByTagName("div")[0]?.innerText;
    if (!firstName) return;

    const textToSend = `${firstName} a effectué : ${newTotalTime} \nIl lui reste à faire : ${timeToBeDoneValue} ${smiley}`;

    fetch(
        "https://discord.com/api/webhooks/1248539810352599115/PoX0mg_UDl2I3-x21kwDIdXGi_7fKXsv2R-m7VRX1Ug-rQYTNkp8P7q7Mv7nHIaDgIm8",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: textToSend,
            }),
        }
    );
}

// Formate le temps en heures et minutes
function formattedTime(time) {
    const formattedTime = [
        Math.floor(time / 1000 / 60 / 60),
        Math.floor((time / 1000 / 60) % 60),
    ];

    let minuts = formattedTime[1];
    if (minuts < 10) minuts = `0${minuts}`;

    return `${formattedTime[0]}h ${minuts}`;
}

/**
 * Détermine le smiley à afficher en fonction du temps de travail effectué convertit en pourcentage
 *
 * @see https://www.w3schools.com/charsets/ref_emoji_smileys.asp
 */
function computedSmiley(time, HoursToDO) {
    const formattedHourDone = Math.floor(time / 1000 / 60 / 60);
    const percentageDone = (formattedHourDone * 100) / HoursToDO;

    const smileys = {
        0: ["☕", "😨", "😫", "😭", "😱", "😰", "😩", "😡", "🥶", "🥵"],
        1: ["☕", "🤕", "😪", "🥱", "😠", "😞", "😣", "😤", "🥺", "😖"],
        2: ["☕", "😟", "😬", "😯", "🙁", "😥", "😧", "😔"],
        3: ["😑", "😐", "😓", "😕", "😒"],
        4: ["🙂", "🙃", "🤗", "🤤", "😏", "😋", "😊", "😉"],
        5: ["😀", "😃", "😄", "😅", "😆"],
        6: ["😁", "🤩", "🤪", "🥳", "😎", "😝", "🥂"],
    };

    let key = 0;

    switch (true) {
        case percentageDone <= 10:
            key = 0;
            break;

        case percentageDone > 10 && percentageDone <= 30:
            key = 1;
            break;

        case percentageDone > 30 && percentageDone <= 50:
            key = 2;
            break;

        case percentageDone > 50 && percentageDone <= 70:
            key = 3;
            break;

        case percentageDone > 70 && percentageDone <= 90:
            key = 4;
            break;

        case percentageDone > 90 && percentageDone <= 100:
            key = 5;
            break;

        case percentageDone > 100:
            key = 6;
            break;
    }

    const selectedSmileys = smileys[key];

    return selectedSmileys[Math.floor(Math.random() * selectedSmileys.length)];
}
