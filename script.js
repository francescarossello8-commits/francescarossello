const cookiePreferenceKey = "fr_visual_design_cookie_preferences";
const socialProfiles = {
    linkedin: "https://www.linkedin.com/in/francesca-rossello-5655a63ba",
    facebook: "https://www.facebook.com/profile.php?id=61572148971467"
};

document.querySelectorAll("a").forEach((link) => {
    const label = link.textContent.trim().toLowerCase();

    if (label === "linkedin") {
        link.href = socialProfiles.linkedin;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    }

    if (label === "facebook") {
        link.href = socialProfiles.facebook;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    }
});

const optionalCookiePrefixes = {
    analytics: ["_ga", "_gid", "_gat"],
    marketing: ["_fbp", "_fbc", "_gcl_au"]
};

const normalizeCookiePreferences = (preferences = {}) => ({
    necessary: true,
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    savedAt: preferences.savedAt || new Date().toISOString()
});

const readPreferenceStorage = () => {
    try {
        if (window.localStorage) {
            return window.localStorage.getItem(cookiePreferenceKey);
        }
    } catch (error) {
        // Some browsers can block localStorage; fall back to a necessary preference cookie.
    }

    const cookie = document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith(`${cookiePreferenceKey}=`));

    return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
};

const writePreferenceStorage = (preferences) => {
    const serializedPreferences = JSON.stringify(preferences);

    try {
        if (window.localStorage) {
            window.localStorage.setItem(cookiePreferenceKey, serializedPreferences);
            return;
        }
    } catch (error) {
        // Keep the preferences available even when localStorage is blocked.
    }

    document.cookie = `${cookiePreferenceKey}=${encodeURIComponent(serializedPreferences)}; max-age=15552000; path=/; SameSite=Lax`;
};

const readCookiePreferences = () => {
    try {
        const savedPreferences = readPreferenceStorage();

        return savedPreferences ? normalizeCookiePreferences(JSON.parse(savedPreferences)) : null;
    } catch (error) {
        return null;
    }
};

