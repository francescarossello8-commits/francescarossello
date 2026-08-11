(() => {
    const protectedSelector = "[data-protected-media], [data-protected-image-link], .portfolio-preview, .portfolio-item, .project-image, .work-card, .art-card";

    const allowNativeAction = (event) => {
        if (event.type === "contextmenu" && event.target.closest(protectedSelector)) {
            event.stopImmediatePropagation();
        }

        if (event.type === "keydown") {
            const key = event.key.toLowerCase();
            const isPrintScreen = key === "printscreen";
            const isSaveOrPrint = (event.ctrlKey || event.metaKey) && (key === "s" || key === "p");

            if (isPrintScreen || isSaveOrPrint) {
                event.stopImmediatePropagation();
            }
        }
    };

    document.addEventListener("contextmenu", allowNativeAction, true);
    document.addEventListener("keydown", allowNativeAction, true);

    const softenImageProtection = () => {
        document.querySelectorAll("img[draggable='false']").forEach((image) => {
            image.removeAttribute("draggable");
            image.addEventListener("dragstart", (event) => event.stopImmediatePropagation(), true);
        });

        document.querySelectorAll(".footer-rights").forEach((notice) => {
            notice.innerHTML = 'Immagini e contenuti visivi: tutti i diritti riservati. Per riprodurli o usarli in altri contesti serve autorizzazione scritta. <a href="privacy-policy.html#diritti-immagini">Dettagli</a>';
        });

        document.querySelectorAll(".asset-rights-note").forEach((note) => {
            note.textContent = "Le immagini sono mostrate a scopo portfolio: per riproduzione, modifica o utilizzo in altri contesti serve autorizzazione scritta.";
        });
    };

    const syncThemeLabel = () => {
        const toggle = document.querySelector("[data-theme-toggle]");

        if (!toggle) {
            return;
        }

        const isLight = document.documentElement.dataset.theme === "light";
        const label = toggle.querySelector(".theme-toggle__label");

        if (label) {
            label.textContent = isLight ? "Tema scuro" : "Tema chiaro";
        }
    };

    const runPolish = () => {
        softenImageProtection();
        syncThemeLabel();
    };

    document.addEventListener("DOMContentLoaded", runPolish);
    document.addEventListener("click", () => window.setTimeout(runPolish, 0), true);
    window.setTimeout(runPolish, 300);
})();
