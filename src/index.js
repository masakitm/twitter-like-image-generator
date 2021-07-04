import { tweetRenderer } from './tweetCreater.js'

const getImg = HTMLElement => {
  html2canvas(HTMLElement)
    .then(canvas => {
      const div = document.createElement('div')
      div.appendChild(canvas)
      document.querySelector('#img').appendChild(div)
    }
  );
}

const onClick = () => {
  Array.from(document.querySelectorAll('.container')).forEach(elem => {
    getImg(elem)
  })
}

const init = () => {
  tweetRenderer()
  document.querySelector('#click_to_create_img').addEventListener('click', () => { onClick() })
}

window.onload = init()