const removeCookie = (name) => {
    const domains = [window.location.hostname, `.${window.location.hostname}`].filter(Boolean);

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    domains.forEach((domain) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}; SameSite=Lax`;
    });
};

const clearDisabledOptionalCookies = (preferences) => {
    const cookieNames = document.cookie
        .split(";")
        .map((cookie) => cookie.trim().split("=")[0])
        .filter(Boolean);

    Object.entries(optionalCookiePrefixes).forEach(([category, prefixes]) => {
        if (preferences[category]) {
            return;
        }

        cookieNames
            .filter((name) => prefixes.some((prefix) => name === prefix || name.startsWith(`${prefix}_`)))
            .forEach(removeCookie);
    });
};

const applyCookiePreferences = (preferences) => {
    const normalizedPreferences = normalizeCookiePreferences(preferences);

    document.documentElement.dataset.cookieAnalytics = normalizedPreferences.analytics ? "enabled" : "disabled";
    document.documentElement.dataset.cookieMarketing = normalizedPreferences.marketing ? "enabled" : "disabled";
    clearDisabledOptionalCookies(normalizedPreferences);

    window.frVisualDesignCanUseCookies = (category) => {
        if (category === "necessary") {
            return true;
        }

        return Boolean(normalizedPreferences[category]);
    };
};

const createCookieConsent = () => {
    if (document.querySelector("[data-cookie-panel]")) {
        return;
    }

    const savedPreferences = readCookiePreferences();
    const panel = document.createElement("section");
    const floatingButton = document.createElement("button");
    panel.className = "cookie-consent";
    panel.dataset.cookiePanel = "";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "cookie-consent-title");
    panel.hidden = Boolean(savedPreferences);
    panel.innerHTML = `
        <div class="cookie-consent__content">
            <p class="eyebrow">Privacy e cookie</p>
            <h2 id="cookie-consent-title">Scegli quali cookie usare</h2>
            <p>Usiamo cookie tecnici necessari per far funzionare il sito. Puoi scegliere liberamente se autorizzare anche analytics e marketing: restano disattivati finche non dai il consenso.</p>
            <div class="cookie-options" aria-label="Categorie cookie">
                <label class="cookie-option is-required">
                    <input type="checkbox" checked disabled>
                    <span><strong>Necessari</strong>Servono al funzionamento del sito e delle preferenze privacy. Non possono essere disattivati.</span>
                </label>
                <label class="cookie-option">
                    <input type="checkbox" data-cookie-toggle="analytics">
                    <span><strong>Analytics</strong>Aiutano a capire come viene usato il sito, solo se verranno collegati strumenti di analisi.</span>
                </label>
                <label class="cookie-option">
                    <input type="checkbox" data-cookie-toggle="marketing">
                    <span><strong>Marketing</strong>Servono per contenuti promozionali o tracciamenti pubblicitari, solo se verranno aggiunti in futuro.</span>
                </label>
            </div>
            <div class="cookie-actions">
                <button type="button" class="secondary" data-cookie-reject>Solo necessari</button>
                <button type="button" class="secondary" data-cookie-save>Salva preferenze</button>
                <button type="button" class="primary" data-cookie-accept>Accetta tutti</button>
            </div>
            <a href="privacy-policy.html#cookie-policy" class="cookie-policy-link">Leggi la Cookie Policy</a>
        </div>
    `;

    document.body.appendChild(panel);
    floatingButton.type = "button";
    floatingButton.className = "cookie-floating-button";
    floatingButton.dataset.openCookiePreferences = "";
    floatingButton.setAttribute("aria-label", "Apri preferenze cookie");
    floatingButton.textContent = "Cookie";
    document.body.appendChild(floatingButton);

    const analyticsToggle = panel.querySelector('[data-cookie-toggle="analytics"]');
    const marketingToggle = panel.querySelector('[data-cookie-toggle="marketing"]');

    const setToggleState = (preferences = readCookiePreferences()) => {
        const normalizedPreferences = normalizeCookiePreferences(preferences || {});

        analyticsToggle.checked = normalizedPreferences.analytics;
        marketingToggle.checked = normalizedPreferences.marketing;
    };

    const savePreferences = (preferences) => {
        const normalizedPreferences = normalizeCookiePreferences({
            ...preferences,
            savedAt: new Date().toISOString()
        });

        writePreferenceStorage(normalizedPreferences);
        applyCookiePreferences(normalizedPreferences);
        panel.hidden = true;
    };

    panel.querySelector("[data-cookie-reject]").addEventListener("click", () => {
        savePreferences({ analytics: false, marketing: false });
    });

    panel.querySelector("[data-cookie-save]").addEventListener("click", () => {
        savePreferences({
            analytics: analyticsToggle.checked,
            marketing: marketingToggle.checked
        });
    });

    panel.querySelector("[data-cookie-accept]").addEventListener("click", () => {
        savePreferences({ analytics: true, marketing: true });
    });

    document.querySelectorAll("[data-open-cookie-preferences]").forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            setToggleState();
            panel.hidden = false;
            panel.querySelector("[data-cookie-save]").focus();
        });
    });

    floatingButton.addEventListener("click", () => {
        setToggleState();
        panel.hidden = false;
        panel.querySelector("[data-cookie-save]").focus();
    });

    if (savedPreferences) {
        applyCookiePreferences(savedPreferences);
        setToggleState(savedPreferences);
    } else {
        applyCookiePreferences({ analytics: false, marketing: false });
    }
};

createCookieConsent();

const isBlogPostPage = (page) => page.startsWith("post-") || page.startsWith("blog-");

const resolveBackFallback = () => {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    if (currentPage.startsWith("portfolio-")) {
        return "portfolio.html";
    }

    if (currentPage.startsWith("servizio-")) {
        return "servizi.html";
    }

    if (isBlogPostPage(currentPage)) {
        return "blog.html";
    }

    return "index.html";
};

const createSiteBackButton = () => {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    if (currentPage === "index.html" || document.querySelector("[data-site-back]")) {
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "site-back-button";
    button.dataset.siteBack = "";
    button.setAttribute("aria-label", "Torna alla pagina precedente");
    button.innerHTML = '<span aria-hidden="true">&larr;</span><span>Indietro</span>';

    button.addEventListener("click", () => {
        const fallback = resolveBackFallback();

        try {
            const referrer = document.referrer ? new URL(document.referrer) : null;
            const isInternalReferrer = referrer && referrer.origin === window.location.origin;
            const isDifferentPage = isInternalReferrer && referrer.pathname !== window.location.pathname;

            if (isDifferentPage && window.history.length > 1) {
                window.history.back();
                return;
            }
        } catch (error) {
            // If referrer parsing fails, use the safe fallback route.
        }

        window.location.href = fallback;
    });

    document.body.appendChild(button);
};

const navigationFlow = [
    "index.html",
    "portfolio.html",
    "portfolio-valorizzazione-brand.html",
    "portfolio-sport-palestre.html",
    "portfolio-eventi.html",
    "portfolio-campagne-sociali.html",
    "portfolio-sicurezza-ambiente-aziende.html",
    "portfolio-valorizzazione-territorio.html",
    "portfolio-ambienti-arredo.html",
    "portfolio-idee-regalo.html",
    "servizi.html",
    "gestionali.html",
    "metodo.html",
    "blog.html",
    "blog-la-fiducia-che-torna-a-casa.html",
    "post-eventi-branding.html",
    "post-idea-visiva.html",
    "post-strumenti-social.html",
    "contatti.html",
    "privacy-policy.html"
];

const projectPages = [
    "portfolio-valorizzazione-brand.html",
    "portfolio-sport-palestre.html",
    "portfolio-eventi.html",
    "portfolio-campagne-sociali.html",
    "portfolio-sicurezza-ambiente-aziende.html",
    "portfolio-valorizzazione-territorio.html",
    "portfolio-ambienti-arredo.html",
    "portfolio-idee-regalo.html"
];

const specialNextPages = {
    "index.html": "portfolio.html",
    "portfolio.html": projectPages[0],
    "servizi.html": "gestionali.html",
    "gestionali.html": "contatti.html",
    "metodo.html": "contatti.html",
    "privacy-policy.html": "index.html",
    "servizio-autori.html": "portfolio.html",
    "servizio-murales.html": "portfolio.html",
    "servizio-trompe-oeil.html": "portfolio.html"
};

const getCurrentPage = () => window.location.pathname.split("/").pop() || "index.html";

const getPageTitle = () => {
    const heading = document.querySelector("main h1");
    return heading ? heading.textContent.trim() : document.title.replace("– FR Visual Design", "").trim();
};

const resolveNextPage = (currentPage) => {
    if (specialNextPages[currentPage]) {
        return specialNextPages[currentPage];
    }

    if (isBlogPostPage(currentPage)) {
        const blogPosts = ["blog-la-fiducia-che-torna-a-casa.html", "post-eventi-branding.html", "post-idea-visiva.html", "post-strumenti-social.html"];
        const postIndex = blogPosts.indexOf(currentPage);
        return blogPosts[postIndex + 1] || "contatti.html";
    }

    if (currentPage.startsWith("portfolio-")) {
        const projectIndex = projectPages.indexOf(currentPage);
        return projectPages[projectIndex + 1] || "contatti.html";
    }

    const flowIndex = navigationFlow.indexOf(currentPage);
    return navigationFlow[flowIndex + 1] || "index.html";
};

const goBackWithFallback = () => {
    const fallback = resolveBackFallback();

    try {
        const referrer = document.referrer ? new URL(document.referrer) : null;
        const isInternalReferrer = referrer && referrer.origin === window.location.origin;
        const isDifferentPage = isInternalReferrer && referrer.pathname !== window.location.pathname;

        if (isDifferentPage && window.history.length > 1) {
            window.history.back();
            return;
        }
    } catch (error) {
        // If referrer parsing fails, use the safe fallback route.
    }

    window.location.href = fallback;
};

const createNavLink = ({ href, label, className = "" }) => {
    const link = document.createElement("a");
    link.className = `page-nav__button ${className}`.trim();
    link.href = href;
    link.textContent = label;
    return link;
};

const createBackControl = (label = "← Indietro") => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-nav__button";
    button.textContent = label;
    button.setAttribute("aria-label", "Torna alla pagina precedente");
    button.addEventListener("click", goBackWithFallback);
    return button;
};

const createBreadcrumb = (currentPage) => {
    const breadcrumb = document.createElement("nav");
    breadcrumb.className = "page-breadcrumb";
    breadcrumb.setAttribute("aria-label", "Percorso pagina");

    const section = currentPage.startsWith("portfolio-")
        ? "Portfolio"
        : isBlogPostPage(currentPage)
        ? "Blog"
        : currentPage.startsWith("servizio-")
        ? "Servizi"
        : "";

    breadcrumb.innerHTML = section
        ? `<a href="index.html">Home</a><span>/</span><a href="${section === "Blog" ? "blog.html" : section === "Servizi" ? "servizi.html" : "portfolio.html"}">${section}</a><span>/</span><span>${getPageTitle()}</span>`
        : `<a href="index.html">Home</a><span>/</span><span>${getPageTitle()}</span>`;

    return breadcrumb;
};

const createPageNavigation = (position) => {
    const currentPage = getCurrentPage();
    const nav = document.createElement("div");
    nav.className = `page-nav page-nav--${position}`;
    nav.dataset.pageNavigation = position;

    nav.appendChild(createNavLink({ href: "index.html", label: "Torna alla Home", className: "page-nav__button--home" }));
    nav.appendChild(createBackControl());
    nav.appendChild(createNavLink({ href: resolveNextPage(currentPage), label: "Avanti →", className: "page-nav__button--next" }));

    if (currentPage.startsWith("portfolio-")) {
        const projectIndex = projectPages.indexOf(currentPage);
        const previousProject = projectIndex > 0 ? projectPages[projectIndex - 1] : "portfolio.html";
        const nextProject = projectPages[projectIndex + 1] || "contatti.html";
        const projectNav = document.createElement("div");
        projectNav.className = "project-nav";
        projectNav.appendChild(createNavLink({ href: previousProject, label: "← Progetto precedente" }));
        projectNav.appendChild(createNavLink({ href: "portfolio.html", label: "Torna al Portfolio", className: "page-nav__button--portfolio" }));
        projectNav.appendChild(createNavLink({ href: nextProject, label: "Progetto successivo →" }));
        nav.appendChild(projectNav);
    }

    return nav;
};

const createPageNavigationBars = () => {
    const currentPage = getCurrentPage();
    const main = document.querySelector("main");
    const firstSection = main ? main.querySelector("section") : null;
    const firstHeading = firstSection ? firstSection.querySelector("h1") : null;

    if (!main || document.querySelector("[data-page-navigation]")) {
        return;
    }

    if (firstHeading) {
        const breadcrumb = createBreadcrumb(currentPage);
        const topNavigation = createPageNavigation("top");
        firstHeading.insertAdjacentElement("afterend", breadcrumb);
        breadcrumb.insertAdjacentElement("afterend", topNavigation);
    } else if (firstSection) {
        firstSection.prepend(createPageNavigation("top"));
    }

    main.appendChild(createPageNavigation("bottom"));
};

createSiteBackButton();

const requestQuestion = (id, label, type = "text", options = []) => ({ id, label, type, options });
const yesNoOptions = ["Sì", "No", "Da definire"];

const requestServicesR04 = [
    {
        id: "logo-identita-visiva",
        label: "Logo / identità visiva",
        description: "Logo, stile e sistema visivo riconoscibile.",
        questions: [
            requestQuestion("partenza", "Hai già un nome/logo o si parte da zero?"),
            requestQuestion("attivita", "Che attività devi comunicare?", "textarea"),
            requestQuestion("stile", "Hai già colori o stile preferito?"),
            requestQuestion("usi", "Dove userai il logo?", "multi", ["Social", "Biglietti da visita", "Sito", "Insegna", "Packaging", "Altro"]),
            requestQuestion("brand_identity", "Ti serve solo il logo o anche una mini brand identity?", "select", ["Solo logo", "Logo + mini brand identity", "Da valutare"]),
            requestQuestion("riferimenti", "Hai esempi o riferimenti visivi?", "textarea"),
            requestQuestion("urgenza_logo", "Urgenza", "select", ["Normale", "Urgente", "Data precisa"])
        ]
    },
    {
        id: "poster-locandina",
        label: "Poster / locandina",
        description: "Visual per evento, promozione o comunicazione.",
        questions: [
            requestQuestion("scopo", "A cosa serve la locandina?", "select", ["Evento", "Promozione", "Corso", "Attività commerciale", "Progetto sociale", "Altro"]),
            requestQuestion("formato", "Formato richiesto", "select", ["A3", "A4", "Social", "Stampa + social", "Altro"]),
            requestQuestion("contenuti", "Hai già testi e immagini?", "select", yesNoOptions),
            requestQuestion("stampa", "Serve anche preparazione per stampa?", "select", yesNoOptions),
            requestQuestion("varianti", "Quante varianti servono?", "number"),
            requestQuestion("scadenza", "Data entro cui serve il lavoro", "date")
        ]
    },
    {
        id: "grafiche-social",
        label: "Grafiche social",
        description: "Contenuti coordinati per uno o più canali.",
        questions: [
            requestQuestion("piattaforme", "Per quale piattaforma?", "multi", ["Instagram", "Facebook", "LinkedIn", "TikTok", "Altro"]),
            requestQuestion("contenuto", "Che tipo di contenuto serve?", "multi", ["Post singolo", "Carosello", "Stories", "Copertina", "Pacchetto mensile"]),
            requestQuestion("quantita", "Quante grafiche servono?", "number"),
            requestQuestion("materiali", "Hai già testi, foto e logo?", "select", yesNoOptions),
            requestQuestion("copy", "Serve anche copy/testo?", "select", yesNoOptions),
            requestQuestion("stile", "Stile desiderato", "multi", ["Elegante", "Urban", "Istituzionale", "Giovane", "Commerciale", "Sociale"])
        ]
    },
    {
        id: "murales",
        label: "Murales",
        description: "Progetto pittorico per pareti e spazi.",
        questions: [
            requestQuestion("dove", "Dove verrà realizzato il murales?"),
            requestQuestion("ambiente", "Interno o esterno?", "select", ["Interno", "Esterno"]),
            requestQuestion("dimensioni", "Dimensioni indicative della parete"),
            requestQuestion("parete", "Stato della parete", "select", ["Liscia", "Ruvida", "Da preparare", "Già dipinta", "Non so"]),
            requestQuestion("tema", "Tema desiderato?", "textarea"),
            requestQuestion("sopralluogo", "Serve sopralluogo?", "select", yesNoOptions),
            requestQuestion("vincoli", "Ci sono vincoli di sicurezza/accesso?", "textarea"),
            requestQuestion("bozzetto", "Serve bozzetto preliminare?", "select", yesNoOptions),
            requestQuestion("materiali", "Chi fornisce colori e materiali?", "select", ["Cliente", "FR Visual Design", "Da definire"]),
            requestQuestion("data", "Data indicativa di realizzazione?", "date"),
            requestQuestion("comune", "Comune/luogo dell’intervento?")
        ]
    },
    {
        id: "sito-web",
        label: "Sito web",
        description: "Presenza online completa e su misura.",
        questions: [
            requestQuestion("tipo", "Che tipo di sito serve?", "select", ["Sito vetrina", "Portfolio", "Sito per attività locale", "Sito evento", "Altro"]),
            requestQuestion("pagine", "Quante pagine indicativamente?", "select", ["1", "3–5", "6–10", "Più di 10"]),
            requestQuestion("materiali", "Hai già testi, immagini e logo?", "select", yesNoOptions),
            requestQuestion("dominio", "Serve dominio/hosting?", "select", yesNoOptions),
            requestQuestion("funzioni", "Quali funzioni servono?", "multi", ["Form contatti", "Blog", "Portfolio", "Collegamento social"]),
            requestQuestion("autonomia", "Vuoi aggiornare i contenuti in autonomia?", "select", yesNoOptions),
            requestQuestion("lingua", "Lingua", "select", ["Italiano", "Italiano + inglese", "Altro"])
        ]
    },
    {
        id: "landing-page",
        label: "Landing page",
        description: "Pagina mirata a una singola azione.",
        questions: [
            requestQuestion("obiettivo", "Obiettivo della landing", "select", ["Vendere servizio", "Raccogliere contatti", "Promuovere evento", "Presentare progetto", "Altro"]),
            requestQuestion("form", "Serve form contatto?", "select", yesNoOptions),
            requestQuestion("materiali", "Hai già testi e immagini?", "select", yesNoOptions),
            requestQuestion("copy", "Serve copy persuasivo?", "select", yesNoOptions),
            requestQuestion("collegamenti", "Serve collegamento WhatsApp/email?", "select", yesNoOptions),
            requestQuestion("pubblicazione", "Serve pubblicazione online?", "select", yesNoOptions),
            requestQuestion("data", "Data di consegna desiderata?", "date")
        ]
    },
    {
        id: "gestionale-su-misura",
        label: "Gestionale su misura",
        description: "Strumento semplice costruito sul lavoro reale.",
        questions: [
            requestQuestion("attivita", "Per che tipo di attività serve?", "select", ["Canile", "Palestra", "Associazione", "Evento", "Studio creativo", "Professionista", "Attività locale", "Altro"]),
            requestQuestion("problema", "Quale problema deve risolvere?", "textarea"),
            requestQuestion("moduli", "Cosa deve gestire?", "multi", ["Clienti", "Richieste", "Progetti", "Appuntamenti", "Documenti", "Pagamenti", "Scadenze", "Magazzino semplice", "Altro"]),
            requestQuestion("utenti", "Quante persone lo useranno?", "number"),
            requestQuestion("accesso", "Deve funzionare solo su un PC o online?", "select", ["Solo un PC", "Online", "Da valutare"]),
            requestQuestion("funzioni", "Quali funzioni aggiuntive servono?", "multi", ["Login", "Stampa documenti/preventivi", "Esportazione dati", "Invio email"]),
            requestQuestion("dati", "Hai già file Excel o moduli da trasformare?", "select", yesNoOptions),
            requestQuestion("urgenza_budget", "Urgenza e budget indicativo", "textarea")
        ]
    },
    {
        id: "reel-contenuti-video",
        label: "Reel / contenuti video",
        description: "Video brevi, montaggio e contenuti dinamici.",
        questions: [
            requestQuestion("tipo", "Che tipo di contenuto serve?", "select", ["Reel", "Video breve", "Presentazione progetto", "Backstage", "Evento", "Altro"]),
            requestQuestion("fornitore", "Chi fornisce foto/video?"),
            requestQuestion("servizi", "Cosa serve?", "multi", ["Montaggio", "Musica", "Testo/sottotitoli"]),
            requestQuestion("formato", "Formato", "select", ["Verticale", "Quadrato", "Orizzontale"]),
            requestQuestion("quantita", "Numero contenuti richiesti?", "number"),
            requestQuestion("data", "Data di consegna?", "date")
        ]
    },
    {
        id: "evento-pacchetto-visual",
        label: "Evento / pacchetto visual",
        description: "Sistema coordinato per comunicare un evento.",
        questions: [
            requestQuestion("tipo", "Che tipo di evento?"),
            requestQuestion("materiali", "Quali materiali servono?", "multi", ["Grafiche stampa", "Grafiche social", "Locandina", "Programma evento", "Segnaletica", "Copertina social"]),
            requestQuestion("gestione", "Serve gestione contenuti prima/durante/dopo evento?", "select", yesNoOptions),
            requestQuestion("data", "Data evento?", "date"),
            requestQuestion("disponibili", "Materiali già disponibili?", "select", yesNoOptions)
        ]
    },
    {
        id: "altro",
        label: "Altro",
        description: "Una richiesta diversa da quelle elencate.",
        questions: [
            requestQuestion("descrizione", "Descrivi il progetto", "textarea"),
            requestQuestion("materiali", "Hai già materiali?", "select", yesNoOptions),
            requestQuestion("scadenza", "Hai una scadenza?", "date"),
            requestQuestion("budget", "Hai un budget indicativo?"),
            requestQuestion("ricontatto", "Vuoi essere ricontattato per definire meglio?", "select", ["Sì", "No"])
        ]
    }
];

const getRequestServiceR04 = (value) => {
    const normalized = String(value || "").toLocaleLowerCase("it-IT");
    const aliases = {
        "identità visiva": "logo-identita-visiva",
        "identita visiva": "logo-identita-visiva",
        "evento o campagna": "evento-pacchetto-visual",
        "sito vetrina": "sito-web",
        "murales o trompe l'oeil": "murales",
        "murales o trompe l’oeil": "murales"
    };
    const serviceId = aliases[normalized] || normalized;
    return requestServicesR04.find((service) => service.id === serviceId || service.label.toLocaleLowerCase("it-IT") === normalized);
};

const createRequestGuideAgent = () => {
    if (document.querySelector("[data-creative-agent]")) {
        return;
    }

    const widget = document.createElement("section");
    widget.className = "creative-agent";
    widget.dataset.creativeAgent = "";
    widget.innerHTML = `
        <button type="button" class="creative-agent__toggle" data-agent-toggle aria-expanded="false" aria-controls="creative-agent-panel">
            <span class="creative-agent__eye" aria-hidden="true"><span class="creative-agent__iris"></span></span>
            <span class="creative-agent__toggle-copy"><strong>Guida al progetto</strong><span>Trova il percorso giusto per la tua richiesta</span></span>
        </button>
        <div class="creative-agent__panel" id="creative-agent-panel" data-agent-panel hidden>
            <div class="creative-agent__header">
                <div><p class="eyebrow">Richiesta guidata</p><h2>Da quale progetto partiamo?</h2></div>
                <button type="button" class="creative-agent__close" data-agent-close aria-label="Chiudi guida">&times;</button>
            </div>
            <div class="creative-agent__body" data-agent-body></div>
        </div>
    `;
    document.body.appendChild(widget);

    const toggle = widget.querySelector("[data-agent-toggle]");
    const panel = widget.querySelector("[data-agent-panel]");
    const body = widget.querySelector("[data-agent-body]");
    const close = widget.querySelector("[data-agent-close]");

    const renderServices = () => {
        body.innerHTML = `
            <div class="creative-agent__message"><span>10 percorsi</span><p>Scegli il servizio più vicino alla tua idea. Non verrà generato alcun preventivo automatico.</p></div>
            <div class="creative-agent__options" data-agent-services></div>
            <p class="creative-agent__privacy">Percorso autonomo, senza chiamate API o AI esterne.</p>
        `;
        const container = body.querySelector("[data-agent-services]");
        requestServicesR04.forEach((service) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = service.label;
            button.addEventListener("click", () => renderService(service));
            container.appendChild(button);
        });
    };

    const renderService = (service) => {
        const questionPreview = service.questions.slice(0, 4).map((question) => `<li>${question.label}</li>`).join("");
        body.innerHTML = `
            <div class="creative-agent__message"><span>${service.label}</span><p>${service.description}</p></div>
            <div class="creative-agent__recap"><strong>Nel form ti chiederò:</strong><ul>${questionPreview}</ul><p>e poche informazioni comuni su budget, tempi e contatto.</p></div>
            <div class="creative-agent__actions">
                <a class="primary" href="contatti.html?tipo=${encodeURIComponent(service.label)}#preventivo">Apri la richiesta guidata</a>
                <button type="button" class="secondary" data-agent-back>Vedi gli altri servizi</button>
            </div>
            <p class="creative-agent__privacy">La proposta economica sarà preparata e verificata da Francesca dopo la richiesta.</p>
        `;
        body.querySelector("[data-agent-back]").addEventListener("click", renderServices);
    };

    toggle.addEventListener("click", () => {
        panel.hidden = !panel.hidden;
        toggle.setAttribute("aria-expanded", String(!panel.hidden));
        if (!panel.hidden && !body.children.length) {
            renderServices();
        }
    });
    close.addEventListener("click", () => {
        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
    });
};

const escapeRequestText = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const initRequestWizardR04 = (form) => {
    const sections = Array.from(form.querySelectorAll("[data-wizard-step]"));
    const progress = Array.from(form.querySelectorAll("[data-wizard-progress]"));
    const servicesContainer = form.querySelector("[data-wizard-services]");
    const questionsContainer = form.querySelector("[data-wizard-questions]");
    const questionTitle = form.querySelector("[data-wizard-question-title]");
    const review = form.querySelector("[data-wizard-review]");
    const next = form.querySelector("[data-wizard-next]");
    const back = form.querySelector("[data-wizard-back]");
    const stepCopy = form.querySelector("[data-wizard-step-copy]");
    const serviceInput = form.querySelector("[data-wizard-service]");
    const serviceCopy = form.querySelector("[data-wizard-service-copy]");
    const structuredInput = form.querySelector("[data-wizard-structured]");
    const summaryInput = form.querySelector("[data-wizard-summary]");
    const messageInput = form.querySelector("[data-wizard-message]");
    const serviceError = form.querySelector("[data-wizard-service-error]");
    let currentStep = 0;
    let selectedService = null;

    const activeFields = () => Array.from(sections[currentStep].querySelectorAll("input, select, textarea"));
    const validateStep = () => {
        if (currentStep === 1 && !selectedService) {
            serviceError.textContent = "Scegli un servizio per continuare.";
            return false;
        }
        const invalid = activeFields().find((field) => !field.checkValidity());
        if (invalid) {
            invalid.reportValidity();
            return false;
        }
        return true;
    };

    const renderQuestions = () => {
        if (!selectedService) {
            questionsContainer.innerHTML = "";
            return;
        }
        questionTitle.textContent = selectedService.label;
        questionsContainer.innerHTML = selectedService.questions.map((question) => {
            const name = `risposta_${selectedService.id}_${question.id}`;
            if (question.type === "textarea") {
                return `<label class="request-wizard__wide"><span>${question.label}</span><textarea name="${name}" rows="3"></textarea></label>`;
            }
            if (question.type === "select") {
                return `<label><span>${question.label}</span><select name="${name}"><option value="">Seleziona...</option>${question.options.map((option) => `<option>${option}</option>`).join("")}</select></label>`;
            }
            if (question.type === "multi") {
                return `<fieldset class="request-wizard__wide request-wizard__choices"><legend>${question.label}</legend>${question.options.map((option) => `<label><input type="checkbox" name="${name}" value="${option}"><span>${option}</span></label>`).join("")}</fieldset>`;
            }
            return `<label><span>${question.label}</span><input type="${question.type}" name="${name}"></label>`;
        }).join("");
    };

    const selectService = (service) => {
        selectedService = service;
        serviceInput.value = service.id;
        serviceCopy.value = service.label;
        serviceError.textContent = "";
        servicesContainer.querySelectorAll("button").forEach((button) => {
            const selected = button.dataset.serviceId === service.id;
            button.classList.toggle("is-selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
        renderQuestions();
    };

    requestServicesR04.forEach((service, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.serviceId = service.id;
        button.setAttribute("aria-pressed", "false");
        button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${service.label}</strong><small>${service.description}</small>`;
        button.addEventListener("click", () => selectService(service));
        servicesContainer.appendChild(button);
    });

    const getValue = (name) => {
        const values = new FormData(form).getAll(name).map((value) => String(value).trim()).filter(Boolean);
        return values.length > 1 ? values : values[0] || "";
    };

    const buildPayload = () => {
        const specific = {};
        selectedService?.questions.forEach((question) => {
            specific[question.id] = getValue(`risposta_${selectedService.id}_${question.id}`);
        });
        return {
            cliente: {
                nome: getValue("nome"),
                referente: getValue("referente"),
                email: getValue("email"),
                telefono: getValue("telefono"),
                tipoCliente: getValue("tipo_cliente"),
                citta: getValue("citta"),
                noteIniziali: getValue("note_iniziali")
            },
            servizioId: selectedService?.id || "",
            servizio: selectedService?.label || "",
            risposteSpecifiche: specific,
            budget: getValue("budget"),
            urgenza: getValue("urgenza"),
            dataPrecisa: getValue("deadline"),
            contattoPreferito: getValue("contatto_preferito"),
            materialiDisponibili: getValue("materiali_disponibili"),
            note: getValue("note_finali")
        };
    };

    const formatValue = (value) => Array.isArray(value) ? value.join(", ") : value || "Non indicato";
    const buildSummaryText = (payload) => {
        const lines = [
            "RICHIESTA GUIDATA FR VISUAL DESIGN",
            "",
            `Cliente: ${payload.cliente.nome}`,
            `Referente: ${formatValue(payload.cliente.referente)}`,
            `Email: ${payload.cliente.email}`,
            `Telefono: ${formatValue(payload.cliente.telefono)}`,
            `Tipo cliente: ${payload.cliente.tipoCliente}`,
            `Città: ${formatValue(payload.cliente.citta)}`,
            `Servizio: ${payload.servizio}`,
            "",
            "RISPOSTE SPECIFICHE"
        ];
        selectedService?.questions.forEach((question) => lines.push(`${question.label}: ${formatValue(payload.risposteSpecifiche[question.id])}`));
        lines.push("", `Budget: ${payload.budget}`, `Urgenza: ${payload.urgenza}`, `Data precisa: ${formatValue(payload.dataPrecisa)}`, `Contatto preferito: ${payload.contattoPreferito}`, `Materiali disponibili: ${formatValue(payload.materialiDisponibili)}`, `Note iniziali: ${formatValue(payload.cliente.noteIniziali)}`, `Altre note: ${formatValue(payload.note)}`);
        return lines.join("\n");
    };

    const renderReview = () => {
        const payload = buildPayload();
        const summary = buildSummaryText(payload);
        structuredInput.value = JSON.stringify(payload);
        summaryInput.value = summary;
        messageInput.value = summary;
        const answers = selectedService.questions
            .filter((question) => formatValue(payload.risposteSpecifiche[question.id]) !== "Non indicato")
            .map((question) => `<div><span>${escapeRequestText(question.label)}</span><strong>${escapeRequestText(formatValue(payload.risposteSpecifiche[question.id]))}</strong></div>`)
            .join("");
        review.innerHTML = `
            <article><span>Cliente</span><strong>${escapeRequestText(payload.cliente.nome)}</strong><p>${escapeRequestText(payload.cliente.tipoCliente)} · ${escapeRequestText(payload.cliente.email)}</p></article>
            <article><span>Servizio</span><strong>${escapeRequestText(payload.servizio)}</strong><p>${escapeRequestText(payload.budget)} · ${escapeRequestText(payload.urgenza)}</p></article>
            <div class="request-wizard__review-answers">${answers || "<p>Nessuna risposta specifica inserita.</p>"}</div>
            <article><span>Materiali e note</span><p>${escapeRequestText(formatValue(payload.materialiDisponibili))}<br>${escapeRequestText(formatValue(payload.note))}</p></article>
        `;
    };

    const showStep = (index) => {
        currentStep = Math.max(0, Math.min(index, sections.length - 1));
        sections.forEach((section, sectionIndex) => {
            const active = sectionIndex === currentStep;
            section.hidden = !active;
            section.classList.toggle("is-active", active);
        });
        progress.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex <= currentStep));
        stepCopy.textContent = `Step ${currentStep + 1} di ${sections.length}`;
        back.disabled = currentStep === 0;
        next.hidden = currentStep === sections.length - 1;
        if (currentStep === sections.length - 1) {
            renderReview();
        }
    };

    next.addEventListener("click", () => {
        if (validateStep()) {
            showStep(currentStep + 1);
        }
    });
    back.addEventListener("click", () => showStep(currentStep - 1));
    form.addEventListener("submit", () => renderReview());
    form.addEventListener("reset", () => window.setTimeout(() => {
        selectedService = null;
        serviceInput.value = "";
        serviceCopy.value = "";
        servicesContainer.querySelectorAll("button").forEach((button) => {
            button.classList.remove("is-selected");
            button.setAttribute("aria-pressed", "false");
        });
        questionsContainer.innerHTML = "";
        showStep(0);
    }, 0));

    window.selectRequestServiceR04 = (value) => {
        const service = getRequestServiceR04(value);
        if (service) {
            selectService(service);
        }
    };
    showStep(0);
};

