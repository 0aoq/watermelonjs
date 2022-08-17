let count = 0; // create value that will have the same state on the next page

function addListener() {
    // function used to add a listener to the count element
    document.getElementById("count").addEventListener("click", (e) => {
        count++;
        e.target.innerText = count.toString();
    });
}

addListener(); // fire first

// listen for page changes so we can update the state of the count element there too
window.addEventListener("watermelon.router:change", (e) => {
    if (document.getElementById("count")) {
        addListener();
        document.getElementById("count").innerText = count.toString();
    }
});
