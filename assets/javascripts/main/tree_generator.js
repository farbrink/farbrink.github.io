/* *****************************************************************************
 * 
 * Created April 18, 2016 by Farrah Brink. Influenced by Alejandro U. Alvarez's
 * generator (https://github.com/aurbano/TreeGenerator) and Teri Martin's Blue 
 * Willow Tree (http://fineartamerica.com/featured/blue-willow-tree-teri-martin.html).
 * 
 **************************************************************************** */

// use prototypal inheritance from Branch, but still use each type's 
// native constructor.
Leader.prototype = Object.create( Branch.prototype, { constructor: { value: Leader } } );
Limb.prototype = Object.create( Branch.prototype, { constructor: { value: Limb } } );
Twig.prototype = Object.create( Branch.prototype, { constructor: { value: Twig } } );

function Tree ( canvasId, type, config ) {
  
    Tree.prototype.instances.push( this );
    
    this.live = true;
    this.type = type;
    
    this.leader = null;
    this.leaves = [  ];
    this.limbs = [  ];
    this.twigs = [  ];
    
    this.activeBranches = [  ];
    this.queuedBranches = [  ];
    
    this.canvas = {
        $element: $( '#' + canvasId ),
        context2d: $( '#' + canvasId )[ 0 ].getContext( '2d' ),
        height: $( '#' + canvasId ).height(  ),
        width: $( '#' + canvasId ).width(  )
    }
    
    var type_config = {  };
    
    if ( this.type == 'birch' ) {
        type_config = {
            branchColors: [ '#eeeeee', '#eeeeee', '#eeeeee', '#cccccc' ],
            canvasColor: '#bbcc99',
            leaderSplitRange: 0.70,
            leafColors: [ '#669900', '#99cc11', '#ddeeaa', '#88bb55' ], 
            limbAngleLimit: Math.PI / 3.0,
            maxLeaderLimbs: 10,
            twigLeafThresh: 0.50,
            wiggle: 0.2
        }
    } else if ( this.type == 'cherry' ) {
        type_config = {
            branchColors: [ '#554444' ],
            canvasColor: '#ffddee',
            leafColors: [ '#ffffff', '#ff3399', '#ffcccc', '#ff6699' ],
            leafFlex: 4, 
            limbAngleLimit: Math.PI / 2.0,
            limbSplitThreshRatio: 3.0 / 2.0,
            twigLeafThresh: 1.0,
            wiggle: 1
        }
    } else if ( this.type == 'willow' ) {
        type_config = {
            branchColors: [ '#444444' ],
            canvasColor: '#ccddee',
            leaderSplitRange: 0.80,
            leafColors: [ '#ffffff', '#3366cc', '#5500bb', '#7799ff' ], 
            maxActiveBranches: 25,
            twigShape: 'cubic',
            wiggle: 0.5
        }
    }
    
    // avgNumLeaderBranches: statistically typical number of branches off the 
    // leader.
    // branchColor: branch color.
    // branchWidth: width of a branch in proportion to its parent.
    // canvasColor: canvas color.
    // grass: should this tree be in grass?
    // growthRate: delay between each growth iteration. highernumbers result in 
    // slower overall growth.
    // growthSegmentLength: approximate length branches grow per iteration.
    // initialWidth: starting width of the leader.
    // leaderHeight: height of the leader in proportion to the canvas height.
    // leaderSplitRange: proportion of the leader, from the top down, on which 
    // branches can grow.
    // leafColors: possible leaf colors.
    // leafFlex: number of diameters a leaf can deviate from its parent branch.
    // leaves: should this tree grow leaves?
    // limbAngleLimit: greatest angle that a limb can originally deviate from 
    // its parent's angle.
    // limbSplitThreshRatio: chance that limbs will split in proportion to the
    // chance of their parent splitting.
    // maxLeaderLimbs: maximum number of limbs that can grow off the leader.
    // maxLimbLimbs: maximum number of limbs that can grow off a limb.
    // maxSproutTime: maximum time that can pass between the initial generation 
    // of limbs and twigs and their growth.
    // twigLeafThresh: chances a leaf will grow on a twig when conditions are
    // suitable.
    // twigShape: shape that twigs grow in.
    // wiggle: roughly, the scalar for the amount each growth iteration can 
    // deviate from its previous path.
    // xOrigin: the starting x-position.
    // yOrigin: the starting y-position.
    
    this.config = $.extend( {
        avgNumLeaderBranches: 15, 
        branchColors: [ '#664444' ],
        branchWidth: 0.80,
        canvasColor: '#aaddff',
        grass: true,
        growthRate: 0,
        growthSegmentLength: 3,
        initialWidth: 30, 
        leaderHeight: 0.95, 
        leaderSplitRange: 0.75, 
        leafColors: [ '#009933', '#33cc33', '#66ff33' ], 
        leafFlex: 3,
        leaves: true,
        limbAngleLimit: 4.0 * Math.PI / 9.0,
        limbSplitThreshRatio: 5.0 / 4.0,
        maxActiveBranches: 50,
        maxLeaderLimbs: 15,
        maxLimbLimbs: 2,
        maxSproutTime: 10,
        twigLeafThresh: 0.80,
        twigShape: 'random',
        wiggle: 0.5, 
        xOrigin: this.canvas.width / 2,
        yOrigin: this.canvas.height, 
    }, type_config, config );
    
    this.canvas.$element.css( 'background-color', this.config.canvasColor );
    
    if ( this.config.grass ) {
        var bladeHeight;
        var color;
        var endPoint;
        var grassColors = [ '#222222', '#777777', '#aaaaaa', '#ffffff' ];
        var bladeSway;
        
        for ( var i = 0; i <= Math.floor( this.canvas.width ); i = i + 2 ) {
            bladeHeight = Math.random(  ) * ( 0.07 * this.canvas.height - ( 0.03 * this.canvas.height ) ) + ( 0.03 * this.canvas.height );
            color = grassColors[ Math.floor( Math.random(  ) * grassColors.length ) ];
            bladeSway = 0.25 * ( Math.random(  ) * ( bladeHeight - ( -1 * bladeHeight ) ) + -1 * bladeHeight );
            endPoint = [ i + bladeSway, this.canvas.height - bladeHeight ];
            
            this.canvas.context2d.lineWidth = 1;
            this.canvas.context2d.strokeStyle = color;
            
            this.canvas.context2d.beginPath(  );
            this.canvas.context2d.moveTo( i, this.canvas.height );
            this.canvas.context2d.quadraticCurveTo( i, endPoint[ 1 ], endPoint[ 0 ], endPoint[ 1 ] );
            this.canvas.context2d.stroke(  );
        }
    }
    
    if ( this.config.leaves ) {
        // put leaves in a separate layer to keep them on top.
        if ( $( '#leafCanvas' ).length == 0 ) {
            var leafCanvas = document.createElement( 'canvas' );
            leafCanvas.id = 'leafCanvas';
            $( leafCanvas ).insertAfter( '#' + canvasId );
        }
        
        this.leafCanvas = {
            $element: $( '#leafCanvas' )[ 0 ],
            context2d: $( '#leafCanvas' )[ 0 ].getContext( '2d' ),
            height: this.canvas.height,
            width: this.canvas.width
        }
        
        this.leafCanvas.$element.height = this.canvas.height;
        this.leafCanvas.$element.width = this.canvas.width;
    }
}

