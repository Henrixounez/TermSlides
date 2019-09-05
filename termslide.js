var fs = require('fs');
var jsdom = require('jsdom');
const { JSDOM } = jsdom;

if (!process.argv[2] && !process.argv[3]) {
    console.log("Please provide a file");
} else {
    file = process.argv[2];
    output = process.argv[3];
    console.log("Reading files ...");
    fs.readFile(file, 'utf8', function(err, contents) {
        if (err !== null) {
            console.log(err);
            process.exit();
        }
        console.log("Adding CSS Rules ...");
        contents = contents.replace('.reveal div', '.reveal div:not(.custom):not([class*="term"])');
        contents = contents.replace('.reveal span', '.reveal span:not([class*="term"])');
        contents = contents.replace('.reveal canvas', '.reveal canvas:not([class*="term"])');
        contents = contents.replace('.reveal video{margin:0;', '.reveal video{')
        console.log("Adding Xterm Modules ...");
        contents = contents.replace('<meta name="description" content="Slides">', '<meta name="description" content="Slides">\n\t\t<link rel="stylesheet" href="css/term.css">\n\t\t<link rel="stylesheet" href="lib/css/zenburn.css">\n\t\t<link rel="stylesheet" href="node_modules/xterm/dist/xterm.css" />\n\t\t<script type="module">\n\t\t  import * as attach from "./node_modules/xterm/dist/addons/attach/attach.js";\n\t\t  import * as fit from "./node_modules/xterm/dist/addons/fit/fit.js";</script>');
        console.log("Adding Xterm into Reveal initialization ...");
        contents = contents.replace('Reveal.initialize({', 'var initializedTerminals = {};\n\t\t\tReveal.initialize({');
        var revealInitializeString = `
        function minimizeTerminal(screen) {
            if (screen.parentNode.parentNode.getElementsByClassName("fakeScreen")[0].style.display == "")
                screen.parentNode.parentNode.getElementsByClassName("fakeScreen")[0].style.display = "none";
            else
                screen.parentNode.parentNode.getElementsByClassName("fakeScreen")[0].style.display = "";
        }
        function closeTerminal(screen) {
            screen.parentNode.parentNode.style.display = "none";
        }
        Reveal.initialize({
            dependencies: [
                { src: 'node_modules/xterm/dist/xterm.js', async: true, callback: function() {
                    Terminal.applyAddon(attach);
                    Terminal.applyAddon(fit);
                    var hostPort = location.hostname + ':' + location.port;
                    var terminalsUrl = 'http://' + hostPort + '/terminals';
                    var startSlide = Reveal.getCurrentSlide();
                    var sectionEls = document.querySelectorAll('section[data-state^="terminal"]');
                    sectionEls.forEach(function(section) {
                        let stateName = section.getAttribute('data-state');
                        let handler = function () {
                            if (initializedTerminals[stateName]) {
                                return;
                            }
                            let terminalEl = section.querySelectorAll('*[data-is-terminal]');
                            if (!terminalEl) {
                                console.warn('section ' + stateName + ' had no associated terminal, ignoring');
                                initializedTerminals[stateName] = true;
                                return;
                            }
                            for (let index = 0; index < terminalEl.length; index++) {
                                if (initializedTerminals[stateName + index]) {
                                    continue;
                                }
                                console.log('initializing terminal for section ' + stateName + '.' + index);
                                let pid = 0;
                                let term = initializedTerminals[stateName + index] = new Terminal({
                                    'macOptionIsMeta': true,
                                    'theme': {},
                                    'cols': terminalEl[index].getAttribute('data-cols') || 20,
                                    'rows': terminalEl[index].getAttribute('data-rows') || 20,
                                    'fontSize': terminalEl[index].getAttribute('data-fontsize') || 12
                                });
                                term.on('resize', function (size) {
                                    if (!pid) {
                                        return;
                                    }
                                    let cols = size.cols,
                                    rows = size.rows,
                                    url = terminalsUrl + '/' + pid + '/size?cols=' + cols + '&rows=' + rows;
                                    fetch(url, {method: 'POST'});
                                });
                                term.open(terminalEl[index]);
                                term.setOption('fontFamily', 'monospace');
                                term.setOption('enableBold', 'true');
                                term.setOption('cursorBlink', true);
                                term.setOption('fontSize', 13);
                                term.fit();
                                Reveal.layout();
                                let cwd = terminalEl[index].getAttribute('data-cwd');
                                let cmd = terminalEl[index].getAttribute('data-cmd');
                                let cmdnowrite = terminalEl[index].getAttribute('data-cmd-nowrite');
                                fetch(terminalsUrl + '?cols=' + term.cols + '&rows=' + term.rows +(cwd ? '&cwd=' + cwd : '') + (cmd ? '&cmd=' + cmd : '') + (cmdnowrite ? '&cmdnowrite=' + cmdnowrite : ''),{method: 'POST'}).then(function (res) {
                                    res.text().then(function (processId) {
                                        console.log('connecting to PID ' + processId);
                                        pid = processId;
                                        var socket = new WebSocket('ws://' + hostPort + '/terminals/' + processId);
                                        socket.onopen = function() {
                                            term.attach(socket);
                                            term._initialized = true;
                                            term.fit();
                                            Reveal.layout();
                                        };
                                    });
                                });
                            }
                        };
                        if (startSlide === section) {
                            handler();
                        } else {
                            Reveal.addEventListener(stateName, handler, false);
                        };
                    });
                }}
            ],
        `;
        contents = contents.replace('Reveal.initialize({', revealInitializeString);
        console.log("Converting HTML to DOM ...");
        doc = new JSDOM(contents);
        var terminals = doc.window.document.querySelectorAll('.terminal');
        console.log("Creating Terminals ...");
        for (var i = 0; i < terminals.length; i++) {
            console.log("Creating Terminal " + i);
            let attributesString = '';
            let attributes = terminals[i].attributes;
            for (var u = 0; u < attributes.length; u++) {
                if (attributes[u].name.match(/data-.*/))
                    attributesString += attributes[u].name + '="' + attributes[u].value + '" '
            }
            if (!terminals[i].closest('section').attributes['data-state'])
                terminals[i].closest('section').setAttribute('data-state', 'terminal-' + i);
            terminals[i].insertAdjacentHTML('beforeend', `
                <div class="custom fakeMenu">
                    <div class="custom fakeButtons fakeZoom" onclick='minimizeTerminal(this)'></div>
                    <div class="custom fakeButtons fakeClose" onclick='closeTerminal(this)'></div>
                </div>
                <div class="custom fakeScreen">
                    <div data-is-terminal ` + attributesString + ` style="height:100%" ></div>
                </div>`);
            terminals[i].classList.add('custom');
            terminals[i].classList.add('terminalWindow');
            terminals[i].setAttribute('style', 'margin: auto; display: inline-block;' + terminals[i].getAttribute('style'));
            if (terminals[i].getAttribute('data-display') != "null")
                terminals[i].getElementsByClassName("fakeScreen")[0].style.display = terminals[i].getAttribute('data-display');
            var siblings = terminals[i].closest('div:not(.terminal)').childNodes;
            for (var u = 0; u < siblings.length; u++) {
                if (siblings[u] !== terminals[i]) {
                    siblings[u].outerHTML = '';
                }
            }
        }
        console.log("Serializing DOM Document ...");
        contents = doc.serialize();
        console.log("Writing final results ...");
        fs.writeFile(output, contents, function(err, data) {
            if (err !== null) {
                console.log(err);
                process.exit();
            }
        }),
        console.log("Finished !");
    });
}