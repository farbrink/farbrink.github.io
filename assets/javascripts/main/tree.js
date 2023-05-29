/* *****************************************************************************
 * 
 * Influenced by Alejandro U. Alletez's tree generator 
 * (https://github.com/aurbano/TreeGenerator) and Teri Martin's Blue Willow Tree 
 * (http://fineartamerica.com/featured/blue-willow-tree-teri-martin.html).
 * 
 **************************************************************************** */

export default class Tree {

  constructor(canvasId, type, config) {
    this.live = true;
    this.type = type;

    this.leader = null;
    this.leaves = [];
    this.branches = [];
    this.twigs = [];

    this.activeElements = [];
    this.queuedElements = [];

    this.createCanvas(canvasId);
    this.setConfig(config);
    this.createLeafCanvas(canvasId);

    this.canvas.$element.css('background-color', this.config.canvasColor);

    this.growGrass();
  }

  _typeConfig() {
    return {
      birch: {
        branchAngleLimit: Math.PI / 3.0,
        canvasColor: '#bbcc99',
        leaderMaxBranches: 10,
        leaderSplitRange: 0.70,
        twigLeafColors: ['#669900', '#99cc11', '#ddeeaa', '#88bb55'],
        twigLeafThresh: 0.50,
        wiggle: 0.2,
        woodColors: ['#eeeeee', '#eeeeee', '#eeeeee', '#cccccc']
      },
      cherry: {
        branchAngleLimit: Math.PI / 2.0,
        branchSplitThreshRatio: 3.0 / 2.0,
        canvasColor: '#ffddee',
        twigLeafColors: ['#ffffff', '#ff3399', '#ffcccc', '#ff6699'],
        leafFlex: 4,
        twigLeafThresh: 1.0,
        wiggle: 1,
        woodColors: ['#554444']
      },
      willow: {
        branchSplitThreshRatio: 3.0 / 2.0,
        canvasColor: '#ccddee',
        leaderSplitRange: 0.80,
        twigLeafColors: ['#ffffff', '#3366cc', '#5500bb', '#7799ff'],
        maxActiveElements: 25,
        twigMaxLength: 0.35 * this.canvas.height,
        twigShape: 'cubic',
        wiggle: 0.5,
        woodColors: ['#444444']
      },
      wisteria: {
        branchAngleLimit: (5.0 * Math.PI) / 9.0,
        branchLeafColors: ['#809e71', '#a5cb91', '#d6ded4'],
        branchesHaveLeaves: true,
        branchMaxBranches: 3,
        branchSplitThreshRatio: 1.0,
        branchWidth: 1.00,
        canvasColor: '#e1d2ff',
        leaderSplitRange: 0.60,
        twigLeafColors: ['#d24ffe', '#df81fe', '#ecb3fe', '#efe3f5'],
        leafDiameter: 3,
        maxActiveElements: 25,
        twigLeafThresh: 0.95,
        twigShape: 'cubic',
        wiggle: 0.80,
        woodColors: ['#89897f']
      }
    }[this.type] || {}
  }

  createCanvas(canvasId) {
    let canvasElement = $('#' + canvasId);

    this.canvas = {
      $element: canvasElement,
      context2d: canvasElement[0].getContext('2d'),
      height: canvasElement.height(),
      width: canvasElement.width()
    }
  }

  createLeafCanvas(canvasId) {
    // put leaves in a separate layer to keep them on top. We configure the canvas
    // even when there are no leaves so that any previous leaves get reset.
    if ($('#leafCanvas').length == 0) {
      const leafCanvas = document.createElement('canvas');
      leafCanvas.id = 'leafCanvas';
      $(leafCanvas).insertAfter('#' + canvasId);
    }

    this.leafCanvas = {
      $element: $('#leafCanvas')[0],
      context2d: $('#leafCanvas')[0].getContext('2d'),
      height: this.canvas.height,
      width: this.canvas.width
    }

    this.leafCanvas.$element.height = this.canvas.height;
    this.leafCanvas.$element.width = this.canvas.width;
  }

