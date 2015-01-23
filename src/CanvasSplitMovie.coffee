###
  CanvasSplitMovie
  Copyright(c) 2015 SHIFTBRAIN - Tsukasa Tokura
  This software is released under the MIT License.
  http://opensource.org/licenses/mit-license.php
###

class CanvasSplitMovie
  defaults :
    splitNum : 5 #canvasの横ラインの分割数
    liquid : true #resize時に親要素の大きさに合わせて拡縮
    targetImgArray : [] #使用画像が格納された配列
    sceneWidth : false #読み込んだ画像の1シーンの横幅
    sceneHeight : false #読み込んだ画像の1シーンの縦幅
    fps : 30 #1秒あたりのフレーム数

  constructor : (_$targetParent, options) ->
    #optionのマージ
    @options = $.extend {}, @defaults, options

    @canvasPointArray = [] #canvs上の各パネル座標を格納する配列
    @imgPointArray = [] #読み込んだ画像の各シーンの座標を格納する配列
    @canvasPanelWidth = null #canvasのパネルの横幅
    @canvasYPanelNum = null #canvasの縦のパネル数
    @imgPanelresizedHeight = null #canvasPanelWidthに合わせて画像の1シーンを拡縮した際の縦幅
    @imgXPanelNum = null #読み込んだ画像の横のシーン数
    @imgYPanelNum = null #読み込んだ画像の縦のシーン数

    @frameCount = 0 #drawで回す表示フレームのカウンター
    @panelCount = 0 #最初パネルを埋める時に回すパネル数のカウンター

    @isFirst = true #パネルが埋まっているかどうかのフラグ
    @$targetParent = _$targetParent #canvasの親になる生成先
    @canvas = null
    @ctx = null

    @requestId = null #RAFに使用するID
    @setTimerId = null #Timeoutに使用するID
    @fpsInterval = 1000 / @options.fps #RAFのfps調整に使用するフレーム間隔の変数
    @timeLog = Date.now() #RAFのfps調整に使用する変数

    #RAFの宣言（fallback付）
    @requestAnimationFrame =
      (window.requestAnimationFrame and window.requestAnimationFrame.bind(window)) or
      (window.webkitRequestAnimationFrame and window.webkitRequestAnimationFrame.bind(window)) or
      (window.mozRequestAnimationFrame and window.mozRequestAnimationFrame.bind(window)) or
      (window.oRequestAnimationFrame and window.oRequestAnimationFrame.bind(window)) or
      (window.msRequestAnimationFrame and window.msRequestAnimationFrame.bind(window)) or
      (callback,element) ->
        @setTimerId = window.setTimeout(callback, 1000 / 60)
        return

    #キャンセル用RAFの宣言（fallback付）
    @cancelAnimationFrame =
      (window.cancelAnimationFrame and window.cancelAnimationFrame.bind(window)) or
      (window.webkitCancelAnimationFrame and window.webkitCancelAnimationFrame.bind(window)) or
      (window.mozCancelAnimationFrame and window.mozCancelAnimationFrame.bind(window)) or
      (window.oCancelAnimationFrame and window.oCancelAnimationFrame.bind(window)) or
      (window.msCancelAnimationFrame and window.msCancelAnimationFrame.bind(window)) or
      (callback,element) ->
        window.clearTimeout(@setTimerId)
        return

    #初期処理
    @_init()


  _init: ->
    #渡されたImgArrayが空、中のImgがロードされてない、中のImgがそもそも渡されていないとエラー
    if @options.targetImgArray.length is 0
      console.error('Image Array is empty.')
      return false
    for i in [0...@options.targetImgArray.length]
      if @options.targetImgArray[i].width is 0 or !@options.targetImgArray[i]
        console.error('Image not loaded.')
        return false

    #オプションにシーンの横幅と縦幅がないとエラー
    if @options.sceneWidth is false or @options.sceneHeight is false
      console.error('Input Scene Size.')
      return false

    #canvasの生成、contextの宣言
    @$targetParent.append('<canvas class="canvas-movie-sprite"></canvas>')
    @canvas = @$targetParent.find('.canvas-movie-sprite')[0]
    @ctx = @canvas.getContext("2d")
    @_canvasResize()

    #liquid対応のリサイズイベント登録
    if @options.liquid
      $(window).on('resize', @_debounce(
        ()=> @_canvasResize()
      ,300))

    return

  #canvasのリサイズ関数
  _canvasResize: =>
    console.log('resize')

    parentWidth = @$targetParent.width()
    parentHeight = @$targetParent.height()
    $(@canvas).attr({'width':parentWidth,'height':parentHeight})

    @_createCuttPoint(@options.targetImgObject)
    #isFirstなら最初から再描画、パネルが埋まっていれば埋めたまま再描画
    if !@isFirst
      @panelCount = @canvasPointArray.length
      if !@requestId
        @frameCount = 0
        @_drawSpriteImg()
    else
      @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
      @panelCount = 0
      @frameCount = 0
    return

  #実行回数の間引き
  _debounce: (func, threshold, execAsap) ->
    timeout = null
    (args...) ->
      obj = this
      delayed = ->
        func.apply(obj, args) unless execAsap
        timeout = null
      if timeout
        clearTimeout(timeout)
      else if (execAsap)
        func.apply(obj, args)
      timeout = setTimeout delayed, threshold || 100

  #各種幅や座標の計算
  _createCuttPoint: ->
    canvasWidth = @canvas.width
    canvasHeight = @canvas.height

    #console.log('canvas width = ' + canvasWidth)
    #console.log('canvas height = ' + canvasHeight)

    @canvasPanelWidth = canvasWidth / @options.splitNum
    @imgPanelresizedHeight = Math.ceil((@canvasPanelWidth / @options.sceneWidth) * @options.sceneHeight)
    @canvasYPanelNum = Math.ceil(canvasHeight / @imgPanelresizedHeight)

    #console.log('canvas scene width = ' + @canvasPanelWidth)
    #console.log('canvas scene height = ' + @imgPanelresizedHeight)

    @canvasPointArray = @_canvasPointPush()

    #targetImgArrayからイメージの座標を結合して一つの配列を作る
    if @imgPointArray.length is 0
      for i in [0...@options.targetImgArray.length]
        partsPointArray = @_imgPointPush(@options.targetImgArray[i])
        for i in [0...partsPointArray.length]
          @imgPointArray.push(partsPointArray[i])
    #console.log(@imgPointArray)

    #console.log('canvasのパネル数 = ' + @canvasPointArray.length)
    #console.log('動画のシーン画像の数 = ' + @imgPointArray.length)
    return


  #canvas座標配列を返す関数
  _canvasPointPush: ->
    pointArray = []
    nowPoint = 0

    for i in [0...@canvasYPanelNum]

      for i2 in [0...@options.splitNum]
        pointArray.push({x:i2 * @canvasPanelWidth, y:nowPoint})

        if i2 is @options.splitNum-1
          nowPoint += @imgPanelresizedHeight

    #console.log(pointArray)
    return pointArray

  #シーン座標配列を返す関数
  _imgPointPush: (targetImg)->
    imgWidth = targetImg.width
    imgHeight = targetImg.height
    imgXPanelNum = Math.ceil(imgWidth / @options.sceneWidth)
    imgYPanelNum = Math.ceil(imgHeight / @options.sceneHeight)
    pointArray = []
    nowPoint = 0

    for i in [0...imgYPanelNum]

      for i2 in [0...imgXPanelNum]
        pointArray.push({x:i2 * @options.sceneWidth, y:nowPoint, img:targetImg})

        if i2 is imgXPanelNum-1
          nowPoint += @options.sceneHeight

    #console.log(pointArray)
    return pointArray

  #スプライトの描画関数
  _drawSpriteImg: ->
    #RAFのフレーム調整
    now = Date.now()
    elapsed = now - @timeLog
    if elapsed > @fpsInterval
      @timeLog = now - (elapsed % @fpsInterval)

      #isFirstで分岐
      if @isFirst
        @frameCount++
        if @panelCount < @canvasPointArray.length then @panelCount++ else @isFirst = false; @panelCount = @canvasPointArray.length
        if @frameCount >= @imgPointArray.length then @frameCount = 0
      else
        if @frameCount < @imgPointArray.length then @frameCount++ else @frameCount = 0

      for i in [0...@panelCount]
        if i+@frameCount >= @imgPointArray.length
          steppedFrame = (i+@frameCount) % @imgPointArray.length
        else
          steppedFrame = i+@frameCount
          #console.log('stepped frame = ' + steppedFrame)
        @ctx.drawImage(
          @imgPointArray[steppedFrame].img
          @imgPointArray[steppedFrame].x
          @imgPointArray[steppedFrame].y
          @options.sceneWidth
          @options.sceneHeight
          @canvasPointArray[i].x
          @canvasPointArray[i].y
          @canvasPanelWidth
          @imgPanelresizedHeight
        )
    return

  #描画ループをスタート
  drawLoopStart: =>
    #console.log('loop start')
    if !@requestId
      @_drawLoop()
    return

  #描画ループをフルパネル表示からスタート
  drawFullLoopStart: =>
    #console.log('loop start')
    if !@requestId
      @panelCount = @canvasPointArray.length
      @_drawLoop()
    return

  #描画ループをストップ
  drawLoopStop: =>
    #console.log('loop stop')
    if @requestId
      @cancelAnimationFrame(@requestId)
      @requestId = null
    return

  #ループ関数
  _drawLoop: =>
    @requestId = @requestAnimationFrame(@_drawLoop)
    @_drawSpriteImg()
    return

  #canvas横分割数の動的変更
  changeSplitNum: (_changeNum) =>
    #console.log('change panel num = ' + _changeNum)
    @isFirst = true
    @options.splitNum = _changeNum
    @_createCuttPoint()
    @panelCount = 0
    @frameCount = 0
    return

  #canvasの初期化
  spriteClear: =>
    #console.log('sprite clear')
    @isFirst = true
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
    @panelCount = 0
    @frameCount = 0
    return

  #fpsの変更 
  changeFps: (_changeFps) =>
    if _changeFps isnt @options.fps
      #console.log('change Fps = ' + _changeFps)
      @options.fps = _changeFps
      @fpsInterval = 1000 / @options.fps
    return

  #リサイズ対応の追加
  liquidOn: ->
    @options.liquid = true
    @_canvasResize()
    $(window).on('resize', @_canvasResize)
    return

  #リサイズ対応の削除
  liquidOff: ->
    @options.liquid = false
    $(window).off('resize', @_canvasResize)
    return

$.fn.CanvasSplitMovie = (options) ->
  @each (i, el) ->
    $el = $(el)
    SplitMovie = new CanvasSplitMovie $el, options
    $el.data 'CanvasSplitMovie', SplitMovie