createRequestGuideAgent();
document.querySelectorAll(".js-request-wizard").forEach(initRequestWizardR04);

const rightsMessage = "Immagini protette: riproduzione, download, screenshot e uso senza autorizzazione sono vietati.";

const showRightsToast = (message = rightsMessage) => {
    let toast = document.querySelector("[data-rights-toast]");

    if (!toast) {
        toast = document.createElement("div");
        toast.className = "rights-toast";
        toast.dataset.rightsToast = "";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showRightsToast.hideTimer);
    showRightsToast.hideTimer = window.setTimeout(() => {
        toast.classList.remove("is-visible");
    }, 3200);
};

const initializeImageProtection = () => {
    document.querySelectorAll("img").forEach((image) => {
        image.dataset.protectedMedia = "";
        image.setAttribute("draggable", "false");
        image.addEventListener("dragstart", (event) => {
            event.preventDefault();
            showRightsToast();
        });
    });

    document.querySelectorAll("footer").forEach((footer) => {
        if (footer.querySelector(".footer-rights")) {
            return;
        }

        const notice = document.createElement("p");
        notice.className = "footer-rights";
        notice.innerHTML = 'Immagini e contenuti visivi: tutti i diritti riservati. Riproduzione, salvataggio, screenshot e uso senza autorizzazione sono vietati. <a href="privacy-policy.html#diritti-immagini">Dettagli</a>';
        footer.insertBefore(notice, footer.querySelector(".footer-links"));
    });

    document.querySelectorAll(".project-gallery-section").forEach((section) => {
        if (section.querySelector(".asset-rights-note")) {
            return;
        }

        const note = document.createElement("p");
        note.className = "asset-rights-note";
        note.textContent = "Le immagini sono mostrate solo a scopo portfolio: riproduzione, download, screenshot, modifica e utilizzo senza autorizzazione scritta sono vietati.";
        section.insertBefore(note, section.querySelector(".project-gallery"));
    });

    document.querySelectorAll('a[href^="images/portfolio/"], a[href^="images/artistico/"]').forEach((link) => {
        link.dataset.protectedImageLink = "";
        link.addEventListener("click", (event) => {
            event.preventDefault();
            showRightsToast("Apertura diretta dell'immagine disattivata: contenuto protetto da copyright.");
        });
    });
};

