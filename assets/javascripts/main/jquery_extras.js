export const animateInSequence = function ( selector, animations, durations ) {
    
    var $elements = $( selector );
    
    
    if ( $elements.length > 0 ) {
        animateNextElement( $elements, 0, animations, durations );
    }
}

const animateNextElement = function ( $elements, index, animations, durations ) {
    
    if ( typeof( animations ) === 'function' && ( typeof( durations ) === 'number' || typeof( durations ) === 'string' ) ) {
        $( $elements[ index ] ).animate( animations, durations, function(  ) {
            if ( index < $elements.length ) {
                animateNextElement( $elements, index + 1, animations, durations );
            }
        } );
    } else if ( animations instanceof Array && durations instanceof Array ) {
        startNextAnimation( $elements, index, 0, animations, durations );
    }
}

const startNextAnimation = function ( $elements, elIndex, anIndex, animations, durations ) {
    
    $( $elements[ elIndex ] ).animate( animations[ anIndex ], durations[ anIndex ], function(  ) {
        if ( anIndex < animations.length ) {
            startNextAnimation( $elements, elIndex, anIndex + 1, animations, durations );
        } else if ( elIndex < $elements.length ) {
            animateNextElement( $elements, elIndex + 1, animations, durations );
        }
    } );
}