  setConfig(config) {
    this.config = $.extend({
      // Greatest angle that a branch can originally deviate from its parent's angle.
      branchAngleLimit:       4.0 * Math.PI / 9.0,
      // Possible branch leaf colors.
      branchLeafColors:       ['#009933', '#33cc33', '#66ff33'],
      // Chances a leaf will grow on a branch when conditions are suitable.
      branchLeafThresh:       0.80,
      // Should branches grow leaves?
      branchesHaveLeaves:     false,
      // Maximum number of sub-branches a branch can have.
      branchMaxBranches:      2,
      // Chance that branches will split in proportion to the chance of their parent splitting.
      branchSplitThreshRatio: 5.0 / 4.0,
      // Width of a branch in proportion to its parent.
      branchWidth:            0.80,
      // Scene background color.
      canvasColor:            '#aaddff',
      // Should the scene have grass?
      hasGrass:               true,
      // Delay between each growth iteration. Higher numbers result in slower overall growth.
      growthRate:             0,
      // Approximate length branches grow per iteration.
      growthSegmentLength:    3,
      // Starting width of the leader.
      initialWidth:           30,
      // Ratio of leaf diameter to parent width.
      leafDiameter:           2,
      // Number of diameters a leaf's position can deviate from its parent branch.
      leafFlex:               3,
      // Statistically typical number of branches off the leader.
      leaderAvgNumBranches:   15,
      // Approximate height of the leader in proportion to the canvas height.
      leaderHeight:           0.95,
      // Maximum number of branches that can grow off the leader.
      leaderMaxBranches:      15,
      // Proportion of the leader, from the top down, on which branches can grow.
      leaderSplitRange:       0.75,
      // Upper limit on the number of wood elements that can be growing at once (to prevent computational slowdown).
      maxActiveElements:      50,
      // Maximum time that can pass between the initial generation of branches and twigs and their growth.
      maxSproutTime:          10,
      // Possible twig leaf colors.
      twigLeafColors:         ['#009933', '#33cc33', '#66ff33'],
      // Chances a leaf will grow on a twig when conditions are suitable.
      twigLeafThresh:         0.80,
      // Twig length upper limit.
      twigMaxLength:          0.20 * this.canvas.height,
      // Shape twigs grow in; either "cubic" or "random".
      twigShape:              'random',
      // Shoud twigs grow leaves?
      twigsHaveLeaves:        true,
      // The scalar for the amount each growth iteration can deviate from the path of the previous growth iteration.
      wiggle:                 0.5,
      // Possible wood colors for each growth iteration.
      woodColors:             ['#664444'],
      // The starting x-position.
      xOrigin:                this.canvas.width / 2,
      // The starting y-position.
      yOrigin:                this.canvas.height,
    }, this._typeConfig(), config);
  }

  /* Rename as grow */
  continueGrowth() {
    if (this.activeElements.length > 0) {
      for (let i = 0; i < this.activeElements.length; i = i + 1) {
        this.activeElements[i].grow();
      }

      const self = this;

      setTimeout(function () {
        self.continueGrowth();
      }, this.config.growthRate);
    }
  }

  /* Rename as plant */
  grow() {
    this.leader = new Leader(0, this, null, this.config.initialWidth, this.config.xOrigin, this.config.yOrigin);
    this.continueGrowth();
  }

  growGrass() {
    if (this.config.hasGrass) {
      let bladeHeight;
      let color;
      let endPoint;
      let grassColors = ['#222222', '#777777', '#aaaaaa', '#ffffff'];
      let bladeSway;

      for (let i = 0; i <= Math.floor(this.canvas.width); i = i + 2) {
        bladeHeight = Math.random() * (0.07 * this.canvas.height - (0.03 * this.canvas.height)) + (0.03 * this.canvas.height);
        color = grassColors[Math.floor(Math.random() * grassColors.length)];
        bladeSway = 0.25 * (Math.random() * (bladeHeight - (-1 * bladeHeight)) + -1 * bladeHeight);
        endPoint = [i + bladeSway, this.canvas.height - bladeHeight];

        this.canvas.context2d.lineWidth = 1;
        this.canvas.context2d.strokeStyle = color;

        this.canvas.context2d.beginPath();
        this.canvas.context2d.moveTo(i, this.canvas.height);
        this.canvas.context2d.quadraticCurveTo(i, endPoint[1], endPoint[0], endPoint[1]);
        this.canvas.context2d.stroke();
      }
    }
  }

