//login.js
export function setCookie(name, value, days = 1) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value}; max-age=${maxAge}; path=/`;
}

export function getCookie(name) {
    return document.cookie
        .split("; ")
        .find(row => row.startsWith(name + "="))
        ?.split("=")[1] || null;
}

export function login(username, role = "editor") {
    setCookie("username", username, 1);
    setCookie("role", role, 1);
}

export function logout() {
    setCookie("username", "", -1);
    setCookie("role", "", -1);
}

export function getUser() {
    const username = getCookie("username");
    const role = getCookie("role");
    if (!username) return null;
    return { username, role };
}

export function isAdmin() {
    return getCookie("role") === "admin";
}

export function initAuth(form, onAuthChange) {
    const userInfo = document.getElementById("user-info");
    const loginInput = document.getElementById("login-name");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    function renderAuth() {
        const user = getUser();

        if (user) {
            userInfo.textContent = `Inloggad som ${user.username} (${user.role})`;
            loginInput.hidden = true;
            loginBtn.hidden = true;
            logoutBtn.hidden = false;
            form.style.display = isAdmin() ? "block" : "none";
        } else {
            userInfo.textContent = "";
            loginInput.hidden = false;
            loginBtn.hidden = false;
            logoutBtn.hidden = true;
            form.style.display = "none";
        }

        if (onAuthChange) onAuthChange();
    }

    loginBtn.addEventListener("click", () => {
        const name = loginInput.value.trim();
        if (!name) return;
        const role = name === "admin" ? "admin" : "editor";
        login(name, role);
        renderAuth();
    });

    logoutBtn.addEventListener("click", () => {
        logout();
        renderAuth();
    });

    renderAuth();
}