initializeImageProtection();

document.addEventListener("contextmenu", (event) => {
    const protectedTarget = event.target.closest("[data-protected-media], [data-protected-image-link], .portfolio-preview, .portfolio-item, .project-image, .work-card, .art-card");

    if (!protectedTarget) {
        return;
    }

    event.preventDefault();
    showRightsToast();
});

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const isPrintScreen = key === "printscreen";
    const isSaveOrPrint = (event.ctrlKey || event.metaKey) && (key === "s" || key === "p");

    if (!isPrintScreen && !isSaveOrPrint) {
        return;
    }

    event.preventDefault();
    showRightsToast("Contenuti visivi protetti: salvataggio, stampa e screenshot non autorizzati sono vietati.");
});

const setPreventivoProjectType = (projectType) => {
    if (!projectType) {
        return;
    }

    if (typeof window.selectRequestServiceR04 === "function") {
        window.selectRequestServiceR04(projectType);
    }

    document.querySelectorAll('select[name="project_type"]').forEach((select) => {
        const hasOption = Array.from(select.options).some((option) => option.value === projectType);

        if (hasOption) {
            select.value = projectType;
        }
    });
};

const setPreventivoField = (selector, value) => {
    if (!value) {
        return;
    }

    document.querySelectorAll(selector).forEach((field) => {
        if (!field.value.trim()) {
            field.value = value;
        }
    });
};

