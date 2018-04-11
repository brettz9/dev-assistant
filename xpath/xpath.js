import {initLocales, _} from '../common/i18n.js';

const dp = new DOMParser();

function $ (sel, doc) {
    if (!doc) {
        doc = document;
    }
    return doc.querySelector(sel);
}

function decorate () {
    const expr = $('#expr').value;
    const inTxt = $('#in').value;
    const d = $('#out').contentDocument.body;
    let x;

    try {
        x = dp.parseFromString(inTxt, 'text/xml');
    } catch (e) {
        // Show error message
        $('#in').className = 'error';
        return;
    }

    if (x.documentElement.nodeName === 'parsererror') {
        // Show error message
        $('#in').className = 'error';
        return;
    }
    // No error
    $('#in').className = '';

    let nodes;
    try {
        nodes = x.evaluate(
            expr, x, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
        );
    } catch (e) {
        // Show error message
        $('#expr').className = 'error';
        return;
    }
    // No error
    $('#expr').className = '';

    for (let i = 0; i < nodes.snapshotLength; ++i) {
        const elt = nodes.snapshotItem(i);
        elt.marked = true;
    }

    // Output the tree
    const walker = document.createTreeWalker(
        x,
        NodeFilter.SHOW_ALL,
        {
            acceptNode (node) {
                if (node.nodeType === Node.TEXT_NODE &&
                    !(/[^\t\n\r ]/.test(node.nodeValue))) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        },
        true
    );

    // Generate the output tree
    d.innerHTML = '';
    addTree(walker, d);
}

// This function was taken from
// http://www.mozilla.org/docs/dom/samples/treewalkerdemo.xml
/*
 * Function that is called recursively to create the output tree
 * Note how this function is exactly the same independingly on what
 * filter we use, the TreeWalker handles the filtering for us
 */
function addTree (walker, destNode) {
    // Walk the TreeWalker tree...
    if (walker.firstChild()) {
        do {
            // ...and create an output node for every node we find
            const curNode = walker.currentNode;
            let newNode;
            switch (curNode.nodeType) {
            case Node.ELEMENT_NODE:
                newNode = document.createElement('tag');
                newNode.setAttribute('name', curNode.nodeName);
                break;
            default:
                newNode = document.createElement('text');
                newNode.setAttribute('value', curNode.nodeValue);
                break;
            }
            if (curNode.marked) {
                newNode.setAttribute('marked', 'true');
            }

            // Insert the output node and recursivly walk the children
            // of every node
            destNode.appendChild(newNode);
            addTree(walker, newNode);
        } while (walker.nextSibling());

        // Don't forget to return the TreeWalker to its previous state
        // before exiting the function
        walker.parentNode();
    }
}

/*
function load () {
    loadFileToTextbox(window, $('#in'), 'xml');
    decorate();
}

function save () {
    saveFileFromTextbox(window, $('#in'), 'xml');
}
*/

window.addEventListener('DOMContentLoaded', async () => {
    await initLocales();
    document.title = _('xpath_title');
    // $('#load').addEventListener('click', load);
    // $('#save').addEventListener('click', save);
    $('#expr').addEventListener('keyup', decorate);
    $('#in').addEventListener('keyup', decorate);
    $('#in').innerHTML = `<body>
    <h1>title</h1>
    <div id="menu">
        <ul>
            <li>home</li>
            <li>about</li>
        </ul>
    </div>
    <div id="sidebar">
        <ul>
            <li>one</li>
            <li>two</li>
        </ul>
    </div>
</body>`;
    decorate();
});
