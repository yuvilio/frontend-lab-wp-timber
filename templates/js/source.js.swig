//js for {{name}}
console.log('hey there from {{name}} ');

var marked = require('marked');
var slice = require('sliced');

window.addEventListener('load', function(){


//render all markdown in the html using marked library
slice(document.querySelectorAll('.marked')).forEach(function( el, i ){
el.outerHTML = '<p class="marked">' + marked(el.textContent) + '</p>';
});

}); //on load