document.querySelectorAll("[data-diagnostic]").forEach((button) => {
    button.addEventListener("click", () => {
        const title = button.dataset.title || "";
        const text = button.dataset.text || "";
        const projectType = button.dataset.projectType || "";
        const resultTitle = document.querySelector("[data-diagnostic-title]");
        const resultText = document.querySelector("[data-diagnostic-text]");
        const resultCta = document.querySelector("[data-diagnostic-cta]");

        document.querySelectorAll("[data-diagnostic]").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");

        if (resultTitle) {
            resultTitle.textContent = title;
        }

        if (resultText) {
            resultText.textContent = text;
        }

        if (resultCta) {
            resultCta.dataset.projectType = projectType;
        }

        setPreventivoProjectType(projectType);
    });
});

document.querySelectorAll("[data-project-type]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
        const projectType = trigger.dataset.projectType;
        setPreventivoProjectType(projectType);
        if (!document.querySelector(".js-request-wizard") && trigger.matches("a")) {
            trigger.href = `contatti.html?tipo=${encodeURIComponent(projectType)}#preventivo`;
        }
    });
});

try {
    const contactParams = new URLSearchParams(window.location.search);

    setPreventivoProjectType(contactParams.get("tipo"));
    setPreventivoField('textarea[name="note_iniziali"]', contactParams.get("brief"));
    setPreventivoField('input[name="deadline"]', contactParams.get("deadline"));
    setPreventivoField('input[name="budget"]', contactParams.get("budget"));
} catch (error) {
    // Ignore malformed URLs and leave the form untouched.
}

