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
        const newHour = [
          Math.floor(newTotalTimestamp / 1000 / 60 / 60),
          Math.floor((newTotalTimestamp / 1000 / 60) % 60),
        ];

        const trueTotalPNode = document.createElement("p");
        trueTotalPNode.innerHTML =
          `<span style="font-weight:600">Vrai total : </span>` +
          newHour[0] +
          "h " +
          newHour[1];
        pNode.appendChild(trueTotalPNode);
      }
    });
    mutationObserver.observe(document.getElementById("WeekPointageRoot"), {
      childList: true,
    });
  }
}
