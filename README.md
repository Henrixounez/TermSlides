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
sudo npm install
cd node_modules/xterm/
sudo npm install
sudo npm run build
cd ../../
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

<br><br>
- You can try right now, a blank HTML Slide is available to test (demo.html)

<br>
----
## Based of the work made by :
- Reveal.js: https://github.com/hakimel/reveal.js/
- Xterm.js : https://github.com/xtermjs/xterm.js/
- Terminal implementation : https://github.com/jkinkead/reveal.js/tree/xterm_base
- Terminal styles : https://github.com/krasimir/evala