Tree.prototype.continueGrowth = function (  ) {
    
    if ( this.activeBranches.length > 0 ) {
        for ( var i = 0; i < this.activeBranches.length; i = i + 1 ) {
            this.activeBranches[ i ].grow(  );
        }
        
        var self = this;
        
        setTimeout( function (  ) {
			      self.continueGrowth(  );
		    }, this.config.growthRate );
    }
}

Tree.prototype.grow = function (  ) {
    
    this.leader = new Leader( 0, this, null, this.config.initialWidth, this.config.xOrigin, this.config.yOrigin );
    this.continueGrowth(  );
}

Tree.prototype.instances = [  ];

Tree.prototype.kill = function (  ) {
    
    this.live = false;
    this.leader.live = false;
    
    var i;
    
    for ( i = 0; i < this.limbs.length; i++ ) {
        this.limbs[ i ].live = false;
    }
    
    for ( i = 0; i < this.twigs.length; i++ ) {
        this.twigs[ i ].live = false;
    }
    
    for ( i = 0; i < this.leaves.length; i++ ) {
        this.leaves[ i ].live = false;
    }
}

function Branch ( level, generator, parent, width, x, y ) {
    
    this.leaves = [  ];
    this.limbs = [  ];
    this.twigs = [  ];
    
    // level: ancestry distance from the leader.
    // lifetime: number of growth iterations this branch has gone through.
    // live: should this branch continue growing?
    // generator: pointer for the origin tree generator.
    // parent: branch that split to form this one.
    // width: width tracker.
    // x: x-position tracker.
    // xOrigin: the starting x-position.
    // xPrev: the previous x-position.
    // y: y-position tracker.
    // yOrigin: the starting y-position.
    // yPrev: the previous y-position.
    
    this.level = level;
    this.lifetime = 0;
    this.live = generator.live;
    this.generator = generator;
    this.parent = parent;
    this.width = width;
    this.x = x;
    this.xOrigin = x;
    this.xPrev = x;
    this.y = y;
    this.yOrigin = y;
    this.yPrev = y;
    
    // DEFAULTS: these values should overwritten by subclasses if ever used.
    // but because these are used in Branch prototype functions, defaults are
    // given.
    
    // dx: change in x-position for the next growth iteration.
    // dy: change in y-position for the next growth iteration.
    // loss: width taken off per growth iteration.
    // postLimbWidth: width after generating a limb in proportion to this 
    // branch's previous width.
    
    this.dx = 0;
    this.dy = 0;
    this.loss = 0.03;
    this.postLimbWidth = 1.00;
}

