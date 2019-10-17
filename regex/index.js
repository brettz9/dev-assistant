// Todo: Add updated XRegExp file in or auto-copied from `node_modules`

// window.onError = _jrxErrorHandler;
// function _jrxErrorHandler (desc, url, line, char) { return; alert("Caught an unhandled exception\ndesc: (" + desc + ")\nurl: (" + url + ")\nline: (" + line + ")\nchar: (" + char + ")"); return true; }
function el(id) { return document.getElementById(id); }
function arraycontent(arr) { var outstr=''; for(var x in arr) outstr=outstr+x+": "+arr[x]+"\n"; return outstr; }

var isGecko = navigator.userAgent.toLowerCase().indexOf('gecko') != -1 ? true : false;
if (!isGecko) {
    alert("Due to lack of time, I've dropped IE-support almost completely, so the page may look skewed or not work correctly, Opera-support may come back though; see About for more details!\n\n"
    + "You'll be redirected to the last working IE/Opera version now.");
    document.location = "jrx.nongecko.html";
}


var JRX =
{
    O_RESULT_WIDTH: 81,
    // TODO: DELETE: are these 2 still needed?
    // I_REGEXP_WIDTH: 80;
    // I_TARGET_WIDTH: 80;
    // this hard-limit helps that regexps don't run infinitely, e.g. due to backtracking
    MAX_ITERATIONS: 250,

    // TODO: deleteme: is this needed?
    // this string keeps the old content of the target text
    // it's compared against the current content to see if it's changed
    _old_target     : '',

    _regexp         : '',
    _replacement    : '',
    _matches        : new Array(),
    _splits         : new Array(),
    _target         : '',
    _oldoptions     : new Array(),
    _oldregexp      : '',
    _oldreplacement : '',
    _oldtarget      : '',

    _samples: {
        dummy: {},
        u0: {desc: 'user expr'      , options: '',      expr: '', target: '', replacement: '', callback: ''},
        di: {desc: '/i demo'        , options: 'i',     expr: 'foo bar.+', target: "Foo bar bla\nfoo Bar blub\nfoo bar - this line will be matched only if the regexp is case-insensitive\nFoo Bar dummy", replace: '', callback: ''},
        dg: {desc: '/g demo'        , options: 'g',     expr: 'foo bar.+', target: "foo bar 1\nfoo bar this won't be matched without /g, matching stops after the first match\nfoo bar, this neither", replacement: '', callback: ''},
        ds: {desc: '/s demo'        , options: 's',     expr: 'foo.+bar', target: "foo\nbar\nwithout /s . will match anything BUT newline (\\n)", replacement: '', callback: ''},
        dm: {desc: '/m demo'        , options: 'm',     expr: '^foo.+', target: "this line will NOT be matched anyway\nfoo bar - this is the line that will be matched\nfoo bar - this line will NOT be matched either\n\nnormally without /m \"^\" & \"$\" would match only once\nthe very beginning and end of the text, and not recognize any line in between", replacement: '', callback: ''},
        dx: {desc: '/x demo'        , options: 'x',     expr: "#this is a comment\n#all inline whitespace is ignored in /x mode (Hello World below won't be matched)\n#use \\s or such to match whitespace\n(foo\\sbar|Hello World) # this is also a comment", target: "foo bar\nHello World", replacement: '', callback: ''},
        dp: {desc: 'split demo'     , options: 'p',     expr: ',', target: 'a typical,comma separated,entry,from a so-called CSV (comma-separated value) file', replacement: '', callback: ''},
        dr: {desc: 'replace demo'   , options: 'r',     expr: '(\\w{4,})\\s(\\w+)', target: 'foo bar hello world', replacement: '($2 .. $& -- $1)', callback: ''},
        de: {desc: 'evaldemo'       , options: 'e',     expr: '(\\S+)(\\s+)(\\S+)', target: 'foo\\tbar', replacement: '', callback: ''},
        xr: {desc: 'XRegExp named match', options: 'rx',expr: "(?<month>\\d{2}) # put this into \"month\"\n([\\.\\/])\n(?<day>\\d{2})   # then into \"day\"\n\\2              # use the same\n                # separator as above\n(?<year>\\d{4})  # finally into \"year\"\n# and convert a \"US\" date\n# to a \"European\" date", target: '12/31/1999', replacement: '${day}.${month}.${year}', callback: ''},
        s0: {desc: 'simple mail'    , options: 'gmx',   expr: "^\n[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*                                 # the username part\n@[a-zA-Z0-9-]+                                                            # hostname\n(\.[a-zA-Z0-9-]+)*\.(([0-9]{1,3})|([a-zA-Z]{2,3})|(aero|coop|info|museum|name))   #TLD\n$", target: "example@example.com\nfoo@bar.info\nblah@127.0.0.1\nbroken@@example.com\nfoo@bar.infp\nblah@.nospam.biz\ntaken from http://regexlib.com/", replacement: '', callback: ''},
        s1: {desc: 'simple url'     , options: 'gix',   expr: "(\n (\n  (file|gopher|news|nntp|telnet|http|ftp|https|tps|sftp)\n  ://\n )\n |\n (www.)\n)+\n(\n ([a-zA-Z0-9._-]+.[a-zA-Z]{2,6})\n |\n ([0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})\n)\n(/[a-zA-Z0-9&amp;%_./-~-]*)?", target: "http://diskusneforum.sk\nwww.diskusneforum.sk\nftp://123.123.123.123/\ndiskusneforum.sk\ntaken from http://regexlib.com/", replacement: '', callback: ''},
        cl: {desc: 'clear everything',options: 'clear', expr: '', target: '', replacement: '', callback: ''}
    },


    getRegExp: function()           { return this._regexp },
    setRegExp: function(text)       { this._oldregexp = this._regexp; this._regexp = text; el('i_regexp').value = this._regexp; },
    restoreRegExp: function()       { this._regexp = this._oldregexp; },
    focusRegExp: function()         { el('i_regexp').focus() },

    getReplacement: function()      { return this._replacement },
    setReplacement: function(text)  { this._oldreplacement = this._replacement; this._replacement = text; el('i_replace').value = this._replacement; },
    restoreReplacement: function()  { this._replacement = this._oldreplacement; },

    getTarget: function()           { return this._target },
    setTarget: function(text)       { this._oldtarget = this._target; this._target = text; el('i_target').value = this.target; },
    restoreTarget: function()       { this._target = this._oldtarget; },

    getOptGlobal: function()            { return el('i_global').checked ? 1 : 0 },
    setOptGlobal: function(bool)        { el('i_global').checked = bool ? 'checked' : '' },

    getOptMulti: function()             { return el('i_multiline').checked ? 1 : 0 },
    setOptMulti: function(bool)         { el('i_multiline').checked = bool ? 'checked' : '' },

    getOptSingle: function()            { return el('i_singleline').checked ? 1 : 0  },
    setOptSingle: function(bool)        { el('i_singleline').checked = bool ? 'checked' : '' },

    getOptInsensitive: function()       { return el('i_insensitive').checked ? 1 : 0 },
    setOptInsensitive: function(bool)   { el('i_insensitive').checked = bool ? 'checked' : '' },

    getOptExtended: function()          { return el('i_extended').checked ? 1 : 0 },
    setOptExtended: function(bool)      { el('i_extended').checked = bool ? 'checked' : '' },

    getOptSplit: function()             { return el('i_split').checked ? 1 : 0 },
    setOptSplit: function(bool)         { el('i_split').checked = bool ? 'checked' : ''; el('i_replace').checked = '' ; if(el('i_split')) JRX.toggleOutput(); },

    getOptReplace: function()           { return el('i_replace').checked ? 1 : 0 },
    setOptReplace: function(bool)       { el('i_replace').checked = bool ? 'checked' : ''; el('i_split').checked = ''; if(el('i_replace')) JRX.toggleOutput(); },

    getOptCompact: function()           { return el('i_compact').checked ? 1 : 0 },
    setOptCompact: function(bool)       { el('i_compact').checked = bool ? 'checked' : '' },

    getOptHelp: function()              { return el('i_miniref').checked ? 1 : 0 },
    setOptHelp: function(bool)          { el('i_miniref').checked = bool ? 'checked' : ''},

    getOptEval: function()              { return el('i_evaltarget').checked ? 1 : 0 },
    setOptEval: function(bool)          { el('i_evaltarget').checked = bool ? 'checked' : ''},




    updateTarget: function()
    {
        if(this._old_target != el('i_target').value)
        {
            this._target = el('i_target').value;
            el('o_target_len').innerHTML = this._target.length;
        }
    },


    toggleOutput: function()
    {
        if(el('i_replace').checked)
        {
            el('i_regexp').className = 'half';
            el('i_replacements').className = 'shared';
            el('o_result_replaced').className = 'shown';
            el('o_result_matched').className = 'hidden';
        }
        else
        {
            el('i_regexp').className = 'full';
            el('i_replacements').className = 'hidden';
            el('o_result_replaced').className = 'hidden';
            el('o_result_matched').className = 'shown';
        }
    },

    toggleMiniRef: function()
    {
        el('inlinehelp').style.visibility = el('i_miniref').checked ? 'visible' : 'hidden';
    },

    toggleVerbose: function()
    {
        el('pageheader').style.display = el('i_compact').checked ? 'none' : 'block';
        el('pagefooter').style.display = el('i_compact').checked ? 'none' : 'block';
        el('pagenews').style.display   = el('i_compact').checked ? 'none' : 'block';
    },

    toggleHelpAbout: function()
    {
        el('help_about').style.display = el('help_about').style.display == 'block' ? 'none' : 'block';
    },

    toggleTarget: function(show)
    {
        el('i_target').className = show ? 'shown' : 'hidden';
        el('o_target').className = show ? 'hidden': 'shown';
    },


    toggleTooltip: function(showtip, element, substrs)
    {
        if(el('i_split').checked || el('i_replace').checked)
            return true;

        if(!showtip)
        {
            el('result_tooltip').style.visibility = 'hidden';
        }
        else
        {
            if(substrs)
            {
                el('result_tooltip').innerHTML = 'Matched group (total ' + substrs[0].length + ' char' + (substrs[0].length ? 's' : '') +')<br/>'
                    +'Click to highlight, double-click to jump to that pos<br/><br/>';
                for(var i=0; i<substrs.length; i++)
                {
                    if(!substrs[i])
                        substrs[i] = '[not matched]';
                    el('result_tooltip').innerHTML += '<b>$' + i + ':</b>&gt;' + Util.unHTMLize(substrs[i]).replace(/\n/g, '\\n') + '&lt;<br/>';
                }
            }
            // alert("el(element).id: " + el(element).id + "\nel(element).offsetLeft: " + el(element).offsetLeft + "\nel(element).parentNode.scrollLeft: " + el(element).parentNode.scrollLeft + "\nel(element).offsetWidth: " + el(element).offsetWidth + "\n" + "el(element).id: " + el(element).id + "\nel(element).offsetTop: " + el(element).offsetTop + "\nel(element).parentNode.scrollTop: " + el(element).parentNode.scrollTop + "\nel(element).offsetHeight: " + el(element).offsetHeight);
            el('result_tooltip').style.left = el(element).offsetLeft - el(element).parentNode.scrollLeft + 0.5 * el(element).offsetHeight;
            el('result_tooltip').style.top  = el(element).offsetTop - el(element).parentNode.scrollTop + 1.5 * el(element).offsetHeight;
            el('result_tooltip').style.visibility = 'visible';
        }
    },


    selectTargetPortion: function(start, end, target)
    {
        if(!target)
            target = el('i_target');
        try {
            //if(target.setSelectionRange)
                //alert("yes: " + isGecko);
        }catch(e){
            throw(e);
        }

        if(isGecko)
        {
            target.setSelectionRange(start, end);
        }
        else
        {
            // supposed IE solution; this is not tested!
            var oRange = target.createTextRange();
            oRange.moveStart("character", start);
            oRange.moveEnd  ("character", end);
            oRange.select();
        }
    },

    highlightText: function(start, end, target)
    {
        if(!target)
            target = el('i_target');
        /* this doesn't work with textarea's
        var range = document.createRange();
        range.setStart(el('i_target'), start);
        range.setEnd(el('i_target'), end);
        range.scrollIntoView(false);
        */

        this.toggleTarget(false);
        // original target content
        var tc = target.value;
        // highlighted text
        var th = tc.substr(start, end-start).replace(/\n/g, '\\n\n');
        // htmlized target text
        var tc_html = Util.unHTMLize(tc.substr(0, start)) +  '<em id="highlighted_text">' + Util.unHTMLize(th) + '</em>' + Util.unHTMLize(tc.substr(end));
        el('o_target').innerHTML = tc_html;
        // el('o_target').innerHTML = tc_html.replace(/\n/g, "<br/>\n");
        el('highlighted_text').scrollIntoView(false);
    },


    updateResults: function()
    {
        var results_arr     = new Array;
        var num_results     = -1;    // -1: if invalid regexp, 0: nothing matched, >0: matches found
        var targetstr       = el('i_target').value;
        var regexpstr       = el('i_regexp').value;
        var regexp_is_valid = false;
        var item_id_prefix  = '_outitem';
        var item_prefix, item_suffix;
        var current_match;

        // this array keeps the matched strings' positions and lengths in the target text
        var textindex_arr       = new Array();
        // this array keeps the matched substrings ($1, $2, etc.) for each match
        var substr_arr          = new Array();
        var myRe;

        // clear old results
        el('o_result_replaced').innerHTML = '';
        el('o_result_matched').innerHTML = '';

        this._old_target = el('i_target').value;


        // replace special chars
        if (el('i_evaltarget').checked)
        {
            targetstr = targetstr.replace(/\\t/g, "\t");
            targetstr = targetstr.replace(/\\r/g, "\r");
            targetstr = targetstr.replace(/\\n/g, "\n");
            targetstr = targetstr.replace(/\\f/g, "\f");
            targetstr = targetstr.replace(/\\v/g, "\v");
            // eval('targetstr = "' + targetstr + '"');
        }

    /**
        try
        {
            var evalstr = '/' + regexpstr + '/'
                        + (el('i_global').checked      ? 'g' : '')
                        + (el('i_singleline').checked  ? 's' : '')
                        + (el('i_multiline').checked   ? 'm' : '')
                        + (el('i_insensitive').checked ? 'i' : '')
                        + (el('i_extended').checked    ? 'x' : '');
            myRe = eval('new XRegExp(' + evalstr + ')');
            regexp_is_valid = true;
        }
        catch(e)
        {
            num_results = -1;
        }
    /**/
    /**/
        if(regexpstr != '')
        {
            try
            {
                var mods =   (el('i_global').checked      ? 'g' : '')
                           + (el('i_singleline').checked  ? 's' : '')
                           + (el('i_multiline').checked   ? 'm' : '')
                           + (el('i_insensitive').checked ? 'i' : '')
                           + (el('i_extended').checked    ? 'x' : '');
                myRe = new XRegExp(regexpstr, mods);
                regexp_is_valid = true;
            }
            catch(e)
            {
                num_results = -1;
            }
        }
    /**/

        if(regexp_is_valid)
        {
            if(el('i_replace').checked)
            {
                num_results = 0;
                // we do the replacement twice, once to get the number of results and then the actual replacement
                Util.unHTMLize(targetstr).replace(myRe, function(){ num_results++ });
                el('o_result_replaced').innerHTML = Util.unHTMLize(targetstr).replace(myRe, '<em>' + el('i_replacements').value + '</em>');
                el('o_results_desc').innerHTML = 'replacements';
            }
            else if(el('i_split').checked)
            {
                var lastend = 0;
                // var split_arr = targetstr.split(myRe, this.MAX_ITERATIONS);
                var split_arr = String.split(targetstr, myRe, this.MAX_ITERATIONS);
                // get the positions of the splitted pieces
                for(var i=0; i<split_arr.length; i++)
                {
                    lastend = targetstr.indexOf(split_arr[i], lastend);
                    results_arr.push(targetstr.slice(lastend, lastend + split_arr[i].length));
                    textindex_arr[item_id_prefix + i] = new Array(lastend, lastend + split_arr[i].length);
                }
                num_results = results_arr.length;
                el('o_results_desc').innerHTML = 'splits';
            }
            else
            {
                // plain old matching
                var iterationcnt = 0;
                while(iterationcnt++ < (el('i_global').checked ? this.MAX_ITERATIONS : 1) && (current_match = myRe.exec(targetstr)) != null)
                {
                    // IE5 doesn't support array.push but who gives a shit about IE5 anymore >:) harhar
                    results_arr.push(current_match[0]);
                    textindex_arr[item_id_prefix + (iterationcnt - 1)] = new Array(current_match.index, current_match.index + current_match[0].length);
                    if(current_match[0].length == 0)
                        myRe.lastIndex++;
                    var dummy_arr = new Array();
                    for(var i = 0; i < current_match.length; i++)
                    {
                        dummy_arr.push(current_match[i]);

                    }
                    substr_arr[item_id_prefix + (iterationcnt - 1)] = dummy_arr;
                }
                num_results = results_arr.length;
                el('o_results_desc').innerHTML = 'match' + (num_results>1 ? 'es' : '');
            }
        }

        try
        {
            // insert the results into the results pane
            switch(num_results)
            {
                case -1:
                    results_arr = new Array('---NO RESULTS FOUND! MAYBE AN EMPTY/INVALID REGEXP?---');
                    textindex_arr = new Array();
                    el('o_num_results').innerHTML = '';
                    el('o_results_desc').innerHTML = 'invalid/empty regexp';
                    break;
                case 0:
                    results_arr = new Array('---Nothing could be matched!---');
                    textindex_arr = new Array();
                    el('o_num_results').innerHTML = '';
                    el('o_results_desc').innerHTML = 'nothing matched';
                    break;
                default:
                    el('o_num_results').innerHTML = num_results;
                    if(el('i_replace').checked)
                        el('o_results_desc').innerHTML = 'replacement' + (num_results>1 ? 's' : '');
                    else if(el('i_split').checked)
                        el('o_results_desc').innerHTML = 'splits';
                    else
                        el('o_results_desc').innerHTML = 'match' + (num_results>1 ? 'es' : '');
                    for(var i = 0; i < results_arr.length; i++)
                    {
                        var itemtext = results_arr[i];
                        if(el('i_evaltarget').checked)
                        {
                            itemtext = itemtext.replace(/\t/g, '\\t');
                            itemtext = itemtext.replace(/\r/g, '\\r');
                            itemtext = itemtext.replace(/\n/g, '\\n');
                            itemtext = itemtext.replace(/\f/g, '\\f');
                            itemtext = itemtext.replace(/\v/g, '\\v');
                        }

                        itemtext = itemtext.replace(/\s/g, String.fromCharCode(160));
                        item_prefix = i + ':>';
                        item_suffix = ' (' + textindex_arr[item_id_prefix + i][0] + '->' + textindex_arr[item_id_prefix + i][1] + ')';
                        itemtext = Util.cropString(itemtext, item_prefix+'<', item_suffix, this.O_RESULT_WIDTH);
                        itemtext = item_prefix + itemtext + '<' + Util.makeString(String.fromCharCode(160), this.O_RESULT_WIDTH - itemtext.length - item_prefix.length - item_suffix.length) + item_suffix;
                        itemtext = Util.unHTMLize(itemtext);
                        results_arr[i] = itemtext;
                    } // end for
            } // end switch(num_results)
        }
        catch(e)
        {
            textindex_arr = null;
            alert("caught:\n" + e);
        }

        // add the items to the output
        for(var i = 0; i < results_arr.length; i++)
        {
            var newid               = item_id_prefix + i;
            if(el(newid))
                el(newid).remove();
            var result_item         = document.createElement('li');
            {
                result_item.id          = newid;
                result_item.title       = 'click to highlight, double-click to jump to target text';
                result_item.innerHTML   = results_arr[i];
                // alert('>'+substr_arr[result_item.id]+'<' + "\n" + '>' + textindex_arr[result_item.id][0] + '<' + "\n" + (!el('i_split').checked && !el('i_replace').checked && substr_arr[item_id_prefix + i] ? 'true' : 'false') );
                // alert(el('i_split').checked + "\n" + el('i_replace').checked);
                try {
                    if(substr_arr[newid][0])
                    {
                        DOM.removeEvent (result_item, 'mousemove');
                        DOM.addEvent    (result_item, 'mousemove', function() { JRX.toggleTooltip(true, this.id, substr_arr[this.id]); JRX.highlightText(textindex_arr[this.id][0], textindex_arr[this.id][1]) });
                        DOM.removeEvent (result_item, 'mouseout');
                        DOM.addEvent    (result_item, 'mouseout', function() { JRX.toggleTooltip(false, this.id); });
                        DOM.removeEvent (result_item, 'click');
                        DOM.addEvent    (result_item, 'click', function() { JRX.highlightText(textindex_arr[this.id][0], textindex_arr[this.id][1]) });
                        DOM.removeEvent (result_item, 'dblclick');
                        DOM.addEvent    (result_item, 'dblclick',  function() { var st = el('o_target').scrollTop; JRX.toggleTarget(true); JRX.selectTargetPortion(textindex_arr[this.id][0], textindex_arr[this.id][1]); el('i_target').scrollTop = st; el('i_target').focus(); });
                    }
                } catch(e){}
            }
            el('o_result_matched').appendChild(result_item);
        }
    },

    setSampleOptions: function()
    {
        // JRX.saveUserSettings();
        // alert(JRX._oldoptions + "\n" + JRX._oldregexp + "\n" + JRX._oldreplacement + "\n" + JRX._oldtarget);
        var val = el('i_sample').options[el('i_sample').selectedIndex].value;
        var sam = this._samples[val];

        if(sam.options == 'clear')
        {
            el('i_regexp').value = '';
            el('i_target').value = '';
            el('i_replacements').value = '';
            JRX.setOptInsensitive(false);
            JRX.setOptGlobal(false);
            JRX.setOptSingle(false);
            JRX.setOptMulti(false);
            JRX.setOptExtended(false);
            JRX.setOptSplit(false);
            JRX.setOptReplace(false);
            JRX.setOptEval(false);
            JRX.updateTarget();
            JRX.updateResults();
            return;
        }

        // alert(el('i_sample').options[el('i_sample').selectedIndex].value);
        // alert(sam.desc + "-" + sam.expr);
        if(sam.expr)
            el('i_regexp').value = sam.expr;
        if(sam.target)
            el('i_target').value = sam.target;
        if(sam.replacement)
            el('i_replacements').value = sam.replacement;
        if(sam.options)
        {
            JRX.setOptInsensitive(false);
            JRX.setOptGlobal(false);
            JRX.setOptSingle(false);
            JRX.setOptMulti(false);
            JRX.setOptExtended(false);
            JRX.setOptSplit(false);
            JRX.setOptReplace(false);
            JRX.setOptEval(false);
            for(var i=0; i<sam.options.length; i++)
            {
                // alert('setting '+sam.options[i]);
                switch(sam.options[i])
                {
                    case 'i':
                        JRX.setOptInsensitive(true);
                        break;
                    case 'g':
                        JRX.setOptGlobal(true);
                        break;
                    case 's':
                        JRX.setOptSingle(true);
                        break;
                    case 'm':
                        JRX.setOptMulti(true);
                        break;
                    case 'x':
                        JRX.setOptExtended(true);
                        break;
                    case 'p':
                        JRX.setOptSplit(true);
                        break;
                    case 'r':
                        JRX.setOptReplace(true);
                        break;
                    case 'e':
                        JRX.setOptEval(true);
                        break;
                    default:
                        alert('unknown option: '+sam.options[i]);
                }
            }
        }
        if(sam.callback)
            eval(sam.callback);
        JRX.resizeInput();
        JRX.updateTarget();
        JRX.updateResults();
    },

    saveUserSettings: function()
    {
        this._oldoptions = '';
        this._oldoptions += JRX.getOptGlobal()      ? 'g' : '';
        this._oldoptions += JRX.getOptSingle()      ? 's' : '';
        this._oldoptions += JRX.getOptMulti()       ? 'm' : '';
        this._oldoptions += JRX.getOptInsensitive() ? 'i' : '';
        this._oldoptions += JRX.getOptExtended()    ? 'x' : '';
        this._oldoptions += JRX.getOptSplit()       ? 'p' : '';
        this._oldoptions += JRX.getOptReplace()     ? 'r' : '';
        this._oldoptions += JRX.getOptEval()        ? 'e' : '';
        this._oldregexp      = el('i_regexp').value;
        this._oldreplacement = el('i_replacements').value;
        this._oldtarget      = el('i_target').value;
        this._samples['u0'].options     = this._oldoptions;
        this._samples['u0'].expr        = this._oldregexp;
        this._samples['u0'].target      = this._oldtarget;
        this._samples['u0'].replacement = this._oldreplacement;
        // alert(this._oldoptions + "\n" + this._oldregexp + "\n" + this._oldreplacement + "\n" + this._oldtarget);
    },


    resizeInput: function()
    {
        var iArr = el('i_regexp').value.split("\n");
        var rArr = el('i_replacements').value.split("\n");
        var len = Math.max( (iArr ? iArr.length : 0), (rArr && el('i_replacements').className != 'hidden' ? rArr.length : 0) );
        // alert("Len: "+len +"\n" + iArr.length +"\n" + rArr.length);

        /* resize input if line number is:
          is 1 => 2
          btw 2 & 5 => 5
          btw 6 & 9 => 9
          more => 10
        */
        /*
        var rows = 10;
        if(len-6 <= 3) rows = 9;
        if(len-2 <= 3) rows = 5;
        if(len-1 <= 0) rows = 1;
        */

        // self.status = "len: " + el('i_regexp').value.length + ", cols: " + el('i_regexp').cols + ", mod: " + Math.ceil(el('i_regexp').value.length / el('i_regexp').cols);
        // rows = Math.ceil(el('i_regexp').value.length / el('i_regexp').cols);
        const rows = Math.max(len, Math.ceil(el('i_regexp').value.length / el('i_regexp').cols), Math.ceil(el('i_replacements').value.length / el('i_replacements').cols));
        el('i_regexp').rows = rows;
        el('i_regexp').style.height       = (rows*1.4)+'em';
        el('i_replacements').style.height = (rows*1.4)+'em';
    },

    checkMultiline: function()
    {
        el('i_multiline').disabled = !isGecko;
        el('i_singleline').disabled = !isGecko;
    },

    init: function()
    {
        DOM.addEvent(el('help'),            'click',     function() { JRX.toggleHelpAbout(); return false; });
        // DOM.addEvent(el('i_sample'),        'select',    function() { JRX.setSampleOptions(); });
        DOM.addEvent(el('i_sample'),        'change',    function() { JRX.setSampleOptions(); });
        DOM.addEvent(el('i_global'),        'click',     function() { JRX.updateResults(); });
        DOM.addEvent(el('i_singleline'),    'click',     function() { JRX.updateResults(); });
        DOM.addEvent(el('i_multiline'),     'click',     function() { JRX.updateResults(); });
        DOM.addEvent(el('i_insensitive'),   'click',     function() { JRX.updateResults(); });
        DOM.addEvent(el('i_extended'),      'click',     function() { JRX.updateResults(); });
        DOM.addEvent(el('i_split'),         'click',     function() { JRX.setOptSplit(el('i_split').checked); JRX.focusRegExp(); JRX.resizeInput(); JRX.updateResults(); });
        DOM.addEvent(el('i_replace'),       'click',     function() { JRX.setOptReplace(el('i_replace').checked); JRX.focusRegExp(); JRX.resizeInput(); JRX.updateResults(); });

        DOM.addEvent(el('i_compact'),       'click',     function() { JRX.toggleVerbose(); });
        DOM.addEvent(el('i_miniref'),       'click',     function() { JRX.toggleMiniRef(); });
    // TODO: DELETE   DOM.addEvent(el('cleartext'),       'click',     function() { clearTargetText(); JRX.updateTarget(); setTargetFocus(); });
        DOM.addEvent(el('i_evaltarget'),    'click',     function() { JRX.updateResults(); el('i_escaperesults').checked = el('i_evaltarget').checked; });
        DOM.addEvent(el('i_regexp'),        'keyup',     function() { JRX.updateResults(); JRX.resizeInput(); JRX.focusRegExp(); });
        DOM.addEvent(el('i_regexp'),        'change',    function() { JRX.saveUserSettings(); });
        DOM.addEvent(el('i_replacements'),  'keyup',     function() { JRX.updateResults(); JRX.resizeInput(); });
        DOM.addEvent(el('i_replacements'),  'change',    function() { JRX.saveUserSettings(); });
        DOM.addEvent(el('i_target'),        'keyup',     function() { JRX.updateTarget(); JRX.updateResults(); });
        DOM.addEvent(el('i_target'),        'change',    function() { JRX.updateTarget(); JRX.updateResults(); JRX.saveUserSettings(); });
        DOM.addEvent(el('o_target'),        'focus',     function() { JRX.toggleTarget(true); });
        DOM.addEvent(el('o_target'),        'click',     function() { JRX.toggleTarget(true); });
        DOM.addEvent(el('o_result_block'),  'mouseout',  function() { JRX.toggleTarget(true); });
        DOM.addEvent(el('helpme'),          'focus',     Util.theAnswerToLifeTheUniverseAndEverything);

        CookieManager.readSettings();

        this.checkMultiline();
        this.toggleOutput();
        this.toggleMiniRef();
        this.toggleVerbose();

        this._old_target = el('i_target').value;

        this.saveUserSettings();
        this.resizeInput();
        this.updateTarget();
        this.updateResults();
    }
} // end JRX
// alert("JRX obj:" + JRX.getRegExp());

