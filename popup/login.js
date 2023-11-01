window.addEventListener("load", () => main());

function main() {
  const form = document.getElementById("_loginForm");
  getCSRFToken()
    .then((csrf_token) => {
      console.log("Déconnecté");
      // Si on est pas log on tombe ici
      const username = form.querySelectorAll("input[id=inputUsername]");
      const password = form.querySelectorAll("input[id=inputPassword]");

      form.onsubmit = () => onLogin(username, password, csrf_token);
    })
    .catch((res) => {
      console.log("Connecté");
      // Si on est déjà log (ou qu'il y a une autre erreur) on tombe ici
      chrome.action.setPopup({ popup: "popup/connected.html" });
    });
}

function getCSRFToken() {
  return fetch(`${DASHBOARD_URL}/login`, { method: "GET" }).then(
    async (res) => {
      if (!!res.url.match(/(?:\/TimeClock\/view)/)) throw new Error();
      const innerHTML = await res.text();
      const html = document.createElement("html");
      html.innerHTML = innerHTML;

      return html
        .querySelectorAll("input[name=_csrf_token]")[0]
        .getAttribute("value");
    }
  );
}

function onLogin(username, password, _csrf_token) {
  console.log("submit", res);
  return fetch(`${DASHBOARD_URL}/login`, {
    method: "POST",
    body: {
      username,
      password,
      _csrf_token,
    },
  });
}
