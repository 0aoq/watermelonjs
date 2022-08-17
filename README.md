# 🍉 WatermelonJS

> "Every good JavaScript developer must realize there comes a day where they must make their own framework in order to survive..."

_- Somebody Influential, 2022_

**Hey!** Documentation can be found at -> [https://🍉.docs.oxvs.net/](https://🍉.docs.oxvs.net/)

## About

-   WatermelonJS might only a simple client side router at the moment, but it is still very powerful! WatermelonJS should work in every browser. If not, feel free to help contribute!
-   Watermelon is tiny! ~5KB after TypeScript compile!

## Usage

Watermelon can be quickly created by importing it as a module in the head of the document.

```html
<head>
    <script defer type="module" state="save">
        import Watermelon from "path_to_watermelon_.js";

        const router = new Watermelon({
            log: true,
            preload: true,
            hoverOnly: true,
        });
    </script>
</head>
```

### Options

-   `preload`: Watermelon will automatically fetch **all** links on the page
-   `hoverOnly`: Watermelon will only fetch links whenever the user hovers over them
-   `log`: Watermelon will log _almost_ everything into the console. Useful for debugging!

### Special Attributes

-   `[state="save"]`: Adding this attribute to a script tag will cause it to not be loaded when the page is changed through WatermelonJS

### Events

-   `watermelon.router:initialLoad`: Fired whenever a page gets initially fetched and loaded
-   `watermelon.router:failLoad`: Fired whenever a page fails to load
-   `watermelon.router:build`: Fired whenever links begin being indexed on the page
-   `watermelon.router:change`: Fired whenever the page is changed through WatermelonJS
    -   `event.detail.url`: This event will contain a property called `url` under its `detail` property, it's easy to understand what this is (URL object)

### Elements

WatermelonJS contains some basic custom elements to help make better pages!

-   `melon-include`: [Documentation](https://melon.docs.oxvs.net/classes/melonInclude.html)

## Notes

Watermelon is very unstable! I don't recommend you use it in a production app until I decide what I want to do with this.

Watermelon is licensed under the MIT license. Please contribute! <br>
Documentation available at [https://🍉.docs.oxvs.net/](https://🍉.docs.oxvs.net/)