var EmailDecryptor =
{
    // this portion courtesy of: Jim Tucek
    // converted to object syntax

    // Speaking of Java, this particular script is (C) Copyright 2002 Jim Tucek
    // If you wish to use my Email Encryption script, these comments must be left
    // alone!  That is all.

    // Visit www.jracademy.com/~jtucek/ for script information and a bit of help
    // setting it up, or www.jracademy.com/~jtucek/email.html for contact
    // information.

    // A brief history of this script can be found (and it's rather entertaining)
    // at www.jracademy.com/~jtucek/eencrypt.html

    goForth: function(c, n, d)
    {
        c += ' ';
        var length = c.length;
        var number = 0;
        // var bar = 0;
        var answer = '';
        for(var i = 0; i < length; i++)
        {
            number = 0;
            while(c.charCodeAt(i) != 32)
            {
                number = number * 10;
                number = number + c.charCodeAt(i)-48;
                i++;
            }
            answer += String.fromCharCode(this.decrypt(number,n,d));
        }
        return answer;
    },

    decrypt: function(c,n,d)
    {
        var foo, bar;
        // Split exponents up
        if (d % 2== 0)
        {
            bar = 1;
            for(var i = 1; i <= d/2; i++)
            {
                foo = (c*c) % n;
                bar = (foo*bar) % n;
            }
        }
        else
        {
            bar = c;
            for(var i = 1; i <= d/2; i++)
            {
                foo = (c*c) % n;
                bar = (foo*bar) % n;
            }
        }
        return bar;
    },

    dumpEmail: function()
    {
        var emailAddress = this.goForth('19960 31214 2956 9983 8670 16115 12124 31214 18007 11197 13184 19211 15558 30912 3065 29611 3065 8845 18057 21918 32133 13714 11821 13184 2956 21918', '34933', '29623');
        //emailAddress is the decrypted version of your email address, ie none@none.com
        document.write('<a href="mailto:' + emailAddress + '" title="send an email about JRX">drop me an email.</a>');
    }
} // end EmailDecryptor


