# twitter風の画像ジェネレーターを作ってみる

## intro
twitterで見かける画像大喜利をローカルで気軽にやりたかった。  
cssマネしてローカルで作れるツール作ってみるか、ついでに画像化できるか調べてみるか、と1日で試した。  
  
こういうのができます。

## 概要
もともと個人がローカルで使うものなので大規模にしたくなかった。  
使うものはhtml, css, バニラjs, CDN経由でhtml2canvas。これだけ。  
node.jsもreactもいらない。  
  
ES2017のビルドなしimportを使いたかったのでそこはchromeのみ対応としている。  
  

## ディレクトリ構造
これだけ。

```
root
  - index.html
  - src
    - index.css
    - index.js
    - tweetCreater.js
    - tweets.json
```

## 見た目再現
まずは twitter 風の見た目を再現する。  
見た目からhtml構造を予想してババっとマークアップ。  
あくまで "風" であればいいので細部はこだわらない。  
  
```
<div class='container'>
  <div class='header'>
    <div class='user'>
      <div class='user_icon'><img src='' alt=''></div>
      <div class='user_profile'>
        <div contenteditable='true' class='user_name'></div>
        <div contenteditable='true' class='user_id'></div>
      </div>
    </div>
    <div class='reader'>…</div>
  </div>
  <div class='tweet'>
    <div class='tweet_text' contenteditable='true'></div>
    <div class='tweet_img'><img src='' alt=''></div>
  </div>
  <div class='tweet_info'>
    <span class='time'></span>
    ・<span class='date'></span>
    ・<span class='client'></span>
  </div>
  <div class='rt'>
    <span class='number'></span>件のリツイート　
    <span class='number'></span>件のいいね
  </div>
</div>
```

で、適宜スタイルを当てる。

```
src/index.css

:root {
  --g: rgb(110, 118, 125); 
  --b: rgb(47, 51, 54);
  --w: rgb(217, 217, 217)
}

* {
  box-sizing: border-box; 
}

html, body {
  color: var(--w);
  background: var(--b);
  min-height: 100%;
}

div {
  margin-bottom: 0.5rem;
}

.button {
  position: fixed;
  top: 1rem;
  right: 1rem;
}

.results {
  text-align: center;
}

.container {
  max-width: 33vw;
  margin: auto;
  padding: 1rem;
  background: var(--b);
}

.header {
  display: flex;
  justify-content: space-between;
}

.header div {
  margin-bottom: 0;
}

.user {
  display: flex;
}
  
.user_icon {
  width: 3rem;
  height: 3rem;
  background: var(--g);
  border-radius: 50%;
}

.user_icon img {
  width: auto;
  height: 100%;
}

.user_name {
  font-weight: bold;
}

.user_profile {
  margin-left: 1rem;
}
    
.user_id {
  font-size: 0.8rem;
  color: var(--g);
}

.tweet_text {
  padding: 0.5rem 0;
}

.tweet_img img{
  width: 100%;
  height: 100%;
  border-radius: 1rem;
}

.number {
  font-weight: bold;
}

.icons {
  display: flex;
}
```

## レンダリング実装
テンプレートが出来たので、レンダリングする方法を考える。  
今回は tweets.json に オブジェクトの配列をもたせて回そうと考えた。  
  
ひとまずこんな感じ。好きな値を入れてもらう。
```
src/tweets.json

[
  {
    "user_icon": "img/画像パス",
    "user_name": "名前",
    "user_id": "idのとこ",
    "tweet_text": "本文",
    "tweet_img": "img/画像パス",
    "time": "時間",
    "date": "日時",
    "number_rt": RT数,
    "number_fav": いいね数 
  }
]s
```

まずはjsonをjsにimport。  
知らなかったけど、ブラウザでjsonインポートするときは `assert { type: 'json' }` が必要らしい。  

```
src/tweetCreater.js

import tweets from './tweets.json' assert { type: 'json' }
```

つぎに、最初に作ったhtmlをもとに文字列を作成する関数をつくる。  
```
const createDOMTemplate = (tweet, index) => {
  const { 
    user_icon,
    user_name,
    user_id,
    tweet_text,
    tweet_img,
    time,
    date,
    number_rt,
    number_fav
  } = tweet

  // 最初につくったhtmlを1行にして、引数（さっきのjsonオブジェクト）からの変数を埋め込んだもの
  return `<div id='twitter_${index}' class='container'><div class='header'><div class='user'><div class='user_icon'><img src='${user_icon}' alt=''></div><div class='user_profile'><div contenteditable='true' class='user_name'>${user_name}</div><div contenteditable='true' class='user_id'>${user_id}</div></div></div><div class='reader'>…</div></div><div class='tweet'><div class='tweet_text' contenteditable='true'>${tweet_text}</div><div class='tweet_img'><img src='${tweet_img}' alt=''></div></div><div class='tweet_info'><span class='time'>${time}</span>・<span class='date'>${date}</span>・<span class='client'>Twitter Web Client</span></div><div class='rt'><span class='number'>${number_rt}</span>件のリツイート　<span class='number'>${number_fav}</span>件のいいね</div></div></div>`
}
```

ローカル用なので不要かもしれんけど、一応escape関数を作ってから、  
```
const escapeHTML = string => {
  return string.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27');
}
```
  
jsonをつっこんだらループしてNodeの配列を返す関数をつくる。  
```
const createTweetList = json => {
  return json.map((tweet, index) => {
    const div = document.createElement('div')
    // さっきの文字列をescapeしてdiv内につっこむ
    div.innerHTML = createDOMTemplate(escapeHTML(tweet), index)
    return div
  })
}
```
   
これで各ツイートのつまったdivの配列ができた。  
あとはレンダリング部分。今回はこんなふうにした。tweetRendererを呼べばjsonをもとに id="render" に向けてレンダリングされる。

```
const renderTweets = tweetList => {
  tweetList.forEach(elem => {
    document.querySelector('#render').appendChild(elem)
  })
}

export const tweetRenderer = () => renderTweets(createTweetList(tweets))
```

## 画像化実装
  
ここでライブラリhtml2canvasを使う  
名前通りhtmlからcanvasを作ってくれるので  
divにつっこんでDOMに反映
   
```
const getImg = HTMLElement => {
  html2canvas(HTMLElement)
    .then(canvas => {
      const div = document.createElement('div')
      div.appendChild(canvas)
      document.querySelector('#img').appendChild(div)
    }
  );
}
```

ボタンを設置して、各tweet要素からgetImgを叩く
```
const onClick = () => {
  scrollTo(0, 0)
  
  Array.from(document.querySelectorAll('.container')).forEach(elem => {
    getImg(elem)
  })
}
```

これで完成。  
  
細部はGithubから！
https://github.com/masakitm/twitter-like-image-generator