  kill() {
    this.live = false;
    this.leader.live = false;

    let i;

    for (i = 0; i < this.branches.length; i++) {
      this.branches[i].live = false;
    }

    for (i = 0; i < this.twigs.length; i++) {
      this.twigs[i].live = false;
    }

    for (i = 0; i < this.leaves.length; i++) {
      this.leaves[i].live = false;
    }
  }
}

class LivingWood {

  constructor(level, generator, parent, width, x, y) {
    this.leaves = [];
    this.branches = [];
    this.twigs = [];

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
    // but because these are used in LivingWood prototype functions, defaults are
    // given.

    // dx: change in x-position for the next growth iteration.
    // dy: change in y-position for the next growth iteration.
    // loss: width taken off per growth iteration.
    // postBranchWidth: width after generating a branch in proportion to this 
    // branch's previous width.

    this.dx = 0;
    this.dy = 0;
    this.loss = 0.03;
    this.postBranchWidth = 1.00;

    this.leafColors = this.generator.config.twigLeafColors
  }

  canLeaf() { return false; }
  canSplit() { return false; }

  continueGrowth() {
    // if the width is still distinguishable, continue this branch.
    if (this.width >= 1) {
      this.guide();
    } else {
      const activeIndex = this.generator.activeElements.indexOf(this);

      if (activeIndex != -1) {
        this.generator.activeElements.splice(activeIndex, 1);

        if (this.generator.queuedElements.length > 0) {
          this.generator.queuedElements[0].start();
        }
      }
    }
  }

  generateLeaf() {
    if (this.width >= 1) {
      const flex = this.width * this.generator.config.leafFlex;
      const angle = Math.atan2(this.dy, this.dx);
      const flexX = flex * Math.abs(Math.sin(angle));
      const flexY = flex * Math.abs(Math.cos(angle));
      const x = this.x + (Math.random() * (flexX - (-1 * flexX)) + (-1 * flexX));
      const y = this.y + (Math.random() * (flexY - (-1 * flexY)) + (-1 * flexY));

      const color = this.leafColors[Math.floor(Math.random() * this.leafColors.length)]
      let childLeaf = new Leaf(color, this.generator, this, this.width * this.generator.config.leafDiameter, x, y);

      this.leaves.push(childLeaf);
      this.generator.leaves.push(childLeaf);
    }
  }

  generateBranch() {
    const width = (this.width) * this.generator.config.branchWidth;
    const x = this.x;
    const y = this.y;

    const childBranch = new Branch(this.level + 1, this.generator, this, width, x, y);

    this.branches.push(childBranch);
    this.generator.branches.push(childBranch);
    this.width = this.width * this.postBranchWidth;
  }

  generateTwig() {
    const width = (this.width) * this.generator.config.branchWidth;
    const x = this.x;
    const y = this.y;

    const childTwig = new Twig(this.level + 1, this.generator, this, width, x, y);

    this.twigs.push(childTwig);
    this.generator.twigs.push(childTwig);
  }

  grow() {
    if (this.live) {
      // the leader needs to be behind the grass.
      if (this.constructor == Leader) {
        this.generator.canvas.context2d.globalCompositeOperation = 'destination-over';
      }

      this.generator.canvas.context2d.strokeStyle = this.generator.config.woodColors[Math.floor(Math.random() * this.generator.config.woodColors.length)];
      this.generator.canvas.context2d.lineWidth = this.width;
      this.generator.canvas.context2d.beginPath();
      this.generator.canvas.context2d.moveTo(Math.floor(this.xPrev), Math.floor(this.yPrev));

      this.lifetime = this.lifetime + 1;
      this.width = this.width > this.loss ? this.width - this.loss : 0;
      this.xPrev = this.x;
      this.yPrev = this.y;
      this.x = this.x + this.dx;
      this.y = this.y + this.dy;

      this.generator.canvas.context2d.lineTo(Math.floor(this.x), Math.floor(this.y));
      this.generator.canvas.context2d.stroke();
      this.generator.canvas.context2d.globalCompositeOperation = 'source-over';

      if (this.canSplit()) {
        this.split();
      }

      if (this.canLeaf()) {
        this.generateLeaf();
      }

      this.continueGrowth();
    }
  }