Branch.prototype.canLeaf = function (  ) {
    
    return( false );
}

Branch.prototype.canSplit = function (  ) {
    
    return( false );
}

Branch.prototype.continueGrowth = function (  ) {
    
    // if the width is still distinguishable, continue this branch.
    if ( this.width >= 1 ) {
        this.guide(  );
    } else {
        var activeIndex = this.generator.activeBranches.indexOf( this );
        
        if ( activeIndex != -1 ) {
            this.generator.activeBranches.splice( activeIndex, 1 );
            
            if ( this.generator.queuedBranches.length > 0 ) {
                this.generator.queuedBranches[ 0 ].start(  );
            }
        }
    }
}

Branch.prototype.generateLeaf = function (  ) {
    
    if ( this.generator.config.leaves ) {
        var flex = this.width * this.generator.config.leafFlex;
        var angle = Math.atan2( this.dy, this.dx );
        var flexX = flex * Math.abs( Math.sin( angle ) );
        var flexY = flex * Math.abs( Math.cos( angle ) );
        var x = this.x + ( Math.random(  ) * ( flexX - ( -1 * flexX ) ) + ( -1 * flexX ) );
        var y = this.y + ( Math.random(  ) * ( flexY - ( -1 * flexY ) ) + ( -1 * flexY ) );
        
        childLeaf = new Leaf( this.generator, this, this.width * 2, x, y );
        
        this.leaves.push( childLeaf );
        this.generator.leaves.push( childLeaf );
    }
}

Branch.prototype.generateLimb = function (  ) {
    
    var width = ( this.width ) * this.generator.config.branchWidth;
    var x = this.x;
    var y = this.y;
    
    var childLimb = new Limb( this.level + 1, this.generator, this, width, x, y );
        
    this.limbs.push( childLimb );
    this.generator.limbs.push( childLimb );
    this.width = this.width * this.postLimbWidth;
}

Branch.prototype.generateTwig = function(  ) {
    
    var width = ( this.width ) * this.generator.config.branchWidth;
    var x = this.x;
    var y = this.y;
    
    var childTwig = new Twig( this.level + 1, this.generator, this, width, x, y );
        
    this.twigs.push( childTwig );
    this.generator.twigs.push( childTwig );
}

