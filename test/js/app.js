// import watermelon.js a start the router

if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
) {
    // it's local, use current
    const Watermelon = await import("../../package/index.js");

    const router = new Watermelon.WatermelonRouter({
        log: true,
        preload: true,
        hoverOnly: true,
    });
} else {
    // not local
    const Watermelon = await import(
        "https://melon.docs.oxvs.net/dist/watermelon.js"
    );

    const router = new Watermelon.WatermelonRouter({
        log: true,
        preload: true,
        hoverOnly: true,
    });
}
