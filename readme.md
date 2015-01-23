#CanvasSplitMovie

##使う前に
画面上に表示されていない時はdrawLoopStopでアニメーションを停止させ、負荷を下げることをおすすめします。

##概要

canvasを用いてスプリットムービーを再現するjQueryプラグインです。縦幅がぴったりでない時に最後の横一列が途切れるのは仕様です。
あらかじめcanvasの大きさを計算して固定しておくと防げます。

##UPDATE

- **2014.11.10** プロトタイプ作成
- **2014.11.14** Sprite分割読み込み機能追加（targetImgObjがtargetImgArrayに変更されました！）
- **2015.01.08** 配布用に調整、サンプルの追加

##使い方

あらかじめ使用するスプライト画像を別軸でloadする必要があります。

###loadの記述例

    url = "img/sprite.jpg";
    ImgData = new Image();
    ImgData.onload = (function() {
    	//処理内容を記述
    });
    ImgData.src = url;
    
##記述

第一引数でオプションを設定します。

###例(上記のload記述例のコメント部分に入る形になります)

	var targetCanvas = $('#canvas-panel');
	targetCanvas.CanvasSplitMovie({
		splitNum: 4,
		liquid: true,
		targetImgArray: [ImgData_01],
		sceneWidth: 240,
		sceneHeight: 296,
		fps: 30
	});
	MovieSplit = targetCanvas.data('CanvasSplitMovie');
	
- **splitNum**：canvasの横コマの分割数になります。多いほど処理負荷がかかるので、モバイルでは少なめに設定してください。default値は5です。
- **liquid**：windowのリサイズ時にcanvasの包括要素に合わせてリサイズするかを決めます。default値はtrueです。
- **targetImgArray**：必須のオプションです。loadが終了したImageを格納した配列を渡します。配列順に結合されます。
- **sceneWidth**：必須のオプションです。読み込むスプライト画像の一つのシーンの横幅です。今回サンプルで使っている画像を見ていただければわかりやすいと思います。
- **sceneHeight**：必須のオプションです。読み込むスプライト画像の一つのシーンの縦幅です。今回サンプルで使っている画像を見ていただければわかりやすいと思います。
- **fps**：1秒あたりのコマ数になります。default値は30です。

##メソッド

###上記の記述例に合わせた形で書いています。

	MovieSplit.drawLoopStart();
	
ムービー再生をスタートします。

	MovieSplit.drawFullLoopStart();

ムービー再生を全パネル表示してスタートします。

	MovieSplit.drawLoopStop();
	
ムービー再生をストップします。

	MovieSplit.changeSplitNum(4);
	
動的にcanvasの横分割数を変更します。

	MovieSplit.spriteClear();
	
canvasを初期化します。

	MovieSplit.changeFps(60);
	
動的にfpsを変更します。

	MovieSplit.liquidOn():
	
windowのリサイズ時に包括要素に合わせて拡大縮小するようにします。一度リサイズが走ります。

	MovieSplit.liquidOff();
	
windowのリサイズ時に包括要素に合わせて拡大縮小しないようにします。