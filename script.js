// Estructura del Sistema de Archivos Virtual
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

let currentPath = ["C:", "DOS"]; // Iniciamos dentro de DOS por comodidad
let inApp = false;

const input = document.getElementById("cmd-input");
const output = document.getElementById("output");
const terminal = document.getElementById("terminal");
const crtScreen = document.querySelector(".crt-screen");
const promptContainer = document.getElementById("prompt-container");

// Forzar foco en el input al hacer click en la pantalla (si no estamos en una app)
document.addEventListener("click", () => {
    if (!inApp) input.focus();
});

// Inicializar el prompt visual al cargar
document.getElementById("prompt").textContent = getPromptText();

input.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !inApp) {
        const commandLine = this.value.trim();
        if (commandLine !== "") {
            executeCommand(commandLine);
        } else {
            printText(getPromptText());
        }
        this.value = "";
    }
});

function getPromptText() {
    return currentPath.join("\\") + ">";
}

function getCurrentNode() {
    let node = fileSystem;
    for (let dir of currentPath) {
        node = node[dir].children;
    }
    return node;
}

function printText(text) {
    const line = document.createElement("div");
    line.textContent = text;
    output.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function executeCommand(cmdLine) {
    printText(getPromptText() + " " + cmdLine);

    const parts = cmdLine.split(" ");
    let command = parts[0].toUpperCase();
    
    if (command.endsWith(".EXE")) {
        command = command.slice(0, -4);
    }
    
    const args = parts.slice(1);
    const currentFolder = getCurrentNode();
    const exeName = command + ".EXE";

    if (currentFolder[exeName] && currentFolder[exeName].type === "executable") {
        runExecutable(currentFolder[exeName].action, args);
        return;
    }

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
                    let size = currentFolder[key].content ? currentFolder[key].content.length : 45;
                    printText(`${key.padEnd(12)}        ${size} bytes`);
                    fileCount++;
                }
            }
            printText(`\n     ${fileCount} File(s)`);
            printText(`     ${dirCount} Dir(s)`);
            break;

        case "CD":
            if (!args[0] || args[0] === ".") break;
            if (args[0] === "..") {
                if (currentPath.length > 1) currentPath.pop();
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

        case "HELP":
            printText("Comandos soportados:");
            printText("HELP   - Muestra este menú de ayuda");
            printText("CLS    - Limpia la pantalla");
            printText("VER    - Muestra la versión de MS-DOS");
            printText("DIR    - Lista los archivos de la carpeta actual");
            printText("CD     - Cambia de directorio (Ej: CD .. o CD DOS)");
            printText("TYPE   - Muestra el contenido de un archivo");
            printText("EDIT   - Abre el Editor de textos (Guarda y descarga archivos)");
            printText("QBASIC - Abre el entorno QuickBASIC interactivo");
            break;

        default:
            printText("Bad command or file name: " + parts[0]);
    }

    document.getElementById("prompt").textContent = getPromptText();
}

function runExecutable(action, args) {
    inApp = true;
    input.blur();
    promptContainer.style.display = "none"; // Ocultamos el prompt verde original

    const appContainer = document.createElement("div");
    appContainer.className = "app-screen";
    appContainer.id = "active-app";

    if (action === "edit") {
        const fileName = args[0] || "UNTITLED.TXT";
        appContainer.innerHTML = `
            <div class="app-header">File  Edit  Search  Options       |       MS-DOS Editor: ${fileName.toUpperCase()}</div>
            <div class="app-content">
                <textarea id="edit-textarea" placeholder="Escribe tu código o texto aquí..."></textarea>
            </div>
            <div class="app-footer">
                <span>F1=Help  |  Ctrl+S = Descargar/Guardar archivo</span>
                <span>Presiona ESC para volver a DOS</span>
            </div>
        `;
        crtScreen.appendChild(appContainer);
        
        const textarea = document.getElementById("edit-textarea");
        textarea.focus();

        // Función para descargar el archivo creado
        function downloadFile() {
            const textToSave = textarea.value;
            const blob = new Blob([textToSave], { type: "text/plain" });
            const link = document.createElement("a");
            link.download = fileName.toUpperCase();
            link.href = window.URL.createObjectURL(blob);
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        textarea.addEventListener("keydown", function(e) {
            // Guardar usando combinación clásica Ctrl + S
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                downloadFile();
            }
            // Salir usando la tecla Escape volviendo al prompt de comandos verde
            if (e.key === "Escape") {
                e.preventDefault();
                appContainer.remove();
                inApp = false;
                promptContainer.style.display = "flex";
                printText(`Cierre de EDIT.EXE completado.`);
                document.getElementById("prompt").textContent = getPromptText();
                input.focus();
            }
        });

    } else if (action === "qbasic") {
        appContainer.innerHTML = `
            <div class="app-header">File  Run  Debug  Options       |       QBASIC.EXE - GORILLAS.BAS</div>
            <div class="app-content" style="display:flex; flex-direction:column; justify-content:center; align-items:center; background:#000000;">
                <div style="color:#ff55ff; font-size:2.5rem; margin-bottom:15px; font-weight:bold; font-family:monospace;">G O R I L L A S . B A S</div>
                <div style="color:#ffff55; text-align:center; font-size:1.1rem; line-height:1.6;">
                    <span style="color:#55ffff;">[ ENTORNO GRÁFICO QBASIC ACTIVADO ]</span><br><br>
                    * Inicializando cálculos de balística de plátanos...<br>
                    * Renderizando gorilas pixelados en rascacielos...<br><br>
                    <button id="btn-download-game" style="padding:8px 16px; background:#aaaaaa; color:#000000; font-weight:bold; border:3px outset #fff; cursor:pointer; font-family:inherit; font-size:1rem;">Descargar código fuente GORILLAS.BAS</button>
                    <br><br>
                    <span style="color:#ff5555; font-size:0.9rem;">Presiona la tecla ESC para cerrar QBASIC y volver a DOS</span>
                </div>
            </div>
            <div class="app-footer">
                <span>F5=Run Game  |  F1=Help</span>
                <span>ESC=Salir</span>
            </div>
        `;
        crtScreen.appendChild(appContainer);

        const downloadBtn = document.getElementById("btn-download-game");
        downloadBtn.focus();

        downloadBtn.addEventListener("click", () => {
            const gorillaSource = `10 REM *** GORILLAS.BAS ***\n20 CLS: PRINT "Cargando Gorilas..."\n30 INPUT "Angulo de tiro: ", A\n40 INPUT "Velocidad de lanzamiento: ", V\n50 REM Calcular trayectoria fisica con gravedad...\n60 PRINT "Banana lanzada a un angulo de "; A; " grados!"`;
            const blob = new Blob([gorillaSource], { type: "text/plain" });
            const link = document.createElement("a");
            link.download = "GORILLAS.BAS";
            link.href = window.URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        window.addEventListener("keydown", function exitQbasic(e) {
            if (e.key === "Escape") {
                appContainer.remove();
                inApp = false;
                promptContainer.style.display = "flex";
                window.removeEventListener("keydown", exitQbasic);
                printText("Salida de QBASIC.EXE exitosa.");
                document.getElementById("prompt").textContent = getPromptText();
                input.focus();
            }
        });
    }
}
