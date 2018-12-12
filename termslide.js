var fs = require('fs');
var jsdom = require('jsdom');
const { JSDOM } = jsdom;

if (!process.argv[2] && !process.argv[3])
    console.log("Please provide a file")
else {
    file = process.argv[2]
    output = process.argv[3]
    console.log("Reading files ...")
    fs.readFile(file, 'utf8', function(err, contents) {
        if (err !== null) {
            console.log(err)
            process.exit()
        }
        console.log("Adding CSS Rules ...")
        contents = contents.replace('.reveal div', '.reveal div:not(.custom):not([class*="term"])')
        contents = contents.replace('.reveal span', '.reveal span:not([class*="term"])')
        contents = contents.replace('.reveal canvas', '.reveal canvas:not([class*="term"])')
        console.log("Adding Xterm Modules ...")
        contents = contents.replace('<meta name="description" content="Slides">', '<meta name="description" content="Slides">\n\t\t<link rel="stylesheet" href="css/term.css">\n\t\t<link rel="stylesheet" href="lib/css/zenburn.css">\n\t\t<link rel="stylesheet" href="node_modules/xterm/build/xterm.css" />\n\t\t<script type="module">\n\t\t  import * as attach from "./node_modules/xterm/build/addons/attach/attach.js";\n\t\t  import * as fit from "./node_modules/xterm/build/addons/fit/fit.js";</script>')
        console.log("Adding Xterm into Reveal initialization ...")
        contents = contents.replace('Reveal.initialize({', 'var initializedTerminals = {};\n\t\t\tReveal.initialize({')
        contents = contents.replace('Reveal.initialize({', 'Reveal.initialize({\ndependencies: [{ src: \'plugin/markdown/marked.js\' },{ src: \'plugin/markdown/markdown.js\' },{ src: \'plugin/notes/notes.js\', async: true },{ src: \'plugin/highlight/highlight.js\', async: true, callback: 		function() { hljs.initHighlightingOnLoad(); } },{ src: \'node_modules/xterm/build/xterm.js\', async: true, 		callback: function() {Terminal.applyAddon(attach);Terminal.applyAddon(fit);var hostPort = location.hostname + \':\' + location.port;var terminalsUrl = \'http://\' + hostPort + \'/terminals\';var startSlide = Reveal.getCurrentSlide();var sectionEls = document.querySelectorAll(\'section		[data-state^="terminal"]\');sectionEls.forEach(function(section) {var stateName = section.getAttribute(\'data-state\');var handler = function () {if (initializedTerminals[stateName]) {return;}var terminalEl = section.querySelector(\'*		[data-is-terminal]\');if (!terminalEl) {console.warn(\'section \' + stateName + \' had no 		associated terminal, ignoring\');initializedTerminals[stateName] = true;return;}console.log(\'initializing terminal for section \' + 		stateName);var pid = 0;var term = initializedTerminals[stateName] = new Terminal(		{\'macOptionIsMeta\': true,\'theme\': {},\'cols\': 200,\'rows\': 25,\'fontSize\': 12});term.on(\'resize\', function (size) {if (!pid) {return;}var cols = size.cols,rows = size.rows,url = terminalsUrl + \'/\' + pid + \'/size?cols=\' + 		cols + \'&rows=\' + rows;fetch(url, {method: \'POST\'});});term.open(terminalEl);term.setOption(\'rendererType\', \'dom\');term.setOption(\'enableBold\', \'true\');term.setOption(\'drawBoldTextInBrightColors\', \'true\');term.setOption(\'fontFamily\', \'monospace\');term.fit();Reveal.layout();var cwd = terminalEl.getAttribute(\'data-cwd\');var cmd = terminalEl.getAttribute(\'data-cmd\');fetch(terminalsUrl + \'?cols=\' + term.cols + \'&rows=\' + 		term.rows +(cwd ? \'&cwd=\' + cwd : \'\') + (cmd ? \'&cmd=\' + cmd 		: \'\'),{method: \'POST\'}).then(function (res) {res.text().then(function (processId) {console.log(\'connecting to PID \' + processId);pid = processId;socket = new WebSocket(\'ws://\' + hostPort + 		\'/terminals/\' + processId);socket.onopen = function() {term.attach(socket);term._initialized = true;term.fit();Reveal.layout();};});});};if (startSlide === section) {handler();} else {Reveal.addEventListener(stateName, handler, false);};});}}],')
        console.log("Converting HTML to DOM ...")
        doc = new JSDOM(contents);
        var terminals = doc.window.document.querySelectorAll('.terminal')
        console.log("Creating Terminals ...")
        for (var i = 0; i < terminals.length; i++) {
            console.log("Creating Terminal " + i)
            var cwd = 'data-cwd="subdir"'
            var cmd = ''
            if (terminals[i].attributes['data-cwd'])
                cwd = 'data-cwd="' + terminals[i].attributes['data-cwd'].nodeValue + '"';
            if (terminals[i].attributes['data-cmd'])
                cmd = 'data-cmd="' + terminals[i].attributes['data-cmd'].nodeValue + '"';
            terminals[i].closest('section').setAttribute('data-state', 'terminal-' + i);
            terminals[i].insertAdjacentHTML('beforeend', '<div class="custom fakeMenu"><div class="custom fakeButtons fakeClose"></div><div class="custom fakeButtons fakeZoom"></div></div><div class="custom fakeScreen"><div data-is-terminal ' + cwd + ' ' + cmd + ' ></div></div>')
            terminals[i].classList.add('custom')
            terminals[i].classList.add('terminalWindow')
            terminals[i].setAttribute('style', 'margin: auto; display: inline;')
        }
        console.log("Serializing DOM Document ...")
        contents = doc.serialize()
        console.log("Writing final results ...")
        fs.writeFile(output, contents, function(err, data) {
            if (err !== null) {
                console.log(err)
                process.exit()
            }
        })
        console.log("Finished !")
    })
}