  guide() {
    this.dx = 0;
    this.dy = 0;
  }

  split() {
    if (this.branches.length < this.maxBranches) {
      if (Math.random() < this.twigThresh()) {
        this.generateTwig();
      } else {
        this.generateBranch();
      }
    } else {
      this.generateTwig();
    }
  }

  start() {
    const activeIndex = this.generator.activeElements.indexOf(this);
    const queuedIndex = this.generator.queuedElements.indexOf(this);
    const self = this;

    if (this.generator.activeElements.length < this.generator.config.maxActiveElements) {
      if (queuedIndex != -1) {
        this.generator.queuedElements.splice(queuedIndex, 1);
      }

      if (activeIndex == -1) {
        this.generator.activeElements.push(this);

        setTimeout(function () {
          self.grow();
        }, Math.random() * this.generator.config.maxSproutTime);
      }
    } else if (queuedIndex == -1) {
      this.generator.queuedElements.push(this);
    }
  }
}

// the branch from which all other branches ultimately grow.
class Leader extends LivingWood {

  constructor(level, generator, parent, width, x, y) {
    super(level, generator, parent, width, x, y)

    // dx: see LivingWood.
    // dy: see LivingWood.
    // expectedLifetime: expected number of total iterations before this branch 
    // ends.
    // loss: see LivingWood.
    // maxBranches: maximum number of branches.
    // postBranchWidth: see LivingWood.
    // splitThresh: chance the branch will split into a new branch. calculated 
    // here with this.splitThresh * this.generator.config.splitRange * 
    // this.expectedLifetime = this.generator.config.leaderAvgNumBranches

    this.dx = 0;
    this.dy = -1 * this.generator.config.growthSegmentLength;
    this.expectedLifetime = ((this.generator.config.leaderHeight * this.generator.canvas.height) / this.generator.config.growthSegmentLength);
    this.growthSegmentLength = this.generator.config.growthSegmentLength
    this.loss = (this.generator.config.initialWidth - 1) / this.expectedLifetime;
    this.maxBranches = this.generator.config.leaderMaxBranches;
    this.postBranchWidth = 1.00;
    this.splitRange = this.generator.config.leaderSplitRange;
    this.splitThresh = (1 / this.generator.config.leaderSplitRange) * (this.generator.config.leaderAvgNumBranches / this.expectedLifetime);
    this.wiggle = this.generator.config.wiggle;

    // the leader must immediately become an active branch, no exceptions.
    this.generator.activeElements.push(this);
    this.grow();
  }

  canSplit() {
    const splittable = (this.lifetime / this.expectedLifetime) > (1 - this.splitRange) &&
      Math.random() < this.splitThresh;

    return (splittable);
  }

  continueGrowth() {
    if (this.width >= 2) {
      this.guide();
      // terminate in a small twig.
    } else {
      const activeIndex = this.generator.activeElements.indexOf(this);
      const childTwig = new Twig(this.level + 1, this.generator, this, this.width, this.x, this.y);

      this.twigs.push(childTwig);
      this.generator.twigs.push(childTwig);

      if (activeIndex != -1) {
        this.generator.activeElements.splice(activeIndex, 1);

        if (this.generator.queuedElements.length > 0) {
          this.generator.queuedElements[0].start();
        }
      }
    }
  }

  guide() {
    this.dx = this.dx + Math.sin(Math.random() + this.lifetime) * ((1 / 2) * this.wiggle);
    this.dy = -1 * this.growthSegmentLength;
  }

  twigThresh() {
    return ((this.lifetime / this.expectedLifetime) - (3 / 4));
  }
}

// non-inheriting class used to generate leaves on twigs and branches.
class Leaf {

  constructor(color, generator, parent, radius, x, y) {
    this.color = color
    this.generator = generator;
    this.live = this.generator.live;
    this.parent = parent;
    this.radius = radius;
    this.x = Math.floor(x);
    this.y = Math.floor(y);

    const maxRadius = this.generator.config.initialWidth / 4;

    if (this.radius > maxRadius) {
      this.radius = maxRadius;
    }

    this.grow();
  }

