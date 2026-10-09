const {app,BrowserWindow,shell,ipcMain,dialog,Menu,session}=require("electron");
const path=require("path");
const fs=require("fs");
const isWeb=u=>/^https?:\/\//i.test(u);
const MAX_BYTES=100*1024*1024;
let mainWindow=null;

app.setAppUserModelId("com.creativeai.offline");

/* Une seule fenêtre : relancer l'application ramène la fenêtre existante au premier plan */
if(!app.requestSingleInstanceLock()){app.quit();}
else{
  app.on("second-instance",()=>{if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.focus()}});

  function create(){
    mainWindow=new BrowserWindow({
      width:1280,height:850,minWidth:900,minHeight:640,backgroundColor:"#12161c",title:"Creative AI",
      icon:path.join(__dirname,"build","icon.png"),show:false,
      webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,preload:path.join(__dirname,"preload.js")}
    });
    mainWindow.once("ready-to-show",()=>mainWindow.show());
    mainWindow.on("closed",()=>{mainWindow=null});
    /* Liens externes (ChatGPT...) : navigateur par défaut, jamais dans l'application */
    mainWindow.webContents.setWindowOpenHandler(({url})=>{if(isWeb(url))shell.openExternal(url);return{action:"deny"}});
    mainWindow.webContents.on("will-navigate",(e,url)=>{if(!url.startsWith("file:")){e.preventDefault();if(isWeb(url))shell.openExternal(url)}});
    mainWindow.loadFile(path.join(__dirname,"public","index.html"));
  }

  /* Autorisations : seul le presse-papiers est accordé (copier les slash) */
  function setupPermissions(){
    const allowed=new Set(["clipboard-read","clipboard-sanitized-write"]);
    session.defaultSession.setPermissionRequestHandler((wc,permission,cb)=>cb(allowed.has(permission)));
    session.defaultSession.setPermissionCheckHandler((wc,permission)=>allowed.has(permission));
  }

  /* Accès aux fichiers : toujours via les boîtes de dialogue natives (l'utilisateur choisit l'emplacement) */
  ipcMain.handle("file:save",async(e,{name,content})=>{
    if(typeof content!=="string"||content.length>MAX_BYTES)throw new Error("Contenu invalide");
    const safe=path.basename(String(name||"creative-ai.json")).replace(/[<>:"/\\|?*\x00-\x1f]/g,"_");
    const win=BrowserWindow.fromWebContents(e.sender);
    const r=await dialog.showSaveDialog(win,{title:"Enregistrer",defaultPath:path.join(app.getPath("documents"),safe),filters:[{name:"Fichier JSON",extensions:["json"]},{name:"Tous les fichiers",extensions:["*"]}]});
    if(r.canceled||!r.filePath)return{canceled:true};
    await fs.promises.writeFile(r.filePath,content,"utf8");
    return{canceled:false,path:r.filePath};
  });
  ipcMain.handle("file:open",async(e)=>{
    const win=BrowserWindow.fromWebContents(e.sender);
    const r=await dialog.showOpenDialog(win,{title:"Choisir une sauvegarde Creative AI",defaultPath:app.getPath("documents"),properties:["openFile"],filters:[{name:"Sauvegarde JSON",extensions:["json"]},{name:"Tous les fichiers",extensions:["*"]}]});
    if(r.canceled||!r.filePaths.length)return{canceled:true};
    const p=r.filePaths[0],st=await fs.promises.stat(p);
    if(st.size>MAX_BYTES)throw new Error("Fichier trop volumineux");
    return{canceled:false,path:p,name:path.basename(p),content:await fs.promises.readFile(p,"utf8")};
  });

  app.whenReady().then(()=>{
    setupPermissions();
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      ...(process.platform==="darwin"?[{role:"appMenu"}]:[]),
      {label:"Fichier",submenu:[process.platform==="darwin"?{role:"close"}:{role:"quit",label:"Quitter"}]},
      {role:"editMenu"},
      {label:"Affichage",submenu:[{role:"reload",label:"Actualiser"},{type:"separator"},{role:"resetZoom",label:"Taille normale"},{role:"zoomIn",label:"Agrandir"},{role:"zoomOut",label:"Réduire"},{type:"separator"},{role:"togglefullscreen",label:"Plein écran"}]},
      {label:"Aide",submenu:[{label:"Ouvrir ChatGPT",click:()=>shell.openExternal("https://chatgpt.com/")}]}
    ]));
    create();
    app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)create()});
  });
  app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});
}
