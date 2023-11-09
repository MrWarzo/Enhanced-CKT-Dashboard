window.addEventListener("load", () => main());

function main() {
  console.log("connected js");

  getDashboardAppTypes();
  getTimeClockView();
  // getTotalTime();
}

function getDashboardAppTypes() {
  const appTypesLink = document.getElementById("dashboard-apptype-css");
  appTypesLink.setAttribute("href", `${DASHBOARD_URL}/css/appType.css`);
}

function getTimeClockView() {
  return fetch(`${DASHBOARD_URL}/TimeClock/view`, { method: "GET" }).then(
    async (res) => {
      const innerHTML = await res.text();
      const html = document.createElement("html");
      html.innerHTML = innerHTML;

      const headerUserInfos = html.getElementsByClassName(
        "ckt-header-userinfo"
      )[0];
      const username = headerUserInfos.innerHTML
        .trim()
        .match(/(?:Connecté\sen\stant\sque)(\s|\r\n)(\s+)(\b[^\s]+\b)/)[3];

      const usernameSpan = document.getElementById("username");
      usernameSpan.innerText = username;

      const pointageHeader = document.getElementById("pointages-header");
      const pointagesList = document.getElementById("pointages-list");
      const pointages =
        Array.prototype.slice.call(html.getElementsByClassName("appClientPointage")).map((pointage) => {
          return { href: pointage.getAttribute("href"), label: pointage.innerText, classname: pointage.classList[1] };
        });

      const tempReloadA = document.createElement("a");
      tempReloadA.setAttribute("class", "pointage reload");
      tempReloadA.innerText = "Recharger";
      tempReloadA.addEventListener("click", () => { window.location.reload() });
      pointageHeader.appendChild(tempReloadA);

      const currentPointage = html.getElementsByTagName("title")[0];
      if (currentPointage.innerText.match(/(?:depuis)/)) {
        const span = document.createElement("span");
        span.setAttribute("class", "pointage-text");
        span.innerText = currentPointage.innerText.replace(/(\r\n|\n|\r)/gm, "");
        pointageHeader.appendChild(span);

        // OUI c'est dégueulasse
        Array.prototype.slice.call(html.getElementsByClassName("stopPointage")).forEach((pointage) => {
          const stopPointage = { href: pointage.getAttribute("href"), label: pointage.innerText };
          const a = document.createElement("a");
          a.setAttribute("href", DASHBOARD_URL + stopPointage.href);
          a.setAttribute("class", `pointage stop-pointage`);
          a.innerText = stopPointage.label;

          pointageHeader.appendChild(a);
        });
      } else {
        const p = document.createElement("p");
        p.innerText = "Aucun pointage en cours.";
        pointageHeader.appendChild(p);
      }

      pointages.forEach((pointage) => {
        // const li = document.createElement("li");
        const a = document.createElement("a");
        a.setAttribute("href", DASHBOARD_URL + pointage.href);
        a.setAttribute("class", `pointage ${pointage.classname}`);
        a.innerText = pointage.label;

        // li.appendChild(a);
        pointagesList.appendChild(a);
      });

    }
  );
}

/* 
 * ultra galère en fait la page est loadé après avoir chargée le dom du coup faut observe
 * sauf qu'on peut pas quand on fetch, et l'iframe ca merde bref à creuser mais je pense
 * faudra faire une route api
 */
function getTotalTime() {
  // return fetch(`${DASHBOARD_URL}/user/recapWeek`, { method: "GET" }).then(
  //   async (res) => {
  //     console.log("res", res)
  //     const innerHTML = await res.text();
  const iframe = document.createElement("iframe");
  iframe.setAttribute("src", `${DASHBOARD_URL}/user/recapWeek`);
  // iframe.hidden = true;
  document.body.appendChild(iframe);

  const iframeDocument = iframe.contentWindow.document;
  // html.hidden = true;
  // document.body.appendChild(html);
  // iframe.remove()

  // console.log("iframe", html)

  const header = iframeDocument.getElementById("pointages-header");
  console.log("header", header)
  const title = iframeDocument.title;
  console.log("title", title)

  let mutationObserver = new MutationObserver((mutations) => {
    const pNode = mutations.find(
      (x) => x.addedNodes[0] && x.addedNodes[0].nodeName === "P"
    ).addedNodes[0];
    console.log("pNode", pNode)
    header.appendChild(pNode);

    const total = pNode.innerHTML;
    const totalDuration = total.match(/([0-9][0-9])h ([0-5][0-9])/);
    const totalTimestamp = (parseInt(totalDuration[1]) * 60 + parseInt(totalDuration[2])) * 60 * 1000;
    const titleCheckInTime = title.match(/([0-1]?[0-9]|2[0-3]):([0-5][0-9])/);

    if (titleCheckInTime) {
      const newTotalTimestamp = computedNewTotalTimeStamp(totalTimestamp, titleCheckInTime);
      const newTotalTime = formattedTime(newTotalTimestamp);
      const trueTotalPNode = document.createElement("p");

      trueTotalPNode.innerHTML = `<span style="font-weight:700">Vrai total : </span>` + newTotalTime;
      console.log("trueTotalPNode", trueTotalPNode)
      header.appendChild(trueTotalPNode);
    }
    iframe.remove();
  })


  iframe.onload = () => {
    console.log("docy", iframeDocument.body);
    mutationObserver.observe(iframeDocument.getElementById("WeekPointageRoot"), {
      childList: true,
      subtree: true
    });
  }
  // })
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
