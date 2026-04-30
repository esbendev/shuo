(function () {
    const SITE_URL = "https://esbendev.com/shuo";
    const GA_MEASUREMENT_ID = "G-475SSTM0WC";

    function upsertMeta(name, content) {
        if (!content) return;
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute("name", name);
            document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
    }

    function upsertPropertyMeta(property, content) {
        if (!content) return;
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute("property", property);
            document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
    }

    function getCanonicalPath() {
        const pathname = window.location.pathname || "/";

        if (pathname.includes("/quiz/index.html")) {
            return "/shuo/quiz/index.html";
        }

        return pathname;
    }

    function ensureCanonicalTag() {
        const canonicalPath = getCanonicalPath();
        const canonicalUrl = `${SITE_URL}${canonicalPath.replace(/^\/shuo/, "")}`;

        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement("link");
            canonical.setAttribute("rel", "canonical");
            document.head.appendChild(canonical);
        }
        canonical.setAttribute("href", canonicalUrl);

        return canonicalUrl;
    }

    function shouldNoIndex() {
        const pathname = window.location.pathname || "";
        const searchParams = new URLSearchParams(window.location.search || "");

        return (
            pathname.includes("indexViejo") ||
            pathname.includes("/other/experimentos/") ||
            pathname.endsWith("/other/sentence-builder.html") ||
            (pathname.includes("/quiz/index.html") && searchParams.has("file"))
        );
    }

    function ensureSeoMeta() {
        const title = document.title || "Shuo Shuo Chinese Practice";
        const h1 = document.querySelector("h1");
        const summarySource = h1 ? h1.textContent : title;
        const description = (document.querySelector('meta[name="description"]') || {}).content ||
            `Chinese practice resources and quizzes. ${summarySource}`;

        const canonicalUrl = ensureCanonicalTag();

        upsertMeta("description", description);
        upsertMeta(
            "robots",
            shouldNoIndex()
                ? "noindex,nofollow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
                : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        );

        upsertPropertyMeta("og:type", "website");
        upsertPropertyMeta("og:site_name", "Shuo Shuo Chinese Practice");
        upsertPropertyMeta("og:title", title);
        upsertPropertyMeta("og:description", description);
        upsertPropertyMeta("og:url", canonicalUrl);

        upsertMeta("twitter:card", "summary");
        upsertMeta("twitter:title", title);
        upsertMeta("twitter:description", description);
    }

    function loadGtagIfNeeded(callback) {
        if (typeof window.gtag === "function") {
            callback();
            return;
        }

        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        script.onload = callback;
        document.head.appendChild(script);
    }

    function hasGaConfig() {
        const dl = window.dataLayer || [];
        return dl.some((entry) => Array.isArray(entry) && entry[0] === "config" && entry[1] === GA_MEASUREMENT_ID);
    }

    function configureAnalytics() {
        if (typeof window.gtag !== "function") return;

        window.gtag("js", new Date());

        if (!hasGaConfig()) {
            window.gtag("config", GA_MEASUREMENT_ID, {
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false,
                page_title: document.title,
                page_path: window.location.pathname + window.location.search
            });
        }

        document.addEventListener("click", function (event) {
            const anchor = event.target.closest("a[href]");
            if (!anchor) return;

            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#")) return;

            const isExternal = /^https?:\/\//i.test(href) && !href.includes(window.location.hostname);
            if (!isExternal) return;

            window.gtag("event", "outbound_click", {
                event_category: "engagement",
                event_label: href,
                link_url: href
            });
        });

        window.addEventListener("error", function (event) {
            if (!event || !event.message) return;
            window.gtag("event", "exception", {
                description: event.message,
                fatal: false
            });
        });
    }

    ensureSeoMeta();
    loadGtagIfNeeded(configureAnalytics);
})();
