document.addEventListener("DOMContentLoaded", (e) => {
    const feedForms = document.getElementsByClassName("feed-container");
    for (const form of feedForms) {
        form.submit();
    }
});