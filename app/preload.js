const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tldr", {
    start:     ()  => ipcRenderer.invoke("wizard:start"),
    pullModel: ()  => ipcRenderer.invoke("wizard:pull-model"),
    finish:    ()  => ipcRenderer.invoke("wizard:finish"),
    openOllama:()  => ipcRenderer.invoke("wizard:open-ollama"),
    onProgress:(cb)=> ipcRenderer.on("pull-progress", (_, line) => cb(line))
});