var CookieManager =
{
    /*
     These 2 functions courtesy of
     http://javascript.about.com/library/blh2d.htm
     These 2 are used to serialize/deserialize textareas' values, to be used in cookies
    */
    hD: "0123456789ABCDEF",
    d2h: function(d)
    {
        var h = this.hD.substr(d&15, 1);
        while(d > 15) { d >>= 4; h = this.hD.substr(d&15, 1)+h; }
        return h;
    },
    h2d: function(h)
    {
        return parseInt(h, 16);
    },

    saveSettings: function()
    {
        var now = new Date();
        var expireat = new Date(now.getTime() + 1000 * 365 * 24 * 60 * 60);
        var cookieval = 'jrxcookie=';

        cookieval = cookieval + 'i_global'      + "-" + el('i_global').checked      + '+';
        cookieval = cookieval + 'i_singleline'  + "-" + el('i_singleline').checked  + '+';
        cookieval = cookieval + 'i_multiline'   + "-" + el('i_multiline').checked   + '+';
        cookieval = cookieval + 'i_insensitive' + "-" + el('i_insensitive').checked + '+';
        cookieval = cookieval + 'i_extended'    + "-" + el('i_extended').checked    + '+';
        cookieval = cookieval + 'i_split'       + "-" + el('i_split').checked       + '+';
        cookieval = cookieval + 'i_compact'     + "-" + el('i_compact').checked     + '+';
        cookieval = cookieval + 'i_miniref'     + "-" + el('i_miniref').checked     + '+';
        cookieval = cookieval + 'i_evaltarget'  + "-" + el('i_evaltarget').checked  + '+';
        cookieval = cookieval + 'i_replace'     + "-" + el('i_replace').checked  + '+';


        var t_regexp = el('i_regexp').value;
        var t_target = el('i_target').value;
        var t_replac = el('i_replacements').value;
        var t_regexp_enc = '';
        var t_target_enc = '';
        var t_replac_enc = '';
        var hc;         // returned hex-code
        for(var l in t_regexp)
        {
            hc = this.d2h(String.charCodeAt(t_regexp[l]));
            t_regexp_enc = t_regexp_enc + (hc.length == 1 ? '0' : '') + hc;
        }
        for(l in t_target)
        {
            hc = this.d2h(String.charCodeAt(t_target[l]));
            t_target_enc = t_target_enc + (hc.length == 1 ? '0' : '') + hc;
        }
        for(l in t_replac)
        {
            hc = this.d2h(String.charCodeAt(t_replac[l]));
            t_replac_enc = t_replac_enc + (hc.length == 1 ? '0' : '') + hc;
        }
        cookieval = cookieval + 'i_regexp'      + "-" + t_regexp_enc        + '+';
        cookieval = cookieval + 'i_target'      + "-" + t_target_enc        + '+';
        cookieval = cookieval + 'i_replacements'+ "-" + t_replac_enc        + '' ;   // note no + here!

        cookieval = cookieval + ';expires=' + expireat.toGMTString() + ';';

        document.cookie = cookieval;
    },

    readSettings: function()
    {
        if(document.cookie)
        {
            var cookiearr, cookiename, cookieval;
            var opts = document.cookie.substr(document.cookie.indexOf("=")+1).split('+');
            for(var o in opts)
            {
                cookiearr  = opts[o].split("-");
                cookiename = cookiearr[0];
                cookieval  = cookiearr[1];
                switch(el(cookiename).type)
                {
                    case 'checkbox':
                        el(cookiename).checked = cookieval == 'true' || cookieval == 'checked' ? 'checked' : '';
                        break;
                    case 'textarea':
                        var os = '';
                        for(var i = 0; i < cookieval.length; i = i + 2)
                            os = os + String.fromCharCode(this.h2d('0x'+cookieval.substr(i,2)));
                        el(cookiename).value = os;
                        break;
                    default:
                        alert("unidentified object in cookie:\nname: " + cookiename + "\nvalue: " + cookieval);
                }
            }
        }
    }
} // end CookieManager


