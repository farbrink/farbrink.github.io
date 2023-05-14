import * as k from "./main/cover_letter.js";

let tree;
let type = [ 'birch', 'cherry', 'willow' ][ Math.floor( Math.random(  ) * 3 ) ];
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