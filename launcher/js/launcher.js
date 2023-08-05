var pins = [];

const panel = document.getElementById("panel");
var prevX = 0, prevY = 0, newX = 0, newY = 0;

var currentPin = undefined;

document.getElementById("paneltopbar").onmousedown = (ev) => {
    ev.preventDefault();
    prevX = ev.clientX;
    prevY = ev.clientY;
    document.onmouseup = stopDragPanel;
    document.onmousemove = movePanel;
}

const movePanel = (ev) => {
    ev.preventDefault();
    newX = prevX - ev.clientX;
    newY = prevY - ev.clientY;

    prevX = ev.clientX;
    prevY = ev.clientY;

    panel.style.left = `${panel.offsetLeft - newX}px`;
    panel.style.top = `${panel.offsetTop - newY}px`;
}

const stopDragPanel = () => {
    document.onmouseup = null;
    document.onmousemove = null;
}

const togglePanel = () => {
    if (panel.style.display != "flex") {
        panel.style.display = "flex";
    } else {
        panel.style.display = "none";
    }
}

const createWebsitePin = () => {
    if (panel.style.display != "flex") {
        togglePanel();
    }
}

document.getElementById("gradientdegreeinput").onkeydown = (ev) => {
    if (ev.key == "ArrowUp") {
        document.getElementById("gradientdegreeinput").value = Number.parseInt(document.getElementById("gradientdegreeinput").value) + 1;
        updateGradientPreview();
    }

    if (ev.key == "ArrowDown") {
        document.getElementById("gradientdegreeinput").value = Number.parseInt(document.getElementById("gradientdegreeinput").value) - 1;
        updateGradientPreview();
    }
    
    if (/[^(0-9)]/g.test(ev.key) && ["Backspace", "Delete", "ArrowLeft", "ArrowRight"].indexOf(ev.key) == -1) {
        ev.preventDefault();
    }
};

const updateGradientPreview = () => {
    const deg = document.getElementById("gradientdegreeinput").value;
    const col1 = document.getElementById("gradientcol1input").value;
    const col2 = document.getElementById("gradientcol2input").value;
    document.getElementById("gradientpreview").style.background = `linear-gradient(${deg}deg, ${col1}, ${col2})`
}

const updatePins = () => {
    if (localStorage.getItem("pins")) {
        pins = JSON.parse(localStorage.getItem("pins"));
        const board = document.getElementById("websites");
        board.innerHTML = `
        <div id="create" class="website" onclick="createWebsitePin()">
            <h1>+</h1>
        </div>`;

        pins.forEach(pin => {
            if (pin.name == "create") {
                pin.name = "create2";
            }
            const node = document.createElement("div");
            node.id = pin.name;
            node.classList.add("website");
            node.style.background = pin.gradient;
            node.onclick = () => window.location = `https://${pin.url}`; 
            
            node.onmouseover = (ev) => {
                currentPin = pin;
                document.getElementById("deletepin").style.display = "flex";
                ev.preventDefault();
            } 

            node.onmouseout = (ev) => {
                currentPin = undefined;
                document.getElementById("deletepin").style.display = "none";
                ev.preventDefault();
            }            

            const h1 = document.createElement("h1");
            h1.innerText = pin.name;
            h1.classList.add("outlined");

            node.appendChild(h1);
            board.appendChild(node);
        });
    }
}

const addPin = () => {
    const newpin = {};

    const name = document.getElementById("nameinput").value;
    const url = document.getElementById("urlinput").value;

    const deg = document.getElementById("gradientdegreeinput").value;
    const col1 = document.getElementById("gradientcol1input").value;
    const col2 = document.getElementById("gradientcol2input").value;

    if (name == "" || url == "") { 
        document.getElementById("errormessage").innerText = "Necesita un nombre y URL";
        return;
    }

    newpin.name = name;
    newpin.url = url;
    newpin.gradient = `linear-gradient(${deg}deg, ${col1}, ${col2})`;

    pins.push(newpin);

    localStorage.setItem("pins", JSON.stringify(pins));
    updatePins();
    togglePanel();
    document.getElementById("errormessage").innerText = "";
}

const toggleAddToStart = () => {
    if (document.getElementById("addtostart").style.display != "block") {
        document.getElementById("addtostart").style.display = "block";
        document.getElementById("toggleAddToStart").innerText = "v Cómo añadir al inicio";
    } else {
        document.getElementById("addtostart").style.display = "none";
        document.getElementById("toggleAddToStart").innerText = "> Cómo añadir al inicio";
    }
}

const toggleLeftbar = () => {
    // animation: ;
    if (document.getElementById("leftbar").style.left != "-30vw") {
        document.getElementById("leftbar").style.animation = "leftbarToggle 200ms linear";
        document.getElementById("backgroundimg").style.animation = "leftbarToggle 200ms linear";
        document.getElementById("toggleleftbar").style.animation = "leftbarToggle 200ms linear";
        document.getElementById("toggleleftbar").innerText = ">";
        
        setTimeout(() => {    
            document.getElementById("leftbar").style.animation = "unset";
            document.getElementById("backgroundimg").style.animation = "unset";
            document.getElementById("toggleleftbar").style.animation = "unset";
    
            document.getElementById("leftbar").style.left = "-30vw";
            document.getElementById("backgroundimg").style.left = "-30vw";
            document.getElementById("toggleleftbar").style.left = "1vw";
        }, 180);
    } else {
        document.getElementById("leftbar").style.animation = "leftbarToggle 200ms linear reverse";
        document.getElementById("backgroundimg").style.animation = "leftbarToggle 200ms linear reverse";
        document.getElementById("toggleleftbar").style.animation = "leftbarToggle 200ms linear reverse";
        document.getElementById("toggleleftbar").innerText = "<";

        document.getElementById("leftbar").style.left = "0";
        document.getElementById("backgroundimg").style.left = "0";
        document.getElementById("toggleleftbar").style.left = "27vw";
        setTimeout(() => {    
            document.getElementById("leftbar").style.animation = "unset";
            document.getElementById("backgroundimg").style.animation = "unset";
            document.getElementById("toggleleftbar").style.animation = "unset";
        }, 180);
    }
}


document.onkeydown = (ev) => {
    if (ev.key == "Delete" && currentPin) {
        const pin = pins.find(pin => pin.name == currentPin.name && pin.gradient == currentPin.gradient && pin.url == currentPin.url); 
        if (pin) {
            pins.splice(pins.indexOf(pin) , 1);
            localStorage.setItem("pins", JSON.stringify(pins));
            document.getElementById("deletepin").style.display = "none";
            updatePins();
        }
    }
}

updatePins();

document.getElementById("gradientcol1input").value = `#${Math.floor(Math.random()*16777215).toString(16)}`;
document.getElementById("gradientcol2input").value = `#${Math.floor(Math.random()*16777215).toString(16)}`;
document.getElementById("gradientdegreeinput").value = Math.floor(Math.random()*360);
updateGradientPreview();