var Util =
{
    unHTMLize: function(str)
    {
        return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : str;
    },

    makeString: function(ch, times)
    {
        var outstr = '';
        for(var i=0; i<times; i++)
            outstr = outstr + ch;
        return outstr;
    },

    cropString: function(str, prefix, suffix, strlen)
    {
        if(str.length <= strlen - prefix.length - suffix.length)
            return str;
        else
            return str.substr(0, strlen - prefix.length - suffix.length) + String.fromCharCode(0x2026);
    },

    theAnswerToLifeTheUniverseAndEverything: function()
    {
        alert(42);
    }
} // end CookieManager


var DOM =
{
    /*
     these 2 functions courtesy of
     http://ejohn.org/projects/flexible-javascript-events/
     addEvent( document.getElementById('foo'), 'click', doSomething );
     addEvent( obj, 'mouseover', function(){ alert('hello!'); } );
     removeEvent( object, eventType, function );

     These 2 are used to add custom eventhandlers
     Don't ask me if this is a better way than simply using onClick, onChange, etc.
     I'm not sure yet.
    */
    addEvent: function( obj, type, fn )
    {
        if ( obj.attachEvent )
        {
            obj['e'+type+fn] = fn;
            obj[type+fn] = function() { obj['e'+type+fn]( window.event ); }
            obj.attachEvent( 'on'+type, obj[type+fn] );
        }
        else
        {
            obj.addEventListener( type, fn, false );
        }
    },

    removeEvent: function( obj, type, fn )
    {
        if ( obj.detachEvent )
        {
            obj.detachEvent( 'on'+type, obj[type+fn] );
            obj[type+fn] = null;
        }
        else
        {
            obj.removeEventListener( type, fn, false );
        }
    }
} // end DOM