  grow() {
    if (this.live) {
      this.generator.leafCanvas.context2d.beginPath();
      this.generator.leafCanvas.context2d.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
      this.generator.leafCanvas.context2d.fillStyle = this.color;
      this.generator.leafCanvas.context2d.fill();
    }
  }
}

// limbs that can split into twigs or, sometimes, a few other branches.
class Branch extends LivingWood {

  constructor(level, generator, parent, width, x, y) {
    super(level, generator, parent, width, x, y);

    // dx: see LivingWood.
    // dy: see LivingWood.
    // loss: see LivingWood.
    // maxBranches: maximum number of branches.
    // postBranchWidth: see LivingWood.
    // splitThresh: chance the branch will split into a new branch. calculated 
    // here with this.splitThresh * ( 3 / 4 ) * this.expectedLifetime = this.generator.config.leaderAvgNumBranches

    // calculate an angle that is within 4 * Math.PI / 9 radians (80 degrees) in
    // either direction of the parent branch's angle, and start the branch in that
    // direction.

    const limitingAngle = this.generator.config.branchAngleLimit;
    const parentAngle = Math.atan2(this.parent.dy, this.parent.dx);
    const angle = Math.random() * ((parentAngle + limitingAngle) - (parentAngle - limitingAngle)) + (parentAngle - limitingAngle);

    this.dx = this.generator.config.growthSegmentLength * Math.cos(angle);
    this.dy = this.generator.config.growthSegmentLength * Math.sin(angle);
    this.hasLeaves = this.generator.config.branchesHaveLeaves;
    this.leafColors = this.generator.config.branchLeafColors;
    this.leafThresh = this.generator.config.branchLeafThresh;
    this.loss = this.generator.leader.loss * this.generator.config.branchWidth;
    this.maxBranches = (level <= 1 ? this.generator.config.branchMaxBranches : 0);
    this.postBranchWidth = 0.80;
    this.splitThresh = this.parent.splitThresh * this.generator.config.branchSplitThreshRatio;
    this.wiggle = this.generator.config.wiggle;

    this.start();
  }

  canLeaf() {
    if (this.hasLeaves) {
      if (this.leaves.length) {
        const lastLeaf = this.leaves[this.leaves.length - 1];
        const distToLastLeaf = Math.pow(Math.pow(Math.abs(this.y - lastLeaf.y), 2) + Math.pow(Math.abs(this.x - lastLeaf.x), 2), 1 / 2);

        return (distToLastLeaf > lastLeaf.radius * 2 && Math.random() < this.leafThresh);
      } else {
        const distToThisOrigin = Math.pow(Math.pow(Math.abs(this.y - this.yOrigin), 2) + Math.pow(Math.abs(this.x - this.xOrigin), 2), 1 / 2);
        return (distToThisOrigin > this.width * 5 && Math.random() < this.leafThresh);
      }
    }
  }

  canSplit() {
    return (this.lifetime > 5 && Math.random() < this.splitThresh);
  }

  continueGrowth() {
    if (this.width >= 3) {
      this.guide();
      // terminate in a small twig.
    } else {
      const activeIndex = this.generator.activeElements.indexOf(this);
      const childTwig = new Twig(this.level + 1, this.generator, this, this.width, this.x, this.y);

      this.twigs.push(childTwig);
      this.generator.twigs.push(childTwig);

      if (activeIndex != -1) {
        this.generator.activeElements.splice(activeIndex, 1);

        if (this.generator.queuedElements.length > 0) {
          this.generator.queuedElements[0].start();
        }
      }
    }
  }

  guide() {
    this.dx = this.dx + Math.sin(Math.random() + this.lifetime) * this.wiggle;
    this.dy = this.dy + Math.cos(Math.random() + this.lifetime) * this.wiggle;
  }

  twigThresh() {
    return (0.50);
  }
}

// bottom-level branches that can't split, but can leaf.
class Twig extends LivingWood {

