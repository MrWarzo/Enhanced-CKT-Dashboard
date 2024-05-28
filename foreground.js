const ckoyaURL = "https://super.dashboard.c-koya.tech";

window.addEventListener("load", () => main());

function getCsrfTOken() {
    return fetch(ckoyaURL + "/login", { method: "GET" })
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

    return fetch(ckoyaURL + "/login", {
        method: "POST",
        headers: {
            ContentType: "application/x-www-form-urlencoded",
            Origin: ckoyaURL,
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

function getRecapWeek() {
    return fetch(ckoyaURL + "/webapi/timeClock/recapWeek", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            date: getFirstDayOfTheWeek().toISOString().split("T")[0],
            userId: 14, // TODO : il faut recup le userID (/me je dirais)
        }),
    }).then((response) => response.json());
}

// TODO: utiliser les routes api dev à l'occasion
async function main() {
    const csrfToken = await getCsrfTOken();
    console.log("csrf", csrfToken);
    await login(csrfToken);
    const recapWeek = await getRecapWeek();
    console.log("recapWeek", recapWeek);
    const totalDuration = getTotalDuration(recapWeek);
    console.log("totalDuration", totalDuration);

    // setTimeout(() => {
    if (window.location.href.match(ckoyaURL)) {
        // if (window.location.href.match(/(?:\/recapWeek)/)) {
        // const title = document.getElementsByTagName("title")[0].innerHTML;
        // const pNode = root.getElementsByTagName("p")[0];

        // const total = pNode.innerHTML;
        // TODO: totalDuration -> faire un get puis recup le _csrfToken puis faire le /login puis recup le sessId puis faire /recapWeek
        // const newTotalTimestamp = 0;
        // const totalDuration = total.match(/([0-9][0-9])h ([0-5][0-9])/);
        // const totalTimestamp = (parseInt(totalDuration[1]) * 60 + parseInt(totalDuration[2])) * 60 * 1000;
        // const titleCheckInTime = title.match(/([0-1]?[0-9]|2[0-3]):([0-5][0-9])/);
        // TODO: faire le / puis recup le checkInTime -> permettre de ne plus dépendre du window.location.href
        // TODO2: En fait on a plus du tout besoin du total je crois à verif
        // const titleCheckInTime = document.body.innerText.match(
        //     /Depuis\s*:\s*(([01][0-9]|2[0-3]):[0-5][0-9])/
        // );

        // let newTotalTimestamp = totalTimestamp;

        // if (titleCheckInTime) {
        //   newTotalTimestamp = computedNewTotalTimeStamp(totalTimestamp, titleCheckInTime);
        // }

        // const newTotalTime = formattedTime(newTotalTimestamp);
        const trueTotalPNode = document.createElement("p");
        const pNode = document.getElementsByClassName("mantine-Paper-root")[0];

        trueTotalPNode.innerHTML =
            `<span style="font-weight:700">Total : </span>` + totalDuration[0];
        // TODO: trouver où injecter le trueTotalPNode (du coup la faudra verif qu'on est sur la bonne page)
        // TODO2: Il faut aussi qu'on l'affiche direct dans le popup de l'extension pour ne plus dependre de la page
        pNode.appendChild(trueTotalPNode);

        computedInputAndButton(
            35,
            pNode,
            totalDuration[1],
            totalDuration[0],
            "HoursToDO",
            "Temps de travail à faire par semaine : "
        );
    }
    // }, 1000)
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

    const p = document.createElement("p");
    p.innerHTML = label;

    const input = document.createElement("input");
    input.value = HoursToDO;
    input.type = "number";
    input.style.width = "3rem";
    input.style.marginLeft = "0.5rem";
    input.style.padding = "0.5em";
    input.style.border = "2px solid #3e9d51";
    input.style.borderRadius = "10px";
    input.style.textAlign = "center";
    input.style.color = "#3e9d51";
    input.style.appearance = "textfield";
    chrome.storage.sync.get(storage, function (data) {
        if (data[storage]) input.value = data[storage];
    });
    input.addEventListener("change", (e) => {
        const newHoursToDO = e.target.value;
        chrome.storage.sync.set({ [storage]: newHoursToDO }, function () {});
    });

    const button = document.createElement("button");
    button.innerHTML = '<i class="fas fa-copy"></i>';
    button.classList.add("ckt-button");
    button.classList.add("primary");
    button.style.marginLeft = "0.5rem";
    button.style = `
        padding: 0px 1.125rem;
        appearance: none;
        text-align: left;
        text-decoration: none;
        box-sizing: border-box;
        height: 2.25rem;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
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
        background-color: rgb(61, 170, 81);
    `;
    button.addEventListener("click", () =>
        handleCopyClick(input.value, newTotalTimestamp, newTotalTime)
    );

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
}

// Formate le temps en heures et minutes
function formattedTime(time) {
    const formattedTime = [
        Math.floor(time / 1000 / 60 / 60),
        Math.floor((time / 1000 / 60) % 60),
    ];

    let minuts = formattedTime[1];
    if (minuts < 10) minuts = `0${minuts}`;

    return `${formattedTime[0]}h${minuts}`;
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
