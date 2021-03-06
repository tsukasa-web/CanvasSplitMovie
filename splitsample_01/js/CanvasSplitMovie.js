/*
  CanvasSplitMovie
  Copyright(c) 2015 SHIFTBRAIN - Tsukasa Tokura
  This software is released under the MIT License.
  http://opensource.org/licenses/mit-license.php
 */
var CanvasSplitMovie,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

CanvasSplitMovie = (function() {
  CanvasSplitMovie.prototype.defaults = {
    splitNum: 5,
    liquid: true,
    targetImgArray: [],
    sceneWidth: false,
    sceneHeight: false,
    fps: 30
  };

  function CanvasSplitMovie(_$targetParent, options) {
    this.changeFps = __bind(this.changeFps, this);
    this.spriteClear = __bind(this.spriteClear, this);
    this.changeSplitNum = __bind(this.changeSplitNum, this);
    this._drawLoop = __bind(this._drawLoop, this);
    this.drawLoopStop = __bind(this.drawLoopStop, this);
    this.drawFullLoopStart = __bind(this.drawFullLoopStart, this);
    this.drawLoopStart = __bind(this.drawLoopStart, this);
    this._canvasResize = __bind(this._canvasResize, this);
    this.options = $.extend({}, this.defaults, options);
    this.canvasPointArray = [];
    this.imgPointArray = [];
    this.canvasPanelWidth = null;
    this.canvasYPanelNum = null;
    this.imgPanelresizedHeight = null;
    this.imgXPanelNum = null;
    this.imgYPanelNum = null;
    this.frameCount = 0;
    this.panelCount = 0;
    this.isFirst = true;
    this.$targetParent = _$targetParent;
    this.canvas = null;
    this.ctx = null;
    this.requestId = null;
    this.setTimerId = null;
    this.fpsInterval = 1000 / this.options.fps;
    this.timeLog = Date.now();
    this.requestAnimationFrame = (window.requestAnimationFrame && window.requestAnimationFrame.bind(window)) || (window.webkitRequestAnimationFrame && window.webkitRequestAnimationFrame.bind(window)) || (window.mozRequestAnimationFrame && window.mozRequestAnimationFrame.bind(window)) || (window.oRequestAnimationFrame && window.oRequestAnimationFrame.bind(window)) || (window.msRequestAnimationFrame && window.msRequestAnimationFrame.bind(window)) || function(callback, element) {
      this.setTimerId = window.setTimeout(callback, 1000 / 60);
    };
    this.cancelAnimationFrame = (window.cancelAnimationFrame && window.cancelAnimationFrame.bind(window)) || (window.webkitCancelAnimationFrame && window.webkitCancelAnimationFrame.bind(window)) || (window.mozCancelAnimationFrame && window.mozCancelAnimationFrame.bind(window)) || (window.oCancelAnimationFrame && window.oCancelAnimationFrame.bind(window)) || (window.msCancelAnimationFrame && window.msCancelAnimationFrame.bind(window)) || function(callback, element) {
      window.clearTimeout(this.setTimerId);
    };
    this._init();
  }

  CanvasSplitMovie.prototype._init = function() {
    var i, _i, _ref;
    if (this.options.targetImgArray.length === 0) {
      console.error('Image Array is empty.');
      return false;
    }
    for (i = _i = 0, _ref = this.options.targetImgArray.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      if (this.options.targetImgArray[i].width === 0 || !this.options.targetImgArray[i]) {
        console.error('Image not loaded.');
        return false;
      }
    }
    if (this.options.sceneWidth === false || this.options.sceneHeight === false) {
      console.error('Input Scene Size.');
      return false;
    }
    this.$targetParent.append('<canvas class="canvas-movie-sprite"></canvas>');
    this.canvas = this.$targetParent.find('.canvas-movie-sprite')[0];
    this.ctx = this.canvas.getContext("2d");
    this._canvasResize();
    if (this.options.liquid) {
      $(window).on('resize', this._debounce((function(_this) {
        return function() {
          return _this._canvasResize();
        };
      })(this), 300));
    }
  };

  CanvasSplitMovie.prototype._canvasResize = function() {
    var parentHeight, parentWidth;
    console.log('resize');
    parentWidth = this.$targetParent.width();
    parentHeight = this.$targetParent.height();
    $(this.canvas).attr({
      'width': parentWidth,
      'height': parentHeight
    });
    this._createCuttPoint(this.options.targetImgObject);
    if (!this.isFirst) {
      this.panelCount = this.canvasPointArray.length;
      if (!this.requestId) {
        this.frameCount = 0;
        this._drawSpriteImg();
      }
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.panelCount = 0;
      this.frameCount = 0;
    }
  };

  CanvasSplitMovie.prototype._debounce = function(func, threshold, execAsap) {
    var timeout;
    timeout = null;
    return function() {
      var args, delayed, obj;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      obj = this;
      delayed = function() {
        if (!execAsap) {
          func.apply(obj, args);
        }
        return timeout = null;
      };
      if (timeout) {
        clearTimeout(timeout);
      } else if (execAsap) {
        func.apply(obj, args);
      }
      return timeout = setTimeout(delayed, threshold || 100);
    };
  };

  CanvasSplitMovie.prototype._createCuttPoint = function() {
    var canvasHeight, canvasWidth, i, partsPointArray, _i, _j, _ref, _ref1;
    canvasWidth = this.canvas.width;
    canvasHeight = this.canvas.height;
    this.canvasPanelWidth = canvasWidth / this.options.splitNum;
    this.imgPanelresizedHeight = Math.ceil((this.canvasPanelWidth / this.options.sceneWidth) * this.options.sceneHeight);
    this.canvasYPanelNum = Math.ceil(canvasHeight / this.imgPanelresizedHeight);
    this.canvasPointArray = this._canvasPointPush();
    if (this.imgPointArray.length === 0) {
      for (i = _i = 0, _ref = this.options.targetImgArray.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        partsPointArray = this._imgPointPush(this.options.targetImgArray[i]);
        for (i = _j = 0, _ref1 = partsPointArray.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          this.imgPointArray.push(partsPointArray[i]);
        }
      }
    }
  };

  CanvasSplitMovie.prototype._canvasPointPush = function() {
    var i, i2, nowPoint, pointArray, _i, _j, _ref, _ref1;
    pointArray = [];
    nowPoint = 0;
    for (i = _i = 0, _ref = this.canvasYPanelNum; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      for (i2 = _j = 0, _ref1 = this.options.splitNum; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i2 = 0 <= _ref1 ? ++_j : --_j) {
        pointArray.push({
          x: i2 * this.canvasPanelWidth,
          y: nowPoint
        });
        if (i2 === this.options.splitNum - 1) {
          nowPoint += this.imgPanelresizedHeight;
        }
      }
    }
    return pointArray;
  };

  CanvasSplitMovie.prototype._imgPointPush = function(targetImg) {
    var i, i2, imgHeight, imgWidth, imgXPanelNum, imgYPanelNum, nowPoint, pointArray, _i, _j;
    imgWidth = targetImg.width;
    imgHeight = targetImg.height;
    imgXPanelNum = Math.ceil(imgWidth / this.options.sceneWidth);
    imgYPanelNum = Math.ceil(imgHeight / this.options.sceneHeight);
    pointArray = [];
    nowPoint = 0;
    for (i = _i = 0; 0 <= imgYPanelNum ? _i < imgYPanelNum : _i > imgYPanelNum; i = 0 <= imgYPanelNum ? ++_i : --_i) {
      for (i2 = _j = 0; 0 <= imgXPanelNum ? _j < imgXPanelNum : _j > imgXPanelNum; i2 = 0 <= imgXPanelNum ? ++_j : --_j) {
        pointArray.push({
          x: i2 * this.options.sceneWidth,
          y: nowPoint,
          img: targetImg
        });
        if (i2 === imgXPanelNum - 1) {
          nowPoint += this.options.sceneHeight;
        }
      }
    }
    return pointArray;
  };

  CanvasSplitMovie.prototype._drawSpriteImg = function() {
    var elapsed, i, now, steppedFrame, _i, _ref;
    now = Date.now();
    elapsed = now - this.timeLog;
    if (elapsed > this.fpsInterval) {
      this.timeLog = now - (elapsed % this.fpsInterval);
      if (this.isFirst) {
        this.frameCount++;
        if (this.panelCount < this.canvasPointArray.length) {
          this.panelCount++;
        } else {
          this.isFirst = false;
          this.panelCount = this.canvasPointArray.length;
        }
        if (this.frameCount >= this.imgPointArray.length) {
          this.frameCount = 0;
        }
      } else {
        if (this.frameCount < this.imgPointArray.length) {
          this.frameCount++;
        } else {
          this.frameCount = 0;
        }
      }
      for (i = _i = 0, _ref = this.panelCount; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (i + this.frameCount >= this.imgPointArray.length) {
          steppedFrame = (i + this.frameCount) % this.imgPointArray.length;
        } else {
          steppedFrame = i + this.frameCount;
        }
        this.ctx.drawImage(this.imgPointArray[steppedFrame].img, this.imgPointArray[steppedFrame].x, this.imgPointArray[steppedFrame].y, this.options.sceneWidth, this.options.sceneHeight, this.canvasPointArray[i].x, this.canvasPointArray[i].y, this.canvasPanelWidth, this.imgPanelresizedHeight);
      }
    }
  };

  CanvasSplitMovie.prototype.drawLoopStart = function() {
    if (!this.requestId) {
      this._drawLoop();
    }
  };

  CanvasSplitMovie.prototype.drawFullLoopStart = function() {
    if (!this.requestId) {
      this.panelCount = this.canvasPointArray.length;
      this._drawLoop();
    }
  };

  CanvasSplitMovie.prototype.drawLoopStop = function() {
    if (this.requestId) {
      this.cancelAnimationFrame(this.requestId);
      this.requestId = null;
    }
  };

  CanvasSplitMovie.prototype._drawLoop = function() {
    this.requestId = this.requestAnimationFrame(this._drawLoop);
    this._drawSpriteImg();
  };

  CanvasSplitMovie.prototype.changeSplitNum = function(_changeNum) {
    this.isFirst = true;
    this.options.splitNum = _changeNum;
    this._createCuttPoint();
    this.panelCount = 0;
    this.frameCount = 0;
  };

  CanvasSplitMovie.prototype.spriteClear = function() {
    this.isFirst = true;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.panelCount = 0;
    this.frameCount = 0;
  };

  CanvasSplitMovie.prototype.changeFps = function(_changeFps) {
    if (_changeFps !== this.options.fps) {
      this.options.fps = _changeFps;
      this.fpsInterval = 1000 / this.options.fps;
    }
  };

  CanvasSplitMovie.prototype.liquidOn = function() {
    this.options.liquid = true;
    this._canvasResize();
    $(window).on('resize', this._canvasResize);
  };

  CanvasSplitMovie.prototype.liquidOff = function() {
    this.options.liquid = false;
    $(window).off('resize', this._canvasResize);
  };

  return CanvasSplitMovie;

})();

$.fn.CanvasSplitMovie = function(options) {
  return this.each(function(i, el) {
    var $el, SplitMovie;
    $el = $(el);
    SplitMovie = new CanvasSplitMovie($el, options);
    return $el.data('CanvasSplitMovie', SplitMovie);
  });
};