/**
 * @file Handle the base of the WatermelonRouter
 * @name index.ts
 * @license MIT
 *
 * Source code available at: https://github.com/0aoq/watermelonjs.git
 */

/**
 * @class WatermelonRouter
 * @description Handle the loading of different page states (router)
 */
export class WatermelonRouter {
    log: boolean;
    preload: boolean;
    hoverOnly: boolean;

    fetched: Array<HTMLAnchorElement>;
    hasListener: Array<HTMLAnchorElement>;
    pages: { [key: string]: string };

    /**
     * @function WatermelonRouter.constructor
     *
     * @param {{[key: string]: any}} options
     * @param {boolean} options.log Define if debug logs should be shown
     * @param {boolean} options.preload Should links be preloaded?
     * @param {boolean} options.hoverOnly Should links only be preloaded on hover?
     */
    constructor(options: {
        log: boolean;
        preload: boolean;
        hoverOnly: boolean;
    }) {
        this.log = options.log; // define if debug logs should be shown
        this.preload = options.preload; // should links be preloaded?
        this.hoverOnly = options.hoverOnly; // should links only be preloaded on hover?

        this.fetched = [] as any; // will contain all anchor elements that we have already fetched/plan to fetch
        this.hasListener = [] as any; // each element under this.fetched will also exist here if it already has a listener
        this.pages = {}; // each page that is fetched will be stored in here

        ////////////////////////////////////////////////////////////

        // event listener to preload links
        document.addEventListener("scroll", this.start);
        this.start(); // run on first load
    }

    /**
     * @function WatermelonRouter.changeState
     * @description Change the browser's history state
     *
     * @param {string} url
     * @returns {void}
     */
    static changeState(url: string) {
        if (!window.history.state || window.history.state.url !== url) {
            window.history.pushState({ url }, "", url);
        }
    }

    /**
     * @function WatermelonRouter.cloneScript
     * @description Clone a script element
     *
     * @param {HTMLScriptElement} script
     */
    static cloneScript(script: HTMLScriptElement) {
        const newScript = document.createElement("script");

        // add attributes
        for (let attribute of Array.from(script.attributes)) {
            newScript.setAttribute(attribute.name, attribute.value);
        }

        // add text
        newScript.appendChild(document.createTextNode(script.innerHTML));

        // append script
        script.parentElement?.replaceChild(newScript, script);
    }

    /**
     * @function WatermelonRouter.createGoto
     * @description Create a goto function for a specific link
     */
    public async createGoto(url: string): Promise<(e: Event) => void> {
        // attempt fetch
        return new Promise((resolve, reject) => {
            const linkMain = async (res) => {
                this.pages[url] = await res.text();

                window.dispatchEvent(
                    new CustomEvent("watermelon.router:initialLoad")
                );

                // handle click function
                resolve((e) => {
                    if (e.preventDefault) e.preventDefault();

                    if (!this.pages[url]) {
                        if (this.log)
                            console.log(
                                `\u{1F6DF} %c| FAIL! This link doesn't exist in the pages cache! ("${url}")`,
                                "color: rgb(255, 87, 87);"
                            );

                        return;
                    }

                    // dispatch event and change innerHTML
                    (async () => {
                        // load page
                        document.documentElement.innerHTML = this.pages[url];

                        // run scripts

                        // @ts-ignore
                        for (let script of document.querySelectorAll(
                            // don't rerun scripts that want their state to save
                            'script:not([state="save"])'
                        )) {
                            WatermelonRouter.cloneScript(script);
                        }

                        // dispatch
                        window.dispatchEvent(
                            new CustomEvent("watermelon.router:change", {
                                detail: { url: new URL(url) },
                            })
                        );
                    })();

                    // change the page state
                    WatermelonRouter.changeState(url);

                    // fancy logging/preload links again
                    if (this.log)
                        console.info(
                            `\u{2615} | SUCCESS! We managed to load "${url}" into the page!`
                        );

                    this.start(); // reload links

                    setTimeout(() => {
                        this.start(); // if something got added by the JavaScript this might catch it
                    }, 500);
                });
            };

            // only fetch if this.pages does NOT contain the link already!
            if (!this.pages[url]) {
                fetch(url).then(async (res) => {
                    if (res.ok) {
                        console.log(
                            `\u{1F349} %c| HTTP! A link has been fetched! ("${url}")`,
                            "color: rgb(87, 255, 87);"
                        );

                        linkMain(res); // call here link main
                    } else {
                        if (this.log)
                            console.log(
                                `\u{1F6DF} %c| FAIL! We couldn't load the link "${url}" into the cache!`,
                                "color: rgb(255, 87, 87);"
                            );

                        window.dispatchEvent(
                            new CustomEvent("watermelon.router:failLoad")
                        );

                        resolve((e) => {
                            return;
                        });
                    }
                });
            } else {
                // just give it the stored version
                linkMain({
                    text: () => {
                        return new Promise((_resolve, _reject) => {
                            console.log(
                                `\u{1F349} %c| CACHE! A link has been fetched from the cache! ("${url}")`,
                                "color: rgb(87, 255, 87);"
                            );

                            _resolve(this.pages[url]);
                        });
                    },
                });
            }
        });
    }

    /**
     * @function WatermelonRouter.start
     * @description Load all page links to the cache and handle transition
     *
     * @returns {void}
     */
    private start() {
        // IntersectionObserver is useless when we could just fetch ALL links (if they haven't been fetched before obviously)

        const handleAnchor = async (anchor: HTMLAnchorElement) => {
            if (this.hasListener.includes(anchor)) return;
            this.hasListener.push(anchor);

            if (this.log)
                console.info(
                    `\u{1F349} %c| LINK! ${anchor.href}`,
                    "color: rgb(87, 255, 87)"
                );

            if (new URL(anchor.href).hostname !== window.location.hostname) {
                // automatically open other sites in a blank tab
                anchor.setAttribute("target", "_blank");
                return;
            }

            const fetched = await this.createGoto(anchor.href);

            // handle click
            anchor.addEventListener("click", fetched);
        };

        // get all anchor elements
        window.dispatchEvent(new CustomEvent("watermelon.router:build"));

        // @ts-ignore
        for (let anchor of document.querySelectorAll("a")) {
            if (this.hoverOnly === true) {
                // add hover event listener, only add to fetched and do action when hovered
                (anchor as HTMLAnchorElement).addEventListener(
                    "mouseenter",
                    () => {
                        if (!this.fetched.includes(anchor))
                            this.fetched.push(anchor);

                        handleAnchor(anchor);
                    }
                );
            } else {
                if (!this.preload) return; // preload needs to be enabled to do this!
                if (!this.fetched.includes(anchor)) {
                    this.fetched.push(anchor);
                    handleAnchor(anchor);
                }
            }
        }
    }
}

export default WatermelonRouter;