const CONTACT_EMAIL = "francescarossello8@gmail.com";

const sendContactForm = async (form) => {
    const formData = new FormData(form);
    // FUTURA INTEGRAZIONE: sostituire la destinazione solo con un endpoint HTTPS pubblico approvato, mantenendo FormSubmit come fallback.
    const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
    });

    if (!response.ok) {
        throw new Error("Invio non riuscito");
    }
};

const showEmailFallback = (status) => {
    status.textContent = "Invio automatico non riuscito. Scrivi direttamente a ";
    const link = document.createElement("a");
    link.href = `mailto:${CONTACT_EMAIL}`;
    link.textContent = CONTACT_EMAIL;
    status.appendChild(link);
};

document.querySelectorAll(".js-contact-form").forEach((form) => {
    const status = form.querySelector(".form-status");
    const button = form.querySelector("button[type='submit']");
    const defaultLabel = button ? button.textContent : "";

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!button || !status) {
            form.submit();
            return;
        }

        button.disabled = true;
        button.textContent = "Invio richiesta in corso...";
        status.textContent = "Invio richiesta in corso...";
        status.className = "form-status is-loading";

        try {
            await sendContactForm(form);
            form.reset();
            status.textContent = "Grazie, la tua richiesta è stata inviata a FR Visual Design.";
            status.className = "form-status is-success";
        } catch (error) {
            showEmailFallback(status);
            status.className = "form-status is-error";
        } finally {
            button.disabled = false;
            button.textContent = defaultLabel;
        }
    });
});

