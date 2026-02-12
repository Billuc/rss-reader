function moveFeedUp(event) {
    const button = event.currentTarget;
    const div = button.parentElement;
    const container = div.parentElement;
    if (div.previousElementSibling) {
        container.insertBefore(div, div.previousElementSibling);
    }
}

function moveFeedDown(event) {
    const button = event.currentTarget;
    const div = button.parentElement;
    const container = div.parentElement;
    if (div.nextElementSibling) {
        container.insertBefore(div.nextElementSibling, div);
    }
}

function removeFeed(event) {
    const button = event.currentTarget;
    const div = button.parentElement;
    const container = div.parentElement;
    container.removeChild(div);
}

function addFeedInput(inputsId) {
    const form = document.getElementById(inputsId);
    if (form) {
        const input = document.createElement("input");
        input.name = "feed-url[]";
        form.appendChild(input);
    }
}

function toggleTheme() {
    const userPrefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    const currentTheme = document.documentElement.getAttribute("data-theme");
    let newTheme;

    if (!currentTheme) {
        newTheme = userPrefersDark ? "light" : "dark";
    } else {
        newTheme = currentTheme === "dark" ? "light" : "dark";
    }

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        document.documentElement.setAttribute("data-theme", savedTheme);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    let h2Time = document.querySelector("h2[data-time]");
    h2Time.innerText = new Date(
        parseInt(h2Time.getAttribute("data-time")) * 1000,
    ).toLocaleString(navigator.language, {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "numeric",
        minute: "numeric",
    });
});
