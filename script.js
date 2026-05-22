const fileSystem = {
    "C:": {
        type: "dir",
        children: {
            "AUTOEXEC.BAT": { type: "file", content: "@ECHO OFF\nPROMPT $P$G\nPATH C:\\DOS" },
            "CONFIG.SYS": { type: "file", content: "DEVICE=C:\\DOS\\HIMEM.SYS\nDOS=HIGH,UMB" },
            "DOS": {
                type: "dir",
                children: {
                    "EDIT.EXE": { type: "executable", action: "edit" },
                    "QBASIC.EXE": { type: "executable", action: "qbasic" }
                }
            }
        }
    }
};

let currentPath = ["C:"];
let inApp = false; // Controla si estamos dentro de un programa

const input = document.getElementById("cmd-input");
const output = document.getElementById("output");
const terminal = document.getElementById("terminal");
const crtScreen = document.querySelector(".crt-screen");

document.addEventListener("click", () => {
    if (!inApp) input.focus();
});

input.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !inApp) {
        const commandLine = this.value.trim();
        if (commandLine !== "") executeCommand(commandLine);
        this.value = "";
    }
});

function getCurrentNode() {
    let node = fileSystem;
    for (let dir of currentPath) {
        node = node[dir].children;
    }
    return node;
}

function getPromptText() {
    return currentPath.join("\\") + ">";
}

function printText(text) {
    const line = document.createElement("div");
    line.textContent = text;
    output.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function executeCommand(cmdLine) {
    // Imprimir el comando ejecutado en la pantalla antes de procesar
    printText(getPromptText() + " " + cmdLine);

    const parts = cmdLine.split(" ");
    
    // Limpiamos el comando: lo pasamos a mayúsculas y le quitamos el ".EXE" si el usuario lo escribió
    let command = parts[0].toUpperCase();
    if (command.endsWith(".EXE")) {
        command = command.slice(0, -4); // Quita los últimos 4 caracteres (.EXE)
    }
    
    const args = parts.slice(1);
    const currentFolder = getCurrentNode();

    // Verificamos si el archivo existe en la carpeta actual antes de lanzarlo
    // Esto evita que ejecutes EDIT estando en una carpeta donde no se encuentra el archivo
    const exeName = command + ".EXE";
    
    switch (command) {
        case "CLS":
            output.innerHTML = "";
            break;

        case "VER":
            printText("MS-DOS version 6.22 (Virtual CRT Edition)");
            break;

        case "DATE":
            printText("Current date is " + new Date().toLocaleDateString());
            break;

        case "DIR":
            printText(" Directory of " + currentPath.join("\\") + "\n");
            let fileCount = 0;
            let dirCount = 0;
            
            for (let key in currentFolder) {
                if (currentFolder[key].type === "dir") {
                    printText(`${key.padEnd(12)} <DIR>`);
                    dirCount++;
                } else {
                    printText(`${key.padEnd(12)}        ${currentFolder[key].content ? currentFolder[key].content.length : 0} bytes`);
                    fileCount++;
                }
            }
            printText(`\n     ${fileCount} File(s)`);
            printText(`     ${dirCount} Dir(s)`);
            break;

        case "CD":
            if (!args[0] || args[0] === ".") {
                break;
            }
            if (args[0] === "..") {
                if (currentPath.length > 1) {
                    currentPath.pop();
                }
            } else {
                const targetDir = args[0].toUpperCase();
                if (currentFolder[targetDir] && currentFolder[targetDir].type === "dir") {
                    currentPath.push(targetDir);
                } else {
                    printText("Invalid directory - " + args[0]);
                }
            }
            break;

        case "TYPE":
            if (!args[0]) {
                printText("Required parameter missing");
                break;
            }
            const targetFile = args[0].toUpperCase();
            if (currentFolder[targetFile] && currentFolder[targetFile].type === "file") {
                printText(currentFolder[targetFile].content);
            } else {
                printText("File not found - " + args[0]);
            }
            break;

        case "EDIT":
            // Comprobamos si EDIT.EXE existe en la ruta actual
            if (currentFolder[exeName]) {
                runExecutable("edit", args);
            } else {
                printText("Bad command or file name: " + parts[0]);
            }
            break;

        case "QBASIC":
            // Comprobamos si QBASIC.EXE existe en la ruta actual
            if (currentFolder[exeName]) {
                runExecutable("qbasic", args);
            } else {
                printText("Bad command or file name: " + parts[0]);
            }
            break;

        case "HELP":
            printText("Supported commands:");
            printText("HELP   - Displays this list");
            printText("CLS    - Clear the screen");
            printText("VER    - Show MS-DOS version");
            printText("DATE   - Show current date");
            printText("DIR    - List files and directories");
            printText("CD     - Change directory (e.g., CD DOS, CD ..)");
            printText("TYPE   - Display file content");
            printText("EDIT   - Open MS-DOS Editor (e.g., EDIT.EXE)");
            printText("QBASIC - Open QuickBasic environment (e.g., QBASIC.EXE)");
            break;

        default:
            printText("Bad command or file name: " + parts[0]);
    }

    // Actualizar el prompt por si cambió de directorio
    document.getElementById("prompt").textContent = getPromptText();
}

// Lógica de ejecución de aplicaciones contenedoras
function runExecutable(action, args) {
    inApp = true;
    input.blur();

    // Crear el contenedor visual de la aplicación
    const appContainer = document.createElement("div");
    appContainer.className = "app-screen";
    appContainer.id = "active-app";

    if (action === "edit") {
        const fileName = args[0] || "UNTITLED.TXT";
        appContainer.innerHTML = `
            <div class="app-header">MS-DOS Editor - ${fileName.toUpperCase()}</div>
            <div class="app-content">
                <textarea id="edit-textarea" placeholder="Escribe aquí tu texto... (Presiona ESC para salir)"></textarea>
            </div>
            <div class="app-footer">Presiona ESC para guardar y volver a DOS</div>
        `;
        crtScreen.appendChild(appContainer);
        
        const tx = document.getElementById("edit-textarea");
        tx.focus();

        // Manejar salida con la tecla Escape
        tx.addEventListener("keydown", function(e) {
            if (e.key === "Escape") {
                appContainer.remove();
                inApp = false;
                printText(`Archivo ${fileName} cerrado.`);
                input.focus();
            }
        });

    } else if (action === "qbasic") {
        appContainer.innerHTML = `
            <div class="app-header">QBASIC.EXE - GORILLAS.BAS</div>
            <div class="app-content" style="display:flex; flex-direction:column; justify-content:center; align-items:center; background:#000000;">
                <div style="color:#ff55ff; font-size:2rem; margin-bottom:20px; font-weight:bold;">G O R I L L A S</div>
                <div style="color:#ffff55; text-align:center;">
                    [Simulación de Inicialización]<br><br>
                    Cargando entorno gráfico de 16 colores...<br>
                    Lanzando plátanos explosivos virtuales...<br><br>
                    <span style="animation: flicker 0.5s infinite; color:#55ffff;">Presiona cualquier tecla para salir</span>
                </div>
            </div>
        `;
        crtScreen.appendChild(appContainer);

        // Cualquier tecla sale de la simulación gráfica de QBasic
        setTimeout(() => {
            window.addEventListener("keydown", function exitQ(e) {
                appContainer.remove();
                inApp = false;
                window.removeEventListener("keydown", exitQ);
                input.focus();
            });
        }, 200);
    }
}
