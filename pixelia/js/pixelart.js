//* Variables initialization
var drawing = false;
var currentTool = 0; //* 0 = Brush, 1 = Eraser, 2 = Bucket
var currentColor = "#131313";
var currentAltColor = "#e3e3e3";

//* Canvas creation
const canvas = document.createElement("canvas");
const wrapper = document.createElement("div");
wrapper.id = "canvaswrapper";
document.body.appendChild(wrapper);
canvas.width = 32;
canvas.height = 32;
canvas.classList.add("pixelartcanvas");
wrapper.appendChild(canvas);

const ctx = canvas.getContext("2d");
ctx.translate(-0.5, -0.5);

// This *SHOULD* be enough, but chromium doesn't care and applies antialiasing anyways
ctx.imageSmoothingEnabled = false;
// Why does this property exists if only firefox is going to use it

// So we have to use SVG wizardry
ctx.filter = "url(\'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"f\" color-interpolation-filters=\"sRGB\"><feComponentTransfer><feFuncA type=\"discrete\" tableValues=\"0 1\"/></feComponentTransfer></filter></svg>#f\')";

//* Canvas pixel manipulation
const setPixel = (x, y, color) => {
    
    //TODO: (fix) This ⬇ uses a color blending filter and uses several colors
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(Math.max(x), Math.max(y), 1, 1);
}

const removePixel = (x, y) => {
    //TODO: This is underoptimized
    ctx.putImageData(ctx.createImageData(1, 1), x, y);

    // Because this ⬇ doesn't work, only removes a little bit of alpha
    // ctx.clearRect(x, y, 1, 1); 
}

const fillFromPixel = (x, y) => {
    var nodes = [];
    nodes.push({
        x: x,
        y: y
    });
    ctx.beginPath();
    ctx.fillStyle = currentColor;

    const initialColor = ctx.getImageData(x, y, 1, 1).data;
    ctx.fillRect(x, y, 1, 1);
    nodes.push({ x: x - 1, y: y }, { x: x + 1, y: y }, { x: x, y: y - 1 }, { x: x, y: y + 1 });
    const newColor = ctx.getImageData(x, y, 1, 1).data; // Easy convert to UInt8Array

    while (nodes.length > 0) {
        const currentNode = nodes[0];
        if (currentNode.x < 0 || currentNode.y < 0 || currentNode.x > canvas.width || currentNode.y > canvas.height) {
            nodes.shift();
            continue;
        }

        if (JSON.stringify(ctx.getImageData(currentNode.x, currentNode.y, 1, 1).data) == JSON.stringify(initialColor)) { //? For some reason they aren't the same, so we need to convert them... what ??????? performance is tanking
            if (JSON.stringify(ctx.getImageData(currentNode.x, currentNode.y, 1, 1).data) != JSON.stringify(newColor)) {
                ctx.fillRect(currentNode.x, currentNode.y, 1, 1); //? Maybe we could use fillRect to fill rectangles instead of single pixels (optimizes something?)
                nodes.push({ x: currentNode.x - 1, y: currentNode.y }, { x: currentNode.x + 1, y: currentNode.y }, { x: currentNode.x, y: currentNode.y - 1 }, { x: currentNode.x, y: currentNode.y + 1 });
            }
        }
        nodes.shift();
    }
}

//* Canvas properties editing
const setResolution = (resolution) => {
    canvas.width = resolution;
    canvas.height = resolution;

    if (resolution == 16)
    {
        [].slice.call(document.getElementsByClassName("pixelartcanvas")).forEach(c => {
            c.style.backgroundSize = "128px 128px";
            c.style.backgroundPosition = "0px 64px, 64px 0px";
        });
    }

    if (resolution == 32)
    {
        [].slice.call(document.getElementsByClassName("pixelartcanvas")).forEach(c => {
            c.style.backgroundSize = "64px 64px";
            c.style.backgroundPosition = "0px 0px, 96px 32px";
        });
    }

    if (resolution == 64)
    {
        [].slice.call(document.getElementsByClassName("pixelartcanvas")).forEach(c => {
            c.style.backgroundSize = "32px 32px";
            c.style.backgroundPosition = "0px 16px, 48px 32px";
        });
    }

    document.getElementById("resolutiontext").innerText = `${resolution}x${resolution}`;

    // Filter and translation resets on width changes
    ctx.filter = "url(\'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"f\" color-interpolation-filters=\"sRGB\"><feComponentTransfer><feFuncA type=\"discrete\" tableValues=\"0 1\"/></feComponentTransfer></filter></svg>#f\')";
    ctx.translate(-0.5, -0.5);
}

