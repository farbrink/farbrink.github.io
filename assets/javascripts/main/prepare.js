import Tree from './tree.js'
import { animateInSequence } from './jquery_extras.js'

export const instateSceneSwitches = function () {
  $(document).on('click', '.js-scene-switch', function () {
    window.sceneType = $(this).data('tree-type');

    prepareScene();
  });

  setTimeout(function () {
    repeatedlyEmphasizeSwitches();
  }, 2000);
}

export const instateResizeRefresh = function () {
  let windowWidth = $(window).width();

  $(window).resize(function () {
    if (windowWidth != $(window).width()) {
      windowWidth = $(window).width();
      prepareScene();
    }
  });
}

export const instateScrollTo = function () {
  $(document).on('click', '.js-scroll-link', function (event) {
    event.preventDefault();

    const elementPosition = $($(this).attr('href')).offset().top - $('.js-sticky-header').height();
    $('body, html').animate({ scrollTop: elementPosition }, 750);
  });
}

export const instateStickyHeader = function () {
  $(window).scroll(function () {
    if ($(this).scrollTop() > $('.js-sticky-header-wrapper').offset().top) {
      $('.js-sticky-header').addClass('-sticky');
    } else {
      $('.js-sticky-header').removeClass('-sticky');
    }
  });
}

export const prepareScene = function () {
  setSceneColor();

  if ($('#tree-canvas').length) {
    if (window.treeInstances.length) {
      for ( let i = 0; i < window.treeInstances.length; i++ ) {
        window.treeInstances[ i ].kill(  );
        window.treeInstances.splice( i, 1 );
      }
    }

    $('#tree-canvas')[0].height = $('#tree-canvas').parent().height();
    $('#tree-canvas')[0].width = $('#tree-canvas').parent().width();

    let tree = new Tree('tree-canvas', window.sceneType, {
      leaderHeight: 0.99,
      xOrigin: (3 / 4) * $('#tree-canvas')[0].width
    });
    window.treeInstances.push(tree)

    tree.grow();
  }
}

export const repeatedlyEmphasizeSwitches = function () {
  _emphasizeSwitches();
  setTimeout(function () {
    repeatedlyEmphasizeSwitches();
  }, 10000);
}

export const setSceneColor = function () {
  $('.js-scene-switch').removeClass('-open');
  $('.js-scene-switch[ data-tree-type="' + window.sceneType + '" ]').addClass('-open');

  $('.js-outlined-text')
    .removeClass('outline-birch')
    .removeClass('outline-cherry')
    .removeClass('outline-willow')
    .removeClass('outline-wisteria')
    .addClass('outline-' + window.sceneType);
}

const _emphasizeSwitches = function () {
  const switchHeight = 32;
  const switchWidth = 32;

  animateInSequence('.js-scene-switch',
    [{
      borderTopLeftRadius: 0.625 * switchHeight,
      borderTopRightRadius: 0.625 * switchHeight,
      borderBottomRightRadius: 0.625 * switchHeight,
      borderBottomLeftRadius: 0.625 * switchHeight,
      height: 1.25 * switchHeight,
      marginLeft: '-=' + 0.125 * switchWidth,
      marginRight: '-=' + 0.125 * switchWidth,
      marginTop: '-=' + 0.125 * switchHeight,
      width: 1.25 * switchWidth
    },
    {
      borderTopLeftRadius: 0.45 * switchHeight,
      borderTopRightRadius: 0.45 * switchHeight,
      borderBottomRightRadius: 0.45 * switchHeight,
      borderBottomLeftRadius: 0.45 * switchHeight,
      height: 0.9 * switchHeight,
      marginLeft: '+=' + 0.175 * switchWidth,
      marginRight: '+=' + 0.175 * switchWidth,
      marginTop: '+=' + 0.175 * switchHeight,
      width: 0.9 * switchWidth
    },
    {
      borderTopLeftRadius: 0.5 * switchHeight,
      borderTopRightRadius: 0.5 * switchHeight,
      borderBottomRightRadius: 0.5 * switchHeight,
      borderBottomLeftRadius: 0.5 * switchHeight,
      height: switchHeight,
      marginLeft: '-=' + 0.05 * switchWidth,
      marginRight: '-=' + 0.05 * switchWidth,
      marginTop: '-=' + 0.05 * switchHeight,
      width: switchWidth
    }],
    [
      100,
      100,
      100
    ]
  );
}