  constructor(level, generator, parent, width, x, y) {
    super(level, generator, parent, width, x, y);

    // dx: see LivingWood.
    // dy: see LivingWood.
    // leafThresh: chance a new leaf will grow when conditions are appropriate.
    // loss: see LivingWood.

    this.growthSegmentLength = this.generator.config.growthSegmentLength;
    this.hasLeaves = this.generator.config.twigsHaveLeaves;
    this.leafThresh = this.generator.config.twigLeafThresh;
    this.shape = this.generator.config.twigShape;
    this.wiggle = this.generator.config.wiggle;

    if (this.shape == 'cubic') {
      // Ensure the direction of growth is correct.
      const direction = (this.xOrigin - this.parent.xOrigin) / Math.abs(this.xOrigin - this.parent.xOrigin);

      this.dy = this.generator.config.growthSegmentLength;
      this.dx = 3 * direction * (this.dy / Math.abs(this.dy)) * Math.cbrt(Math.abs(this.dy));
      this.loss = this.parent.loss / 2;

      // Never let a twig be so wide that it will extend beyond the canvas.
      // maxWidth - ( maxLifetime * this.loss ) = 1
      let maxTwigLength = this.generator.config.twigMaxLength;
      if (maxTwigLength > (this.generator.canvas.height - this.y)) { maxTwigLength = this.generator.canvas.height - this.y }

      const maxLength = maxTwigLength - (maxTwigLength * 0.20 * Math.random());
      const maxLifetime = maxLength / this.dy;
      const maxWidth = 1 + (maxLifetime * this.loss);

      if (this.width > maxWidth) { this.width = maxWidth; }
    } else if (this.shape == 'random') {
      // Calculate an angle that is within 4 * Math.PI / 9 radians (80 degrees) in
      // either direction of the parent branch's angle, and start the branch in that
      // direction.

      const limitingAngle = this.generator.config.branchAngleLimit;
      const parentAngle = Math.atan2(this.parent.dy, this.parent.dx);
      const angle = Math.random() * ((parentAngle + limitingAngle) - (parentAngle - limitingAngle)) + (parentAngle - limitingAngle);
      const growthSegmentLength = this.generator.config.growthSegmentLength;

      this.dx = growthSegmentLength * Math.cos(angle);
      this.dy = growthSegmentLength * Math.sin(angle);
      this.loss = this.parent.loss;

      const maxLifetime = this.generator.config.twigMaxLength / growthSegmentLength;
      const maxWidth = 1 + (maxLifetime * this.loss);

      if (this.width > maxWidth) { this.width = maxWidth; }
    } else {
      this.width = 0;
    }

    this.start();
  }

  canLeaf() {
    if (this.hasLeaves) {
      if (this.leaves.length) {
        const lastLeaf = this.leaves[this.leaves.length - 1];
        const distToLastLeaf = Math.pow(Math.pow(Math.abs(this.y - lastLeaf.y), 2) + Math.pow(Math.abs(this.x - lastLeaf.x), 2), 1 / 2);

        return (distToLastLeaf > lastLeaf.radius * 2 && Math.random() < this.leafThresh);
      } else {
        const distToThisOrigin = Math.pow(Math.pow(Math.abs(this.y - this.yOrigin), 2) + Math.pow(Math.abs(this.x - this.xOrigin), 2), 1 / 2);
        return (distToThisOrigin > this.width * 5 && Math.random() < this.leafThresh);
      }
    }
  }

  guide() {
    if (this.shape == 'cubic') {
      const direction = (this.xOrigin - this.parent.xOrigin) / Math.abs(this.xOrigin - this.parent.xOrigin);

      // x = ( y - yOrigin )^( 1 / 3 ) + xOrigin
      this.dy = this.growthSegmentLength;
      this.dx = 3 * direction * (((this.y + this.dy) - this.yOrigin) / Math.abs((this.y + this.dy) - this.yOrigin)) * (Math.cbrt(Math.abs((this.y + this.dy) - this.yOrigin)) - ((this.y - this.yOrigin) / Math.abs(this.y - this.yOrigin)) * Math.cbrt(Math.abs(this.y - this.yOrigin)));
    } else if (this.shape == 'random') {
      this.dx = this.dx + Math.sin(Math.random() + this.lifetime) * this.wiggle;
      this.dy = this.dy + Math.cos(Math.random() + this.lifetime) * this.wiggle;
    }
  }
}
