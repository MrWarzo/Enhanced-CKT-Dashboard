window.addEventListener("load", () => main());

function main() {
  if (window.location.href.match(/(?:\/recapWeek)/)) {
    let mutationObserver = new MutationObserver((mutations) => {
      const title = document.getElementsByTagName("title")[0].innerHTML;
      const pNode = mutations.find(
        (x) => x.addedNodes[0] && x.addedNodes[0].nodeName === "P"
      ).addedNodes[0];

      const total = pNode.innerHTML;
      const totalDuration = total.match(/([0-9][0-9])h ([0-5][0-9])/);
      const totalTimestamp = (parseInt(totalDuration[1]) * 60 + parseInt(totalDuration[2])) * 60 * 1000;
      const titleActualTime = title.match(/([0-1]?[0-9]|2[0-3]):([0-5][0-9])/);

      if (titleActualTime) {
        const newTotalTimestamp = computedNewTotalTimeStamp(totalTimestamp, titleActualTime);
        const actualTime = formattedTime(newTotalTimestamp);
        const trueTotalPNode = document.createElement("p");

        trueTotalPNode.innerHTML = `<span style="font-weight:700">Vrai total : </span>` + actualTime;
        pNode.appendChild(trueTotalPNode);

        const btn35h = computedButtons(35, pNode, newTotalTimestamp, actualTime);
        const btn39h = computedButtons(39, pNode, newTotalTimestamp, actualTime);
      }
    });

    mutationObserver.observe(document.getElementById("WeekPointageRoot"), {
      childList: true,
    });
  }
}

// calcule le temps de travail effectué
function computedNewTotalTimeStamp(totalTimestamp, titleActualTime) {
  const now = new Date();
  const actualTime = new Date();
  actualTime.setHours(parseInt(titleActualTime[1]));
  actualTime.setMinutes(parseInt(titleActualTime[2]));

  // temps entre l'heure actuelle et l'heure de début de pointage
  const calculated = now.getTime() - actualTime.getTime();

  return calculated + totalTimestamp;
}

// Ajoute deux boutons pour copier la valeur du temps de travail déjà effectué et le temps restant à faire
function computedButtons(maxHour, pNode, newTotalTimestamp, actualTime) {
  const button = document.createElement("button");
  button.innerHTML = maxHour + 'h <i class="fas fa-copy" style="margin-left: 0.5rem"></i>';
  button.classList.add('ckt-button');
  button.classList.add('primary');
  button.style.marginLeft = '0';
  button.addEventListener("click", () => handleCopyClick(maxHour, newTotalTimestamp, actualTime));

  pNode.appendChild(button);
}

// Gère l'évènement au clic sur les boutons de copie
function handleCopyClick(maxHour, newTotalTimestamp, actualTime) {
  const timeToBeDone = maxHour * 60 * 60 * 1000 - newTotalTimestamp;
  const timeToBeDoneValue = formattedTime(timeToBeDone);
  const smiley = computedSmiley(newTotalTimestamp, maxHour);

  const textToCopy = `Temps de travail effectué : ${actualTime} \nReste à faire : ${timeToBeDoneValue} ${smiley}`;
  navigator.clipboard.writeText(textToCopy);
}

// Formate le temps en heures et minutes
function formattedTime(time)
{
  const formattedTime = [
    Math.floor(time / 1000 / 60 / 60),
    Math.floor((time / 1000 / 60) % 60),
  ];

  let minuts = formattedTime[1];
  if (minuts < 10) minuts = `0${minuts}`;

  return `${formattedTime[0]} h ${minuts}`;
}

// Détermine le smiley à afficher en fonction du temps de travail effectué
function computedSmiley(time, maxHour)
{
  const formattedHourDone = Math.floor(time / 1000 / 60 / 60);
  let smiley = '';

  switch (true) {
    case formattedHourDone < 5:
      smiley = '😱';
      break;

    case formattedHourDone > 5 && formattedHourDone <= 20:
      smiley = '😭';
      break;
    
    case formattedHourDone > 20 && formattedHourDone <= 30:
      smiley = '😢';
      break;

    case formattedHourDone > 30 && formattedHourDone <= maxHour:
      smiley = '😮';
      break;

    default:
      smiley = '😄';
      break;
  }

  return smiley;
}
