const {contextBridge,ipcRenderer}=require("electron");
/* Seul pont entre l'application et le système : enregistrer / ouvrir un fichier via boîtes de dialogue natives */
contextBridge.exposeInMainWorld("desktop",{
  isDesktop:true,
  platform:process.platform,
  saveFile:(name,content)=>ipcRenderer.invoke("file:save",{name,content}),
  openFile:()=>ipcRenderer.invoke("file:open")
});