Branch.prototype.grow = function(  ) {
    
    if ( this.live ) {
        // the leader needs to be behind the grass.
        if ( this.constructor == Leader ) {
            this.generator.canvas.context2d.globalCompositeOperation = 'destination-over';
        }
        
        this.generator.canvas.context2d.strokeStyle = this.generator.config.branchColors[ Math.floor( Math.random(  ) * this.generator.config.branchColors.length ) ];
        this.generator.canvas.context2d.lineWidth = this.width;
        this.generator.canvas.context2d.beginPath(  );
        this.generator.canvas.context2d.moveTo( Math.floor( this.xPrev ), Math.floor( this.yPrev ) );
        
        this.lifetime = this.lifetime + 1;
        this.width = this.width - this.loss;
        this.xPrev = this.x;
        this.yPrev = this.y;
        this.x = this.x + this.dx;
        this.y = this.y + this.dy;
        
        this.generator.canvas.context2d.lineTo( Math.floor( this.x ), Math.floor( this.y ) );
        this.generator.canvas.context2d.stroke(  );
        this.generator.canvas.context2d.globalCompositeOperation = 'source-over';
        
        if ( this.canSplit(  ) ) {
            this.split(  );
        }
        
        if ( this.canLeaf(  ) ) {
            this.generateLeaf(  );
        }
        
        this.continueGrowth(  );
    }
}

Branch.prototype.guide = function (  ) {
    
    this.dx = 0;
    this.dy = 0;
}

Branch.prototype.split = function (  ) {
    
    if ( this.limbs.length < this.maxLimbs ) {
        if ( Math.random(  ) < this.twigThresh(  ) ) {
            this.generateTwig(  );
        } else {
            this.generateLimb(  );
        }
    } else {
        this.generateTwig(  );
    }
}

Branch.prototype.start = function (  ) {
    
    var activeIndex = this.generator.activeBranches.indexOf( this );
    var queuedIndex = this.generator.queuedBranches.indexOf( this );
    var self = this;
    
    if ( this.generator.activeBranches.length < this.generator.config.maxActiveBranches ) {
        if ( queuedIndex != -1 ) {
            this.generator.queuedBranches.splice( queuedIndex, 1 );
        }
        
        if ( activeIndex == -1 ) {
            this.generator.activeBranches.push( this );
            
            setTimeout( function(  ) {
                self.grow(  );
            }, Math.random(  ) * this.generator.config.maxSproutTime );
        }
    } else if ( queuedIndex == -1 ) {
        this.generator.queuedBranches.push( this );
    }
}

// the branch from which all other branches ultimately grow.
function Leader ( level, generator, parent, width, x, y ) {
    
    // constructor stealing.
    Branch.call( this, level, generator, parent, width, x, y );
    
    // dx: see Branch.
    // dy: see Branch.
    // expectedLifetime: expected number of total iterations before this branch 
    // ends.
    // loss: see Branch.
    // maxLimbs: maximum number of limbs.
    // postLimbWidth: see Branch.
    // splitThresh: chance the branch will split into a new branch. calculated 
    // here with this.splitThresh * this.generator.config.splitRange * 
    // this.expectedLifetime = this.generator.config.avgNumLeaderBranches
    
    this.dx = 0;
    this.dy = -1 * this.generator.config.growthSegmentLength;
    this.expectedLifetime = ( ( this.generator.config.leaderHeight * this.generator.canvas.height ) / this.generator.config.growthSegmentLength );
    this.loss = ( this.generator.config.initialWidth - 1 ) / this.expectedLifetime;
    this.maxLimbs = this.generator.config.maxLeaderLimbs;
    this.postLimbWidth = 1.00;
    this.splitThresh = ( 1 / this.generator.config.leaderSplitRange ) * ( this.generator.config.avgNumLeaderBranches / this.expectedLifetime );
    
    // the leader must immediately become an active branch, no exceptions.
    this.generator.activeBranches.push( this );
    this.grow(  );
}

Leader.prototype.canSplit = function (  ) {
    
    var splittable = ( this.lifetime / this.expectedLifetime ) > ( 1 - this.generator.config.leaderSplitRange ) &&
      Math.random(  ) < this.splitThresh;
    
    return( splittable );
}

Leader.prototype.guide = function(  ) {
    
    this.dx = this.dx + Math.sin( Math.random(  ) + this.lifetime ) * ( ( 1 / 2 ) * this.generator.config.wiggle );
    this.dy = -1 * this.generator.config.growthSegmentLength;
}

