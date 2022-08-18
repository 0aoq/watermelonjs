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
    search: HTMLElement | Document;

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
     * @param {HTMLElement | Document} options.search Where should we look for links?
     */
    constructor(options: {
        log: boolean;
        preload: boolean;
        hoverOnly: boolean;
        search: HTMLElement | Document;
    }) {
        this.log = options.log; // define if debug logs should be shown
        this.preload = options.preload; // should links be preloaded?
        this.hoverOnly = options.hoverOnly; // should links only be preloaded on hover?
        this.search = options.search; // where should we look for links?
        if (this.search === undefined) this.search = document;

        this.fetched = [] as any; // will contain all anchor elements that we have already fetched/plan to fetch
        this.hasListener = [] as any; // each element under this.fetched will also exist here if it already has a listener
        this.pages = {}; // each page that is fetched will be stored in here

        ////////////////////////////////////////////////////////////

        // event listener to preload links
        this.search.addEventListener("scroll", this.start);
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
                // clean dom
                this.pages[url] = await res.text();
                const parsed = new DOMParser().parseFromString(
                    this.pages[url],
                    "text/html"
                );

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
                        // load page, we need to set the body and the head separately so chrome works better with it
                        document.body.innerHTML = parsed.body.innerHTML;

                        // remove each head element.. as long as it isn't a <link> (keep the css in place)

                        const newNodes = Array.from(parsed.head.children);

                        // quick function to test if an element needs to be removed or not
                        const doRemoveElement = (
                            nodeList: Array<Node>,
                            element: HTMLElement
                        ) => {
                            if (
                                nodeList.find((node: any) =>
                                    node.isEqualNode(element as HTMLElement)
                                )
                            ) {
                                return false; // don't remove this because it already exists
                            }

                            return true;
                        };

                        // @ts-ignore
                        for (let element of document.head.querySelectorAll(
                            "*"
                        )) {
                            if (!doRemoveElement(newNodes, element)) continue; // don't remove this element because it needs to still be present after merge
                            element.remove();
                        }

                        // @ts-ignore
                        for (let element of parsed.head.querySelectorAll("*")) {
                            // @ts-ignore
                            if (
                                !doRemoveElement(
                                    Array.from(
                                        document.head.querySelectorAll("*")
                                    ),
                                    element
                                )
                            )
                                continue; // don't add this element because it already exists

                            document.head.appendChild(element);
                        }

                        // run scripts

                        // @ts-ignore
                        for (let script of this.search.querySelectorAll(
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
        for (let anchor of this.search.querySelectorAll("a")) {
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

let includeCache = {}; // will hold all fetched includes so they can be easily reloaded later

/**
 * @class melonInclude
 * @description Custom element for including HTML elements in other pages
 *
 * @example
 * Import basic paragraph element from another file.
 * ```html
 * <!-- include.html -->
 * <p>Sandboxed include element!</p>
 * ```
 *
 * ```html
 * <!-- index.html -->
 * <melon-include src="include.html"></melon-include>
 * ```
 *
 * Import a basic component from another file. Scripts should always use "this" to interact with its component, not document.
 * ```html
 * <!-- include.html -->
 * <p>Sandboxed include element!</p>
 * <script>
 *     this.querySelector("p").innerText = "This was changed from within the include!"
 * </script>
 * ```
 *
 * ```html
 * <!-- index.html -->
 * <melon-include src="include.html"></melon-include>
 * ```
 *
 * Import with given attributes.
 * ```html
 * <!-- include.html -->
 * <melon-collector></melon-collector> <!-- in this example this will have an attribute name "hello" with the value of "world" -->
 * <p>The <code>melon-collector</code> element will have all the given attributes!</p>
 * ```
 *
 * ```html
 * <!-- index.html -->
 * <melon-include src="include.html" hello="world"></melon-include>
 * ```
 */
export class melonInclude extends HTMLElement {
    constructor() {
        super();

        // create sandbox (shadowroot)
        this.attachShadow({ mode: "open" });

        // fetch include
        if (!this.getAttribute("src")) return;
        (async () => {
            if (!includeCache[this.getAttribute("src") as string]) {
                const res = await fetch(this.getAttribute("src") as string);

                // make sure it's ok
                if (
                    !res.ok ||
                    !res.headers
                        .get("Content-Type")!
                        .includes(
                            "text/html" /* we can only import html for this */
                        )
                ) {
                    console.log(
                        `\u{1F6DF} %c| FAIL! We couldn't fetch the include for this element! (src="${this.getAttribute(
                            "src"
                        )}")`,
                        "color: rgb(255, 87, 87);"
                    );
                }

                // get text and add to shadow
                const text = await res.text();
                this.shadowRoot!.innerHTML = text;

                // load attributes
                for (let attribute of Array.from(this.attributes)) {
                    if (!this.shadowRoot!.querySelector("melon-collector"))
                        break;
                    if (attribute.name === "src") continue;
                    this.shadowRoot!.querySelector(
                        "melon-collector"
                    )?.setAttribute(attribute.name, attribute.value);
                }

                // add to includeCache, if we're here then we already know it doesn't exist yet
                includeCache[this.getAttribute("src") as string] = text;
            } else {
                // it's already in the cache, just add the include
                this.shadowRoot!.innerHTML =
                    includeCache[this.getAttribute("src") as string];

                // load attributes
                for (let attribute of Array.from(this.attributes)) {
                    if (!this.shadowRoot!.querySelector("melon-collector"))
                        break;
                    if (attribute.name === "src") continue;
                    this.shadowRoot!.querySelector(
                        "melon-collector"
                    )?.setAttribute(attribute.name, attribute.value);
                }
            }

            // run scripts
            // @ts-ignore
            for (let script of this.shadowRoot.querySelectorAll(
                // don't rerun scripts that want their state to save
                'script:not([state="save"])'
            )) {
                new Function(script.innerHTML).call(this.shadowRoot);
            }
        })();
    }
}

customElements.define("melon-include", melonInclude);

// default export
export default WatermelonRouter;
