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
        
        computedInputAndButton(35, pNode, newTotalTimestamp, newTotalTime, "HoursToDO", "Temps de travail à faire par semaine : ");
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

function computedInputAndButton(HoursToDO, pNode, newTotalTimestamp, newTotalTime, storage, label) {
  const div = document.createElement("div");
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.marginTop = '1rem';

  const p = document.createElement("p");
  p.innerHTML = label;

  const input = document.createElement("input");
  input.value = HoursToDO;
  input.type = "number";
  input.style.width = '3rem';
  input.style.marginLeft = '0.5rem';
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
  button.classList.add('ckt-button');
  button.classList.add('primary');
  button.style.marginLeft = '0.5rem';
  button.addEventListener("click", () => handleCopyClick(input.value, newTotalTimestamp, newTotalTime));

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

/**
 * Détermine le smiley à afficher en fonction du temps de travail effectué convertit en pourcentage
 * 
 * @see https://www.w3schools.com/charsets/ref_emoji_smileys.asp
 */
function computedSmiley(time, HoursToDO)
{
  const formattedHourDone = Math.floor(time / 1000 / 60 / 60);
  const percentageDone = formattedHourDone * 100 / HoursToDO;

  const smileys = {
    0: ['☕','😨','😫','😭','😱','😰','😩','😡','🥶','🥵'],
    1: ['☕','🤕','😪','🥱','😠','😞','😣','😤','🥺','😖'],
    2: ['☕','😟','😬','😯','🙁','😥','😧','😔'],
    3: ['😑','😐','😓','😕','😒'],
    4: ['🙂','🙃','🤗','🤤','😏','😋','😊','😉'],
    5: ['😀','😃','😄','😅','😆'],
    6: ['😁','🤩','🤪','🥳','😎','😝','🥂']
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

    case percentageDone > 100 :
      key = 6;
      break;
  }

  const selectedSmileys = smileys[key];

  return selectedSmileys[Math.floor(Math.random() * selectedSmileys.length)];
}