Leader.prototype.twigThresh = function (  ) {
    
    return( ( this.lifetime / this.expectedLifetime ) - ( 3 / 4 ) );
}

// non-inheriting prototype used to generate leaves on twigs.
function Leaf ( generator, parent, radius, x, y ) {
    
    this.generator = generator;
    this.live = this.generator.live;
    this.parent = parent;
    this.radius = radius;
    this.x = Math.floor( x );
    this.y = Math.floor( y );
    
    if ( this.radius > this.generator.config.initialWidth / 4 ) {
        this.radius = this.generator.config.initialWidth / 4;
    }
    
    this.grow(  );
}

Leaf.prototype.grow = function (  ) {
    
    if ( this.live ) {
        this.generator.leafCanvas.context2d.beginPath(  );
        this.generator.leafCanvas.context2d.arc( this.x, this.y, this.radius, 0, 2 * Math.PI, false );
        this.generator.leafCanvas.context2d.fillStyle = this.generator.config.leafColors[ Math.floor( Math.random(  ) * this.generator.config.leafColors.length ) ];
        this.generator.leafCanvas.context2d.fill(  );
    }
}

// sub-branches that can split into twigs or, sometimes, a few other limbs.
function Limb ( level, generator, parent, width, x, y ) {
    
    // constructor stealing.
    Branch.call( this, level, generator, parent, width, x, y );
    
    // dx: see Branch.
    // dy: see Branch.
    // loss: see Branch.
    // maxLimbs: maximum number of limbs.
    // postLimbWidth: see Branch.
    // splitThresh: chance the branch will split into a new branch. calculated 
    // here with this.splitThresh * ( 3 / 4 ) * this.expectedLifetime = this.generator.config.avgNumLeaderBranches
    
    // calculate an angle that is within 4 * Math.PI / 9 radians (80 degrees) in
    // either direction of the parent branch's angle, and start the limb in that
    // direction.
    
    var limitingAngle = this.generator.config.limbAngleLimit;
    var parentAngle = Math.atan2( this.parent.dy, this.parent.dx );
    var angle = Math.random(  ) * ( ( parentAngle + limitingAngle ) - ( parentAngle - limitingAngle ) ) + ( parentAngle - limitingAngle );
    
    this.dx = this.generator.config.growthSegmentLength * Math.cos( angle );
    this.dy = this.generator.config.growthSegmentLength * Math.sin( angle );
    this.loss = this.generator.leader.loss * this.generator.config.branchWidth;
    this.maxLimbs = ( level <= 1 ? this.generator.config.maxLimbLimbs : 0 );
    this.postLimbWidth = 0.80;
    this.splitThresh = this.parent.splitThresh * this.generator.config.limbSplitThreshRatio;
    
    this.start(  );
}

Limb.prototype.canSplit = function (  ) {
    
    return( this.lifetime > 10 && Math.random(  ) < this.splitThresh );
}

Limb.prototype.continueGrowth = function (  ) {
    
    if ( this.width >= 2 ) {
        
        this.guide(  );
    // terminate in a small twig.
    } else {
        var activeIndex = this.generator.activeBranches.indexOf( this );
        var childTwig = new Twig( this.level + 1, this.generator, this, this.width, this.x, this.y );
        
        this.twigs.push( childTwig );
        this.generator.twigs.push( childTwig );
        
        if ( activeIndex != -1 ) {
            this.generator.activeBranches.splice( activeIndex, 1 );
            
            if ( this.generator.queuedBranches.length > 0 ) {
                this.generator.queuedBranches[ 0 ].start(  );
            }
        }
    }
}

Limb.prototype.guide = function(  ) {
    
    this.dx = this.dx + Math.sin( Math.random(  ) + this.lifetime ) * this.generator.config.wiggle;
    this.dy = this.dy + Math.cos( Math.random(  ) + this.lifetime ) * this.generator.config.wiggle;
}

Limb.prototype.twigThresh = function (  ) {
    
    return( 0.50 );
}