const THEME_STORAGE_KEY = "fr-visual-design-theme";
const INTRO_STORAGE_KEY = "fr-visual-design-intro-seen";
const root = document.documentElement;
const navbar = document.querySelector(".navbar");
const navLinks = navbar ? navbar.querySelector(".nav-links") : null;

const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

const setTheme = (theme) => {
    root.dataset.theme = theme;

    const toggle = document.querySelector("[data-theme-toggle]");

    if (toggle) {
        const isLight = theme === "light";
        toggle.setAttribute("aria-pressed", String(isLight));
        toggle.setAttribute("aria-label", isLight ? "Passa al tema scuro" : "Passa al tema chiaro");
        toggle.querySelector(".theme-toggle__icon").textContent = isLight ? "☾" : "☀";
        toggle.querySelector(".theme-toggle__label").textContent = isLight ? "Dark mode" : "Light mode";
    }
};

setTheme(getPreferredTheme());

if (navbar && navLinks && !navbar.querySelector("[data-menu-toggle]")) {
    const menuToggle = document.createElement("button");
    menuToggle.type = "button";
    menuToggle.className = "menu-toggle";
    menuToggle.dataset.menuToggle = "";
    menuToggle.setAttribute("aria-label", "Apri menu");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';

    const scrim = document.createElement("button");
    scrim.type = "button";
    scrim.className = "sidebar-scrim";
    scrim.dataset.sidebarScrim = "";
    scrim.setAttribute("aria-label", "Chiudi menu");

    const sidebar = navLinks.cloneNode(true);
    sidebar.className = "site-sidebar";
    sidebar.dataset.siteSidebar = "";
    sidebar.setAttribute("aria-label", "Menu laterale");
    sidebar.insertAdjacentHTML("afterbegin", `
        <li class="site-sidebar__header">
            <span class="site-sidebar__title">Menu</span>
            <button type="button" class="site-sidebar__close" data-sidebar-close aria-label="Chiudi menu">&times;</button>
        </li>
    `);

    const setSidebarState = (isOpen) => {
        document.body.classList.toggle("sidebar-is-open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Chiudi menu" : "Apri menu");
    };

    menuToggle.addEventListener("click", () => {
        setSidebarState(!document.body.classList.contains("sidebar-is-open"));
    });

    scrim.addEventListener("click", () => setSidebarState(false));
    sidebar.querySelector("[data-sidebar-close]").addEventListener("click", () => setSidebarState(false));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setSidebarState(false);
        }
    });

    sidebar.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            setSidebarState(false);
        }
    });

    navbar.insertBefore(menuToggle, navLinks);
    document.body.appendChild(scrim);
    document.body.appendChild(sidebar);
}

