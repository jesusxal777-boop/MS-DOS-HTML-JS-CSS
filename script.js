// Sistema de archivos virtual rudimentario
const fileSystem = {
    "C:": {
        type: "dir",
        children: {
            "AUTOEXEC.BAT": { type: "file", content: "@ECHO OFF\nPROMPT $P$G\nPATH C:\\DOS" },
            "CONFIG.SYS": { type: "file", content: "DEVICE=C:\\DOS\\HIMEM.SYS\nDOS=HIGH,UMB" },
            "DOS": {
                type: "dir",
                children: {
                    "EDIT.EXE": { type: "file", content: "[Binary Executable: Text Editor]" },
                    "QBASIC.EXE": { type: "file", content: "[Binary Executable: QuickBasic Interpreter]" }
                }
            },
            "DREAM": {
                type: "dir",
                children: {
                    "LOG.TXT": { type: "file", content: "Simulador DOS inicializado con exito.\nFiltro CRT activo al 100%." }
                }
            }
        }
    }
};

let currentPath = ["C:"];
const input = document.getElementById("cmd-input");
const output = document.getElementById("output");
const terminal = document.getElementById("terminal");

// Enfocar el input siempre que se haga clic en la pantalla
document.addEventListener("click", () => input.focus());

input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        const commandLine = this.value.trim();
        if (commandLine !== "") {
            executeCommand(commandLine);
        }
        this.value = "";
    }
});

// Obtener el nodo actual del sistema de archivos
function getCurrentNode() {
    let node = fileSystem;
    for (let dir of currentPath) {
        node = node[dir].children;
    }
    return node;
}

// Formatear la ruta actual para el Prompt
function getPromptText() {
    return currentPath.join("\\") + ">";
}

function printText(text, isHTML = false) {
    const line = document.createElement("div");
    if (isHTML) {
        line.innerHTML = text;
    } else {
        line.textContent = text;
    }
    output.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight; // Auto-scroll
}

function executeCommand(cmdLine) {
    // Imprimir el comando ejecutado en la pantalla antes de procesar
    printText(getPromptText() + " " + cmdLine);

    const parts = cmdLine.split(" ");
    const command = parts[0].toUpperCase();
    const args = parts.slice(1);

    const currentFolder = getCurrentNode();

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
                    printText(`${key.padEnd(12)}        ${currentFolder[key].content.length} bytes`);
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

        case "HELP":
            printText("Supported commands:");
            printText("HELP - Displays this list");
            printText("CLS  - Clear the screen");
            printText("VER  - Show MS-DOS version");
            printText("DATE - Show current date");
            printText("DIR  - List files and directories");
            printText("CD   - Change directory (e.g., CD DOS, CD ..)");
            printText("TYPE - Display content of a text file (e.g., TYPE AUTOEXEC.BAT)");
            break;

        default:
            printText("Bad command or file name: " + parts[0]);
    }

    // Actualizar el prompt por si cambió de directorio
    document.getElementById("prompt").textContent = getPromptText();
}
