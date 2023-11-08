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
      const titleCheckInTime = title.match(/([0-1]?[0-9]|2[0-3]):([0-5][0-9])/);

      if (titleCheckInTime) {
        const newTotalTimestamp = computedNewTotalTimeStamp(totalTimestamp, titleCheckInTime);
        const newTotalTime = formattedTime(newTotalTimestamp);
        const trueTotalPNode = document.createElement("p");

        trueTotalPNode.innerHTML = `<span style="font-weight:700">Vrai total : </span>` + newTotalTime;
        pNode.appendChild(trueTotalPNode);

        const btn35h = computedButton(35, pNode, newTotalTimestamp, newTotalTime);
        const btn39h = computedButton(39, pNode, newTotalTimestamp, newTotalTime);
      }
    });

    mutationObserver.observe(document.getElementById("WeekPointageRoot"), {
      childList: true,
    });
  }
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

// Créé un bouton pour copier la valeur du temps de travail déjà effectué et le temps restant à faire
function computedButton(HoursToDO, pNode, newTotalTimestamp, newTotalTime) {
  const button = document.createElement("button");
  button.innerHTML = HoursToDO + 'h <i class="fas fa-copy" style="margin-left: 0.5rem"></i>';
  button.classList.add('ckt-button');
  button.classList.add('primary');
  button.style.marginLeft = '0';
  button.addEventListener("click", () => handleCopyClick(HoursToDO, newTotalTimestamp, newTotalTime));

  pNode.appendChild(button);
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
function formattedTime(time)
{
  const formattedTime = [
    Math.floor(time / 1000 / 60 / 60),
    Math.floor((time / 1000 / 60) % 60),
  ];

  let minuts = formattedTime[1];
  if (minuts < 10) minuts = `0${minuts}`;

  return `${formattedTime[0]}h${minuts}`;
}

// Détermine le smiley à afficher en fonction du temps de travail effectué
function computedSmiley(time, HoursToDO)
{
  const formattedHourDone = Math.floor(time / 1000 / 60 / 60);
  const percentHourDone = formattedHourDone * 100 / HoursToDO; 

  let smiley = '';

  switch (true) {
    case percentHourDone < 10:
      smiley = '😴';
      break;

    case percentHourDone > 10 && percentHourDone <= 25:
      smiley = '😱';
      break;

    case percentHourDone > 25 && percentHourDone <= 50:
      smiley = '😭';
      break;
    
    case formattedHourDone > 50 && formattedHourDone <= 75:
      smiley = '😢';
      break;

    case formattedHourDone > 75 && formattedHourDone <= 90:
      smiley = '😮';
      break;

    case formattedHourDone > 90 && formattedHourDone <= 100:
      smiley = '😄';
      break;

    default:
      smiley = '🤩';
      break;
  }

  return smiley;
}
