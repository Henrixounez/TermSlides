# TermSlides
Add terminals into you reveal.js presentations

## Pre-Installation :
- You will need those package to run the install :
    - npm
    - node

## Installation Reveal.js and Xterm.js dependencies :
```
git clone https://github.com/Henrixounez/TermSlides.git
cd TermSlides
npm install
cd node_modules/xterm/
npm install
```
## How to use :
- Create a slide on Slides.com
- Add in your slide HTML : 
```
<div class="terminal" data-cwd="<folderOnSpawn>" data-cmd="<commandExecutedOnSpawn">
```
- Export your file in HTML 
- Use termslides.js to convert your terminal divs into real terminals
```
node termslides.js <inputFile> <outputFile>
```
- Then you can start reveal.js in root folder using 
```
npm run start
```
- Enjoy !
    - You can access your slide using http://127.0.0.1:8000/<b>\<nameOfYourFile\></b>

<br>
- You can try right now, an HTML Slide is available to test (demo.html)

<br>

## Customization :
- You can change default shell by modifying this line in app.js :

```
var entrypoint = process.platform === 'win32' ? 'cmd.exe' : 'bash'; //You can change to your favorite shell here
```

### Optional div attributes :
* data-cwd="\<string\>"
    - Spawns terminal in designated folder
* data-cmd="\<string\>"
    - Terminal execute a command on spawn
* data-display="none"
    - Terminal will spawn collapsed
* data-cols="\<string\>"
    - Terminal columns number
* data-rows="\<string\>"
    - Terminal rows number
* data-fontsize="\<string\>"
    - Terminal font size

----
## Based of the work made by :
- Reveal.js: https://github.com/hakimel/reveal.js/
- Xterm.js : https://github.com/xtermjs/xterm.js/
- Terminal implementation : https://github.com/jkinkead/reveal.js/tree/xterm_base
- Terminal styles : https://github.com/krasimir/evala