if (navbar && !navbar.querySelector("[data-theme-toggle]")) {
    const themeToggle = document.createElement("button");
    themeToggle.type = "button";
    themeToggle.className = "theme-toggle";
    themeToggle.dataset.themeToggle = "";
    themeToggle.innerHTML = '<span class="theme-toggle__icon" aria-hidden="true"></span><span class="theme-toggle__label"></span>';

    themeToggle.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        setTheme(nextTheme);
    });

    navbar.appendChild(themeToggle);
    setTheme(root.dataset.theme || getPreferredTheme());
}

const createSiteIntro = () => {
    let intro = document.querySelector("[data-site-intro]");

    if (intro) {
        return intro;
    }

    intro = document.createElement("div");
    intro.className = "site-intro";
    intro.dataset.siteIntro = "";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML = '<img src="images/logo.png" alt="">';
    document.body.appendChild(intro);

    return intro;
};

if (!sessionStorage.getItem(INTRO_STORAGE_KEY)) {
    sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
    const intro = createSiteIntro();
    intro.classList.add("is-active");

    window.setTimeout(() => {
        intro.classList.remove("is-active");
    }, 980);
}

const updateNavbarState = () => {
    if (!navbar) {
        return;
    }

    navbar.classList.toggle("is-scrolled", window.scrollY > 24);
};

updateNavbarState();
window.addEventListener("scroll", updateNavbarState, { passive: true });

const revealSelectors = [
    "section:not(.hero) > h1",
    "section:not(.hero) > h2",
    ".section-intro",
    ".portfolio-explanation",
    ".asset-rights-note",
    ".artist-copy",
    ".art-card",
    ".about-text",
    ".method-card",
    ".diagnostic-option",
    ".diagnostic-result",
    ".package-card",
    ".deliverable-card",
    ".service-item",
    ".transformation-card",
    ".ai-value",
    ".portfolio-item",
    ".review-card",
    ".blog-post",
    ".project-image",
    ".project-copy",
    ".project-copy li",
    ".project-gallery-section",
    ".work-card",
    ".impact-panel",
    ".portfolio-action",
    ".contact-prompt",
    ".contact-form",
    ".direct-contact",
    ".social-links",
    ".post-content",
    ".legal-content h2",
    ".post-content p",
    ".privacy-consent",
    ".footer-rights",
    ".project-actions"
];

const revealTargets = document.querySelectorAll(revealSelectors.join(", "));

revealTargets.forEach((element) => {
    if (!element.closest(".hero")) {
        element.classList.add("fade-up");
    }
});

const animatedElements = document.querySelectorAll(".fade-up");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15
    });

    animatedElements.forEach((element, index) => {
        const parent = element.parentElement;
        const siblings = parent
            ? Array.from(parent.children).filter((child) => child.classList.contains("fade-up"))
            : [];
        const localIndex = siblings.indexOf(element);
        const baseIndex = localIndex >= 0 ? localIndex : index;
        const delay = Math.min(baseIndex, 5) * 70;

        element.style.setProperty("--reveal-delay", `${delay}ms`);
        observer.observe(element);
    });
} else {
    animatedElements.forEach((element) => element.classList.add("is-visible"));
}
