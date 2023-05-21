import * as k from "./main/cover_letter.js";

let tree;
let type = [ 'birch', 'cherry', 'willow', 'wisteria' ][ Math.floor( Math.random(  ) * 4 ) ];
let windowWidth = $( window ).width(  );

$( document ).ready( function (  ) {
  console.log( 'Document loaded.' )
  console.log( type )

  k.instateScrollTo(  );
  
  k.instateCoverLetterSwitches(  );
  k.prepareCoverLetter( type );
} );

console.log( 'Script loaded.' )

k.instateResizeRefresh( type );
k.instateStickyHeader(  );

const textOutline = function ( color, width ) {
  width = width + 0;
  let shadow = "0 0 0 transparent";
  let i = 0;
  let w = 1;

  while ( i < width ) {
      i = i + 1;
      let j = 0;
      w = w + 2;

      for (let r = 1; r <= w; r++) {
        for (let c = 1; c <= w; c++) {
              let x = c - Math.ceil(w / 2);
              let y = r - Math.ceil(w / 2);

              shadow = `${shadow}, "${x}px ${y}px 0 ${color}"`;
          }
      }
  }

  console.log(shadow)
}

console.log(textOutline)