// bottom-level branches that can't split, but can leaf.
function Twig ( level, generator, parent, width, x, y ) {
    
    // constructor stealing.
    Branch.call( this, level, generator, parent, width, x, y );
    
    // dx: see Branch.
    // dy: see Branch.
    // leafThresh: chance a new leaf will grow when conditions are appropriate.
    // loss: see Branch.
    
    this.leafThresh = this.generator.config.twigLeafThresh;
        
    if ( this.generator.config.twigShape == 'cubic' ) {
        // ensure the direction of growth is correct.
        var direction = ( this.xOrigin - this.parent.xOrigin ) / Math.abs( this.xOrigin - this.parent.xOrigin );
        
        this.dy = this.generator.config.growthSegmentLength;
        this.dx = 3 * direction * ( this.dy / Math.abs( this.dy ) ) * Math.cbrt( Math.abs( this.dy ) );
        this.loss = this.parent.loss / 2;
        
        // never let a twig be so wide that it will extend beyond the canvas.
        // make sure it will stop within the last 20%, if not before.
        // maxWidth - ( maxLifetime * this.loss ) = 1
        
        var maxLifetime = ( ( this.generator.canvas.height - ( this.generator.canvas.height * ( 0.20 * Math.random(  ) ) ) ) - this.y ) / this.dy;
        var maxWidth = 1 + ( maxLifetime * this.loss )
        
        if ( this.width > maxWidth ) {
            this.width = maxWidth;
        }
    } else if ( this.generator.config.twigShape == 'random' ) {
        // calculate an angle that is within 4 * Math.PI / 9 radians (80 degrees) in
        // either direction of the parent branch's angle, and start the limb in that
        // direction.
        
        var limitingAngle = this.generator.config.limbAngleLimit;
        var parentAngle = Math.atan2( this.parent.dy, this.parent.dx );
        var angle = Math.random(  ) * ( ( parentAngle + limitingAngle ) - ( parentAngle - limitingAngle ) ) + ( parentAngle - limitingAngle );
    
        this.dx = this.generator.config.growthSegmentLength * Math.cos( angle );
        this.dy = this.generator.config.growthSegmentLength * Math.sin( angle );
        this.loss = this.parent.loss;
        
        var maxWidth = this.generator.config.initialWidth / 5;
        
        if ( this.width > maxWidth ) {
            this.width = maxWidth;
        }
    } else {
        this.width = 0;
    }
    
    this.start(  );
}

Twig.prototype.canLeaf = function (  ) {
    
    if ( this.leaves.length ) {
        var lastLeaf = this.leaves[ this.leaves.length - 1 ];
        var distToLastLeaf = Math.pow( Math.pow( Math.abs( this.y - lastLeaf.y ), 2 ) + Math.pow( Math.abs( this.x - lastLeaf.x ), 2 ), 1 / 2 );
    
        return( distToLastLeaf > lastLeaf.radius * 2 && Math.random(  ) < this.leafThresh );
    } else {
        var distToThisOrigin = Math.pow( Math.pow( Math.abs( this.y - this.yOrigin ), 2 ) + Math.pow( Math.abs( this.x - this.xOrigin ), 2 ), 1 / 2 );
        return( distToThisOrigin > this.width * 5 && Math.random(  ) < this.leafThresh );
    }
}

Twig.prototype.guide = function(  ) {
    
    if ( this.generator.config.twigShape == 'cubic' ) {
        
        var direction = ( this.xOrigin - this.parent.xOrigin ) / Math.abs( this.xOrigin - this.parent.xOrigin );
        
        // x = ( y - yOrigin )^( 1 / 3 ) + xOrigin
        this.dy = this.generator.config.growthSegmentLength;
        this.dx = 3 * direction * ( ( ( this.y + this.dy ) - this.yOrigin ) / Math.abs( ( this.y + this.dy ) - this.yOrigin ) ) * ( Math.cbrt( Math.abs( ( this.y + this.dy ) - this.yOrigin ) ) - ( ( this.y - this.yOrigin ) / Math.abs( this.y - this.yOrigin ) ) * Math.cbrt( Math.abs( this.y - this.yOrigin ) ) );
    } else if ( this.generator.config.twigShape == 'random' ) {
        this.dx = this.dx + Math.sin( Math.random(  ) + this.lifetime ) * this.generator.config.wiggle;
        this.dy = this.dy + Math.cos( Math.random(  ) + this.lifetime ) * this.generator.config.wiggle;
    }
}
