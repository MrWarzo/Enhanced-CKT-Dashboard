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
      const totalTimestamp =
        (parseInt(totalDuration[1]) * 60 + parseInt(totalDuration[2])) *
        60 *
        1000;

      const hour = title.match(/([0-1]?[0-9]|2[0-3]):([0-5][0-9])/);

      if (hour) {
        const date = new Date();
        date.setHours(parseInt(hour[1]));
        date.setMinutes(parseInt(hour[2]));
        const now = new Date();

        const calculated = now.getTime() - date.getTime();

        const newTotalTimestamp = calculated + totalTimestamp;
        const actualTime = formattedTime(newTotalTimestamp);
      
        const trueTotalPNode = document.createElement("p");
        trueTotalPNode.innerHTML = `<span style="font-weight:600">Vrai total : </span>` + actualTime;
        pNode.appendChild(trueTotalPNode);

        const copyButton35 = document.createElement("button");
        copyButton35.innerHTML = '35h <i class="fas fa-copy"></i>';
        copyButton35.addEventListener("click", () => handleCopyClick(35, newTotalTimestamp, actualTime));

        const copyButton39 = document.createElement("button");
        copyButton39.innerHTML = '39h <i class="fas fa-copy"></i>';
        copyButton39.addEventListener("click", () => handleCopyClick(39, newTotalTimestamp, actualTime));

        pNode.appendChild(copyButton35);
        pNode.appendChild(copyButton39);
      }
    });

    mutationObserver.observe(document.getElementById("WeekPointageRoot"), {
      childList: true,
    });
  }
}

function handleCopyClick(maxHour, newTotalTimestamp, actualTime) {
  const timeToBeDone = maxHour * 60 * 60 * 1000 - newTotalTimestamp;
  const timeToBeDoneValue = formattedTime(timeToBeDone);
  const smiley = computedSmiley(newTotalTimestamp, maxHour);

  const textToCopy = `Temps de travail effectué : ${actualTime} \nReste à faire : (${timeToBeDoneValue}) ${smiley}`;
  navigator.clipboard.writeText(textToCopy);
}

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

function computedSmiley(time, maxHour)
{
  const formattedHourDone =  Math.floor(time / 1000 / 60 / 60);
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
