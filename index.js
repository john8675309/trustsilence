const { app, BrowserWindow, Menu } = require('electron')
const md5 = require("md5");
const { box, randomBytes } = require('tweetnacl');
const {decodeUTF8,encodeUTF8,encodeBase64,decodeBase64} = require('tweetnacl-util');
const newNonce = () => randomBytes(box.nonceLength);
function generateKey() {
    return box.keyPair();
}


function createWindow () {
    // Create the browser window.
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })
    var menu = Menu.buildFromTemplate([{
          label: 'File',
          submenu: [
              {
                label:'Burn It',
                click: () => {
                    win.webContents.executeJavaScript("burnQuestion();");
                    //burnQuestion();
                }
              },
              {
                label:'Exit',
                click: () => {
                    app.quit();
                }
              }
          ]
    }])
    Menu.setApplicationMenu(menu);
    // and load the index.html of the app.
    win.loadFile('index.html')
    win.webContents.openDevTools()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

const {ipcMain} = require('electron')
ipcMain.on('close-me', (evt, arg) => {
  app.quit()
})

ipcMain.on('generate-key', (evt, arg) => {
    var key = generateKey();
    evt.reply('public-key', encodeBase64(key.publicKey));
    evt.reply('private-key', encodeBase64(key.secretKey));
})

ipcMain.on('hash', (evt, arg) => {
    evt.reply('hash', hash(arg));
})

ipcMain.on('compare', (evt, arg) => {
    //evt.reply('hash', );
    console.log(arg);
})


function hash(rawPassword, options = {}) {
    const salt = options.salt ? options.salt : new Date().getTime();
    const rounds = options.rounds ? options.rounds : 10;
    let hashed = md5(rawPassword + salt);
    for (let i = 0; i <= rounds; i++) {
      hashed = md5(hashed);
    }
    return `${salt}$${rounds}$${hashed}`;
}

function compare(rawPassword, hashedPassword) {
    try {
      const [ salt, rounds ] = hashedPassword.split('$');
      const hashedRawPassword = this.hash(rawPassword, { salt, rounds });
      return hashedPassword === hashedRawPassword;
    } catch (error) {
      throw Error(error.message);
    }
}