//* Drawing logic
const draw = (ev) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();

    const x = (ev.clientX - rect.left) * canvas.width / rect.width;
    const y = (ev.clientY - rect.top) * canvas.height / rect.height;

    switch (currentTool) {
        case 0:
            setPixel(x, y, currentColor);
            break;
        case 1:
            removePixel(x, y);
            break;

        case 2:
            fillFromPixel(x, y);
            break;
    }

}

//* Event bindings
document.onmousedown = (ev) => {
    drawing = true;
    draw(ev);
}
document.onmouseup = () => { drawing = false; }

document.onmousemove = (ev) => {
    draw(ev);
}

document.onkeydown = (ev) => {
    if (ev.key == "b") {
        switchTool(0, document.getElementById("brushbutton"));
    }

    if (ev.key == "e") {
        switchTool(1, document.getElementById("eraserbutton"));
    }

    if (ev.key == "g") {
        switchTool(2, document.getElementById("buckettool"));
    }

    if (ev.key == "x") {
        swapCurrentColor();
    }
}

window.onbeforeunload = (ev) => {
    return "";
}

document.getElementById("colorinput").oninput = (ev) => {
    currentColor = document.getElementById("colorinput").value;
}

//* Palette loading
var palette = [];
document.getElementById("paletteinput").oninput = () => {
    if (document.getElementById("palette")) {
        document.getElementById("palette").remove();
    }

    const paletteCanvas = document.createElement("canvas");

    const paletteNode = document.createElement("div");
    paletteNode.id = "palette";

    createImageBitmap(document.getElementById("paletteinput").files[0]).then(bmp => {
        paletteCanvas.width = bmp.width;
        paletteCanvas.height = bmp.height;
        const paletteCtx = paletteCanvas.getContext("2d");
        paletteCtx.drawImage(bmp, 0, 0);//URL.createObjectURL(document.getElementById("paletteinput").files[0]));
        for (var x = 0; x < bmp.width; x++) {
            const color = paletteCtx.getImageData(x, 0, 1, 1).data; // Uint8ClampedArray
            palette.push(color);

            const colorNode = document.createElement("img");

            const colorCanvas = document.createElement("canvas");
            colorCanvas.width = 1;
            colorCanvas.height = 1;
            colorCanvas.getContext("2d").putImageData(new ImageData(color, 1, 1), 0, 0);

            colorNode.src = colorCanvas.toDataURL("image/png");
            colorNode.onclick = (ev) => {
                currentColor = `#${[...new Uint8Array(color)].map(x => x.toString(16).padStart(2, '0')).join('')}`;
                currentColor = currentColor.slice(0, currentColor.length - 2);
                document.getElementById("colorinput").value = currentColor;
            }
            paletteNode.appendChild(colorNode);
        }

        document.getElementById("bar").appendChild(paletteNode);
    });
}

//* Drawing downloading
const downloadPixelart = () => {
    var a = document.getElementById("pixelartdownload");
    a.href = canvas.toDataURL().replace("image/png", "image/octet-stream");
    a.download = "pixelart.png";
}

//* Tools 
const switchTool = (toolId, caller) => {
    switch (toolId) {
        case 0:
            currentTool = 0;
            canvas.style.cursor = "url('/img/paint.png'), auto";
            changeUISelectedTool(caller);
            break;

        case 1:
            currentTool = 1;
            canvas.style.cursor = "url('/img/erase.png'), auto";
            changeUISelectedTool(caller);
            break;

        case 2:
            currentTool = 2;
            canvas.style.cursor = "url('/img/fill.png'), auto";
            changeUISelectedTool(caller);
            break;
    }
}

const changeUISelectedTool = (caller) => {
    if (!document.getElementById("toolkit")) { return; }
    document.getElementById("toolkit").childNodes.forEach(node => {
        if (node.nodeType == 3) { return; }
        if (node != caller) {
            node.style.border = "2px solid black";
        } else {
            node.style.border = "2px solid white";
        }
    });
}

const swapCurrentColor = () => {
    const cc = currentColor;
    currentColor = currentAltColor;
    currentAltColor = cc;

    document.getElementById("colorinput").value = currentColor;
    document.getElementById("altcolorinput").value = currentAltColor;
}

//* UI Functions
const toggleResolutionOptions = () => {
    document.getElementById("resolutionoptions").classList.toggle("shown");
}

//* Startup functions
switchTool(0, document.getElementById("brushbutton"));
document.getElementById("colorinput").value = currentColor;
document.getElementById("altcolorinput").value = currentAltColor;