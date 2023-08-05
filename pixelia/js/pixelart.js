//* Variables initialization
var drawing = false;
var currentTool = 0; //* 0 = Brush, 1 = Eraser
var currentColor;

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

// This *SHOULD* be enough, but chromium doesn't give a shit and applies antialiasing anyways 🖕🖕🖕🖕🖕🖕🖕🖕🖕🖕🖕
ctx.imageSmoothingEnabled = false;
// WHY THE FUCK this property exists if only firefox is going to use it

// So we have to use SVG wizardry
ctx.filter = "url(\'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"f\" color-interpolation-filters=\"sRGB\"><feComponentTransfer><feFuncA type=\"discrete\" tableValues=\"0 1\"/></feComponentTransfer></filter></svg>#f\')";

//* Canvas pixel manipulation
const setPixel = (x, y, color) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

const removePixel = (x, y) => {
    //TODO: This is underoptimized
    ctx.putImageData(ctx.createImageData(1,1), x, y);

    // Because this ⬇ doesn't work, only removes a little bit of alpha
    // ctx.clearRect(x, y, 1, 1); 
}

//* Drawing logic
const draw = (ev) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();

    const x = (ev.clientX - rect.left) * canvas.width / rect.width;
    const y = (ev.clientY - rect.top) * canvas.height / rect.height;
    
    switch(currentTool) {
        case 0:
            setPixel(x, y, currentColor);
            break;
        case 1:
            removePixel(x, y);
            break;
    }

}

//* Event bindings
document.onmousedown = (ev) => {
    drawing = true;
    draw(ev);
}
document.onmouseup = () => {drawing = false;}

document.onmousemove = (ev) => {
    draw(ev);
}

document.onkeydown = (ev) => {
    //TODO: Harcoded keybinds ☠
    if (ev.key == "b") {
        switchTool(0, document.getElementById("brushbutton"));
    }
    if (ev.key == "e") {
        switchTool(1, document.getElementById("eraserbutton"));
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
                document.getElementById("colorinput").value = currentColor.slice(0, currentColor.length-2);
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
const switchTool = (toolId, caller) =>
{
    switch(toolId)
    {
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

//* Startup functions
switchTool(0, document.getElementById("brushbutton"));