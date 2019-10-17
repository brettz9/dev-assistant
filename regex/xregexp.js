// This awesome library adds some extended functionality to stock JS Regexp-implementation
// The version below is the "minified" one
// XRegExp 0.5.1, <http://stevenlevithan.com/regex/xregexp/>, MIT License
//XRegExp 0.5.1, <stevenlevithan.com>, MIT License
if(!window.XRegExp){(function(){var D={exec:RegExp.prototype.exec,match:String.prototype.match,replace:String.prototype.replace,split:String.prototype.split},C={part:/(?:[^\\([#\s.]+|\\(?!k<[\w$]+>)[\S\s]?|\((?=\?(?!#|<[\w$]+>)))+|(\()(?:\?(?:(#)[^)]*\)|<([$\w]+)>))?|\\k<([\w$]+)>|(\[\^?)|([\S\s])/g,replaceVar:/(?:[^$]+|\$(?![1-9$&`']|{[$\w]+}))+|\$(?:([1-9]\d*|[$&`'])|{([$\w]+)})/g,extended:/^(?:\s+|#.*)+/,quantifier:/^(?:[?*+]|{\d+(?:,\d*)?})/,classLeft:/&&\[\^?/g,classRight:/]/g},A=function(H,F,G){for(var E=G||0;E<H.length;E++){if(H[E]===F){return E}}return -1},B=/()??/.exec("")[1]!==undefined;XRegExp=function(N,H){if(N instanceof RegExp){if(H!==undefined){throw TypeError("can't supply flags when constructing one RegExp from another")}return N.addFlags()}var H=H||"",E=H.indexOf("s")>-1,J=H.indexOf("x")>-1,O=false,Q=[],G=[],F=C.part,K,I,M,L,P;F.lastIndex=0;while(K=D.exec.call(F,N)){if(K[2]){if(!C.quantifier.test(N.slice(F.lastIndex))){G.push("(?:)")}}else{if(K[1]){Q.push(K[3]||null);if(K[3]){O=true}G.push("(")}else{if(K[4]){L=A(Q,K[4]);G.push(L>-1?"\\"+(L+1)+(isNaN(N.charAt(F.lastIndex))?"":"(?:)"):K[0])}else{if(K[5]){if(N.charAt(F.lastIndex)==="]"){G.push(K[5]==="["?"(?!)":"[\\S\\s]");F.lastIndex++}else{I=XRegExp.matchRecursive("&&"+N.slice(K.index),C.classLeft,C.classRight,"",{escapeChar:"\\"})[0];G.push(K[5]+I+"]");F.lastIndex+=I.length+1}}else{if(K[6]){if(E&&K[6]==="."){G.push("[\\S\\s]")}else{if(J&&C.extended.test(K[6])){M=D.exec.call(C.extended,N.slice(F.lastIndex-1))[0].length;if(!C.quantifier.test(N.slice(F.lastIndex-1+M))){G.push("(?:)")}F.lastIndex+=M-1}else{G.push(K[6])}}}else{G.push(K[0])}}}}}}P=RegExp(G.join(""),D.replace.call(H,/[sx]+/g,""));P._x={source:N,captureNames:O?Q:null};return P};RegExp.prototype.exec=function(I){var G=D.exec.call(this,I),F,H,E;if(G){if(B&&G.length>1){E=new RegExp("^"+this.source+"$(?!\\s)",this.getNativeFlags());D.replace.call(G[0],E,function(){for(H=1;H<arguments.length-2;H++){if(arguments[H]===undefined){G[H]=undefined}}})}if(this._x&&this._x.captureNames){for(H=1;H<G.length;H++){F=this._x.captureNames[H-1];if(F){G[F]=G[H]}}}if(this.global&&this.lastIndex>(G.index+G[0].length)){this.lastIndex--}}return G};String.prototype.match=function(E){if(!(E instanceof RegExp)){E=new XRegExp(E)}if(E.global){return D.match.call(this,E)}return E.exec(this)};String.prototype.replace=function(F,G){var E=(F._x||{}).captureNames;if(!(F instanceof RegExp&&E)){return D.replace.apply(this,arguments)}if(typeof G==="function"){return D.replace.call(this,F,function(){arguments[0]=new String(arguments[0]);for(var H=0;H<E.length;H++){if(E[H]){arguments[0][E[H]]=arguments[H+1]}}return G.apply(window,arguments)})}else{return D.replace.call(this,F,function(){var H=arguments;return D.replace.call(G,C.replaceVar,function(J,I,M){if(I){switch(I){case"$":return"$";case"&":return H[0];case"`":return H[H.length-1].slice(0,H[H.length-2]);case"'":return H[H.length-1].slice(H[H.length-2]+H[0].length);default:var K="";I=+I;while(I>E.length){K=D.split.call(I,"").pop()+K;I=Math.floor(I/10)}return(I?H[I]:"$")+K}}else{if(M){var L=A(E,M);return L>-1?H[L+1]:J}else{return J}}})})}};String.prototype.split=function(J,F){if(!(J instanceof RegExp)){return D.split.apply(this,arguments)}var G=[],E=J.lastIndex,K=0,I=0,H;if(F===undefined||+F<0){F=false}else{F=Math.floor(+F);if(!F){return[]}}if(!J.global){J=J.addFlags("g")}else{J.lastIndex=0}while((!F||I++<=F)&&(H=J.exec(this))){if(J.lastIndex>K){G=G.concat(this.slice(K,H.index),(H.index===this.length?[]:H.slice(1)));K=J.lastIndex}if(!H[0].length){J.lastIndex++}}G=K===this.length?(J.test("")?G:G.concat("")):(F?G:G.concat(this.slice(K)));J.lastIndex=E;return G}})()}RegExp.prototype.getNativeFlags=function(){return(this.global?"g":"")+(this.ignoreCase?"i":"")+(this.multiline?"m":"")+(this.extended?"x":"")+(this.sticky?"y":"")};RegExp.prototype.addFlags=function(A){var B=new XRegExp(this.source,(A||"")+this.getNativeFlags());if(this._x){B._x={source:this._x.source,captureNames:this._x.captureNames?this._x.captureNames.slice(0):null}}return B};RegExp.prototype.call=function(A,B){return this.exec(B)};RegExp.prototype.apply=function(B,A){return this.exec(A[0])};XRegExp.cache=function(C,A){var B="/"+C+"/"+(A||"");return XRegExp.cache[B]||(XRegExp.cache[B]=new XRegExp(C,A))};XRegExp.escape=function(A){return A.replace(/[-[\]{}()*+?.\\^$|,#\s]/g,"\\$&")};XRegExp.matchRecursive=function(P,D,S,F,B){var B=B||{},V=B.escapeChar,K=B.valueNames,F=F||"",Q=F.indexOf("g")>-1,C=F.indexOf("i")>-1,H=F.indexOf("m")>-1,U=F.indexOf("y")>-1,F=F.replace(/y/g,""),D=D instanceof RegExp?(D.global?D:D.addFlags("g")):new XRegExp(D,"g"+F),S=S instanceof RegExp?(S.global?S:S.addFlags("g")):new XRegExp(S,"g"+F),I=[],A=0,J=0,N=0,L=0,M,E,O,R,G,T;if(V){if(V.length>1){throw SyntaxError("can't supply more than one escape character")}if(H){throw TypeError("can't supply escape character when using the multiline flag")}G=XRegExp.escape(V);T=new RegExp("^(?:"+G+"[\\S\\s]|(?:(?!"+D.source+"|"+S.source+")[^"+G+"])+)+",C?"i":"")}while(true){D.lastIndex=S.lastIndex=N+(V?(T.exec(P.slice(N))||[""])[0].length:0);O=D.exec(P);R=S.exec(P);if(O&&R){if(O.index<=R.index){R=null}else{O=null}}if(O||R){J=(O||R).index;N=(O?D:S).lastIndex}else{if(!A){break}}if(U&&!A&&J>L){break}if(O){if(!A++){M=J;E=N}}else{if(R&&A){if(!--A){if(K){if(K[0]&&M>L){I.push([K[0],P.slice(L,M),L,M])}if(K[1]){I.push([K[1],P.slice(M,E),M,E])}if(K[2]){I.push([K[2],P.slice(E,J),E,J])}if(K[3]){I.push([K[3],P.slice(J,N),J,N])}L=N}else{I.push(P.slice(E,J))}if(!Q){break}}}else{D.lastIndex=S.lastIndex=0;throw Error("subject data contains unbalanced delimiters")}}if(J===N){N++}}if(Q&&!U&&K&&K[0]&&P.length>L){I.push([K[0],P.slice(L),L,P.length])}D.lastIndex=S.lastIndex=0;return I};
