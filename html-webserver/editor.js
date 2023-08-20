const webSocketAddress = "ws://192.168.0.175:8765"

const exampleTsCode = [
    'console.log("Click to Load TS File");',
].join('\n');

require.config({
    paths: {
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.22.3/min/vs'
    }
});

require(['vs/editor/editor.main'], function() {
    let editor = monaco.editor.create(document.getElementById('container'), {
        value: exampleTsCode,
        language: 'typescript'
    });

    let socket = new WebSocket(webSocketAddress);

    let loadingContent = false; // Flag to   determine if we're loading content into the editor
    let selectedFile = null; // The currently selected file

    socket.onopen = function(event) {
        console.log("Connected to the WebSocket server");

        // Fetch list of files immediately upon connection
        socket.send(JSON.stringify({
            action: 'list'
        }));
    };

    const saveFile = function() {
        const tsCode = editor.getValue();
        // Transpile the TypeScript code to JavaScript
        const jsCode = ts.transpileModule(tsCode, {
            compilerOptions: {
                module: ts.ModuleKind.None
            }
        }).outputText;

        document.getElementById('jsCode').innerText = jsCode;

        // Send the TS and JS content to the server
        socket.send(JSON.stringify({
            action: 'save',
            tsContent: tsCode,
            jsContent: jsCode,
            fileName: selectedFile
        }));
    };


    editor.onDidChangeModelContent(function() {
        if (loadingContent) {
            // If we're just loading content, don't save it back to the server
            return;
        }

        const tsCode = editor.getValue();
        // Transpile the TypeScript code to JavaScript
        const jsCode = ts.transpileModule(tsCode, {
            compilerOptions: {
                module: ts.ModuleKind.None
            }
        }).outputText;

        document.getElementById('jsCode').innerText = jsCode;

    });



    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.action === 'load') {
            loadingContent = true; // Set the flag
            editor.setValue(data.content);
            loadingContent = false; // Reset the flag after loading the content

            document.getElementById('saveBtn').onclick = saveFile;

        } else if (data.action === 'list') {
            const fileExplorer = document.getElementById('fileExplorer');
            fileExplorer.innerHTML = ''; // Clear existing list

            data.files.forEach(file => {
                const listItem = document.createElement('div');
                listItem.textContent = file;
                listItem.style.cursor = 'pointer';
                listItem.addEventListener('click', function() {
                    selectedFile = file;
                    socket.send(JSON.stringify({
                        action: 'load',
                        filename: file
                    }));
                });
                fileExplorer.appendChild(listItem);
            });
        }
    };
});
