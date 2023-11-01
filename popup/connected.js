window.addEventListener("load", () => main());

function main() {
  console.log("connected js");

  getTimeClockView();
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
    }
  );
}
